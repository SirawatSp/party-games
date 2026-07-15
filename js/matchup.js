document.addEventListener("DOMContentLoaded", () => {
  const WHEEL_COLORS = [
    "#ff2f87", "#2be6ff", "#d6ff3d", "#ffb703", "#9d6bff",
    "#ff8a3d", "#1de9b6", "#5b6eff", "#ff3d54", "#38bdf8", "#34d399", "#fb7185"
  ];

  // panels
  const setupPanel = document.getElementById("muSetup");
  const pairsPanel = document.getElementById("muPairs");
  const choosePanel = document.getElementById("muChoose");
  const passPanel = document.getElementById("muPass");
  const guessPanel = document.getElementById("muGuess");
  const revealPanel = document.getElementById("muReveal");
  const gameEndPanel = document.getElementById("muGameEnd");

  // setup elements
  const nameInput = document.getElementById("muNameInput");
  const addBtn = document.getElementById("muAddBtn");
  const shuffleBtn = document.getElementById("muShuffleBtn");
  const namesBox = document.getElementById("muNames");
  const wheelSlices = document.getElementById("muWheelSlices");
  const wheelSvg = document.getElementById("muWheel");
  const wheelEmpty = document.getElementById("muWheelEmpty");

  // pairs elements
  const pairListBox = document.getElementById("muPairList");
  const startBtn = document.getElementById("muStartBtn");
  const repairBtn = document.getElementById("muRepairBtn");

  // round elements
  const chooseTurn = document.getElementById("muChooseTurn");
  const chooseQ = document.getElementById("muChooseQ");
  const chooseChoices = document.getElementById("muChooseChoices");
  const passText = document.getElementById("muPassText");
  const passBtn = document.getElementById("muPassBtn");
  const guessTurn = document.getElementById("muGuessTurn");
  const guessQ = document.getElementById("muGuessQ");
  const guessChoices = document.getElementById("muGuessChoices");
  const revealEmoji = document.getElementById("muRevealEmoji");
  const revealVerdict = document.getElementById("muRevealVerdict");
  const revealDetail = document.getElementById("muRevealDetail");
  const scoreBox = document.getElementById("muScore");
  const nextBtn = document.getElementById("muNextBtn");
  const repair2Btn = document.getElementById("muRepair2Btn");
  const endTitle = document.getElementById("muEndTitle");
  const endScore = document.getElementById("muEndScore");
  const endLeaderboard = document.getElementById("muEndLeaderboard");
  const endRepairBtn = document.getElementById("muEndRepairBtn");

  let names = [];
  let groups = [];        // array of arrays of names (pairs, plus maybe one trio)
  let roundIdx = 0;
  let wheelAngle = 0;
  let spinning = false;

  let drawQuestion = createPicker(MATCHUP_LIST);
  let currentQ = null;
  let currentGroup = null;
  let chooserName = null;
  let chooserPick = null;
  let guessers = [];       // [{name, pick}]
  let guessPos = 0;
  let score = { correct: 0, total: 0 };
  let playerStats = {};   // name -> {correct, total} across all rounds this session

  // ---------- name management + wheel ----------
  function showOnly(panel) {
    [setupPanel, pairsPanel, choosePanel, passPanel, guessPanel, revealPanel, gameEndPanel]
      .forEach((p) => { p.style.display = p === panel ? "" : "none"; });
  }

  function polarToXY(cx, cy, r, angleDeg) {
    const a = (angleDeg - 90) * Math.PI / 180;
    return [cx + r * Math.cos(a), cy + r * Math.sin(a)];
  }

  function renderWheel() {
    wheelSlices.innerHTML = "";
    const n = names.length;
    wheelEmpty.style.display = n === 0 ? "" : "none";
    wheelSvg.style.display = n === 0 ? "none" : "";
    if (n === 0) return;

    const cx = 150, cy = 150, r = 148;
    if (n === 1) {
      const circle = document.createElementNS("http://www.w3.org/2000/svg", "circle");
      circle.setAttribute("cx", cx); circle.setAttribute("cy", cy); circle.setAttribute("r", r);
      circle.setAttribute("fill", WHEEL_COLORS[0]);
      wheelSlices.appendChild(circle);
      addLabel(cx, cy, 0, names[0], cx);
      return;
    }
    const seg = 360 / n;
    for (let i = 0; i < n; i++) {
      const start = i * seg, end = (i + 1) * seg;
      const [x1, y1] = polarToXY(cx, cy, r, start);
      const [x2, y2] = polarToXY(cx, cy, r, end);
      const large = seg > 180 ? 1 : 0;
      const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
      path.setAttribute("d", `M${cx},${cy} L${x1},${y1} A${r},${r} 0 ${large} 1 ${x2},${y2} Z`);
      path.setAttribute("fill", WHEEL_COLORS[i % WHEEL_COLORS.length]);
      path.setAttribute("stroke", "#1c0f24");
      path.setAttribute("stroke-width", "1.5");
      wheelSlices.appendChild(path);
      addLabel(cx, cy, start + seg / 2, names[i], r);
    }
  }

  function addLabel(cx, cy, midAngle, text, r) {
    const [tx, ty] = polarToXY(cx, cy, r * 0.62, midAngle);
    const t = document.createElementNS("http://www.w3.org/2000/svg", "text");
    t.setAttribute("x", tx);
    t.setAttribute("y", ty);
    t.setAttribute("fill", "#160a1e");
    t.setAttribute("font-size", names.length > 8 ? "11" : "13");
    t.setAttribute("font-weight", "700");
    t.setAttribute("font-family", "Kanit, sans-serif");
    t.setAttribute("text-anchor", "middle");
    t.setAttribute("dominant-baseline", "middle");
    t.setAttribute("transform", `rotate(${midAngle} ${tx} ${ty})`);
    t.textContent = text.length > 8 ? text.slice(0, 8) + "…" : text;
    wheelSlices.appendChild(t);
  }

  function renderNames() {
    namesBox.innerHTML = "";
    names.forEach((name, i) => {
      const chip = document.createElement("span");
      chip.className = "mu-name-chip";
      chip.innerHTML = '<span>' + name + '</span><button aria-label="ลบ" data-i="' + i + '">✕</button>';
      namesBox.appendChild(chip);
    });
    namesBox.querySelectorAll("button").forEach((b) => {
      b.addEventListener("click", () => {
        names.splice(parseInt(b.dataset.i, 10), 1);
        refreshSetup();
      });
    });
    shuffleBtn.disabled = names.length < 2 || spinning;
  }

  function refreshSetup() {
    renderNames();
    renderWheel();
  }

  function addName() {
    const v = nameInput.value.trim();
    if (!v) return;
    if (names.length >= 12) {
      nameInput.value = "";
      return;
    }
    if (names.some((n) => n.toLowerCase() === v.toLowerCase())) {
      nameInput.value = "";
      return;
    }
    names.push(v);
    nameInput.value = "";
    nameInput.focus();
    refreshSetup();
  }

  addBtn.addEventListener("click", addName);
  nameInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") { e.preventDefault(); addName(); }
  });

  // ---------- pairing ----------
  function shuffle(arr) {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  function makeGroups() {
    const shuffled = shuffle(names);
    const g = [];
    // build pairs; if odd count, make the final group a trio
    let i = 0;
    while (i < shuffled.length) {
      const remaining = shuffled.length - i;
      if (remaining === 3) { g.push([shuffled[i], shuffled[i + 1], shuffled[i + 2]]); i += 3; }
      else { g.push([shuffled[i], shuffled[i + 1]]); i += 2; }
    }
    return g;
  }

  function renderPairList() {
    pairListBox.innerHTML = "";
    groups.forEach((grp, i) => {
      const row = document.createElement("div");
      row.className = "mu-pair-row";
      row.innerHTML = '<span class="mu-pair-num">' + (i + 1) + '</span>' +
        '<span class="mu-pair-names">' + grp.join("  &  ") + '</span>';
      pairListBox.appendChild(row);
    });
  }

  function doShuffle() {
    if (spinning || names.length < 2) return;
    spinning = true;
    shuffleBtn.disabled = true;
    addBtn.disabled = true;
    // spin the wheel a few turns to a random resting angle
    const turns = 4 + Math.floor(Math.random() * 3);
    wheelAngle += turns * 360 + Math.floor(Math.random() * 360);
    wheelSvg.style.transition = "transform 2.4s cubic-bezier(.15,.8,.25,1)";
    wheelSvg.style.transform = "rotate(" + wheelAngle + "deg)";

    const finish = () => {
      wheelSvg.removeEventListener("transitionend", finish);
      spinning = false;
      addBtn.disabled = false;
      regroup();
    };
    wheelSvg.addEventListener("transitionend", finish);
    // safety fallback in case transitionend doesn't fire
    setTimeout(() => { if (spinning) finish(); }, 2800);
  }

  // (re)build groups instantly and show the pairs list — used for "จับคู่ใหม่"
  function regroup() {
    groups = makeGroups();
    roundIdx = 0;
    score = { correct: 0, total: 0 };
    playerStats = {};
    drawQuestion = createPicker(MATCHUP_LIST);
    renderPairList();
    showOnly(pairsPanel);
  }

  // show a final score summary before letting the group reshuffle and start over
  function showGameEnd() {
    const pct = score.total ? Math.round((score.correct / score.total) * 100) : 0;
    endScore.textContent = "รวมทั้งวง: ทายถูก " + score.correct + " จาก " + score.total + " ครั้ง (" + pct + "%)";

    const rows = Object.keys(playerStats)
      .map((name) => ({ name, ...playerStats[name], pct: playerStats[name].total ? playerStats[name].correct / playerStats[name].total : 0 }))
      .sort((a, b) => b.pct - a.pct || b.total - a.total);

    endTitle.textContent = rows.length && rows[0].correct > 0
      ? "🏆 " + rows[0].name + " รู้ใจคู่ตัวเองที่สุดในวง!"
      : "🏁 จบเกม! สรุปผลรอบนี้";

    endLeaderboard.innerHTML = rows.map((r, i) =>
      '<div class="mu-pair-row"><span class="mu-pair-num">' + (i + 1) + '</span>' +
      '<span class="mu-pair-names">' + r.name + " — ทายถูก " + r.correct + "/" + r.total + " (" + Math.round(r.pct * 100) + "%)</span></div>"
    ).join("");

    showOnly(gameEndPanel);
  }

  shuffleBtn.addEventListener("click", doShuffle);
  repairBtn.addEventListener("click", regroup);
  repair2Btn.addEventListener("click", showGameEnd);
  endRepairBtn.addEventListener("click", regroup);

  // ---------- rounds ----------
  function pickQuestion() {
    return drawQuestion();
  }

  function startRound() {
    currentGroup = groups[roundIdx % groups.length];
    currentQ = pickQuestion();
    // random chooser within the group; everyone else guesses
    const order = shuffle(currentGroup);
    chooserName = order[0];
    guessers = order.slice(1).map((n) => ({ name: n, pick: null }));
    guessPos = 0;
    chooserPick = null;
    renderChooseStep();
  }

  function renderChoices(container, onPick) {
    container.innerHTML = "";
    currentQ.choices.forEach((c) => {
      const b = document.createElement("button");
      b.className = "mu-choice";
      b.textContent = c;
      b.addEventListener("click", () => onPick(c));
      container.appendChild(b);
    });
  }

  function renderChooseStep() {
    chooseTurn.innerHTML = 'ส่งมือถือให้ <b>' + chooserName + '</b> — เลือกคำตอบลับ ๆ ห้ามให้คู่เห็น 🤫';
    chooseQ.textContent = currentQ.q;
    renderChoices(chooseChoices, (c) => {
      chooserPick = c;
      goToGuess();
    });
    showOnly(choosePanel);
  }

  function goToGuess() {
    const g = guessers[guessPos];
    passText.innerHTML = 'ส่งมือถือให้ <b>' + g.name + '</b><br>ให้ทายว่า <b>' + chooserName + '</b> เลือกอะไรไป';
    passBtn.onclick = () => renderGuessStep();
    showOnly(passPanel);
  }

  function renderGuessStep() {
    const g = guessers[guessPos];
    guessTurn.innerHTML = '<b>' + g.name + '</b> ทายว่า <b>' + chooserName + '</b> เลือกช้อยไหน?';
    guessQ.textContent = currentQ.q;
    renderChoices(guessChoices, (c) => {
      g.pick = c;
      guessPos++;
      if (guessPos < guessers.length) {
        goToGuess();
      } else {
        renderReveal();
      }
    });
    showOnly(guessPanel);
  }

  function renderReveal() {
    let correctCount = 0;
    guessers.forEach((g) => { if (g.pick === chooserPick) correctCount++; });
    const allCorrect = correctCount === guessers.length;
    const anyCorrect = correctCount > 0;

    score.total += guessers.length;
    score.correct += correctCount;
    guessers.forEach((g) => {
      const stats = playerStats[g.name] || (playerStats[g.name] = { correct: 0, total: 0 });
      stats.total++;
      if (g.pick === chooserPick) stats.correct++;
    });

    revealEmoji.textContent = allCorrect ? "🎯" : (anyCorrect ? "😅" : "😵");
    revealVerdict.textContent = allCorrect ? "ทายถูกหมด!" : (anyCorrect ? "ทายถูกบางส่วน" : "ทายผิด!");
    revealVerdict.className = "mu-reveal-verdict " + (allCorrect ? "ok" : (anyCorrect ? "half" : "no"));

    let detail = '<div class="mu-reveal-line"><b>' + chooserName + '</b> เลือก: <span class="mu-pick-real">' + chooserPick + '</span></div>';
    guessers.forEach((g) => {
      const ok = g.pick === chooserPick;
      detail += '<div class="mu-reveal-line">' + g.name + ' ทาย: <span class="' + (ok ? "mu-pick-ok" : "mu-pick-no") + '">' + g.pick + (ok ? " ✓" : " ✗") + '</span></div>';
    });
    revealDetail.innerHTML = detail;

    scoreBox.textContent = "รวมทั้งวง: ทายถูก " + score.correct + " จาก " + score.total + " ครั้ง";
    showOnly(revealPanel);
  }

  startBtn.addEventListener("click", () => { roundIdx = 0; startRound(); });
  nextBtn.addEventListener("click", () => { roundIdx++; startRound(); });

  // init
  refreshSetup();
});
