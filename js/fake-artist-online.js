// หน้าจอโหมดออนไลน์ของ "ศิลปินตัวปลอม"
// ไฟล์นี้ทำแค่เรื่องหน้าจอ ตรรกะเกมทั้งหมดอยู่ใน js/fake-artist-net.js (ฝั่งโฮสต์)
// เครื่องลูกไม่มีตรรกะเกมเลย แค่วาดหน้าจอตามสถานะที่โฮสต์ส่งมาให้
document.addEventListener("DOMContentLoaded", () => {
  const $ = (id) => document.getElementById(id);
  const SCREENS = ["onStart", "onLobby", "onRole", "onDraw", "onVote", "onGuess", "onResult", "onFinal"];

  const S = {
    room: null,
    game: null,        // มีเฉพาะเครื่องที่เป็นโฮสต์
    isHost: false,
    myName: "",
    goal: 5,
    state: null,       // สถานะสาธารณะล่าสุดจากโฮสต์
    role: null,        // บทบาทลับของเครื่องนี้
    guessOptions: null,
    pending: null,     // เส้นที่กำลังลากแต่ยังไม่ส่ง
    sentThisTurn: false,
    votedFor: null,
    roleSeen: false,
    lastTurnPos: -1,
  };

  let drawing = false;

  function esc(s) {
    return String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  }

  function show(id) {
    SCREENS.forEach((s) => $(s).classList.toggle("fa-hidden", s !== id));
  }

  function myId() {
    return S.isHost ? "host" : (S.room && S.room.t && S.room.t.id) || null;
  }

  function playerById(id) {
    if (!S.state) return null;
    return S.state.players.filter((p) => p.id === id)[0] || null;
  }

  // ---------- วาดรูปลงผืนผ้าใบ ----------
  function paint(canvas, strokes) {
    const ctx = canvas.getContext("2d");
    ctx.fillStyle = "#fffdf7";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.lineWidth = Math.max(3, canvas.width * 0.0075);
    (strokes || []).forEach((st) => {
      if (!st.pts || !st.pts.length) return;
      const p = playerById(st.id);
      ctx.strokeStyle = p ? p.color : "#111";
      const px = st.pts.map((pt) => ({ x: pt.x * canvas.width, y: pt.y * canvas.height }));
      ctx.beginPath();
      ctx.moveTo(px[0].x, px[0].y);
      if (px.length === 1) ctx.lineTo(px[0].x + 0.01, px[0].y);
      else if (px.length === 2) ctx.lineTo(px[1].x, px[1].y);
      else {
        for (let i = 1; i < px.length - 1; i++) {
          ctx.quadraticCurveTo(px[i].x, px[i].y, (px[i].x + px[i + 1].x) / 2, (px[i].y + px[i + 1].y) / 2);
        }
        ctx.lineTo(px[px.length - 1].x, px[px.length - 1].y);
      }
      ctx.stroke();
    });
  }

  function renderLiveCanvas() {
    const strokes = (S.state ? S.state.strokes : []).slice();
    if (S.pending && S.pending.length) strokes.push({ id: myId(), pts: S.pending });
    paint($("onCanvas"), strokes);
  }

  function legend(box) {
    if (!S.state) return;
    box.innerHTML = S.state.players
      .map((p) => '<span class="fa-legend-item"><i style="background:' + p.color + '"></i>' + esc(p.name) + "</span>")
      .join("");
  }

  // ---------- ต่อห้อง ----------
  function transport() {
    // ?loopback=1 ใช้ตอนทดสอบเท่านั้น จะต่อกันเองในหน้าเดียวโดยไม่แตะเน็ต
    if (new URLSearchParams(location.search).get("loopback") === "1") return new PGChannelTransport();
    return new PGPeerTransport();
  }

  function wireGuest(room) {
    room.on("state", (st) => { S.state = st; render(); });
    room.on("role", (r) => { S.role = r; S.roleSeen = false; render(); });
    room.on("guessOptions", (d) => { S.guessOptions = d.options; render(); });
    room.on("host:leave", () => {
      $("onWarn").textContent = "เจ้าของห้องหลุดไปแล้ว ห้องนี้ปิด ต้องสร้างห้องใหม่";
      show("onStart");
    });
  }

  $("onHostBtn").addEventListener("click", () => {
    const name = $("onName").value.trim();
    if (!name) { $("onWarn").textContent = "ใส่ชื่อก่อนนะ"; return; }
    $("onWarn").textContent = "กำลังสร้างห้อง…";
    S.myName = name;
    S.isHost = true;
    S.room = new PGRoom(transport());
    S.room.host().then((code) => {
      S.game = new PGFakeArtistHost(S.room, FAKE_ARTIST_TOPICS, {
        goal: S.goal,
        hostName: name,
        onState: (st) => { S.state = st; render(); },
        onPrivate: (type, d) => {
          if (type === "role") { S.role = d; S.roleSeen = false; }
          else S.guessOptions = d.options;
          render();
        },
      });
      $("onWarn").textContent = "";
      $("onCodeShow").textContent = code;
      S.game.publish();
    }).catch((err) => {
      $("onWarn").textContent = "สร้างห้องไม่สำเร็จ: " + (err && err.message ? err.message : "ลองใหม่อีกที");
      S.isHost = false;
    });
  });

  $("onJoinBtn").addEventListener("click", () => {
    const name = $("onName").value.trim();
    const code = $("onCode").value.trim().toUpperCase();
    if (!name) { $("onWarn").textContent = "ใส่ชื่อก่อนนะ"; return; }
    if (code.length !== 5) { $("onWarn").textContent = "รหัสห้องมี 5 ตัวอักษร"; return; }
    $("onWarn").textContent = "กำลังเข้าห้อง…";
    S.myName = name;
    S.isHost = false;
    S.room = new PGRoom(transport());
    wireGuest(S.room);
    S.room.join(code).then(() => {
      $("onWarn").textContent = "";
      $("onCodeShow").textContent = code;
      S.room.send("join", { name: name });
    }).catch((err) => {
      $("onWarn").textContent = "เข้าห้องไม่สำเร็จ: " + (err && err.message ? err.message : "เช็ครหัสอีกที");
    });
  });

  $("onCode").addEventListener("input", (e) => {
    e.target.value = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, "");
  });

  $("onGoalSwitch").querySelectorAll(".fa-opt-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      $("onGoalSwitch").querySelectorAll(".fa-opt-btn").forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");
      S.goal = parseInt(btn.dataset.goal, 10);
      if (S.game) S.game.goal = S.goal;
    });
  });

  $("onStartGameBtn").addEventListener("click", () => {
    if (S.game && S.game.canStart()) S.game.startRound();
  });
  $("onNextBtn").addEventListener("click", () => { if (S.game) S.game.nextRound(); });
  $("onRestartBtn").addEventListener("click", () => { if (S.game) S.game.restart(); });
  $("onRoleBtn").addEventListener("click", () => { S.roleSeen = true; render(); });

  // ---------- ลากเส้น ----------
  const cv = $("onCanvas");

  function pointFrom(e) {
    const r = cv.getBoundingClientRect();
    return {
      x: Math.min(1, Math.max(0, (e.clientX - r.left) / r.width)),
      y: Math.min(1, Math.max(0, (e.clientY - r.top) / r.height)),
    };
  }

  function myTurn() {
    return S.state && S.state.phase === "draw" && S.state.drawerId === myId() && !S.sentThisTurn;
  }

  cv.addEventListener("pointerdown", (e) => {
    if (!myTurn() || S.pending) return;
    e.preventDefault();
    drawing = true;
    S.pending = [pointFrom(e)];
    try { cv.setPointerCapture(e.pointerId); } catch (err) { /* ไม่รองรับก็ข้ามได้ */ }
    renderLiveCanvas();
  });

  cv.addEventListener("pointermove", (e) => {
    if (!drawing) return;
    e.preventDefault();
    S.pending.push(pointFrom(e));
    renderLiveCanvas();
  });

  function endStroke() {
    if (!drawing) return;
    drawing = false;
    $("onDoneBtn").classList.remove("fa-hidden");
    $("onRedrawBtn").classList.remove("fa-hidden");
  }
  cv.addEventListener("pointerup", endStroke);
  cv.addEventListener("pointercancel", endStroke);
  cv.addEventListener("pointerleave", endStroke);

  $("onRedrawBtn").addEventListener("click", () => {
    S.pending = null;
    drawing = false;
    $("onDoneBtn").classList.add("fa-hidden");
    $("onRedrawBtn").classList.add("fa-hidden");
    renderLiveCanvas();
  });

  $("onDoneBtn").addEventListener("click", () => {
    if (!S.pending || !S.pending.length) return;
    const pts = S.pending;
    S.pending = null;
    S.sentThisTurn = true;
    $("onDoneBtn").classList.add("fa-hidden");
    $("onRedrawBtn").classList.add("fa-hidden");
    if (S.isHost) S.game.submitStroke("host", pts);
    else S.room.send("stroke", { pts: pts });
  });

  // ---------- render ----------
  function render() {
    const st = S.state;
    if (!st) return;

    const roleReady = S.role && S.role.round === st.roundNo;
    if (st.phase === "lobby") return renderLobby(st);
    if (st.phase === "draw" && !roleReady) return renderRoleWaiting();
    if (st.phase === "draw" && !S.roleSeen) return renderRole(st);
    if (st.phase === "draw") return renderDraw(st);
    if (st.phase === "vote") return renderVote(st);
    if (st.phase === "guess") return renderGuess(st);
    if (st.phase === "result") return renderResult(st, false);
    if (st.phase === "final") return renderResult(st, true);
  }

  function renderLobby(st) {
    $("onLobbyList").innerHTML = st.players
      .map((p) =>
        '<div class="fa-score-row"><span class="fa-score-name">' +
        '<i class="fa-score-dot" style="background:' + p.color + '"></i>' + esc(p.name) +
        (p.id === myId() ? ' <em class="fa-score-tag">คุณ</em>' : "") +
        "</span></div>")
      .join("");
    const enough = st.players.length >= PGFakeArtistConst.MIN_PLAYERS;
    $("onLobbyHint").textContent = enough
      ? "ครบแล้ว! เจ้าของห้องกดเริ่มได้เลย (เข้าเพิ่มได้ถึง 10 คน)"
      : "ตอนนี้ " + st.players.length + " คน — ต้องมีอย่างน้อย " + PGFakeArtistConst.MIN_PLAYERS + " คนถึงจะเริ่มได้";
    $("onGoalWrap").classList.toggle("fa-hidden", !S.isHost);
    $("onStartGameBtn").classList.toggle("fa-hidden", !S.isHost || !enough);
    $("onWaitHost").classList.toggle("fa-hidden", S.isHost);
    show("onLobby");
  }

  // บทบาทยังมาไม่ถึงเครื่องนี้ (ข้อความ state มาก่อน role) — กันไม่ให้เห็นกระดานก่อนรู้บทบาท
  function renderRoleWaiting() {
    $("onRoleCat").textContent = "กำลังรับบทบาท…";
    $("onRoleCard").classList.remove("fa-role-fake");
    $("onRoleLabel").textContent = "";
    $("onRoleWord").textContent = "⏳";
    $("onRoleSub").textContent = "รอสักครู่ กำลังรับคำลับจากเจ้าของห้อง";
    show("onRole");
  }

  function renderRole(st) {
    $("onRoleCat").textContent = S.role.cat;
    $("onRoleCard").classList.toggle("fa-role-fake", !!S.role.isFake);
    if (S.role.isFake) {
      $("onRoleLabel").textContent = "บทบาทของคุณ";
      $("onRoleWord").textContent = "🎭 ศิลปินตัวปลอม";
      $("onRoleSub").textContent = "คุณไม่รู้คำลับ! วาดให้เนียนที่สุด แล้วเดาคำจากเส้นของคนอื่น";
    } else {
      $("onRoleLabel").textContent = "คำลับของรอบนี้คือ";
      $("onRoleWord").textContent = S.role.word;
      $("onRoleSub").textContent = "ห้ามพูดออกมาเด็ดขาด ให้วาดออกมาแทน";
    }
    show("onRole");
  }

  function renderDraw(st) {
    const drawer = playerById(st.drawerId);
    const mine = st.drawerId === myId();
    if (S.lastTurnPos !== st.turnPos) {
      // ขึ้นตาใหม่ ล้างสถานะการวาดของเครื่องนี้ทิ้ง
      S.lastTurnPos = st.turnPos;
      S.sentThisTurn = false;
      S.pending = null;
      drawing = false;
      $("onDoneBtn").classList.add("fa-hidden");
      $("onRedrawBtn").classList.add("fa-hidden");
    }
    if (mine && !S.sentThisTurn) { $("onDrawHint").innerHTML = "ตาคุณแล้ว — ลากนิ้ว <b>1 เส้นเดียว</b> ห้ามยกนิ้วกลางคัน ห้ามเขียนตัวอักษร"; }
    else if (mine) $("onDrawHint").textContent = "ส่งเส้นแล้ว รอเครื่องอื่นวาดต่อ…";
    else $("onDrawHint").textContent = "ดูเฉย ๆ ก่อน รอถึงตาคุณ";

    $("onDrawRound").textContent = "เส้นที่ " + (st.turnPos + 1) + " / " + st.totalTurns;
    $("onDrawCat").textContent = st.cat || "";
    $("onDrawTurn").innerHTML = mine
      ? '<b style="color:' + (drawer ? drawer.color : "#fff") + '">ตาของคุณ!</b>'
      : 'ตาของ <b style="color:' + (drawer ? drawer.color : "#fff") + '">' + esc(drawer ? drawer.name : "…") + "</b>";
    cv.style.cursor = mine && !S.sentThisTurn ? "crosshair" : "default";
    legend($("onDrawLegend"));
    renderLiveCanvas();
    show("onDraw");
  }

  function renderVote(st) {
    paint($("onVoteCanvas"), st.strokes);
    legend($("onVoteLegend"));
    const me = myId();
    const already = st.voted.indexOf(me) >= 0;
    $("onVoteList").innerHTML = "";
    st.players.forEach((p) => {
      if (p.id === me) return;
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "fa-vote-btn" + (S.votedFor === p.id ? " on-voted" : "");
      btn.innerHTML = '<i style="background:' + p.color + '"></i>' + esc(p.name);
      btn.disabled = already;
      btn.addEventListener("click", () => {
        S.votedFor = p.id;
        if (S.isHost) S.game.submitVote("host", p.id);
        else S.room.send("vote", { targetId: p.id });
      });
      $("onVoteList").appendChild(btn);
    });
    $("onVoteProgress").textContent = already
      ? "โหวตแล้ว รอเพื่อนอีก " + (st.players.length - st.voted.length) + " คน…"
      : "โหวตแล้ว " + st.voted.length + " / " + st.players.length + " คน";
    show("onVote");
  }

  function renderGuess(st) {
    const iAmFake = !!(S.role && S.role.isFake);
    if (iAmFake && S.guessOptions) {
      $("onGuessTitle").textContent = "โดนจับได้! ตาคุณแก้ตัวแล้ว";
      $("onGuessHint").textContent = "เดาคำลับให้ถูก แล้วคุณจะพลิกกลับมาชนะทันที";
      const box = $("onGuessOptions");
      box.innerHTML = "";
      S.guessOptions.forEach((w) => {
        const btn = document.createElement("button");
        btn.type = "button";
        btn.className = "fa-guess-btn";
        btn.textContent = w;
        btn.addEventListener("click", () => {
          box.querySelectorAll("button").forEach((b) => { b.disabled = true; });
          if (S.isHost) S.game.submitGuess("host", w);
          else S.room.send("guess", { word: w });
        });
        box.appendChild(btn);
      });
    } else {
      $("onGuessTitle").textContent = "จับตัวปลอมได้แล้ว!";
      $("onGuessHint").textContent = "แต่ยังไม่จบ — ตัวปลอมกำลังเดาคำลับอยู่ ถ้าเดาถูกจะพลิกกลับมาชนะ";
      $("onGuessOptions").innerHTML = "";
    }
    show("onGuess");
  }

  function renderResult(st, final) {
    const r = st.result;
    if (r) {
      paint($("onResultCanvas"), st.strokes);
      legend($("onResultLegend"));
      const reason = {
        wrong: "วงชี้ผิดคน! ตัวปลอมรอดไปได้แบบสบาย ๆ",
        tie: "คะแนนโหวตเสมอกัน วงตกลงกันไม่ได้ ตัวปลอมเลยรอดไป",
        guessed: "โดนจับได้ก็จริง แต่ตัวปลอมเดาคำถูก พลิกกลับมาชนะ!",
        caught: "จับตัวปลอมได้ และเขาเดาคำผิดด้วย ศิลปินตัวจริงชนะ!",
      }[r.how];
      $("onResultIcon").textContent = r.winner === "fake" ? "🎭" : "🖌";
      $("onResultTitle").textContent = r.winner === "fake" ? "ตัวปลอมชนะรอบนี้!" : "ศิลปินตัวจริงชนะรอบนี้!";
      $("onResultTitle").className = "fa-h3 " + (r.winner === "fake" ? "fa-win-fake" : "fa-win-artist");
      let d = '<div class="fa-result-line">คำลับคือ <b class="fa-reveal-word">' + esc(r.word) + "</b> · หมวด " + esc(r.cat) + "</div>";
      d += '<div class="fa-result-line">ตัวปลอมคือ <b style="color:' + r.fakeColor + '">' + esc(r.fakeName) + "</b></div>";
      if (r.accusedName && r.accusedName !== r.fakeName) d += '<div class="fa-result-line">วงชี้ไปที่ <b>' + esc(r.accusedName) + "</b></div>";
      if (r.fakeGuess) d += '<div class="fa-result-line">ตัวปลอมเดาว่า <b>' + esc(r.fakeGuess) + "</b> " + (r.fakeGuess === r.word ? "✅" : "❌") + "</div>";
      d += '<div class="fa-result-why">' + reason + "</div>";
      $("onResultDetail").innerHTML = d;
    }
    const rows = st.players.slice();
    if (final) rows.sort((a, b) => b.score - a.score);
    const medals = ["🥇", "🥈", "🥉"];
    const html = rows.map((p, i) =>
      '<div class="fa-score-row' + (final && p.score === rows[0].score ? " fa-score-win" : "") + '">' +
      '<span class="fa-score-name"><i class="fa-score-dot" style="background:' + p.color + '"></i>' +
      (final ? (medals[i] || i + 1 + ".") + " " : "") + esc(p.name) +
      (p.id === myId() ? ' <em class="fa-score-tag">คุณ</em>' : "") +
      '</span><span class="fa-score-pts">' + p.score + " / " + st.goal + "</span></div>").join("");

    if (final) {
      $("onFinalList").innerHTML = html;
      $("onFinalTitle").textContent = "🏆 " + rows[0].name + " คือศิลปินตัวจริงแห่งวง!";
      const gal = $("onGallery");
      gal.innerHTML = "";
      (st.gallery || []).forEach((g) => {
        const fig = document.createElement("figure");
        fig.className = "fa-gallery-item";
        const c = document.createElement("canvas");
        c.width = 600; c.height = 450;
        paint(c, g.strokes);
        const cap = document.createElement("figcaption");
        cap.innerHTML = "<b>" + esc(g.word) + '</b><span class="fa-gallery-sub">รอบ ' + g.round +
          ' · ตัวปลอม: <i style="color:' + g.fakeColor + '">' + esc(g.fakeName) + "</i> " +
          (g.winner === "fake" ? "🎭 ชนะ" : "🖌 แพ้") + "</span>";
        fig.appendChild(c); fig.appendChild(cap);
        gal.appendChild(fig);
      });
      $("onGalleryHead").classList.toggle("fa-hidden", !(st.gallery || []).length);
      $("onRestartBtn").classList.toggle("fa-hidden", !S.isHost);
      show("onFinal");
    } else {
      $("onScoreList").innerHTML = html;
      $("onNextBtn").classList.toggle("fa-hidden", !S.isHost);
      $("onWaitNext").classList.toggle("fa-hidden", S.isHost);
      S.votedFor = null;
      show("onResult");
    }
  }

  show("onStart");
});
