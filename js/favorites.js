// เกม "ของโปรดของเธอ" — คำถามเปิดบทสนทนา 2 โหมด
//   talk  = คุยกันเลย (สุ่มคำถามแล้วผลัดกันตอบรอบวง)
//   guess = ทายใจเพื่อน (สุ่มว่าคำถามนี้เป็นของใคร คนอื่นทายว่าเขาจะตอบอะไร แล้วให้คะแนน)
document.addEventListener("DOMContentLoaded", () => {
  const $ = (id) => document.getElementById(id);

  const CAT_LABEL = {
    movie: "🎬 หนัง & ซีรีส์",
    cartoon: "📺 การ์ตูน & อนิเมะ",
    music: "🎵 เพลง & ศิลปิน",
    food: "🍜 ของกิน",
    travel: "✈️ เที่ยว & ที่ทาง",
    child: "🧸 วัยเด็ก & ความทรงจำ",
    life: "🌿 ไลฟ์สไตล์",
    fun: "🎲 สุ่มฮา & จินตนาการ",
  };

  const MODE_DESC = {
    talk: "สุ่มคำถามขึ้นมา แล้วผลัดกันตอบไปทีละคนรอบวง",
    guess: "สุ่มว่าคำถามนี้เป็นของใคร แล้วให้เพื่อนทายว่าเจ้าตัวจะตอบว่าอะไร",
  };

  const PLAYER_COLORS = [
    "#c4b5fd", "#ff2f87", "#2be6ff", "#d6ff3d", "#ffb703",
    "#1de9b6", "#ff8a3d", "#5b6eff", "#ff3d54", "#34d399",
  ];

  const MIN_PLAYERS = 3;
  const MAX_PLAYERS = 10;
  const TIMER_SECONDS = 45;

  // ---------- state ----------
  const S = {
    mode: "talk",
    cat: "all",
    players: [],   // [{ name, color, score }]
    order: [],     // ลำดับ index ผู้เล่นที่จะได้เป็นเจ้าของคำตอบในแต่ละรอบ
    roundIdx: 0,
    laps: 1,
    question: null,
    correct: new Set(), // index ผู้เล่นที่ทายถูกในรอบปัจจุบัน
  };

  const pickers = {};
  let timerInterval = null;
  let timerLeft = TIMER_SECONDS;

  // ชื่อผู้เล่นมาจากช่องกรอกของผู้ใช้ ต้อง escape ก่อนเอาไปต่อเป็น HTML เสมอ
  function esc(s) {
    return String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  }

  // ---------- คลังคำถาม + ตัวสุ่มแบบไม่ซ้ำ ----------
  function poolOf(cat) {
    return cat === "all" ? FAVORITES_LIST : FAVORITES_LIST.filter((x) => x.cat === cat);
  }

  function drawQuestion() {
    if (!pickers[S.cat]) pickers[S.cat] = createPicker(poolOf(S.cat), "pg_favorites_" + S.cat);
    return pickers[S.cat]();
  }

  function cardHtml(item) {
    return (
      '<div class="trivia-card fav-card">' +
        '<div class="cat">' + CAT_LABEL[item.cat] + "</div>" +
        '<div class="statement">' + item.q + "</div>" +
      "</div>"
    );
  }

  // ---------- โหมดคุยกันเลย ----------
  function stopTimer() {
    if (timerInterval) {
      clearInterval(timerInterval);
      timerInterval = null;
    }
    $("favTimerBtn").textContent = "จับเวลา " + TIMER_SECONDS + " วิ ⏱";
    $("favTimerBtn").classList.remove("timer-running");
  }

  function nextTalk() {
    stopTimer();
    const item = drawQuestion();
    if (!item) return;
    $("favCardHolder").innerHTML = cardHtml(item);
  }

  $("favNextBtn").addEventListener("click", nextTalk);

  $("favTimerBtn").addEventListener("click", () => {
    if (timerInterval) {
      stopTimer();
      return;
    }
    timerLeft = TIMER_SECONDS;
    $("favTimerBtn").textContent = timerLeft + " วินาที ⏱";
    $("favTimerBtn").classList.add("timer-running");
    timerInterval = setInterval(() => {
      timerLeft--;
      if (timerLeft <= 0) {
        $("favTimerBtn").textContent = "หมดเวลา! ⏱";
        vibrateTimeout();
        clearInterval(timerInterval);
        timerInterval = null;
        setTimeout(stopTimer, 1200);
        return;
      }
      $("favTimerBtn").textContent = timerLeft + " วินาที ⏱";
    }, 1000);
  });

  // ---------- สลับโหมด / หมวด ----------
  function applyMode() {
    $("favTalk").classList.toggle("fav-hidden", S.mode !== "talk");
    $("favGuess").classList.toggle("fav-hidden", S.mode !== "guess");
    $("favModeDesc").textContent = MODE_DESC[S.mode];
    if (S.mode === "talk") stopTimer();
  }

  $("favModes").querySelectorAll(".fav-mode-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      if (S.mode === btn.dataset.mode) return;
      $("favModes").querySelectorAll(".fav-mode-btn").forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");
      S.mode = btn.dataset.mode;
      applyMode();
    });
  });

  $("catTags").querySelectorAll(".tag").forEach((tagEl) => {
    tagEl.addEventListener("click", () => {
      $("catTags").querySelectorAll(".tag").forEach((t) => t.classList.remove("active"));
      tagEl.classList.add("active");
      S.cat = tagEl.dataset.cat;
      // ระหว่างเล่นโหมดทายใจอยู่ ไม่ต้องดึงคำถามใหม่ทิ้ง — หมวดใหม่จะมีผลตอนขึ้นรอบถัดไปเอง
      if (S.mode === "talk") nextTalk();
    });
  });

  // ---------- โหมดทายใจเพื่อน: ตั้งค่าผู้เล่น ----------
  const DEFAULT_NAMES = ["เอ", "บี", "ซี", "ดี"];

  function renderPlayerInputs(names) {
    const wrap = $("favPlayerList");
    wrap.innerHTML = "";
    names.forEach((name, i) => {
      const row = document.createElement("div");
      row.className = "fav-player-row";
      row.innerHTML =
        '<span class="fav-player-dot" style="background:' + PLAYER_COLORS[i % PLAYER_COLORS.length] + '">' + (i + 1) + "</span>" +
        '<input class="fav-player-input" type="text" maxlength="12" value="' + esc(name) + '" placeholder="ชื่อผู้เล่น">' +
        '<button class="fav-player-del" type="button" aria-label="ลบผู้เล่น">✕</button>';
      row.querySelector(".fav-player-del").addEventListener("click", () => {
        const current = readNames();
        if (current.length <= MIN_PLAYERS) {
          $("favSetupWarn").textContent = "ต้องมีอย่างน้อย " + MIN_PLAYERS + " คน";
          return;
        }
        current.splice(i, 1);
        renderPlayerInputs(current);
        $("favSetupWarn").textContent = "";
      });
      wrap.appendChild(row);
    });
  }

  function readNames() {
    return Array.from($("favPlayerList").querySelectorAll(".fav-player-input")).map((el) => el.value.trim());
  }

  $("favAddPlayer").addEventListener("click", () => {
    const names = readNames();
    if (names.length >= MAX_PLAYERS) {
      $("favSetupWarn").textContent = "รับได้สูงสุด " + MAX_PLAYERS + " คน";
      return;
    }
    names.push("");
    renderPlayerInputs(names);
    $("favSetupWarn").textContent = "";
  });

  $("favLapSwitch").querySelectorAll(".fav-lap-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      $("favLapSwitch").querySelectorAll(".fav-lap-btn").forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");
      S.laps = parseInt(btn.dataset.laps, 10);
    });
  });

  // ---------- โหมดทายใจเพื่อน: ดำเนินเกม ----------
  const STAGES = ["favSetup", "favRound", "favScore", "favFinal"];

  function showStage(id) {
    STAGES.forEach((s) => $(s).classList.toggle("fav-hidden", s !== id));
    $(id).scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function shuffled(n) {
    const arr = [];
    for (let i = 0; i < n; i++) arr.push(i);
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      const t = arr[i];
      arr[i] = arr[j];
      arr[j] = t;
    }
    return arr;
  }

  function buildOrder(n) {
    let order = [];
    for (let lap = 0; lap < S.laps; lap++) order = order.concat(shuffled(n));
    return order;
  }

  $("favStartBtn").addEventListener("click", () => {
    const names = readNames();
    if (names.some((n) => !n)) {
      $("favSetupWarn").textContent = "ใส่ชื่อให้ครบทุกช่องก่อนนะ";
      return;
    }
    if (names.length < MIN_PLAYERS) {
      $("favSetupWarn").textContent = "ต้องมีอย่างน้อย " + MIN_PLAYERS + " คน";
      return;
    }
    if (new Set(names).size !== names.length) {
      $("favSetupWarn").textContent = "ชื่อซ้ำกัน เปลี่ยนให้ต่างกันก่อนนะ";
      return;
    }
    $("favSetupWarn").textContent = "";
    S.players = names.map((name, i) => ({ name: name, color: PLAYER_COLORS[i % PLAYER_COLORS.length], score: 0 }));
    S.order = buildOrder(S.players.length);
    S.roundIdx = 0;
    startRound();
  });

  function targetIdx() {
    return S.order[S.roundIdx];
  }

  function startRound() {
    const item = drawQuestion();
    if (!item) return;
    S.question = item;
    S.correct = new Set();

    const target = S.players[targetIdx()];
    $("favRoundTag").textContent = "รอบที่ " + (S.roundIdx + 1) + " / " + S.order.length;
    $("favRoundCardHolder").innerHTML = cardHtml(item);
    ["favTargetName", "favTargetName2", "favTargetName3"].forEach((id) => {
      $(id).textContent = target.name;
      $(id).style.color = target.color;
    });
    showStage("favRound");
  }

  $("favRevealBtn").addEventListener("click", () => {
    renderGuessers();
    renderScoreList($("favScoreList"), false);
    $("favNextRoundBtn").textContent =
      S.roundIdx + 1 >= S.order.length ? "ดูผลรวม 🏆" : "รอบต่อไป →";
    showStage("favScore");
  });

  function renderGuessers() {
    const wrap = $("favGuessers");
    wrap.innerHTML = "";
    S.players.forEach((p, i) => {
      if (i === targetIdx()) return;
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "fav-guesser";
      btn.innerHTML = '<span class="fav-guesser-dot" style="background:' + p.color + '"></span>' + esc(p.name);
      btn.addEventListener("click", () => {
        if (S.correct.has(i)) {
          S.correct.delete(i);
          btn.classList.remove("hit");
        } else {
          S.correct.add(i);
          btn.classList.add("hit");
        }
        renderScoreList($("favScoreList"), false);
      });
      wrap.appendChild(btn);
    });
  }

  // แสดงตารางคะแนน — final=true จะเรียงลำดับและใส่เหรียญให้
  function renderScoreList(wrap, final) {
    const rows = S.players.map((p, i) => ({
      p: p,
      i: i,
      pts: p.score + pendingPoints(i),
    }));
    if (final) rows.sort((a, b) => b.pts - a.pts);
    const medals = ["🥇", "🥈", "🥉"];
    const top = final ? rows[0].pts : -1;

    wrap.innerHTML = "";
    rows.forEach((row, rank) => {
      const div = document.createElement("div");
      div.className = "fav-score-row" + (final && row.pts === top ? " fav-score-win" : "");
      const lead = final ? (medals[rank] || rank + 1 + ".") + " " : "";
      div.innerHTML =
        '<span class="fav-score-name">' +
          '<i class="fav-score-dot" style="background:' + row.p.color + '"></i>' +
          lead + esc(row.p.name) +
          (!final && row.i === targetIdx() ? ' <em class="fav-score-tag">เจ้าของคำตอบ</em>' : "") +
        "</span>" +
        '<span class="fav-score-pts">' + row.pts + "</span>";
      wrap.appendChild(div);
    });
  }

  // แต้มที่กำลังจะได้จากรอบปัจจุบัน (ยังไม่บันทึกลง score จนกว่าจะกดรอบต่อไป)
  function pendingPoints(i) {
    if (S.mode !== "guess" || !S.question) return 0;
    if (S.correct.has(i)) return 1;
    if (i === targetIdx() && S.correct.size > 0) return 1;
    return 0;
  }

  $("favNextRoundBtn").addEventListener("click", () => {
    S.players.forEach((p, i) => {
      p.score += pendingPoints(i);
    });
    S.correct = new Set();
    S.question = null;

    if (S.roundIdx + 1 >= S.order.length) {
      renderScoreList($("favFinalList"), true);
      showStage("favFinal");
      return;
    }
    S.roundIdx++;
    startRound();
  });

  $("favRestartBtn").addEventListener("click", () => {
    S.players.forEach((p) => {
      p.score = 0;
    });
    showStage("favSetup");
  });

  // ---------- เริ่มต้น ----------
  renderPlayerInputs(DEFAULT_NAMES.slice());
  applyMode();
  nextTalk();
});
