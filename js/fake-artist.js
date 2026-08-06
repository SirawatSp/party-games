// เกม "ศิลปินตัวปลอม" — ดัดแปลงจาก A Fake Artist Goes to New York (Oink Games)
// เล่นบนเครื่องเดียวส่งต่อกัน: ดูบทบาททีละคน → ผลัดกันวาดคนละ 1 เส้น 2 รอบ → ชี้ตัวปลอม → เฉลย
// เส้นทุกเส้นเก็บเป็นพิกัด 0..1 เพื่อให้วาดซ้ำได้ทุกขนาดจอ และเอาไปรีเพลย์/บันทึกรูปได้
document.addEventListener("DOMContentLoaded", () => {
  const $ = (id) => document.getElementById(id);

  const PLAYER_COLORS = [
    "#e11d48", "#2563eb", "#15803d", "#f59e0b", "#9333ea",
    "#0891b2", "#db2777", "#4d7c0f", "#ea580c", "#4f46e5",
  ];
  const MIN_PLAYERS = 4;
  const MAX_PLAYERS = 10;
  const PASSES = 2;          // ทุกคนได้วาดคนละ 2 เส้น
  const GUESS_OPTIONS = 4;   // จำนวนตัวเลือกตอนตัวปลอมทายคำ
  const DEFAULT_NAMES = ["เอ", "บี", "ซี", "ดี"];

  const STAGES = ["faSetup", "faPass", "faRole", "faDraw", "faVote", "faGuess", "faResult", "faFinal"];

  const S = {
    players: [],
    goal: 5,
    limit: 0,          // วินาทีต่อ 1 เส้น (0 = ไม่จับเวลา)
    gallery: [],       // เก็บภาพของทุกรอบไว้โชว์รวมกันตอนจบเกม
    round: 0,
    topic: null,       // { cat, word }
    fakeIdx: -1,
    startIdx: 0,
    revealPos: 0,
    turnPos: 0,
    strokes: [],       // [{ p: playerIdx, pts: [{x,y}] }]
    pending: null,     // เส้นที่เพิ่งลากแต่ยังไม่กดส่งต่อ
    accused: null,
    fakeGuess: null,
  };

  let drawing = false;
  let replayTimer = null;
  let turnTimer = null;
  let turnLeft = 0;

  function esc(s) {
    return String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  }

  function shuffled(arr) {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      const t = a[i];
      a[i] = a[j];
      a[j] = t;
    }
    return a;
  }

  let firstShow = true;
  function showStage(id) {
    stopReplay();
    if (id !== "faDraw") stopTurnTimer();
    STAGES.forEach((s) => $(s).classList.toggle("fa-hidden", s !== id));
    if (firstShow) {
      firstShow = false;
      return;
    }
    $(id).scrollIntoView({ behavior: "smooth", block: "start" });
  }

  // ---------- ตั้งค่าผู้เล่น ----------
  function renderPlayerInputs(names) {
    const wrap = $("faPlayerList");
    wrap.innerHTML = "";
    names.forEach((name, i) => {
      const row = document.createElement("div");
      row.className = "fa-player-row";
      row.innerHTML =
        '<span class="fa-player-dot" style="background:' + PLAYER_COLORS[i % PLAYER_COLORS.length] + '"></span>' +
        '<input class="fa-player-input" type="text" maxlength="12" value="' + esc(name) + '" placeholder="ชื่อผู้เล่น">' +
        '<button class="fa-player-del" type="button" aria-label="ลบผู้เล่น">✕</button>';
      row.querySelector(".fa-player-del").addEventListener("click", () => {
        const current = readNames();
        if (current.length <= MIN_PLAYERS) {
          $("faSetupWarn").textContent = "ต้องมีอย่างน้อย " + MIN_PLAYERS + " คน เกมถึงจะสนุก";
          return;
        }
        current.splice(i, 1);
        renderPlayerInputs(current);
        $("faSetupWarn").textContent = "";
      });
      wrap.appendChild(row);
    });
  }

  function readNames() {
    return Array.from($("faPlayerList").querySelectorAll(".fa-player-input")).map((el) => el.value.trim());
  }

  $("faAddPlayer").addEventListener("click", () => {
    const names = readNames();
    if (names.length >= MAX_PLAYERS) {
      $("faSetupWarn").textContent = "รับได้สูงสุด " + MAX_PLAYERS + " คน";
      return;
    }
    names.push("");
    renderPlayerInputs(names);
    $("faSetupWarn").textContent = "";
  });

  $("faGoalSwitch").querySelectorAll(".fa-opt-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      $("faGoalSwitch").querySelectorAll(".fa-opt-btn").forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");
      S.goal = parseInt(btn.dataset.goal, 10);
    });
  });

  $("faLimitSwitch").querySelectorAll(".fa-opt-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      $("faLimitSwitch").querySelectorAll(".fa-opt-btn").forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");
      S.limit = parseInt(btn.dataset.limit, 10);
    });
  });

  $("faStartBtn").addEventListener("click", () => {
    const names = readNames();
    if (names.some((n) => !n)) {
      $("faSetupWarn").textContent = "ใส่ชื่อให้ครบทุกช่องก่อนนะ";
      return;
    }
    if (names.length < MIN_PLAYERS) {
      $("faSetupWarn").textContent = "ต้องมีอย่างน้อย " + MIN_PLAYERS + " คน เกมถึงจะสนุก";
      return;
    }
    if (new Set(names).size !== names.length) {
      $("faSetupWarn").textContent = "ชื่อซ้ำกัน เปลี่ยนให้ต่างกันก่อนนะ";
      return;
    }
    $("faSetupWarn").textContent = "";
    S.players = names.map((name, i) => ({ name: name, color: PLAYER_COLORS[i % PLAYER_COLORS.length], score: 0 }));
    S.round = 0;
    S.gallery = [];
    startRound();
  });

  // ---------- สุ่มโจทย์ + เริ่มรอบ ----------
  const drawTopic = createPicker(FAKE_ARTIST_WORDS, "pg_fake_artist");

  function startRound() {
    S.round++;
    const pick = drawTopic();
    if (!pick) return;
    S.topic = pick;
    S.fakeIdx = Math.floor(Math.random() * S.players.length);
    S.startIdx = Math.floor(Math.random() * S.players.length);
    S.revealPos = 0;
    S.turnPos = 0;
    S.strokes = [];
    S.pending = null;
    S.accused = null;
    S.fakeGuess = null;
    goToPass();
  }

  function playerAt(offset) {
    return (S.startIdx + offset) % S.players.length;
  }

  // ---------- ดูบทบาททีละคน ----------
  function goToPass() {
    const idx = playerAt(S.revealPos);
    const p = S.players[idx];
    $("faPassRound").textContent = "รอบที่ " + S.round + " · ดูบทบาท " + (S.revealPos + 1) + "/" + S.players.length;
    $("faPassName").textContent = p.name;
    $("faPassName").style.color = p.color;
    showStage("faPass");
  }

  $("faPassBtn").addEventListener("click", () => {
    const idx = playerAt(S.revealPos);
    const isFake = idx === S.fakeIdx;
    $("faRoleCat").textContent = S.topic.cat;
    $("faRoleCard").classList.toggle("fa-role-fake", isFake);
    if (isFake) {
      $("faRoleLabel").textContent = "บทบาทของคุณ";
      $("faRoleWord").textContent = "🎭 ศิลปินตัวปลอม";
      $("faRoleSub").textContent = "คุณไม่รู้คำลับ! วาดให้เนียนที่สุด แล้วพยายามเดาคำจากเส้นของคนอื่น";
    } else {
      $("faRoleLabel").textContent = "คำลับของรอบนี้คือ";
      $("faRoleWord").textContent = S.topic.word;
      $("faRoleSub").textContent = "ห้ามพูดออกมาเด็ดขาด ให้วาดออกมาแทน";
    }
    showStage("faRole");
  });

  $("faRoleBtn").addEventListener("click", () => {
    S.revealPos++;
    if (S.revealPos < S.players.length) {
      goToPass();
    } else {
      startDrawing();
    }
  });

  // ---------- กระดานวาด ----------
  const cv = $("faCanvas");
  const ctx = cv.getContext("2d");

  function strokeWidth(canvas) {
    return Math.max(3, canvas.width * 0.0075);
  }

  function paint(canvas, context, strokes, extra) {
    context.fillStyle = "#fffdf7";
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.lineCap = "round";
    context.lineJoin = "round";
    context.lineWidth = strokeWidth(canvas);
    const all = extra ? strokes.concat([extra]) : strokes;
    all.forEach((st) => {
      if (!st.pts.length) return;
      context.strokeStyle = S.players[st.p] ? S.players[st.p].color : "#111";
      const px = st.pts.map((pt) => ({ x: pt.x * canvas.width, y: pt.y * canvas.height }));
      context.beginPath();
      context.moveTo(px[0].x, px[0].y);
      if (px.length === 1) {
        // แตะจุดเดียวก็ให้เห็นเป็นจุดกลม ๆ
        context.lineTo(px[0].x + 0.01, px[0].y);
      } else if (px.length === 2) {
        context.lineTo(px[1].x, px[1].y);
      } else {
        // ลากเส้นผ่านจุดกึ่งกลางของทุกคู่จุดด้วยเส้นโค้ง ทำให้ลายเส้นลื่นไม่เป็นเหลี่ยม
        for (let i = 1; i < px.length - 1; i++) {
          const mx = (px[i].x + px[i + 1].x) / 2;
          const my = (px[i].y + px[i + 1].y) / 2;
          context.quadraticCurveTo(px[i].x, px[i].y, mx, my);
        }
        context.lineTo(px[px.length - 1].x, px[px.length - 1].y);
      }
      context.stroke();
    });
  }

  function renderDrawCanvas() {
    const cur = S.pending ? { p: playerAt(S.turnPos % S.players.length), pts: S.pending } : null;
    paint(cv, ctx, S.strokes, cur);
  }

  function pointFrom(e) {
    const r = cv.getBoundingClientRect();
    const x = (e.clientX - r.left) / r.width;
    const y = (e.clientY - r.top) / r.height;
    return { x: Math.min(1, Math.max(0, x)), y: Math.min(1, Math.max(0, y)) };
  }

  cv.addEventListener("pointerdown", (e) => {
    if ($("faDraw").classList.contains("fa-hidden")) return;
    if (S.pending) return;   // ลากได้เส้นเดียวต่อตา ต้องกด "วาดเส้นนี้ใหม่" ก่อนถึงจะลากใหม่ได้
    e.preventDefault();
    drawing = true;
    S.pending = [pointFrom(e)];
    try { cv.setPointerCapture(e.pointerId); } catch (err) { /* บางเบราว์เซอร์ไม่รองรับ ข้ามได้ */ }
    renderDrawCanvas();
  });

  cv.addEventListener("pointermove", (e) => {
    if (!drawing) return;
    e.preventDefault();
    S.pending.push(pointFrom(e));
    renderDrawCanvas();
  });

  function endStroke() {
    if (!drawing) return;
    drawing = false;
    $("faDoneBtn").classList.remove("fa-hidden");
    $("faRedrawBtn").classList.remove("fa-hidden");
    $("faDrawHint").innerHTML = "ลากเสร็จแล้ว — กด <b>ส่งต่อ</b> ให้คนถัดไป หรือกดวาดเส้นนี้ใหม่ถ้ายังไม่พอใจ";
  }

  cv.addEventListener("pointerup", endStroke);
  cv.addEventListener("pointercancel", endStroke);
  cv.addEventListener("pointerleave", endStroke);

  function startDrawing() {
    S.turnPos = 0;
    renderDrawTurn();
  }

  function stopTurnTimer() {
    if (turnTimer) {
      clearInterval(turnTimer);
      turnTimer = null;
    }
    $("faClock").classList.add("fa-hidden");
    $("faClock").classList.remove("fa-clock-danger");
  }

  function startTurnTimer() {
    stopTurnTimer();
    if (!S.limit) return;
    turnLeft = S.limit;
    const clock = $("faClock");
    clock.classList.remove("fa-hidden");
    clock.textContent = turnLeft + " วิ";
    turnTimer = setInterval(() => {
      turnLeft--;
      clock.textContent = Math.max(0, turnLeft) + " วิ";
      clock.classList.toggle("fa-clock-danger", turnLeft <= 5);
      if (turnLeft <= 0) {
        stopTurnTimer();
        vibrateTimeout();
        commitTurn(true);
      }
    }, 1000);
  }

  function renderDrawTurn() {
    const total = S.players.length * PASSES;
    const pass = Math.floor(S.turnPos / S.players.length) + 1;
    const idx = playerAt(S.turnPos % S.players.length);
    const p = S.players[idx];

    S.pending = null;
    drawing = false;
    $("faDoneBtn").classList.add("fa-hidden");
    $("faRedrawBtn").classList.add("fa-hidden");
    $("faDrawHint").innerHTML = "ลากนิ้ว <b>1 เส้นเดียว</b> ห้ามยกนิ้วกลางคัน ห้ามเขียนตัวอักษรหรือตัวเลข";
    $("faDrawRound").textContent = "เส้นที่ " + (S.turnPos + 1) + " / " + total + " · รอบวาดที่ " + pass + "/" + PASSES;
    $("faDrawCat").textContent = S.topic.cat;
    $("faDrawTurn").innerHTML = 'ตาของ <b style="color:' + p.color + '">' + esc(p.name) + "</b>";
    renderLegend($("faDrawLegend"));
    renderDrawCanvas();
    showStage("faDraw");
    startTurnTimer();
  }

  $("faRedrawBtn").addEventListener("click", () => {
    S.pending = null;
    drawing = false;
    $("faDoneBtn").classList.add("fa-hidden");
    $("faRedrawBtn").classList.add("fa-hidden");
    $("faDrawHint").innerHTML = "ลากนิ้ว <b>1 เส้นเดียว</b> ห้ามยกนิ้วกลางคัน ห้ามเขียนตัวอักษรหรือตัวเลข";
    renderDrawCanvas();
  });

  // timedOut = true เมื่อถูกเรียกเพราะหมดเวลา (เส้นที่ยังไม่ได้ลากจะกลายเป็นตาที่เสียไปเลย)
  function commitTurn(timedOut) {
    if (!timedOut && (!S.pending || !S.pending.length)) return;
    stopTurnTimer();
    drawing = false;
    S.strokes.push({ p: playerAt(S.turnPos % S.players.length), pts: S.pending || [] });
    S.pending = null;
    S.turnPos++;
    if (S.turnPos >= S.players.length * PASSES) {
      goToVote();
    } else {
      renderDrawTurn();
    }
  }

  $("faDoneBtn").addEventListener("click", () => commitTurn(false));

  function renderLegend(box) {
    box.innerHTML = S.players
      .map((p) => '<span class="fa-legend-item"><i style="background:' + p.color + '"></i>' + esc(p.name) + "</span>")
      .join("");
  }

  // ---------- ชี้ตัวปลอม ----------
  function goToVote() {
    const vc = $("faVoteCanvas");
    paint(vc, vc.getContext("2d"), S.strokes, null);
    renderLegend($("faVoteLegend"));

    const list = $("faVoteList");
    list.innerHTML = "";
    S.players.forEach((p, i) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "fa-vote-btn";
      btn.innerHTML = '<i style="background:' + p.color + '"></i>' + esc(p.name);
      btn.addEventListener("click", () => resolveVote(i));
      list.appendChild(btn);
    });
    showStage("faVote");
  }

  $("faTieBtn").addEventListener("click", () => resolveVote(null));

  function resolveVote(idx) {
    S.accused = idx;
    if (idx === S.fakeIdx) {
      showGuessStage();
    } else {
      // ชี้ผิดคน หรือวงตกลงกันไม่ได้ = ตัวปลอมรอดไปได้
      finishRound("fake", idx === null ? "tie" : "wrong");
    }
  }

  // ---------- ตัวปลอมทายคำ ----------
  function showGuessStage() {
    const fake = S.players[S.fakeIdx];
    $("faGuessName").textContent = fake.name;
    $("faGuessName").style.color = fake.color;

    const topic = FAKE_ARTIST_TOPICS.filter((t) => t.cat === S.topic.cat)[0];
    const pool = topic ? topic.words.filter((w) => w !== S.topic.word) : [];
    const decoys = shuffled(pool).slice(0, GUESS_OPTIONS - 1);
    const options = shuffled([S.topic.word].concat(decoys));

    const box = $("faGuessOptions");
    box.innerHTML = "";
    options.forEach((w) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "fa-guess-btn";
      btn.textContent = w;
      btn.addEventListener("click", () => {
        S.fakeGuess = w;
        if (w === S.topic.word) finishRound("fake", "guessed");
        else finishRound("artists", "caught");
      });
      box.appendChild(btn);
    });
    showStage("faGuess");
  }

  // ---------- เฉลย + คะแนน ----------
  function finishRound(winner, how) {
    const fake = S.players[S.fakeIdx];

    if (winner === "fake") fake.score += 2;
    else S.players.forEach((p, i) => { if (i !== S.fakeIdx) p.score += 1; });

    const rc = $("faResultCanvas");
    paint(rc, rc.getContext("2d"), S.strokes, null);
    renderLegend($("faResultLegend"));

    const reason = {
      wrong: "วงชี้ผิดคน! ตัวปลอมรอดไปได้แบบสบาย ๆ",
      tie: "วงตกลงกันไม่ได้ ตัวปลอมเลยรอดไปได้",
      guessed: "โดนจับได้ก็จริง แต่ตัวปลอมเดาคำถูก พลิกกลับมาชนะ!",
      caught: "จับตัวปลอมได้ และเขาเดาคำผิดด้วย ศิลปินตัวจริงชนะ!",
    }[how];

    $("faResultIcon").textContent = winner === "fake" ? "🎭" : "🖌";
    $("faResultTitle").textContent = winner === "fake" ? "ตัวปลอมชนะรอบนี้!" : "ศิลปินตัวจริงชนะรอบนี้!";
    $("faResultTitle").className = "fa-h3 " + (winner === "fake" ? "fa-win-fake" : "fa-win-artist");

    let detail = '<div class="fa-result-line">คำลับคือ <b class="fa-reveal-word">' + esc(S.topic.word) + "</b> · หมวด " + esc(S.topic.cat) + "</div>";
    detail += '<div class="fa-result-line">ตัวปลอมคือ <b style="color:' + fake.color + '">' + esc(fake.name) + "</b></div>";
    if (S.accused !== null && S.accused !== S.fakeIdx) {
      detail += '<div class="fa-result-line">วงชี้ไปที่ <b style="color:' + S.players[S.accused].color + '">' + esc(S.players[S.accused].name) + "</b></div>";
    }
    if (S.fakeGuess) {
      detail += '<div class="fa-result-line">ตัวปลอมเดาว่า <b>' + esc(S.fakeGuess) + "</b> " + (S.fakeGuess === S.topic.word ? "✅" : "❌") + "</div>";
    }
    detail += '<div class="fa-result-why">' + reason + "</div>";
    detail += '<div class="fa-result-line fa-result-pts">' +
      (winner === "fake" ? "ตัวปลอมได้ <b>+2 แต้ม</b>" : "ศิลปินตัวจริงได้กันคนละ <b>+1 แต้ม</b>") + "</div>";
    $("faResultDetail").innerHTML = detail;

    S.gallery.push({
      round: S.round,
      word: S.topic.word,
      cat: S.topic.cat,
      strokes: S.strokes.slice(),
      fake: fake.name,
      fakeColor: fake.color,
      winner: winner,
    });

    renderScores($("faScoreList"), false);

    const done = S.players.some((p) => p.score >= S.goal);
    $("faNextBtn").textContent = done ? "ดูผลรวม 🏆" : "รอบต่อไป →";
    showStage("faResult");
  }

  function renderScores(box, final) {
    const rows = S.players.map((p, i) => ({ p: p, i: i }));
    if (final) rows.sort((a, b) => b.p.score - a.p.score);
    const medals = ["🥇", "🥈", "🥉"];
    const top = final && rows.length ? rows[0].p.score : -1;

    box.innerHTML = "";
    rows.forEach((row, rank) => {
      const div = document.createElement("div");
      div.className = "fa-score-row" + (final && row.p.score === top ? " fa-score-win" : "");
      const lead = final ? (medals[rank] || rank + 1 + ".") + " " : "";
      div.innerHTML =
        '<span class="fa-score-name"><i class="fa-score-dot" style="background:' + row.p.color + '"></i>' +
        lead + esc(row.p.name) +
        (!final && row.i === S.fakeIdx ? ' <em class="fa-score-tag">ตัวปลอมรอบนี้</em>' : "") +
        "</span>" +
        '<span class="fa-score-pts">' + row.p.score + " / " + S.goal + "</span>";
      box.appendChild(div);
    });
  }

  $("faNextBtn").addEventListener("click", () => {
    if (S.players.some((p) => p.score >= S.goal)) {
      const best = S.players.slice().sort((a, b) => b.score - a.score);
      const champs = best.filter((p) => p.score === best[0].score);
      $("faFinalTitle").textContent = champs.length === 1
        ? "🏆 " + champs[0].name + " คือศิลปินตัวจริงแห่งวง!"
        : "🏆 เสมอกัน " + champs.length + " คน!";
      renderScores($("faFinalList"), true);
      renderGallery();
      showStage("faFinal");
      return;
    }
    startRound();
  });

  // แกลเลอรีรวมภาพที่วงนี้วาดไว้ทุกรอบ — โชว์ตอนจบเกม
  function renderGallery() {
    const box = $("faGallery");
    box.innerHTML = "";
    $("faGalleryHead").classList.toggle("fa-hidden", S.gallery.length === 0);
    S.gallery.forEach((g) => {
      const item = document.createElement("figure");
      item.className = "fa-gallery-item";
      const c = document.createElement("canvas");
      c.width = 600;
      c.height = 450;
      paint(c, c.getContext("2d"), g.strokes, null);
      const cap = document.createElement("figcaption");
      cap.innerHTML =
        '<b>' + esc(g.word) + "</b>" +
        '<span class="fa-gallery-sub">รอบ ' + g.round + " · ตัวปลอม: " +
        '<i style="color:' + g.fakeColor + '">' + esc(g.fake) + "</i> " +
        (g.winner === "fake" ? "🎭 ชนะ" : "🖌 แพ้") + "</span>";
      item.appendChild(c);
      item.appendChild(cap);
      box.appendChild(item);
    });
  }

  $("faRestartBtn").addEventListener("click", () => {
    S.players.forEach((p) => { p.score = 0; });
    S.round = 0;
    S.gallery = [];
    startRound();
  });

  // ---------- รีเพลย์การวาด ----------
  function stopReplay() {
    if (replayTimer) {
      clearInterval(replayTimer);
      replayTimer = null;
      $("faReplayBtn").textContent = "▶ ดูรีเพลย์การวาด";
    }
  }

  $("faReplayBtn").addEventListener("click", () => {
    const rc = $("faResultCanvas");
    const rctx = rc.getContext("2d");
    if (replayTimer) {
      stopReplay();
      paint(rc, rctx, S.strokes, null);
      return;
    }
    let shown = 0;
    paint(rc, rctx, [], null);
    $("faReplayBtn").textContent = "⏸ หยุดรีเพลย์";
    replayTimer = setInterval(() => {
      shown++;
      paint(rc, rctx, S.strokes.slice(0, shown), null);
      if (shown >= S.strokes.length) stopReplay();
    }, 420);
  });

  // ---------- บันทึกรูป ----------
  $("faSaveBtn").addEventListener("click", () => {
    const rc = $("faResultCanvas");
    paint(rc, rc.getContext("2d"), S.strokes, null);
    const a = document.createElement("a");
    a.download = "fake-artist-" + S.topic.word + ".png";
    a.href = rc.toDataURL("image/png");
    a.click();
  });

  // ---------- เริ่มต้น ----------
  renderPlayerInputs(DEFAULT_NAMES.slice());
  paint(cv, ctx, [], null);
  showStage("faSetup");
});
