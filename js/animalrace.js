document.addEventListener("DOMContentLoaded", () => {
  const setupPanel = document.getElementById("setupPanel");
  const lineupPanel = document.getElementById("lineupPanel");
  const racePanel = document.getElementById("racePanel");
  const battlePanel = document.getElementById("battlePanel");
  const resultPanel = document.getElementById("resultPanel");

  const modeSwitch = document.getElementById("modeSwitch");
  const countSwitch = document.getElementById("countSwitch");
  const drawBtn = document.getElementById("drawBtn");

  const lineupTitle = document.getElementById("lineupTitle");
  const lineupGrid = document.getElementById("lineupGrid");
  const startRaceBtn = document.getElementById("startRaceBtn");
  const redrawBtn = document.getElementById("redrawBtn");

  const raceModeLabel = document.getElementById("raceModeLabel");
  const raceCountdown = document.getElementById("raceCountdown");
  const raceTrack = document.getElementById("raceTrack");

  const battleAliveLabel = document.getElementById("battleAliveLabel");
  const battleArena = document.getElementById("battleArena");
  const battleNextBtn = document.getElementById("battleNextBtn");
  const battleLog = document.getElementById("battleLog");

  const resultTitle = document.getElementById("resultTitle");
  const resultBody = document.getElementById("resultBody");
  const raceAgainBtn = document.getElementById("raceAgainBtn");
  const raceBackSetupBtn = document.getElementById("raceBackSetupBtn");

  const MODE_LABEL = { swim: "ว่ายน้ำ 🏊", run: "วิ่งแข่ง 🏃", battle: "ตะลุมบอน ⚔️" };

  let mode = "swim";
  let racerCount = 6;
  let contestants = []; // [{animal, cheer}]
  let raceTimer = null;

  function showOnly(panel) {
    [setupPanel, lineupPanel, racePanel, battlePanel, resultPanel]
      .forEach((p) => { p.style.display = p === panel ? "" : "none"; });
  }

  // สุ่มหยิบ n ตัวแบบไม่ซ้ำจากลิสต์ (ใช้ทั้งเลือกนักแข่งและจับคู่ปะทะในตะลุมบอน)
  function shuffleSample(list, n) {
    const arr = list.slice();
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr.slice(0, n);
  }

  // เผื่อไว้สำหรับตอนที่มีไฟล์ภาพ png จริง: ถ้า animal.img ถูกเติมค่า จะใช้รูปแทนอีโมจิอัตโนมัติ
  function animalToken(animal) {
    return animal.img ? '<img src="' + animal.img + '" alt="' + animal.name + '">' : animal.emoji;
  }

  modeSwitch.querySelectorAll(".tp-mode-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      mode = btn.dataset.mode;
      modeSwitch.querySelectorAll(".tp-mode-btn").forEach((b) => b.classList.toggle("active", b === btn));
    });
  });
  countSwitch.querySelectorAll(".tp-mode-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      racerCount = Number(btn.dataset.n);
      countSwitch.querySelectorAll(".tp-mode-btn").forEach((b) => b.classList.toggle("active", b === btn));
    });
  });

  function drawContestants() {
    contestants = shuffleSample(RACE_ANIMALS, racerCount).map((animal) => ({ animal, cheer: "" }));
  }

  function renderLineup() {
    lineupTitle.textContent = MODE_LABEL[mode] + " — เลือกเชียร์นักแข่ง";
    lineupGrid.innerHTML = "";
    contestants.forEach((c) => {
      const card = document.createElement("div");
      card.className = "rc-lineup-card";
      card.innerHTML =
        '<div class="rc-token rc-token-lg">' + animalToken(c.animal) + "</div>" +
        '<div class="rc-animal-name">' + c.animal.name + "</div>" +
        '<input type="text" class="rc-cheer-input" placeholder="ใครเชียร์ตัวนี้บ้าง?" maxlength="40">';
      const input = card.querySelector(".rc-cheer-input");
      input.value = c.cheer;
      input.addEventListener("input", () => { c.cheer = input.value; });
      lineupGrid.appendChild(card);
    });
  }

  drawBtn.addEventListener("click", () => {
    drawContestants();
    renderLineup();
    showOnly(lineupPanel);
  });

  redrawBtn.addEventListener("click", () => {
    drawContestants();
    renderLineup();
  });

  startRaceBtn.addEventListener("click", () => {
    if (mode === "battle") startBattle();
    else startLaneRace();
  });

  // ---------------- ว่ายน้ำ / วิ่งแข่ง (lane race) ----------------
  let laneRacers = [];
  let raceTickCount = 0;
  const RACE_TICK_MS = 130;
  const MAX_TICKS = 420;

  function startLaneRace() {
    raceModeLabel.textContent = MODE_LABEL[mode];
    raceTrack.className = "rc-track rc-track-" + mode;
    raceTrack.innerHTML = "";
    laneRacers = contestants.map((c) => ({ animal: c.animal, cheer: c.cheer, pos: 0, finished: false, place: null, el: null, tokenEl: null }));

    laneRacers.forEach((r) => {
      const lane = document.createElement("div");
      lane.className = "rc-lane";
      lane.innerHTML =
        '<div class="rc-lane-label">' + animalToken(r.animal) + " " + r.animal.name + "</div>" +
        '<div class="rc-lane-track"><div class="rc-token rc-race-token">' + animalToken(r.animal) + "</div></div>";
      raceTrack.appendChild(lane);
      r.el = lane;
      r.tokenEl = lane.querySelector(".rc-race-token");
      r.tokenEl.style.left = "0%";
    });

    showOnly(racePanel);
    runCountdown(runLaneLoop);
  }

  function runCountdown(done) {
    const seq = ["3", "2", "1", "ไป!"];
    let i = 0;
    raceCountdown.textContent = seq[i];
    const iv = setInterval(() => {
      i++;
      if (i >= seq.length) {
        clearInterval(iv);
        raceCountdown.textContent = "";
        done();
        return;
      }
      raceCountdown.textContent = seq[i];
    }, 550);
  }

  function runLaneLoop() {
    raceTickCount = 0;
    let placeCounter = 0;
    clearInterval(raceTimer);
    raceTimer = setInterval(() => {
      raceTickCount++;
      let allDone = true;
      laneRacers.forEach((r) => {
        if (r.finished) return;
        allDone = false;
        let step = 1.6 + Math.random() * 3.2;
        if (Math.random() < 0.07) step += 6 + Math.random() * 8; // ฮึดสปีดขึ้นกะทันหัน
        if (Math.random() < 0.05) step *= 0.25; // สะดุด ชะลอจังหวะ
        r.pos = Math.min(100, r.pos + step);
        r.tokenEl.style.left = Math.min(96, r.pos) + "%";
        if (r.pos >= 100) {
          r.finished = true;
          placeCounter++;
          r.place = placeCounter;
          r.el.classList.add("rc-lane-done");
          r.tokenEl.classList.add("rc-token-win-pulse");
        }
      });
      if (allDone || raceTickCount >= MAX_TICKS) {
        if (raceTickCount >= MAX_TICKS) {
          laneRacers
            .filter((r) => !r.finished)
            .sort((a, b) => b.pos - a.pos)
            .forEach((r) => { placeCounter++; r.finished = true; r.place = placeCounter; });
        }
        clearInterval(raceTimer);
        vibrateTimeout();
        setTimeout(showLaneResult, 500);
      }
    }, RACE_TICK_MS);
  }

  function showLaneResult() {
    const ranked = laneRacers.slice().sort((a, b) => a.place - b.place);
    resultTitle.textContent = "🏆 " + ranked[0].animal.name + " เข้าเส้นชัยเป็นที่ 1!";
    resultBody.innerHTML = "";
    const list = document.createElement("div");
    list.className = "rc-result-list";
    ranked.forEach((r, i) => {
      const row = document.createElement("div");
      row.className = "rc-result-row" + (i === 0 ? " rc-result-first" : "");
      row.innerHTML =
        '<span class="rc-result-place">' + (i + 1) + "</span>" +
        '<span class="rc-result-animal">' + animalToken(r.animal) + " " + r.animal.name + "</span>" +
        (r.cheer ? '<span class="rc-result-cheer">' + (i === 0 ? "🎉 " : "") + r.cheer + "</span>" : "");
      list.appendChild(row);
    });
    resultBody.appendChild(list);
    showOnly(resultPanel);
  }

  // ---------------- ตะลุมบอน (battle royale) ----------------
  const BATTLE_LINES = [
    "{A} พุ่งเข้าใส่ {B} แบบไม่ทันตั้งตัว!",
    "{A} กับ {B} ปะทะกันมันส์หยุดโลก!",
    "{A} ใช้ท่าไม้ตายเข้าใส่ {B}!",
    "{A} กับ {B} วิ่งเข้าใส่กันสุดแรง!",
    "สนามสั่นเมื่อ {A} เจอ {B}!",
  ];
  const BATTLE_WIN_LINES = [
    "🏆 {W} เอาชนะไปได้อย่างเหลือเชื่อ!",
    "🏆 {W} ยืนหนึ่ง จบยกนี้ไปแบบสวย ๆ!",
    "🏆 {W} รอดมาได้หวุดหวิด!",
    "🏆 {W} จัดการคู่ต่อสู้เรียบร้อย!",
  ];
  const drawBattleLine = () => BATTLE_LINES[Math.floor(Math.random() * BATTLE_LINES.length)];
  const drawWinLine = () => BATTLE_WIN_LINES[Math.floor(Math.random() * BATTLE_WIN_LINES.length)];

  let battleRacers = [];

  function startBattle() {
    battleRacers = contestants.map((c) => ({ animal: c.animal, cheer: c.cheer, alive: true, el: null }));
    battleLog.innerHTML = "";
    renderBattleArena();
    battleNextBtn.disabled = false;
    battleNextBtn.textContent = "ปะทะยกต่อไป 👊";
    showOnly(battlePanel);
  }

  function renderBattleArena() {
    battleArena.innerHTML = "";
    battleRacers.forEach((r) => {
      const card = document.createElement("div");
      card.className = "rc-arena-card" + (r.alive ? "" : " rc-arena-out");
      card.innerHTML =
        '<div class="rc-token">' + animalToken(r.animal) + "</div>" +
        '<div class="rc-animal-name">' + r.animal.name + "</div>" +
        (r.cheer ? '<div class="rc-cheer-tag">' + r.cheer + "</div>" : "");
      battleArena.appendChild(card);
      r.el = card;
    });
    const aliveCount = battleRacers.filter((r) => r.alive).length;
    battleAliveLabel.textContent = "เหลือ " + aliveCount + " ตัว";
  }

  function addBattleLog(text) {
    const line = document.createElement("div");
    line.className = "rc-log-line";
    line.textContent = text;
    battleLog.prepend(line);
  }

  battleNextBtn.addEventListener("click", () => {
    const alive = battleRacers.filter((r) => r.alive);
    if (alive.length <= 1) return;
    const [a, b] = shuffleSample(alive, 2);
    a.el.classList.add("rc-clash");
    b.el.classList.add("rc-clash");
    battleNextBtn.disabled = true;
    addBattleLog(drawBattleLine().replace("{A}", a.animal.name).replace("{B}", b.animal.name));

    setTimeout(() => {
      a.el.classList.remove("rc-clash");
      b.el.classList.remove("rc-clash");
      const winner = Math.random() < 0.5 ? a : b;
      const loser = winner === a ? b : a;
      loser.alive = false;
      addBattleLog(drawWinLine().replace("{W}", winner.animal.name));
      renderBattleArena();

      const stillAlive = battleRacers.filter((r) => r.alive);
      if (stillAlive.length <= 1) {
        battleNextBtn.disabled = true;
        setTimeout(() => showBattleResult(stillAlive[0]), 700);
      } else {
        battleNextBtn.disabled = false;
      }
    }, 650);
  });

  function showBattleResult(champion) {
    resultTitle.textContent = "🏆 " + champion.animal.name + " คือแชมป์ตะลุมบอน!";
    resultBody.innerHTML =
      '<div class="rc-champion">' +
        '<div class="rc-token rc-token-xl">' + animalToken(champion.animal) + "</div>" +
        '<div class="rc-champion-name">' + champion.animal.name + "</div>" +
        (champion.cheer ? '<div class="rc-result-cheer">🎉 ' + champion.cheer + "</div>" : "") +
      "</div>";
    showOnly(resultPanel);
  }

  raceAgainBtn.addEventListener("click", () => {
    drawContestants();
    renderLineup();
    showOnly(lineupPanel);
  });

  raceBackSetupBtn.addEventListener("click", () => {
    clearInterval(raceTimer);
    showOnly(setupPanel);
  });
});
