document.addEventListener("DOMContentLoaded", () => {
  const $ = (id) => document.getElementById(id);

  const MAX_PLAYERS = 10;
  const MIN_PLAYERS = 3;

  const PEEK_HINT = {
    on: "คนโกหกจะเห็นคำตอบจริงด้วย แล้วต้องแต่งคำตอบใกล้ ๆ ให้คนทายแยกไม่ออก — ยากขึ้นและสนุกกว่า",
    off: "คนโกหกจะเห็นแค่คำถาม ต้องมั่วคำตอบเอง — ง่ายขึ้นสำหรับคนทาย เหมาะกับวงที่เพิ่งเริ่มเล่น",
  };

  // รวมคลังคำถามของเกมนี้เข้ากับคลังทริเวียเดิม โดยเอาเฉพาะข้อที่คำตอบสั้นพอ
  // จะได้พูดออกเสียงและแต่งเลียนแบบได้ทัน (คำตอบยาว ๆ เล่นเกมนี้ไม่สนุก)
  function buildPool() {
    const seen = new Set();
    const pool = [];
    BLUFF_LIST.forEach((x) => {
      if (seen.has(x.question)) return;
      seen.add(x.question);
      pool.push({ question: x.question, answer: x.answer });
    });
    if (typeof WORLD_TRIVIA_QA !== "undefined") {
      WORLD_TRIVIA_QA.forEach((x) => {
        if (seen.has(x.question)) return;
        if (x.answer.length > 45) return;
        seen.add(x.question);
        pool.push({ question: x.question, answer: x.answer });
      });
    }
    return pool;
  }

  const POOL = buildPool();

  const S = {
    players: [],
    peek: true,
    maxRounds: 10,
    round: 0,
    guesserIdx: 0,
    truthIdx: -1,
    passQueue: [],
    passPos: 0,
    current: null,
    drawQuestion: null,
    scores: {},
    stats: {}, // เก็บสถิติไว้สรุปตอนจบ
  };

  function esc(str) {
    return String(str).replace(/[&<>"']/g, (ch) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[ch]));
  }

  function show(id) {
    ["bfSetup", "bfRoundIntro", "bfPass", "bfRole", "bfGuess", "bfReveal", "bfFinal"].forEach((s) =>
      $(s).classList.toggle("bf-hidden", s !== id)
    );
  }

  // ---------- ตั้งวง ----------
  function renderPlayers() {
    $("bfPlayerList").innerHTML = S.players
      .map(
        (p, i) =>
          '<span class="bf-chip">' + esc(p) + '<button class="bf-chip-x" data-i="' + i + '" type="button" aria-label="ลบ ' + esc(p) + '">×</button></span>'
      )
      .join("");
    $("bfPlayerList").querySelectorAll("[data-i]").forEach((btn) => {
      btn.addEventListener("click", () => {
        S.players.splice(Number(btn.dataset.i), 1);
        renderPlayers();
      });
    });
  }

  function addPlayer() {
    const name = $("bfNameInput").value.trim();
    if (!name) return;
    if (S.players.length >= MAX_PLAYERS) {
      warn("ใส่ได้สูงสุด " + MAX_PLAYERS + " คน");
      return;
    }
    if (S.players.some((p) => p === name)) {
      warn("ชื่อ " + name + " ซ้ำกับคนที่ใส่ไปแล้ว ลองเติมตัวเลขต่อท้ายดู");
      return;
    }
    S.players.push(name);
    $("bfNameInput").value = "";
    $("bfNameInput").focus();
    warn("");
    renderPlayers();
  }

  function warn(msg) {
    $("bfWarn").textContent = msg;
  }

  $("bfAddBtn").addEventListener("click", addPlayer);
  $("bfNameInput").addEventListener("keydown", (e) => {
    if (e.key === "Enter") addPlayer();
  });

  $("bfPeekSwitch").querySelectorAll("[data-peek]").forEach((btn) => {
    btn.addEventListener("click", () => {
      $("bfPeekSwitch").querySelectorAll("[data-peek]").forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");
      S.peek = btn.dataset.peek === "on";
      $("bfPeekHint").textContent = PEEK_HINT[S.peek ? "on" : "off"];
    });
  });

  $("bfRoundSwitch").querySelectorAll("[data-rounds]").forEach((btn) => {
    btn.addEventListener("click", () => {
      $("bfRoundSwitch").querySelectorAll("[data-rounds]").forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");
      S.maxRounds = Number(btn.dataset.rounds);
    });
  });

  // ---------- เริ่มเกม ----------
  $("bfStartBtn").addEventListener("click", () => {
    if (S.players.length < MIN_PLAYERS) {
      warn("ต้องมีผู้เล่นอย่างน้อย " + MIN_PLAYERS + " คน (คนทาย 1 + คนพูดความจริง 1 + คนโกหกอย่างน้อย 1)");
      return;
    }
    warn("");
    S.round = 0;
    S.guesserIdx = 0;
    S.scores = {};
    S.stats = {};
    S.players.forEach((p) => {
      S.scores[p] = 0;
      S.stats[p] = { guessRight: 0, guessTotal: 0, fooled: 0, truthFound: 0, truthTotal: 0 };
    });
    S.drawQuestion = createPicker(POOL, "pg_bluff");
    startRound();
  });

  // ---------- รอบใหม่ ----------
  function startRound() {
    S.round++;
    const item = S.drawQuestion();
    if (!item) {
      // คลังหมดจริง ๆ (แทบเป็นไปไม่ได้) ให้จบเกมไปเลย
      return endGame();
    }
    S.current = item;

    // คนที่ไม่ใช่คนทาย 1 คนได้เป็นคนพูดความจริง สุ่มใหม่ทุกรอบ
    const others = S.players.map((_, i) => i).filter((i) => i !== S.guesserIdx);
    S.truthIdx = others[Math.floor(Math.random() * others.length)];

    // ส่งมือถือให้คนที่ไม่ใช่คนทาย เรียงตามลำดับที่นั่ง
    S.passQueue = others.slice();
    S.passPos = 0;

    $("bfRoundTag").textContent = S.maxRounds ? "รอบที่ " + S.round + " / " + S.maxRounds : "รอบที่ " + S.round;
    $("bfGuesserName").textContent = S.players[S.guesserIdx];
    $("bfIntroHint").textContent =
      S.players[S.guesserIdx] + " วางมือถือไว้ก่อน ห้ามดูเด็ดขาด — อีก " + S.passQueue.length + " คนจะผลัดกันรับมือถือไปดูบทบาทของตัวเอง";
    show("bfRoundIntro");
  }

  $("bfIntroBtn").addEventListener("click", nextPass);

  function nextPass() {
    if (S.passPos >= S.passQueue.length) return toGuess();
    const name = S.players[S.passQueue[S.passPos]];
    $("bfPassName").textContent = name;
    $("bfPassWho").textContent = " " + name;
    show("bfPass");
  }

  $("bfPassBtn").addEventListener("click", () => {
    const idx = S.passQueue[S.passPos];
    const isTruth = idx === S.truthIdx;

    $("bfRoleQuestion").textContent = S.current.question;
    $("bfRoleCard").classList.toggle("bf-role-truth", isTruth);
    $("bfRoleCard").classList.toggle("bf-role-liar", !isTruth);

    if (isTruth) {
      $("bfRoleLabel").textContent = "✅ คุณคือคนที่รู้ความจริง";
      $("bfRoleAnswer").textContent = S.current.answer;
      $("bfRoleSub").textContent = "พูดคำตอบนี้ออกไปตรง ๆ แต่ทำให้ดูน่าเชื่อด้วยนะ ถ้าตอบเร็วเกินไปจะโดนจับได้";
    } else if (S.peek) {
      $("bfRoleLabel").textContent = "🎭 คุณคือคนโกหก — คำตอบจริงคือ";
      $("bfRoleAnswer").textContent = S.current.answer;
      $("bfRoleSub").textContent = "ห้ามพูดคำตอบนี้! ให้ดัดให้เพี้ยนไปนิดหน่อยจนคนทายแยกไม่ออก";
    } else {
      $("bfRoleLabel").textContent = "🎭 คุณคือคนโกหก";
      $("bfRoleAnswer").textContent = "ไม่รู้คำตอบจริง";
      $("bfRoleSub").textContent = "แต่งคำตอบขึ้นมาเองให้ฟังดูน่าเชื่อที่สุด แล้วพูดให้เหมือนรู้จริง";
    }
    show("bfRole");
    if (navigator.vibrate) navigator.vibrate(40);
  });

  $("bfRoleBtn").addEventListener("click", () => {
    S.passPos++;
    nextPass();
  });

  // ---------- คนทายเลือก ----------
  function toGuess() {
    $("bfGuessQuestion").textContent = S.current.question;
    $("bfGuessName").textContent = S.players[S.guesserIdx];
    $("bfVoteList").innerHTML = S.passQueue
      .map((i) => '<button class="bf-vote-btn" data-pick="' + i + '" type="button">' + esc(S.players[i]) + "</button>")
      .join("");
    $("bfVoteList").querySelectorAll("[data-pick]").forEach((btn) => {
      btn.addEventListener("click", () => resolve(Number(btn.dataset.pick)));
    });
    show("bfGuess");
  }

  function resolve(pickIdx) {
    const guesser = S.players[S.guesserIdx];
    const truthTeller = S.players[S.truthIdx];
    const picked = S.players[pickIdx];
    const correct = pickIdx === S.truthIdx;
    const deltas = [];

    S.stats[guesser].guessTotal++;
    S.stats[truthTeller].truthTotal++;

    if (correct) {
      S.scores[guesser] += 2;
      S.scores[truthTeller] += 1;
      S.stats[guesser].guessRight++;
      S.stats[truthTeller].truthFound++;
      deltas.push({ name: guesser, d: 2, why: "ทายถูก" });
      deltas.push({ name: truthTeller, d: 1, why: "พูดความจริงจนมีคนเชื่อ" });
    } else {
      S.scores[picked] += 3;
      S.stats[picked].fooled++;
      deltas.push({ name: picked, d: 3, why: "หลอกสำเร็จ" });
    }

    $("bfRevealIcon").textContent = correct ? "🎯" : "🤡";
    $("bfRevealTitle").textContent = correct
      ? guesser + " จับได้! " + truthTeller + " พูดความจริง"
      : guesser + " โดนหลอก — " + picked + " ไม่ได้พูดความจริง";
    $("bfRealAnswer").textContent = S.current.answer;
    $("bfRealWho").textContent = "คนที่ได้คำตอบจริงรอบนี้คือ " + truthTeller;

    $("bfScoreDelta").innerHTML = deltas
      .map((x) => '<div class="bf-delta"><b>' + esc(x.name) + "</b> +" + x.d + " <span>" + x.why + "</span></div>")
      .join("");

    renderScores("bfScoreList");
    show("bfReveal");
    if (navigator.vibrate) navigator.vibrate(correct ? [60, 40, 60] : 160);
  }

  function renderScores(target) {
    const rows = S.players
      .map((p) => ({ name: p, score: S.scores[p] }))
      .sort((a, b) => b.score - a.score);
    const top = rows.length ? rows[0].score : 0;
    $(target).innerHTML = rows
      .map(
        (r, i) =>
          '<div class="bf-score-row' + (r.score === top && top > 0 ? " bf-lead" : "") + '">' +
          '<span class="bf-score-rank">' + (i + 1) + "</span>" +
          '<span class="bf-score-name">' + esc(r.name) + "</span>" +
          '<span class="bf-score-num">' + r.score + "</span>" +
          "</div>"
      )
      .join("");
  }

  $("bfNextBtn").addEventListener("click", () => {
    S.guesserIdx = (S.guesserIdx + 1) % S.players.length;
    if (S.maxRounds && S.round >= S.maxRounds) return endGame();
    startRound();
  });

  // ---------- จบเกม ----------
  function endGame() {
    renderScores("bfFinalList");

    // หาแชมป์ของแต่ละด้าน เอาไว้แซวกันตอนจบ
    const best = (key, label, unit) => {
      let bn = null, bv = 0;
      S.players.forEach((p) => {
        if (S.stats[p][key] > bv) {
          bv = S.stats[p][key];
          bn = p;
        }
      });
      return bv > 0 ? '<div class="bf-stat"><b>' + label + "</b> " + esc(bn) + " (" + bv + " " + unit + ")</div>" : "";
    };
    const lines = [
      best("fooled", "🎭 จอมโกหกแห่งวง", "ครั้ง"),
      best("guessRight", "🕵️ นักสืบมือหนึ่ง", "ครั้ง"),
      best("truthFound", "😇 พูดจริงแล้วคนเชื่อ", "ครั้ง"),
    ].filter(Boolean);
    $("bfStats").innerHTML = lines.length ? lines.join("") : '<div class="bf-stat">รอบนี้ยังไม่มีใครโดดเด่นเป็นพิเศษ</div>';

    show("bfFinal");
  }

  $("bfAgainBtn").addEventListener("click", () => {
    S.round = 0;
    S.guesserIdx = 0;
    S.players.forEach((p) => {
      S.scores[p] = 0;
      S.stats[p] = { guessRight: 0, guessTotal: 0, fooled: 0, truthFound: 0, truthTotal: 0 };
    });
    startRound();
  });

  $("bfNewBtn").addEventListener("click", () => {
    show("bfSetup");
    warn("");
  });

  $("bfPeekHint").textContent = PEEK_HINT.on;
  renderPlayers();
});
