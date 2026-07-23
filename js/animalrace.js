document.addEventListener("DOMContentLoaded", () => {
  const setupPanel = document.getElementById("setupPanel");
  const lineupPanel = document.getElementById("lineupPanel");
  const racePanel = document.getElementById("racePanel");
  const battlePanel = document.getElementById("battlePanel");
  const resultPanel = document.getElementById("resultPanel");

  const modeSwitch = document.getElementById("modeSwitch");
  const countSlider = document.getElementById("countSlider");
  const countReadout = document.getElementById("countReadout");
  const drawBtn = document.getElementById("drawBtn");

  const lineupTitle = document.getElementById("lineupTitle");
  const lineupGrid = document.getElementById("lineupGrid");
  const startRaceBtn = document.getElementById("startRaceBtn");
  const redrawBtn = document.getElementById("redrawBtn");

  const raceModeLabel = document.getElementById("raceModeLabel");
  const raceCountdown = document.getElementById("raceCountdown");
  const raceTrack = document.getElementById("raceTrack");

  const battleAliveLabel = document.getElementById("battleAliveLabel");
  const meleeArena = document.getElementById("meleeArena");
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
  countSlider.addEventListener("input", () => {
    racerCount = Number(countSlider.value);
    countReadout.textContent = racerCount + " ตัว" + (racerCount === RACE_ANIMALS.length ? " (หมดคลัง)" : "");
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
    if (mode === "battle") startMelee();
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

  // ---------------- ตะลุมบอน (battle royale — ทุกตัวลงสนามพร้อมกัน) ----------------
  // ทุกตัวเดินสุ่มในสนามเดียวกัน ชนกันเมื่อไหร่ก็สุ่มว่าใครเป็นฝ่ายตี แล้วสุ่มดาเมจ
  // ทุกตัวเริ่มด้วยเลือดเท่ากันหมด ไม่มีตัวไหนได้เปรียบโดยกำเนิด
  const MELEE_HIT_LINES = [
    "{A} พุ่งเข้าใส่ {B} แบบไม่ทันตั้งตัว!",
    "{A} กับ {B} ปะทะกันมันส์หยุดโลก!",
    "{A} ใช้ท่าไม้ตายเข้าใส่ {B}!",
    "{A} กับ {B} ชนกันสุดแรง!",
    "สนามสั่นเมื่อ {A} เจอ {B}!",
  ];
  const MELEE_KO_LINES = [
    "💀 {L} ถูก {W} น็อกร่วง!",
    "💀 {L} หมดแรงเพราะฝีมือ {W}!",
    "💀 {W} จัดการ {L} เรียบร้อย!",
    "💀 {L} ไปไม่รอดเพราะ {W}!",
  ];
  const drawMeleeLine = () => MELEE_HIT_LINES[Math.floor(Math.random() * MELEE_HIT_LINES.length)];
  const drawKoLine = () => MELEE_KO_LINES[Math.floor(Math.random() * MELEE_KO_LINES.length)];

  const MELEE_MAX_HP = 100;
  const TOKEN_SIZE = 46;        // px เส้นผ่านศูนย์กลาง hitbox
  const HIT_COOLDOWN_MS = 550;  // กันโดนตีรัว ๆ ตอนยังชนกันอยู่
  const MELEE_TICK_MS = 70;
  const MELEE_MAX_TICKS = 500;  // เซฟตี้กันลูปค้าง (~35 วิ)

  let meleeFighters = [];
  let meleeTimer = null;
  let meleeTickCount = 0;

  function addBattleLog(text) {
    const line = document.createElement("div");
    line.className = "rc-log-line";
    line.textContent = text;
    battleLog.prepend(line);
  }

  function positionToken(f) {
    f.el.style.transform = "translate(" + f.x + "px, " + f.y + "px)";
  }

  function updateAliveLabel() {
    const aliveCount = meleeFighters.filter((f) => f.alive).length;
    battleAliveLabel.textContent = "เหลือ " + aliveCount + " ตัว";
  }

  function spawnImpact(x, y) {
    const el = document.createElement("div");
    el.className = "rc-melee-impact";
    el.textContent = "💥";
    el.style.left = x + "px";
    el.style.top = y + "px";
    meleeArena.appendChild(el);
    setTimeout(() => el.remove(), 500);
  }

  function startMelee() {
    clearInterval(meleeTimer);
    meleeArena.querySelectorAll(".rc-melee-token, .rc-melee-impact").forEach((el) => el.remove());
    battleLog.innerHTML = "";
    showOnly(battlePanel);

    const w = meleeArena.clientWidth;
    const h = meleeArena.clientHeight;

    meleeFighters = contestants.map((c) => {
      const el = document.createElement("div");
      el.className = "rc-melee-token";
      el.innerHTML =
        '<div class="rc-melee-hpbar"><div class="rc-melee-hpfill"></div></div>' +
        '<div class="rc-melee-emoji">' + animalToken(c.animal) + "</div>" +
        '<div class="rc-melee-name">' + c.animal.name + "</div>";
      meleeArena.appendChild(el);
      const hpFillEl = el.querySelector(".rc-melee-hpfill");
      hpFillEl.style.width = "100%";
      const angle = Math.random() * Math.PI * 2;
      const speed = 0.8 + Math.random() * 1.6;
      return {
        animal: c.animal,
        cheer: c.cheer,
        hp: MELEE_MAX_HP,
        alive: true,
        x: Math.random() * Math.max(1, w - TOKEN_SIZE),
        y: Math.random() * Math.max(1, h - TOKEN_SIZE),
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        cooldownUntil: 0,
        target: null,
        el,
        hpFillEl,
      };
    });
    meleeFighters.forEach(positionToken);

    updateAliveLabel();
    meleeTickCount = 0;
    meleeTimer = setInterval(meleeTick, MELEE_TICK_MS);
  }

  function meleeTick() {
    meleeTickCount++;
    const w = meleeArena.clientWidth;
    const h = meleeArena.clientHeight;
    const now = performance.now();
    const alive = meleeFighters.filter((f) => f.alive);

    // แต่ละตัวสุ่มเลือกคู่ปรับเป้าหมายเป็นระยะแล้วพุ่งเข้าหาแบบไม่ตรงเป๊ะ (ผสมทิศเดิมเข้าไปให้ดูเป็นธรรมชาติ)
    // ทำให้ชนกันบ่อยพอจะจบเกมได้ไว แทนที่จะเดินสุ่มเรื่อยเปื่อยจนกว่าจะบังเอิญเจอกัน
    alive.forEach((f) => {
      if (!f.target || !f.target.alive || Math.random() < 0.1) {
        const others = alive.filter((o) => o !== f);
        f.target = others.length ? others[Math.floor(Math.random() * others.length)] : null;
      }
      let dirX = f.vx;
      let dirY = f.vy;
      if (f.target) {
        const tx = f.target.x - f.x;
        const ty = f.target.y - f.y;
        const tlen = Math.sqrt(tx * tx + ty * ty) || 1;
        dirX = f.vx * 0.35 + (tx / tlen) * 0.65;
        dirY = f.vy * 0.35 + (ty / tlen) * 0.65;
      }
      const dlen = Math.sqrt(dirX * dirX + dirY * dirY) || 1;
      const speed = 2.2 + Math.random() * 1.4;
      f.vx = (dirX / dlen) * speed;
      f.vy = (dirY / dlen) * speed;
      f.x += f.vx;
      f.y += f.vy;
      if (f.x < 0) { f.x = 0; f.vx *= -1; }
      if (f.x > w - TOKEN_SIZE) { f.x = w - TOKEN_SIZE; f.vx *= -1; }
      if (f.y < 0) { f.y = 0; f.vy *= -1; }
      if (f.y > h - TOKEN_SIZE) { f.y = h - TOKEN_SIZE; f.vy *= -1; }
      positionToken(f);
    });

    // ตรวจชนกัน (hitbox แบบวงกลม) แล้วสุ่มว่าใครตี ใครโดน
    for (let i = 0; i < alive.length; i++) {
      for (let j = i + 1; j < alive.length; j++) {
        const A = alive[i];
        const B = alive[j];
        if (!A.alive || !B.alive) continue;
        if (now < A.cooldownUntil || now < B.cooldownUntil) continue;
        const dx = A.x - B.x;
        const dy = A.y - B.y;
        if (Math.sqrt(dx * dx + dy * dy) < TOKEN_SIZE * 1.05) {
          resolveHit(A, B, now);
        }
      }
    }

    const stillAlive = meleeFighters.filter((f) => f.alive);
    if (stillAlive.length <= 1 || meleeTickCount >= MELEE_MAX_TICKS) {
      clearInterval(meleeTimer);
      vibrateTimeout();
      const champion = stillAlive[0] || meleeFighters[meleeFighters.length - 1];
      setTimeout(() => showBattleResult(champion), 600);
    }
  }

  function resolveHit(A, B, now) {
    const attacker = Math.random() < 0.5 ? A : B;
    const defender = attacker === A ? B : A;
    const dmg = 14 + Math.random() * 18; // ดาเมจสุ่มทุกครั้ง

    defender.hp = Math.max(0, defender.hp - dmg);
    defender.hpFillEl.style.width = defender.hp + "%";
    defender.el.classList.add("rc-melee-hit");
    setTimeout(() => defender.el.classList.remove("rc-melee-hit"), 240);
    spawnImpact((attacker.x + defender.x) / 2 + TOKEN_SIZE / 2, (attacker.y + defender.y) / 2 + TOKEN_SIZE / 2);
    vibrateTimeout();

    A.cooldownUntil = now + HIT_COOLDOWN_MS;
    B.cooldownUntil = now + HIT_COOLDOWN_MS;

    // เด้งแยกทางกันหลังปะทะ กันโดนตีซ้ำรัว ๆ ตอนยังชนกันอยู่
    const dx = defender.x - attacker.x || Math.random() - 0.5;
    const dy = defender.y - attacker.y || Math.random() - 0.5;
    const len = Math.sqrt(dx * dx + dy * dy) || 1;
    defender.vx = (dx / len) * 1.6;
    defender.vy = (dy / len) * 1.6;
    attacker.vx = -(dx / len) * 1.2;
    attacker.vy = -(dy / len) * 1.2;

    if (Math.random() < 0.4) {
      addBattleLog(drawMeleeLine().replace("{A}", attacker.animal.name).replace("{B}", defender.animal.name));
    }

    if (defender.hp <= 0 && defender.alive) {
      defender.alive = false;
      defender.el.classList.add("rc-melee-ko");
      addBattleLog(drawKoLine().replace("{W}", attacker.animal.name).replace("{L}", defender.animal.name));
      updateAliveLabel();
    }
  }

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
    clearInterval(meleeTimer);
    showOnly(setupPanel);
  });
});
