// เกม "ถามไวตอบไว" — โจทย์ "บอกมา 3 อย่าง" 2 โหมด
//   chill = ชิล ๆ (สุ่มโจทย์ ผลัดกันตอบ ไม่จับเวลา)
//   race  = แข่งจับเวลา (สุ่มว่าถึงตาใคร ตอบให้ครบ 3 ข้อก่อนหมดเวลา แล้วเก็บแต้ม)
document.addEventListener("DOMContentLoaded", () => {
  const $ = (id) => document.getElementById(id);

  const CAT_LABEL = {
    travel: "✈️ เที่ยว",
    food: "🍜 ของกิน",
    ent: "🎬 บันเทิง",
    self: "🪞 เรื่องของตัวเอง",
    stuff: "🎒 ของ & ไอเทม",
    people: "🫂 คนรอบตัว",
    daily: "☀️ ชีวิตประจำวัน",
    fun: "🎲 สมมติ & ฮา",
  };

  const MODE_DESC = {
    chill: "สุ่มโจทย์ขึ้นมา แล้วผลัดกันตอบคนละ 3 อย่างรอบวง ไม่มีเวลาบีบ",
    race: "สุ่มว่าถึงตาใคร แล้วตอบให้ครบ 3 อย่างก่อนหมดเวลา ตอบเร็วได้แต้มพิเศษ",
  };

  const PLAYER_COLORS = [
    "#ff9500", "#2be6ff", "#d6ff3d", "#ff2f87", "#9d6bff",
    "#1de9b6", "#5b6eff", "#ff3d54", "#34d399", "#ffd23f",
  ];

  const SLOTS = 3;
  const MIN_PLAYERS = 2;
  const MAX_PLAYERS = 10;
  const TICK_MS = 100;

  const S = {
    mode: "chill",
    cat: "all",
    players: [],
    order: [],
    roundIdx: 0,
    laps: 1,
    secs: 10,
    question: null,
    filled: [],       // สถานะช่อง 1-2-3 ของรอบปัจจุบัน
    running: false,
    msLeft: 0,
    earned: 0,        // แต้มที่ได้จากรอบปัจจุบัน (0 = ไม่ทัน, 1 = ครบ, 2 = ครบเร็ว)
    done: false,      // รอบนี้จบแล้ว (ตอบครบหรือหมดเวลา)
  };

  const pickers = {};
  let ticker = null;

  function esc(s) {
    return String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  }

  // ---------- คลังโจทย์ ----------
  function poolOf(cat) {
    return cat === "all" ? RAPIDFIRE_LIST : RAPIDFIRE_LIST.filter((x) => x.cat === cat);
  }

  function drawQuestion() {
    if (!pickers[S.cat]) pickers[S.cat] = createPicker(poolOf(S.cat), "pg_rapidfire_" + S.cat);
    return pickers[S.cat]();
  }

  function cardHtml(item) {
    return (
      '<div class="trivia-card rf-card">' +
        '<div class="cat">' + CAT_LABEL[item.cat] + " · บอกมา 3 อย่าง</div>" +
        '<div class="statement">' + item.q + "</div>" +
      "</div>"
    );
  }

  // ---------- โหมดชิล ๆ ----------
  function nextChill() {
    const item = drawQuestion();
    if (!item) return;
    $("rfCardHolder").innerHTML = cardHtml(item);
  }

  $("rfChillNext").addEventListener("click", nextChill);

  // ---------- สลับโหมด / หมวด ----------
  function applyMode() {
    $("rfChill").classList.toggle("rf-hidden", S.mode !== "chill");
    $("rfRace").classList.toggle("rf-hidden", S.mode !== "race");
    $("rfModeDesc").textContent = MODE_DESC[S.mode];
    if (S.mode !== "race") stopTicker();
  }

  $("rfModes").querySelectorAll(".rf-mode-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      if (S.mode === btn.dataset.mode) return;
      $("rfModes").querySelectorAll(".rf-mode-btn").forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");
      S.mode = btn.dataset.mode;
      applyMode();
    });
  });

  $("rfCatTags").querySelectorAll(".tag").forEach((tagEl) => {
    tagEl.addEventListener("click", () => {
      $("rfCatTags").querySelectorAll(".tag").forEach((t) => t.classList.remove("active"));
      tagEl.classList.add("active");
      S.cat = tagEl.dataset.cat;
      // กำลังจับเวลาอยู่ไม่ต้องสลับโจทย์กลางคัน หมวดใหม่จะมีผลรอบถัดไป
      if (S.mode === "chill") nextChill();
    });
  });

  // ---------- ตั้งค่าผู้เล่น ----------
  const DEFAULT_NAMES = ["เอ", "บี", "ซี", "ดี"];

  function renderPlayerInputs(names) {
    const wrap = $("rfPlayerList");
    wrap.innerHTML = "";
    names.forEach((name, i) => {
      const row = document.createElement("div");
      row.className = "rf-player-row";
      row.innerHTML =
        '<span class="rf-player-dot" style="background:' + PLAYER_COLORS[i % PLAYER_COLORS.length] + '">' + (i + 1) + "</span>" +
        '<input class="rf-player-input" type="text" maxlength="12" value="' + esc(name) + '" placeholder="ชื่อผู้เล่น">' +
        '<button class="rf-player-del" type="button" aria-label="ลบผู้เล่น">✕</button>';
      row.querySelector(".rf-player-del").addEventListener("click", () => {
        const current = readNames();
        if (current.length <= MIN_PLAYERS) {
          $("rfSetupWarn").textContent = "ต้องมีอย่างน้อย " + MIN_PLAYERS + " คน";
          return;
        }
        current.splice(i, 1);
        renderPlayerInputs(current);
        $("rfSetupWarn").textContent = "";
      });
      wrap.appendChild(row);
    });
  }

  function readNames() {
    return Array.from($("rfPlayerList").querySelectorAll(".rf-player-input")).map((el) => el.value.trim());
  }

  $("rfAddPlayer").addEventListener("click", () => {
    const names = readNames();
    if (names.length >= MAX_PLAYERS) {
      $("rfSetupWarn").textContent = "รับได้สูงสุด " + MAX_PLAYERS + " คน";
      return;
    }
    names.push("");
    renderPlayerInputs(names);
    $("rfSetupWarn").textContent = "";
  });

  function bindSwitch(wrapId, attr, onPick) {
    $(wrapId).querySelectorAll(".rf-opt-btn").forEach((btn) => {
      btn.addEventListener("click", () => {
        $(wrapId).querySelectorAll(".rf-opt-btn").forEach((b) => b.classList.remove("active"));
        btn.classList.add("active");
        onPick(parseInt(btn.dataset[attr], 10));
      });
    });
  }

  bindSwitch("rfTimeSwitch", "sec", (v) => { S.secs = v; });
  bindSwitch("rfLapSwitch", "laps", (v) => { S.laps = v; });

  // ---------- ดำเนินเกมโหมดแข่ง ----------
  const STAGES = ["rfSetup", "rfPlay", "rfFinal"];

  function showStage(id) {
    STAGES.forEach((s) => $(s).classList.toggle("rf-hidden", s !== id));
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

  $("rfStartGameBtn").addEventListener("click", () => {
    const names = readNames();
    if (names.some((n) => !n)) {
      $("rfSetupWarn").textContent = "ใส่ชื่อให้ครบทุกช่องก่อนนะ";
      return;
    }
    if (names.length < MIN_PLAYERS) {
      $("rfSetupWarn").textContent = "ต้องมีอย่างน้อย " + MIN_PLAYERS + " คน";
      return;
    }
    if (new Set(names).size !== names.length) {
      $("rfSetupWarn").textContent = "ชื่อซ้ำกัน เปลี่ยนให้ต่างกันก่อนนะ";
      return;
    }
    $("rfSetupWarn").textContent = "";
    S.players = names.map((name, i) => ({ name: name, color: PLAYER_COLORS[i % PLAYER_COLORS.length], score: 0 }));
    S.order = [];
    for (let lap = 0; lap < S.laps; lap++) S.order = S.order.concat(shuffled(S.players.length));
    S.roundIdx = 0;
    startRound();
  });

  function turnIdx() {
    return S.order[S.roundIdx];
  }

  function startRound() {
    stopTicker();
    const item = drawQuestion();
    if (!item) return;
    S.question = item;
    S.filled = [false, false, false];
    S.running = false;
    S.done = false;
    S.earned = 0;
    S.msLeft = S.secs * 1000;

    const p = S.players[turnIdx()];
    $("rfRoundTag").textContent = "รอบที่ " + (S.roundIdx + 1) + " / " + S.order.length;
    $("rfTurnName").textContent = p.name;
    $("rfTurnName").style.color = p.color;
    $("rfPlayCardHolder").innerHTML = cardHtml(item);

    renderSlots();
    renderClock();
    $("rfClock").classList.remove("rf-danger", "rf-clock-ok", "rf-clock-fail");
    $("rfSlotHint").textContent = 'กด "เริ่ม" แล้วแตะช่อง 1-2-3 ทุกครั้งที่เจ้าตัวตอบได้ 1 ข้อ';
    $("rfGoBtn").classList.remove("rf-hidden");
    $("rfGoBtn").textContent = "เริ่มจับเวลา ▶";
    $("rfResult").classList.add("rf-hidden");
    $("rfNextRoundBtn").classList.add("rf-hidden");
    renderScoreList($("rfScoreList"), false);
    showStage("rfPlay");
  }

  function renderSlots() {
    $("rfSlots").querySelectorAll(".rf-slot").forEach((btn, i) => {
      btn.classList.toggle("filled", S.filled[i]);
      btn.disabled = !S.running;
      btn.textContent = S.filled[i] ? "✓" : String(i + 1);
    });
  }

  function renderClock() {
    const left = Math.max(0, S.msLeft);
    $("rfClock").textContent = left >= 10000 ? Math.ceil(left / 1000) : (left / 1000).toFixed(1);
    $("rfClock").classList.toggle("rf-danger", S.running && left <= 3000);
  }

  function stopTicker() {
    if (ticker) {
      clearInterval(ticker);
      ticker = null;
    }
    S.running = false;
  }

  $("rfGoBtn").addEventListener("click", () => {
    if (S.running || S.done) return;
    S.running = true;
    S.msLeft = S.secs * 1000;
    $("rfGoBtn").classList.add("rf-hidden");
    $("rfSlotHint").textContent = "แตะช่องทุกครั้งที่เขาตอบได้ 1 อย่าง!";
    renderSlots();
    renderClock();
    const startedAt = Date.now();
    ticker = setInterval(() => {
      S.msLeft = S.secs * 1000 - (Date.now() - startedAt);
      renderClock();
      if (S.msLeft <= 0) finishRound(false);
    }, TICK_MS);
  });

  $("rfSlots").querySelectorAll(".rf-slot").forEach((btn) => {
    btn.addEventListener("click", () => {
      if (!S.running) return;
      const i = parseInt(btn.dataset.slot, 10);
      S.filled[i] = !S.filled[i];
      renderSlots();
      if (S.filled.every(Boolean)) finishRound(true);
    });
  });

  function finishRound(ok) {
    const msLeft = Math.max(0, S.msLeft);
    stopTicker();
    S.done = true;
    S.msLeft = ok ? msLeft : 0;
    renderClock();
    renderSlots();

    // ตอบครบภายในครึ่งเวลาแรก = เร็วพิเศษ ได้ 2 แต้ม
    const fast = ok && msLeft > S.secs * 500;
    S.earned = ok ? (fast ? 2 : 1) : 0;

    const box = $("rfResult");
    box.classList.remove("rf-hidden", "rf-result-ok", "rf-result-fail");
    if (ok) {
      box.classList.add("rf-result-ok");
      box.innerHTML = fast
        ? "⚡ ไวมาก! เหลือตั้ง " + (msLeft / 1000).toFixed(1) + " วิ &nbsp;<b>+2 แต้ม</b>"
        : "✅ ครบ 3 อย่างพอดี &nbsp;<b>+1 แต้ม</b>";
      $("rfClock").classList.add("rf-clock-ok");
    } else {
      box.classList.add("rf-result-fail");
      box.innerHTML = "⏰ หมดเวลา! ตอบได้ " + S.filled.filter(Boolean).length + "/3 &nbsp;<b>ไม่ได้แต้ม</b>";
      $("rfClock").classList.add("rf-clock-fail");
      pgTimeUp();
    }
    $("rfSlotHint").textContent = "";
    $("rfGoBtn").classList.add("rf-hidden");
    $("rfNextRoundBtn").classList.remove("rf-hidden");
    $("rfNextRoundBtn").textContent = S.roundIdx + 1 >= S.order.length ? "ดูผลรวม 🏆" : "รอบต่อไป →";
    renderScoreList($("rfScoreList"), false);
  }

  $("rfNextRoundBtn").addEventListener("click", () => {
    S.players[turnIdx()].score += S.earned;
    S.earned = 0;
    S.question = null;
    if (S.roundIdx + 1 >= S.order.length) {
      renderScoreList($("rfFinalList"), true);
      showStage("rfFinal");
      return;
    }
    S.roundIdx++;
    startRound();
  });

  $("rfRestartBtn").addEventListener("click", () => {
    S.players.forEach((p) => {
      p.score = 0;
    });
    showStage("rfSetup");
  });

  function renderScoreList(wrap, final) {
    const rows = S.players.map((p, i) => ({
      p: p,
      i: i,
      pts: p.score + (!final && S.done && i === turnIdx() ? S.earned : 0),
    }));
    if (final) rows.sort((a, b) => b.pts - a.pts);
    const medals = ["🥇", "🥈", "🥉"];
    const top = final && rows.length ? rows[0].pts : -1;

    wrap.innerHTML = "";
    rows.forEach((row, rank) => {
      const div = document.createElement("div");
      div.className = "rf-score-row" + (final && row.pts === top ? " rf-score-win" : "");
      const lead = final ? (medals[rank] || rank + 1 + ".") + " " : "";
      div.innerHTML =
        '<span class="rf-score-name">' +
          '<i class="rf-score-dot" style="background:' + row.p.color + '"></i>' +
          lead + esc(row.p.name) +
          (!final && row.i === turnIdx() ? ' <em class="rf-score-tag">ตานี้</em>' : "") +
        "</span>" +
        '<span class="rf-score-pts">' + row.pts + "</span>";
      wrap.appendChild(div);
    });
  }

  // ---------- เริ่มต้น ----------
  renderPlayerInputs(DEFAULT_NAMES.slice());
  applyMode();
  nextChill();
});
