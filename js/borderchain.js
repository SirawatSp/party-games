document.addEventListener("DOMContentLoaded", () => {
  const $ = (id) => document.getElementById(id);

  const MODE_HINT = {
    coop: "ทุกคนช่วยกันตะโกนคำตอบ แข่งกับเวลาอย่างเดียว เครื่องจำสถิติสูงสุดของเครื่องนี้ไว้ให้",
    turn: "วนตอบทีละคน ใครตอบผิดหรือหมดเวลาตกรอบทันที เหลือคนสุดท้ายคือผู้ชนะ",
  };
  const HINT_HINT = {
    on: "บอกว่าประเทศปัจจุบันเหลือเพื่อนบ้านที่ยังไม่ได้ใช้กี่ประเทศ",
    off: "ไม่บอกอะไรเลย ต้องรู้เองล้วน ๆ",
  };
  const BEST_KEY = "pg_borderchain_best";

  // ---------- เตรียมข้อมูลค้นหา ----------
  const BY_CODE = {};
  BORDER_COUNTRIES.forEach((c) => (BY_CODE[c.code] = c));

  // ตัดช่องว่าง เครื่องหมาย และวรรณยุกต์ที่พิมพ์ต่างกันได้ ให้เทียบง่ายขึ้น
  function norm(s) {
    return String(s)
      .toLowerCase()
      .replace(/[\s​._'’\-–—(),.]/g, "")
      .replace(/ํ/g, "")
      .trim();
  }

  // ตารางค้นหา: ชื่อทุกแบบ -> รหัสประเทศ
  const LOOKUP = {};
  BORDER_COUNTRIES.forEach((c) => {
    [c.th, c.en].concat(c.alias || []).forEach((name) => {
      const k = norm(name);
      if (!k) return;
      // ถ้าชื่อย่อชนกัน ให้ชื่อหลักชนะเสมอ
      if (LOOKUP[k] && LOOKUP[k] !== c.code) return;
      LOOKUP[k] = c.code;
    });
  });
  // ชื่อหลักต้องชนะทุกกรณี เขียนทับอีกรอบกันชนกับ alias ของประเทศอื่น
  BORDER_COUNTRIES.forEach((c) => {
    LOOKUP[norm(c.th)] = c.code;
    LOOKUP[norm(c.en)] = c.code;
  });

  const S = {
    mode: "coop",
    totalTime: 90,
    turnTime: 15,
    hintOn: true,
    players: [],
    alive: [],
    turnIdx: 0,
    cur: null,
    chain: [],
    used: new Set(),
    score: 0,
    streak: 0,
    timeLeft: 0,
    ticker: null,
    over: false,
  };

  function esc(s) {
    return String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  }
  function show(id) {
    ["bcSetup", "bcPlay", "bcEnd"].forEach((x) => $(x).classList.toggle("bc-hidden", x !== id));
  }
  function warn(m) {
    $("bcWarn").textContent = m;
  }
  function readBest() {
    try {
      return parseInt(localStorage.getItem(BEST_KEY) || "0", 10) || 0;
    } catch (e) {
      return 0;
    }
  }
  function writeBest(v) {
    try {
      localStorage.setItem(BEST_KEY, String(v));
    } catch (e) {
      /* โหมดส่วนตัวเขียนไม่ได้ ไม่เป็นไร */
    }
  }

  // ---------- ตั้งค่า ----------
  function renderPlayers() {
    $("bcPlayerList").innerHTML = S.players
      .map((p, i) => '<span class="bc-chip">' + esc(p) + '<button class="bc-chip-x" data-i="' + i + '" type="button" aria-label="ลบ">×</button></span>')
      .join("");
    $("bcPlayerList").querySelectorAll("[data-i]").forEach((b) => {
      b.addEventListener("click", () => {
        S.players.splice(Number(b.dataset.i), 1);
        renderPlayers();
      });
    });
  }
  function addPlayer() {
    const n = $("bcNameInput").value.trim();
    if (!n) return;
    if (S.players.length >= 10) return warn("ใส่ได้สูงสุด 10 คน");
    if (S.players.indexOf(n) >= 0) return warn("ชื่อ " + n + " ซ้ำกับที่ใส่ไปแล้ว");
    S.players.push(n);
    $("bcNameInput").value = "";
    $("bcNameInput").focus();
    warn("");
    renderPlayers();
  }
  $("bcAddBtn").addEventListener("click", addPlayer);
  $("bcNameInput").addEventListener("keydown", (e) => {
    if (e.key === "Enter") addPlayer();
  });

  $("bcModeSwitch").querySelectorAll("[data-mode]").forEach((b) => {
    b.addEventListener("click", () => {
      $("bcModeSwitch").querySelectorAll("[data-mode]").forEach((x) => x.classList.remove("active"));
      b.classList.add("active");
      S.mode = b.dataset.mode;
      $("bcModeHint").textContent = MODE_HINT[S.mode];
      $("bcPlayerOpt").classList.toggle("bc-hidden", S.mode !== "turn");
      $("bcTimeOpt").classList.toggle("bc-hidden", S.mode === "turn");
      warn("");
    });
  });
  $("bcTimeSwitch").querySelectorAll("[data-time]").forEach((b) => {
    b.addEventListener("click", () => {
      $("bcTimeSwitch").querySelectorAll("[data-time]").forEach((x) => x.classList.remove("active"));
      b.classList.add("active");
      S.totalTime = parseInt(b.dataset.time, 10);
    });
  });
  $("bcTurnSwitch").querySelectorAll("[data-turn]").forEach((b) => {
    b.addEventListener("click", () => {
      $("bcTurnSwitch").querySelectorAll("[data-turn]").forEach((x) => x.classList.remove("active"));
      b.classList.add("active");
      S.turnTime = parseInt(b.dataset.turn, 10);
    });
  });
  $("bcHintSwitch").querySelectorAll("[data-hint]").forEach((b) => {
    b.addEventListener("click", () => {
      $("bcHintSwitch").querySelectorAll("[data-hint]").forEach((x) => x.classList.remove("active"));
      b.classList.add("active");
      S.hintOn = b.dataset.hint === "on";
      $("bcHintHint").textContent = HINT_HINT[S.hintOn ? "on" : "off"];
    });
  });

  // ---------- เริ่มเกม ----------
  $("bcStartBtn").addEventListener("click", () => {
    if (S.mode === "turn" && S.players.length < 2) {
      return warn("โหมดผลัดกันตอบต้องมีผู้เล่นอย่างน้อย 2 คน");
    }
    warn("");
    startGame();
  });
  $("bcAgainBtn").addEventListener("click", startGame);
  $("bcBackBtn").addEventListener("click", () => {
    stopTimer();
    show("bcSetup");
  });
  $("bcGiveUpBtn").addEventListener("click", () => endGame("ยอมแพ้"));

  function pickStart() {
    // เริ่มจากประเทศที่มีเพื่อนบ้านตั้งแต่ 3 ขึ้นไป จะได้ไม่ตันตั้งแต่ตาแรก
    const good = BORDER_COUNTRIES.filter((c) => c.borders.length >= 3);
    return good[Math.floor(Math.random() * good.length)];
  }

  function startGame() {
    stopTimer();
    S.cur = pickStart();
    S.chain = [S.cur.code];
    S.used = new Set([S.cur.code]);
    S.score = 0;
    S.streak = 0;
    S.over = false;
    S.alive = S.players.slice();
    S.turnIdx = 0;
    S.timeLeft = S.mode === "turn" ? S.turnTime : S.totalTime;

    $("bcFeedback").textContent = "";
    $("bcFeedback").className = "bc-feedback";
    $("bcAnswer").value = "";
    $("bcAnswer").disabled = false;
    $("bcSubmitBtn").disabled = false;
    $("bcClockCap").textContent = S.mode === "turn" ? "วิ (ตานี้)" : "วินาที";
    show("bcPlay");
    render();
    startTimer();
    $("bcAnswer").focus();
  }

  // ---------- นาฬิกา ----------
  function stopTimer() {
    if (S.ticker) {
      clearInterval(S.ticker);
      S.ticker = null;
    }
  }
  function startTimer() {
    stopTimer();
    if (S.mode === "coop" && !S.totalTime) {
      $("bcClock").textContent = "∞";
      return;
    }
    renderClock();
    S.ticker = setInterval(() => {
      S.timeLeft--;
      renderClock();
      if (S.timeLeft <= 0) {
        stopTimer();
        if (S.mode === "turn") {
          eliminate(S.alive[S.turnIdx] + " หมดเวลา");
        } else {
          if (typeof pgTimeUp === "function") pgTimeUp();
          endGame("หมดเวลา");
        }
      }
    }, 1000);
  }
  function renderClock() {
    $("bcClock").textContent = Math.max(0, S.timeLeft);
    $("bcClock").classList.toggle("bc-danger", S.timeLeft <= 5);
  }

  // ---------- แสดงผล ----------
  function remainingNeighbors() {
    return S.cur.borders.filter((b) => !S.used.has(b));
  }
  function render() {
    $("bcCurName").textContent = S.cur.th;
    $("bcCurEn").textContent = S.cur.en;
    $("bcScore").textContent = S.score;
    $("bcChainLen").textContent = S.chain.length;

    const left = remainingNeighbors().length;
    $("bcCurHint").textContent = S.hintOn
      ? "เหลือเพื่อนบ้านที่ยังไม่ได้ใช้ " + left + " ประเทศ (ทั้งหมด " + S.cur.borders.length + ")"
      : "";

    $("bcTurnTag").classList.toggle("bc-hidden", S.mode !== "turn");
    if (S.mode === "turn") {
      $("bcTurnTag").innerHTML =
        "ถึงตา <b>" + esc(S.alive[S.turnIdx]) + "</b> · เหลือผู้เล่น " + S.alive.length + " คน";
    }
    renderChain("bcChain");
  }
  function renderChain(target) {
    $(target).innerHTML = S.chain
      .map((code, i) => {
        const c = BY_CODE[code];
        const last = i === S.chain.length - 1;
        return (
          '<span class="bc-link' + (last ? " bc-link-cur" : "") + '">' +
          (i === 0 ? "🚩 " : "") + esc(c.th) +
          "</span>"
        );
      })
      .join('<span class="bc-arrow">→</span>');
  }

  function feedback(msg, kind) {
    const el = $("bcFeedback");
    el.textContent = msg;
    el.className = "bc-feedback bc-fb-" + kind;
  }

  // ---------- ตอบ ----------
  function submit() {
    if (S.over) return;
    const raw = $("bcAnswer").value.trim();
    if (!raw) return;
    const code = LOOKUP[norm(raw)];
    $("bcAnswer").value = "";

    if (!code) {
      return miss("ไม่รู้จักประเทศ \"" + raw + "\" — ลองพิมพ์ชื่อเต็มหรือภาษาอังกฤษดู", false);
    }
    if (S.used.has(code)) {
      return miss(BY_CODE[code].th + " ใช้ไปแล้วในโซ่นี้", true);
    }
    if (S.cur.borders.indexOf(code) < 0) {
      return miss(BY_CODE[code].th + " ไม่มีชายแดนติดกับ" + S.cur.th, true);
    }

    // ตอบถูก
    S.streak++;
    const gain = 100 + 25 * (S.streak - 1);
    S.score += gain;
    S.used.add(code);
    S.chain.push(code);
    S.cur = BY_CODE[code];
    feedback("✅ " + S.cur.th + " ถูกต้อง! +" + gain + (S.streak > 1 ? " (ต่อเนื่อง " + S.streak + ")" : ""), "ok");
    if (navigator.vibrate) navigator.vibrate(30);

    if (S.mode === "turn") {
      nextTurn();
    } else {
      S.timeLeft = S.timeLeft; // โหมดช่วยกันใช้เวลารวม ไม่รีเซ็ต
    }
    render();

    // ตันเมื่อไม่เหลือเพื่อนบ้านที่ยังไม่ได้ใช้
    if (remainingNeighbors().length === 0) {
      endGame("ตัน");
    }
  }

  // ตอบผิด: โหมดช่วยกันแค่รีเซ็ตสตรีค โหมดผลัดคือตกรอบ
  function miss(msg, resetStreak) {
    if (resetStreak) S.streak = 0;
    feedback("❌ " + msg, "bad");
    if (navigator.vibrate) navigator.vibrate(120);
    if (S.mode === "turn") eliminate(S.alive[S.turnIdx] + " ตอบผิด");
    else render();
  }

  function eliminate(reason) {
    const out = S.alive.splice(S.turnIdx, 1)[0];
    feedback("💀 " + reason + " — " + out + " ตกรอบ", "bad");
    if (S.alive.length <= 1) return endGame("เหลือคนสุดท้าย");
    if (S.turnIdx >= S.alive.length) S.turnIdx = 0;
    S.timeLeft = S.turnTime;
    startTimer();
    render();
    $("bcAnswer").focus();
  }

  function nextTurn() {
    S.turnIdx = (S.turnIdx + 1) % S.alive.length;
    S.timeLeft = S.turnTime;
    startTimer();
    $("bcAnswer").focus();
  }

  $("bcSubmitBtn").addEventListener("click", submit);
  $("bcAnswer").addEventListener("keydown", (e) => {
    if (e.key === "Enter") submit();
  });

  // ---------- จบเกม ----------
  function endGame(reason) {
    if (S.over) return;
    S.over = true;
    stopTimer();
    $("bcAnswer").disabled = true;
    $("bcSubmitBtn").disabled = true;

    const len = S.chain.length;
    const best = readBest();
    const isRecord = S.mode === "coop" && len > best;
    if (isRecord) writeBest(len);

    if (S.mode === "turn") {
      $("bcEndIcon").textContent = "🏆";
      $("bcEndTitle").textContent = S.alive.length === 1 ? S.alive[0] + " ชนะ!" : "จบเกม";
      $("bcEndText").textContent =
        reason === "ตัน"
          ? "โซ่ตันที่" + S.cur.th + " — ไม่เหลือเพื่อนบ้านที่ยังไม่ได้ใช้แล้ว"
          : "ทุกคนตกรอบหมดจนเหลือคนสุดท้าย";
    } else {
      $("bcEndIcon").textContent = isRecord ? "🎉" : reason === "ตัน" ? "🧱" : "🏁";
      $("bcEndTitle").textContent = isRecord ? "สถิติใหม่!" : reason === "ตัน" ? "โซ่ตันแล้ว" : "หมดเวลา";
      $("bcEndText").textContent =
        reason === "ตัน"
          ? S.cur.th + " ไม่เหลือเพื่อนบ้านที่ยังไม่ได้ใช้แล้ว ต่อไม่ได้อีก"
          : "ต่อโซ่ได้ " + len + " ประเทศ";
    }

    $("bcEndScore").textContent = S.score;
    $("bcEndLen").textContent = len;
    $("bcEndBest").textContent = Math.max(best, S.mode === "coop" ? len : best);
    renderChain("bcEndChain");

    // บอกว่าตรงประเทศสุดท้ายยังมีทางไปต่อไหม จะได้รู้ว่าพลาดอะไร
    const left = remainingNeighbors();
    $("bcMissed").innerHTML = left.length
      ? '<div class="bc-missed-head">ตรง' + esc(S.cur.th) + " ยังไปต่อได้อีก</div>" +
        left.map((b) => '<span class="bc-missed-chip">' + esc(BY_CODE[b].th) + "</span>").join("")
      : "";

    show("bcEnd");
    if (navigator.vibrate) navigator.vibrate([120, 60, 120]);
  }

  // ---------- ค่าเริ่มต้น ----------
  $("bcModeHint").textContent = MODE_HINT.coop;
  $("bcHintHint").textContent = HINT_HINT.on;
  renderPlayers();
});
