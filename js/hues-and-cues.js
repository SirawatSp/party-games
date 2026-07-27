// เกม Hues & Cues ทายเฉดสี — ดัดแปลงจากบอร์ดเกม Hues and Cues สำหรับเล่นบนเครื่องเดียววางกลางวง
// จังหวะเล่น: คนใบ้เปิดดูสีลับคนเดียว → วางเครื่องลง ใบ้ 1 คำ → ทุกคนผลัดกันแตะทาย
// → คนใบ้ใบ้เพิ่ม 2 คำ → ทุกคนแตะทายหมุดที่สอง → เฉลยพร้อมกรอบ 3x3 แล้วคิดคะแนน
// คะแนน (อิงกติกาจริง): ตรงเป๊ะ 3 / ในกรอบ 3x3 ได้ 2 / วงถัดไปอีกชั้นได้ 1
// คนใบ้ได้ 1 แต้มต่อหมุดทุกอันที่ตกอยู่ในกรอบ 3x3 สูงสุด 9 แต้ม
(function () {
  "use strict";

  const COLS = HUES_COLS;
  const ROWS = HUES_ROWS;
  const LETTERS = "ABCDEFGHIJKLMNOP";
  const CUE_MAX_POINTS = 9;
  const MIN_PLAYERS = 2;
  const MAX_PLAYERS = 10;
  // สีหมุดประจำตัวผู้เล่น: เลือกโทนสว่างล้วน เพราะต้องอ่านออกทั้งบนกระดานสีสด
  // และบนพื้นหลังเว็บที่เป็นสีเข้ม (หมุดทุกอันมีขอบขาว + เงาดำรอบนอกช่วยให้เด่นอยู่แล้ว)
  const MARKER_COLORS = [
    "#ffffff", "#ff2f87", "#2be6ff", "#d6ff3d", "#ffb703",
    "#9d6bff", "#1de9b6", "#ff3d54", "#5b6eff", "#ff8a3d",
  ];

  const S = {
    players: [],      // { name, score }
    names: ["", "", "", ""],
    cueGiver: 0,
    round: 1,
    laps: 1,
    totalRounds: 0,
    target: -1,
    options: [],
    phase: 1,         // 1 = ใบ้ 1 คำ, 2 = ใบ้ 2 คำ
    order: [],        // ลำดับคนทาย (ทุกคนยกเว้นคนใบ้)
    turn: 0,
    marks: [],        // { player, cell, phase }
    pending: -1,
  };

  const $ = (id) => document.getElementById(id);
  const rowOf = (i) => Math.floor(i / COLS);
  const colOf = (i) => i % COLS;
  const coordOf = (i) => LETTERS[rowOf(i)] + (colOf(i) + 1);
  const cssColor = (i) => {
    const c = HUES_GRID[i];
    return "hsl(" + c.h + " " + c.s + "% " + c.l + "%)";
  };
  // ระยะแบบ Chebyshev = จำนวน "ช่อง" ที่ห่างกันแบบนับทแยงได้ ตรงกับการวางกรอบสี่เหลี่ยมของเกมจริง
  const dist = (a, b) =>
    Math.max(Math.abs(rowOf(a) - rowOf(b)), Math.abs(colOf(a) - colOf(b)));

  function pointsFor(cell) {
    const d = dist(cell, S.target);
    if (d === 0) return 3;
    if (d === 1) return 2;
    if (d === 2) return 1;
    return 0;
  }

  const SCREENS = ["hcSetup", "hcPass", "hcPick", "hcMemo", "hcPlay", "hcCue2", "hcReveal", "hcFinal"];
  let firstShow = true;
  function show(id) {
    SCREENS.forEach((s) => $(s).classList.toggle("hc-hidden", s !== id));
    // เลื่อนจอมาที่พื้นที่เล่นเสมอ จะได้ไม่ต้องไถหาเองทุกครั้งที่เปลี่ยนจังหวะเกม
    // (ข้ามครั้งแรกตอนโหลดหน้า เพื่อให้ผู้เล่นได้อ่านหัวเรื่องก่อน)
    if (firstShow) { firstShow = false; return; }
    $(id).scrollIntoView({ behavior: "smooth", block: "start" });
  }

  // ---------- ตั้งค่าผู้เล่น ----------
  function renderPlayers() {
    const wrap = $("hcPlayerList");
    wrap.innerHTML = "";
    S.names.forEach((name, i) => {
      const row = document.createElement("div");
      row.className = "hc-player-row";

      const dot = document.createElement("span");
      dot.className = "hc-player-dot";
      dot.style.background = MARKER_COLORS[i];
      dot.textContent = i + 1;

      const input = document.createElement("input");
      input.className = "hc-player-input";
      input.type = "text";
      input.maxLength = 14;
      input.value = name;
      input.placeholder = "ผู้เล่น " + (i + 1);
      input.addEventListener("input", () => { S.names[i] = input.value; });

      row.appendChild(dot);
      row.appendChild(input);

      if (S.names.length > MIN_PLAYERS) {
        const del = document.createElement("button");
        del.className = "hc-player-del";
        del.type = "button";
        del.textContent = "✕";
        del.addEventListener("click", () => {
          S.names.splice(i, 1);
          renderPlayers();
        });
        row.appendChild(del);
      }
      wrap.appendChild(row);
    });
    $("hcAddPlayer").disabled = S.names.length >= MAX_PLAYERS;
  }

  $("hcAddPlayer").addEventListener("click", () => {
    if (S.names.length >= MAX_PLAYERS) return;
    S.names.push("");
    renderPlayers();
  });

  $("hcLapSwitch").addEventListener("click", (e) => {
    const btn = e.target.closest(".hc-lap-btn");
    if (!btn) return;
    S.laps = Number(btn.dataset.laps);
    $("hcLapSwitch").querySelectorAll(".hc-lap-btn").forEach((b) => b.classList.toggle("active", b === btn));
  });

  $("hcStartBtn").addEventListener("click", () => {
    const players = S.names.map((n, i) => ({
      name: (n || "").trim() || "ผู้เล่น " + (i + 1),
      score: 0,
    }));
    if (players.length < MIN_PLAYERS) {
      $("hcSetupWarn").textContent = "ต้องมีผู้เล่นอย่างน้อย 2 คน";
      return;
    }
    $("hcSetupWarn").textContent = "";
    S.players = players;
    S.cueGiver = 0;
    S.round = 1;
    S.totalRounds = players.length * S.laps;
    startRound();
  });

  // ---------- เริ่มรอบ ----------
  function startRound() {
    S.marks = [];
    S.phase = 1;
    S.pending = -1;
    S.target = -1;
    S.options = pickOptions();
    S.order = S.players.map((_, i) => i).filter((i) => i !== S.cueGiver);
    S.turn = 0;
    $("hcPassRound").textContent = "รอบที่ " + S.round + " / " + S.totalRounds;
    $("hcPassName").textContent = S.players[S.cueGiver].name;
    show("hcPass");
  }

  // สุ่มตัวเลือก 4 สีให้ห่างกันพอสมควร จะได้เลือกใบ้ได้หลากหลาย ไม่ใช่สีคล้ายกันหมด
  // เลี่ยงแถวบนสุด/ล่างสุดที่ขาวจัด-ดำจัด เพราะใบ้ยากเกินไปสำหรับเล่นสนุก ๆ
  function pickOptions() {
    const lo = COLS;                    // ข้ามแถว A
    const hi = COLS * (ROWS - 1);       // ข้ามแถว P
    const opts = [];
    let guard = 0;
    while (opts.length < 4 && guard++ < 800) {
      const i = lo + Math.floor(Math.random() * (hi - lo));
      if (opts.every((o) => dist(o, i) > 5)) opts.push(i);
    }
    while (opts.length < 4) {
      const i = lo + Math.floor(Math.random() * (hi - lo));
      if (opts.indexOf(i) === -1) opts.push(i);
    }
    return opts;
  }

  $("hcPassBtn").addEventListener("click", () => {
    renderOptions();
    show("hcPick");
  });

  function renderOptions() {
    const wrap = $("hcOptions");
    wrap.innerHTML = "";
    S.options.forEach((cell) => {
      const btn = document.createElement("button");
      btn.className = "hc-option";
      btn.type = "button";
      btn.style.background = cssColor(cell);
      const tag = document.createElement("span");
      tag.className = "hc-option-tag";
      tag.textContent = coordOf(cell);
      btn.appendChild(tag);
      btn.addEventListener("click", () => {
        S.target = cell;
        $("hcMemoSwatch").style.background = cssColor(cell);
        $("hcMemoCoord").textContent = "พิกัด " + coordOf(cell);
        show("hcMemo");
      });
      wrap.appendChild(btn);
    });
  }

  $("hcMemoBtn").addEventListener("click", () => {
    S.phase = 1;
    S.turn = 0;
    startGuess();
  });

  // ---------- กระดาน ----------
  function buildBoard(container, interactive) {
    container.innerHTML = "";
    const frag = document.createDocumentFragment();
    for (let i = 0; i < HUES_GRID.length; i++) {
      const cell = document.createElement(interactive ? "button" : "div");
      cell.className = "hc-cell";
      if (interactive) {
        cell.type = "button";
        cell.dataset.i = i;
      }
      cell.style.background = cssColor(i);
      frag.appendChild(cell);
    }
    container.appendChild(frag);
  }

  function markerEl(cell, playerIdx, phase, dup) {
    const el = document.createElement("div");
    el.className = "hc-marker" + (phase === 2 ? " hc-marker-2" : "");
    const c = colOf(cell);
    const r = rowOf(cell);
    // ขยับหมุดที่ซ้อนช่องเดียวกันเล็กน้อย จะได้เห็นว่ามีหลายคนทายช่องนี้
    const off = dup * 5;
    el.style.left = ((c + 0.5) / COLS) * 100 + "%";
    el.style.top = ((r + 0.5) / ROWS) * 100 + "%";
    el.style.marginLeft = off + "px";
    el.style.marginTop = -off + "px";
    el.style.background = phase === 2 ? MARKER_COLORS[playerIdx] : "transparent";
    el.style.borderColor = MARKER_COLORS[playerIdx];
    el.style.color = phase === 2 ? contrastOn(MARKER_COLORS[playerIdx]) : MARKER_COLORS[playerIdx];
    el.textContent = String(playerIdx + 1);
    return el;
  }

  function contrastOn(hex) {
    const n = parseInt(hex.slice(1), 16);
    const lum = (((n >> 16) & 255) * 299 + ((n >> 8) & 255) * 587 + (n & 255) * 114) / 1000;
    return lum > 140 ? "#0b0410" : "#ffffff";
  }

  function renderMarkers(overlay) {
    overlay.innerHTML = "";
    const seen = {};
    S.marks.forEach((m) => {
      const key = m.cell + "_" + m.phase;
      seen[key] = (seen[key] || 0);
      overlay.appendChild(markerEl(m.cell, m.player, m.phase, seen[key]));
      seen[key]++;
    });
  }

  // ---------- ช่วงทาย ----------
  function startGuess() {
    S.pending = -1;
    $("hcConfirm").classList.add("hc-hidden");
    $("hcTapHint").classList.remove("hc-hidden");
    $("hcPhaseTag").textContent =
      S.phase === 1 ? "รอบที่ " + S.round + " · คำใบ้ 1 คำ" : "รอบที่ " + S.round + " · คำใบ้ 2 คำ";
    updateTurn();
    renderMarkers($("hcOverlay"));
    show("hcPlay");
  }

  function updateTurn() {
    const p = S.players[S.order[S.turn]];
    const el = $("hcTurn");
    el.innerHTML = "";
    const dot = document.createElement("span");
    dot.className = "hc-player-dot";
    dot.style.background = MARKER_COLORS[S.order[S.turn]];
    dot.textContent = S.order[S.turn] + 1;
    const txt = document.createElement("span");
    txt.textContent = "ตาของ " + p.name;
    el.appendChild(dot);
    el.appendChild(txt);
  }

  $("hcBoard").addEventListener("click", (e) => {
    const cell = e.target.closest(".hc-cell");
    if (!cell || cell.dataset.i === undefined) return;
    selectCell(Number(cell.dataset.i));
  });

  function selectCell(i) {
    if (S.pending >= 0) {
      const prev = $("hcBoard").children[S.pending];
      if (prev) prev.classList.remove("hc-sel");
    }
    S.pending = i;
    const el = $("hcBoard").children[i];
    if (el) el.classList.add("hc-sel");
    $("hcConfirmSwatch").style.background = cssColor(i);
    $("hcConfirmCoord").textContent = coordOf(i);
    $("hcConfirm").classList.remove("hc-hidden");
    $("hcTapHint").classList.add("hc-hidden");
  }

  $("hcConfirm").addEventListener("click", (e) => {
    const nudge = e.target.closest("[data-d]");
    if (!nudge || S.pending < 0) return;
    let c = colOf(S.pending);
    let r = rowOf(S.pending);
    const d = nudge.dataset.d;
    if (d === "l") c = Math.max(0, c - 1);
    if (d === "r") c = Math.min(COLS - 1, c + 1);
    if (d === "u") r = Math.max(0, r - 1);
    if (d === "d") r = Math.min(ROWS - 1, r + 1);
    selectCell(r * COLS + c);
  });

  $("hcConfirmBtn").addEventListener("click", () => {
    if (S.pending < 0) return;
    const el = $("hcBoard").children[S.pending];
    if (el) el.classList.remove("hc-sel");
    S.marks.push({ player: S.order[S.turn], cell: S.pending, phase: S.phase });
    S.pending = -1;
    $("hcConfirm").classList.add("hc-hidden");
    $("hcTapHint").classList.remove("hc-hidden");
    renderMarkers($("hcOverlay"));

    S.turn++;
    if (S.turn < S.order.length) {
      updateTurn();
      return;
    }
    // ทายครบทุกคนในเฟสนี้แล้ว
    if (S.phase === 1) {
      $("hcCue2Name").textContent = S.players[S.cueGiver].name;
      show("hcCue2");
    } else {
      reveal();
    }
  });

  $("hcCue2Btn").addEventListener("click", () => {
    S.phase = 2;
    S.turn = 0;
    startGuess();
  });

  // ---------- แอบดูสีลับ (คนใบ้กดค้าง) ----------
  (function setupPeek() {
    const btn = $("hcPeek");
    const layer = $("hcPeekLayer");
    const on = (e) => {
      e.preventDefault();
      if (S.target < 0) return;
      layer.style.background = cssColor(S.target);
      layer.classList.remove("hc-hidden");
    };
    const off = () => layer.classList.add("hc-hidden");
    btn.addEventListener("mousedown", on);
    btn.addEventListener("touchstart", on, { passive: false });
    ["mouseup", "mouseleave", "touchend", "touchcancel"].forEach((ev) =>
      btn.addEventListener(ev, off)
    );
  })();

  // ---------- เฉลย + คิดคะแนน ----------
  function reveal() {
    $("hcRevealCoord").textContent = coordOf(S.target);
    buildBoard($("hcBoard2"), false);

    const overlay = $("hcOverlay2");
    renderMarkersInto(overlay);

    // กรอบ 3x3 (ได้ 2 แต้ม) และวงถัดไปอีกชั้น 5x5 (ได้ 1 แต้ม)
    overlay.appendChild(frameEl(1, "hc-frame"));
    overlay.appendChild(frameEl(2, "hc-frame hc-frame-outer"));

    const star = document.createElement("div");
    star.className = "hc-target";
    star.style.left = ((colOf(S.target) + 0.5) / COLS) * 100 + "%";
    star.style.top = ((rowOf(S.target) + 0.5) / ROWS) * 100 + "%";
    overlay.appendChild(star);

    // คะแนนผู้ทาย
    const perPlayer = {};
    S.marks.forEach((m) => {
      const pts = pointsFor(m.cell);
      if (!perPlayer[m.player]) perPlayer[m.player] = { total: 0, detail: [] };
      perPlayer[m.player].total += pts;
      perPlayer[m.player].detail.push({ phase: m.phase, coord: coordOf(m.cell), pts: pts });
    });

    // คะแนนคนใบ้: 1 แต้มต่อหมุดที่อยู่ในกรอบ 3x3
    const inFrame = S.marks.filter((m) => dist(m.cell, S.target) <= 1).length;
    const cuePts = Math.min(inFrame, CUE_MAX_POINTS);

    const list = $("hcScoreList");
    list.innerHTML = "";

    const cueRow = document.createElement("div");
    cueRow.className = "hc-score-row hc-score-cue";
    cueRow.innerHTML =
      '<span class="hc-score-name">🎤 ' + esc(S.players[S.cueGiver].name) + " (คนใบ้)</span>" +
      '<span class="hc-score-detail">' + inFrame + " หมุดอยู่ในกรอบ</span>" +
      '<span class="hc-score-pts">+' + cuePts + "</span>";
    list.appendChild(cueRow);
    S.players[S.cueGiver].score += cuePts;

    S.order.forEach((pi) => {
      const info = perPlayer[pi] || { total: 0, detail: [] };
      S.players[pi].score += info.total;
      const row = document.createElement("div");
      row.className = "hc-score-row";
      const detail = info.detail
        .map((d) => "รอบ" + d.phase + " " + d.coord + " (+" + d.pts + ")")
        .join(" · ");
      row.innerHTML =
        '<span class="hc-score-name"><i class="hc-score-dot" style="background:' +
        MARKER_COLORS[pi] + '"></i>' + esc(S.players[pi].name) + "</span>" +
        '<span class="hc-score-detail">' + esc(detail) + "</span>" +
        '<span class="hc-score-pts">+' + info.total + "</span>";
      list.appendChild(row);
    });

    $("hcNextBtn").textContent = S.round >= S.totalRounds ? "ดูผลรวม 🏆" : "รอบต่อไป →";
    show("hcReveal");
  }

  function renderMarkersInto(overlay) {
    overlay.innerHTML = "";
    const seen = {};
    S.marks.forEach((m) => {
      const key = m.cell + "_" + m.phase;
      seen[key] = seen[key] || 0;
      overlay.appendChild(markerEl(m.cell, m.player, m.phase, seen[key]));
      seen[key]++;
    });
  }

  function frameEl(radius, cls) {
    const el = document.createElement("div");
    el.className = cls;
    const size = radius * 2 + 1;
    el.style.left = ((colOf(S.target) - radius) / COLS) * 100 + "%";
    el.style.top = ((rowOf(S.target) - radius) / ROWS) * 100 + "%";
    el.style.width = (size / COLS) * 100 + "%";
    el.style.height = (size / ROWS) * 100 + "%";
    return el;
  }

  function esc(s) {
    return String(s).replace(/[&<>"]/g, (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c])
    );
  }

  $("hcNextBtn").addEventListener("click", () => {
    if (S.round >= S.totalRounds) {
      finish();
      return;
    }
    S.round++;
    S.cueGiver = (S.cueGiver + 1) % S.players.length;
    startRound();
  });

  function finish() {
    const ranked = S.players
      .map((p, i) => ({ name: p.name, score: p.score, idx: i }))
      .sort((a, b) => b.score - a.score);
    const list = $("hcFinalList");
    list.innerHTML = "";
    const medals = ["🥇", "🥈", "🥉"];
    ranked.forEach((p, i) => {
      const row = document.createElement("div");
      row.className = "hc-score-row" + (i === 0 ? " hc-score-win" : "");
      row.innerHTML =
        '<span class="hc-score-name">' + (medals[i] || "&nbsp;&nbsp;" + (i + 1)) +
        ' <i class="hc-score-dot" style="background:' + MARKER_COLORS[p.idx] + '"></i>' +
        esc(p.name) + "</span>" +
        '<span class="hc-score-pts">' + p.score + " แต้ม</span>";
      list.appendChild(row);
    });
    show("hcFinal");
  }

  $("hcRestartBtn").addEventListener("click", () => {
    S.players.forEach((p) => { p.score = 0; });
    S.cueGiver = 0;
    S.round = 1;
    startRound();
  });

  // ---------- เริ่มต้น ----------
  buildBoard($("hcBoard"), true);
  renderPlayers();
})();
