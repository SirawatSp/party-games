document.addEventListener("DOMContentLoaded", () => {
  const $ = (id) => document.getElementById(id);

  const MODE_HINT = {
    coop: "ทุกคนช่วยกันตะโกนคำตอบ แข่งกับเวลาอย่างเดียว เครื่องจำสถิติสูงสุดของเครื่องนี้ไว้ให้",
    turn: "วนตอบทีละคน ใครตอบผิดหรือหมดเวลาตกรอบทันที เหลือคนสุดท้ายคือผู้ชนะ",
    route: "มีประเทศตั้งต้นกับปลายทางมาให้ ต้องต่อประเทศไปให้ถึง · เดินซ้ำได้ ไม่จำกัดจำนวนก้าว ปลายทางยิ่งไกลยิ่งได้คะแนนเยอะ",
  };
  const MAP_HINT = {
    on: "ซูมไปที่ประเทศปัจจุบันให้อัตโนมัติ จะได้เห็นว่ารอบ ๆ มีประเทศอะไรบ้าง (ไม่บอกชื่อนะ)",
    off: "ไม่มีแผนที่ ต้องนึกภาพเอาเอง",
  };
  const HINT_HINT = {
    on: "บอกว่าประเทศปัจจุบันเหลือเพื่อนบ้านที่ยังไม่ได้ใช้กี่ประเทศ",
    off: "ไม่บอกอะไรเลย ต้องรู้เองล้วน ๆ",
  };
  // โหมดหาทางใช้ตัวช่วยคนละอย่าง จึงต้องอธิบายคนละแบบ
  const HINT_HINT_ROUTE = {
    on: "บอกว่าจากประเทศปัจจุบันเหลืออีกอย่างน้อยกี่ก้าวถึงจะถึงปลายทาง ใช้ดูว่าเดินถูกทางไหม",
    off: "ไม่บอกอะไรเลย ต้องหาทางเอง",
  };
  function updateHintHint() {
    const table = S.mode === "route" ? HINT_HINT_ROUTE : HINT_HINT;
    $("bcHintHint").textContent = table[S.hintOn ? "on" : "off"];
  }
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

  // ---------- ค้นทางบนกราฟพรมแดน ----------
  // BFS จากประเทศหนึ่ง ได้ระยะทาง (จำนวนก้าว) ไปทุกประเทศที่เดินถึงได้ พร้อมทางกลับ
  // ใช้สามอย่าง: สร้างโจทย์ที่การันตีว่ามีทางไปถึง, บอกใบ้ว่าเหลืออีกกี่ก้าว, เฉลยทางสั้นสุด
  function bfs(fromCode) {
    const dist = { [fromCode]: 0 };
    const prev = {};
    const queue = [fromCode];
    for (let i = 0; i < queue.length; i++) {
      const cur = queue[i];
      const c = BY_CODE[cur];
      if (!c) continue;
      for (const nb of c.borders) {
        if (dist[nb] !== undefined) continue;
        dist[nb] = dist[cur] + 1;
        prev[nb] = cur;
        queue.push(nb);
      }
    }
    return { dist, prev };
  }

  function shortestPath(fromCode, toCode) {
    const { dist, prev } = bfs(fromCode);
    if (dist[toCode] === undefined) return null;
    const path = [toCode];
    let cur = toCode;
    while (cur !== fromCode) {
      cur = prev[cur];
      path.unshift(cur);
    }
    return path;
  }

  // สุ่มโจทย์ที่ต้องต่ออย่างน้อย steps ประเทศพอดี — ส่ง steps = 0 คือไม่ล็อกระยะ สุ่มอิสระ
  // กราฟพรมแดนโลกไม่ได้เชื่อมกันทั้งหมด (ทวีปอเมริกาแยกจากยูเรเซีย-แอฟริกา
  // และมีคู่เกาะอย่างไอร์แลนด์-สหราชอาณาจักรที่เดินไปไหนไม่ได้ไกล)
  // จึงต้องสุ่มตั้งต้นแล้วเช็กว่ามีปลายทางที่ระยะเท่านี้จริงไหม ไม่เจอก็สุ่มใหม่
  function makeRoute(steps) {
    const pool = BORDER_COUNTRIES.slice();
    for (let attempt = 0; attempt < 400; attempt++) {
      const start = pool[Math.floor(Math.random() * pool.length)];
      // ตั้งต้นที่ประเทศซึ่งมีเพื่อนบ้านอย่างน้อย 2 ประเทศ ไม่งั้นก้าวแรกถูกบังคับ ไม่ต้องคิดเลย
      if (start.borders.length < 2) continue;
      const { dist } = bfs(start.code);
      // สุ่มอิสระ: เอาปลายทางไหนก็ได้ที่เดินถึง ขอแค่ไม่ใช่ประเทศติดกันเฉย ๆ
      const targets = Object.keys(dist).filter((code) =>
        steps > 0 ? dist[code] === steps : dist[code] >= 2
      );
      if (!targets.length) continue;
      const target = targets[Math.floor(Math.random() * targets.length)];
      return { start: start, target: BY_CODE[target], optimal: dist[target] };
    }
    return null;
  }

  const S = {
    mode: "coop",
    totalTime: 90,
    turnTime: 15,
    hintOn: true,
    mapOn: true,
    routeSteps: 5,
    target: null,
    optimal: 0,
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
      $("bcRouteOpt").classList.toggle("bc-hidden", S.mode !== "route");
      updateHintHint();
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
  $("bcRouteSwitch").querySelectorAll("[data-steps]").forEach((b) => {
    b.addEventListener("click", () => {
      $("bcRouteSwitch").querySelectorAll("[data-steps]").forEach((x) => x.classList.remove("active"));
      b.classList.add("active");
      S.routeSteps = parseInt(b.dataset.steps, 10);
    });
  });

  $("bcMapSwitch").querySelectorAll("[data-map]").forEach((b) => {
    b.addEventListener("click", () => {
      $("bcMapSwitch").querySelectorAll("[data-map]").forEach((x) => x.classList.remove("active"));
      b.classList.add("active");
      S.mapOn = b.dataset.map === "on";
      $("bcMapHint").textContent = MAP_HINT[S.mapOn ? "on" : "off"];
    });
  });
  $("bcMapHint").textContent = MAP_HINT.on;

  // ---------- แผนที่ ----------
  // ใช้แผนที่อันเดียวทั้งตอนเล่นและตอนจบเกม ย้ายไปมาระหว่างสองกล่อง
  const MAP = wmCreateMap($("bcMapSvg"), {});

  $("bcZoomIn").addEventListener("click", () => MAP.zoomBy(1 / 1.5));
  $("bcZoomOut").addEventListener("click", () => MAP.zoomBy(1.5));
  $("bcZoomFit").addEventListener("click", () => S.cur && MAP.focus(S.cur.code));
  $("bcZoomAll").addEventListener("click", () => MAP.reset());

  // จำไว้ว่าซูมค้างอยู่ที่ประเทศไหน จะได้ขยับกล้องเฉพาะตอนประเทศเปลี่ยนจริง
  // ถ้าขยับทุกครั้งที่วาดใหม่ (เช่นตอนสลับตาผู้เล่น) จะเด้งกลับจนคนเลื่อนดูเองไม่ได้
  let mapFocusCode = null;
  function paintMap(force) {
    if (!S.mapOn) return;
    MAP.setClass(S.chain, "wm-used");
    MAP.setClass(S.target ? [S.target.code] : [], "wm-goal");
    MAP.setClass([S.cur.code], "wm-now");
    if (force || mapFocusCode !== S.cur.code) {
      MAP.focus(S.cur.code);
      mapFocusCode = S.cur.code;
    }
  }

  $("bcHintSwitch").querySelectorAll("[data-hint]").forEach((b) => {
    b.addEventListener("click", () => {
      $("bcHintSwitch").querySelectorAll("[data-hint]").forEach((x) => x.classList.remove("active"));
      b.classList.add("active");
      S.hintOn = b.dataset.hint === "on";
      updateHintHint();
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
    S.target = null;
    S.optimal = 0;
    if (S.mode === "route") {
      const route = makeRoute(S.routeSteps);
      if (!route) {
        return warn("สุ่มโจทย์ระยะนี้ไม่ได้ ลองเลือกระยะอื่นดู");
      }
      S.cur = route.start;
      S.target = route.target;
      S.optimal = route.optimal;
    } else {
      S.cur = pickStart();
    }
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
    // ย้ายแผนที่กลับเข้าหน้าเล่น (ตอนจบเกมรอบก่อนมันถูกย้ายไปอยู่หน้าสรุป)
    $("bcMapHolder").appendChild($("bcMapSvg"));
    $("bcMapBox").classList.toggle("bc-hidden", !S.mapOn);
    MAP.setClass([], "wm-miss");
    mapFocusCode = null;
    render();
    paintMap(true);
    // โหมดหาทางต้องเห็นก่อนว่าปลายทางอยู่ทางไหน ไม่งั้นไม่รู้จะเดินไปทางไหน
    if (S.mode === "route" && S.mapOn && S.target) {
      const a = wmByCode(S.cur.code);
      const b = wmByCode(S.target.code);
      if (a && b) {
        MAP.fit([{ lat: a.lat, lon: a.lon }, { lat: b.lat, lon: b.lon }], 160);
        mapFocusCode = S.cur.code;
      }
    }
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
    if (S.mode !== "turn" && !S.totalTime) {
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

    const isRoute = S.mode === "route";
    $("bcGoal").classList.toggle("bc-hidden", !isRoute);
    $("bcLegendGoal").classList.toggle("bc-hidden", !isRoute);
    // บอกวิธีย้อนกลับเฉพาะตอนมีอะไรให้ย้อนจริง ๆ
    $("bcBackHint").classList.toggle("bc-hidden", !isRoute || S.chain.length < 2);
    $("bcChainCap").textContent = isRoute ? "ก้าวที่ใช้" : "ความยาวโซ่";
    $("bcChainLen").textContent = isRoute ? S.chain.length - 1 : S.chain.length;

    if (isRoute) {
      $("bcGoalName").textContent = S.target.th;
      $("bcGoalMeta").textContent = "ทางที่สั้นที่สุดคือ " + S.optimal + " ก้าว · เดินกี่ก้าวก็ได้";
      // ตัวช่วยบอกว่าจากตรงนี้เหลืออีกอย่างน้อยกี่ก้าว ใช้ดูว่าเดินถูกทางหรือเดินอ้อม
      if (S.hintOn) {
        const left = bfs(S.cur.code).dist[S.target.code];
        $("bcCurHint").textContent =
          left === 0
            ? "ถึงแล้ว!"
            : "จากตรงนี้เหลืออีกอย่างน้อย " + left + " ก้าว · ประเทศนี้ติดกับ " + S.cur.borders.length + " ประเทศ";
      } else {
        $("bcCurHint").textContent = "";
      }
    } else {
      const left = remainingNeighbors().length;
      $("bcCurHint").textContent = S.hintOn
        ? "เหลือเพื่อนบ้านที่ยังไม่ได้ใช้ " + left + " ประเทศ (ทั้งหมด " + S.cur.borders.length + ")"
        : "";
    }

    $("bcTurnTag").classList.toggle("bc-hidden", S.mode !== "turn");
    if (S.mode === "turn") {
      $("bcTurnTag").innerHTML =
        "ถึงตา <b>" + esc(S.alive[S.turnIdx]) + "</b> · เหลือผู้เล่น " + S.alive.length + " คน";
    }
    renderChain("bcChain");
    paintMap(false);
  }
  function renderChain(target) {
    // โหมดหาทางกดย้อนกลับได้ ทำเป็นปุ่มจริงเพื่อให้กดด้วยคีย์บอร์ดและ screen reader ได้ด้วย
    const canRewind = target === "bcChain" && S.mode === "route" && !S.over;
    $(target).innerHTML = S.chain
      .map((code, i) => {
        const c = BY_CODE[code];
        const last = i === S.chain.length - 1;
        const cls = "bc-link" + (last ? " bc-link-cur" : "") + (canRewind && !last ? " bc-link-back" : "");
        const label = (i === 0 ? "🚩 " : "") + esc(c.th);
        if (canRewind && !last) {
          return (
            '<button type="button" class="' + cls + '" data-back="' + i + '" title="ย้อนกลับมาที่' +
            esc(c.th) + '">' + label + "</button>"
          );
        }
        return '<span class="' + cls + '">' + label + "</span>";
      })
      .join('<span class="bc-arrow">→</span>');
  }

  // กดประเทศที่เคยตอบไปแล้วเพื่อย้อนกลับไปจุดนั้น เผื่อเดินมาผิดทาง
  // ตัดโซ่ทิ้งตั้งแต่จุดนั้นเป็นต้นไป ไม่ใช่เดินย้อนกลับ จำนวนก้าวจึงลดลงจริง
  function rewindTo(index) {
    if (S.over || S.mode !== "route") return;
    if (index < 0 || index >= S.chain.length - 1) return;
    const back = BY_CODE[S.chain[index]];
    S.chain = S.chain.slice(0, index + 1);
    S.used = new Set(S.chain);
    S.cur = back;
    S.streak = 0;
    feedback("↩︎ ย้อนกลับมาที่" + back.th + " แล้ว — ลองทางใหม่ได้เลย", "ok");
    render();
    $("bcAnswer").focus();
  }

  $("bcChain").addEventListener("click", (e) => {
    const btn = e.target.closest("[data-back]");
    if (!btn) return;
    rewindTo(parseInt(btn.getAttribute("data-back"), 10));
  });

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
    // โหมดหาทางเดินซ้ำได้ จะได้ถอยออกจากทางตันแล้วลองทางใหม่ ไม่ต้องเริ่มใหม่ทั้งเกม
    if (S.mode !== "route" && S.used.has(code)) {
      return miss(BY_CODE[code].th + " ใช้ไปแล้วในโซ่นี้", true);
    }
    if (S.cur.borders.indexOf(code) < 0) {
      return miss(BY_CODE[code].th + " ไม่มีชายแดนติดกับ" + S.cur.th, true);
    }

    // ตอบถูก
    S.streak++;
    // โหมดหาทางคิดคะแนนตอนจบทีเดียวจากจำนวนก้าวที่ใช้ ระหว่างทางจึงไม่ให้แต้ม
    // ไม่งั้นเดินอ้อมยิ่งเยอะยิ่งได้คะแนน ซึ่งขัดกับเป้าหมายของโหมด
    const gain = S.mode === "route" ? 0 : 100 + 25 * (S.streak - 1);
    S.score += gain;
    S.used.add(code);
    S.chain.push(code);
    S.cur = BY_CODE[code];
    feedback(
      S.mode === "route"
        ? "✅ " + S.cur.th + " — ต่อได้ " + (S.chain.length - 1) + " ก้าวแล้ว"
        : "✅ " + S.cur.th + " ถูกต้อง! +" + gain + (S.streak > 1 ? " (ต่อเนื่อง " + S.streak + ")" : ""),
      "ok"
    );
    if (navigator.vibrate) navigator.vibrate(30);

    if (S.mode === "turn") {
      nextTurn();
    }
    render();

    if (S.mode === "route") {
      if (code === S.target.code) endGame("ถึงแล้ว");
      return;
    }

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

    if (S.mode === "route") {
      const used = S.chain.length - 1;
      const perfect = used === S.optimal;
      const won = reason === "ถึงแล้ว";
      // ไม่จำกัดจำนวนก้าวและไม่หักคะแนนตามก้าว เดินอ้อมกี่รอบก็ได้ ขอแค่ไปให้ถึง
      // คะแนนคิดจากความไกลของโจทย์แทน ปลายทางยิ่งไกลยิ่งได้เยอะ
      S.score = won ? S.optimal * 200 : 0;
      $("bcEndIcon").textContent = won ? (perfect ? "🎯" : "🏁") : reason === "หมดเวลา" ? "⌛" : "🏳️";
      $("bcEndTitle").textContent = won
        ? perfect
          ? "ถึงแล้ว! และเดินได้สั้นที่สุดพอดีด้วย"
          : "ถึงแล้ว!"
        : reason === "หมดเวลา"
        ? "หมดเวลาก่อนถึง"
        : "ยอมแพ้";
      $("bcEndText").textContent = won
        ? "จาก" + BY_CODE[S.chain[0]].th + " ถึง" + S.target.th + " ใช้ " + used + " ก้าว" +
          (perfect ? " เท่ากับทางที่สั้นที่สุดพอดี" : " (ทางที่สั้นที่สุดคือ " + S.optimal + " ก้าว)")
        : "เป้าหมายคือ" + S.target.th + " ยังไปไม่ถึง";

      $("bcEndScore").textContent = S.score;
      $("bcEndLen").textContent = used;
      $("bcEndLenCap").textContent = "ก้าวที่ใช้";
      $("bcEndBest").textContent = S.optimal;
      $("bcEndBestCap").textContent = "สั้นที่สุด";
      renderChain("bcEndChain");

      // เฉลยทางที่สั้นที่สุดให้ดู จะได้รู้ว่าควรเดินทางไหน
      const best = shortestPath(S.chain[0], S.target.code);
      $("bcMissed").innerHTML = best
        ? '<div class="bc-missed-head">ทางที่สั้นที่สุด (' + (best.length - 1) + " ก้าว)</div>" +
          best.map((c) => '<span class="bc-missed-chip">' + esc(BY_CODE[c].th) + "</span>").join('<span class="bc-arrow">→</span>')
        : "";

      $("bcEndMapBox").classList.toggle("bc-hidden", !S.mapOn);
      $("bcEndLegendGoal").classList.remove("bc-hidden");
      $("bcEndLegendMiss").textContent = "ทางที่สั้นที่สุด";
      if (S.mapOn) {
        $("bcEndMapHolder").appendChild($("bcMapSvg"));
        MAP.setClass(S.chain, "wm-used");
        MAP.setClass(best || [], "wm-miss");
        MAP.setClass([S.target.code], "wm-goal");
        MAP.setClass([S.cur.code], "wm-now");
        const pts = S.chain
          .concat(best || [])
          .map((c) => wmByCode(c))
          .filter(Boolean)
          .map((c) => ({ lat: c.lat, lon: c.lon }));
        if (pts.length) MAP.fit(pts, 120);
      }
      show("bcEnd");
      if (navigator.vibrate) navigator.vibrate([120, 60, 120]);
      return;
    }

    $("bcEndLenCap").textContent = "ประเทศในโซ่";
    $("bcEndBestCap").textContent = "สถิติสูงสุด";
    $("bcEndLegendGoal").classList.add("bc-hidden");
    $("bcEndLegendMiss").textContent = "ที่ยังไปต่อได้";
    MAP.setClass([], "wm-goal");

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

    // สรุปเส้นทางทั้งหมดบนแผนที่ พร้อมชี้ว่าตรงประเทศสุดท้ายยังไปต่อทางไหนได้บ้าง
    $("bcEndMapBox").classList.toggle("bc-hidden", !S.mapOn);
    if (S.mapOn) {
      $("bcEndMapHolder").appendChild($("bcMapSvg"));
      MAP.setClass(S.chain, "wm-used");
      MAP.setClass([S.cur.code], "wm-now");
      MAP.setClass(remainingNeighbors(), "wm-miss");
      const pts = S.chain
        .concat(remainingNeighbors())
        .map((code) => wmByCode(code))
        .filter(Boolean)
        .map((c) => ({ lat: c.lat, lon: c.lon }));
      if (pts.length) MAP.fit(pts, 120);
    }

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
