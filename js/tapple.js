document.addEventListener("DOMContentLoaded", () => {
  const TH_LETTERS = [
    "ก", "ข", "ค", "ง", "จ", "ฉ", "ช", "ซ", "ญ", "ด", "ต", "ถ", "ท", "ธ", "น",
    "บ", "ป", "ผ", "ฝ", "พ", "ฟ", "ภ", "ม", "ย", "ร", "ล", "ว", "ศ", "ส", "ห", "อ"
  ];
  const EN_LETTERS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");

  const TURN_SECONDS = 10;
  const CARDS_TO_WIN = 3;
  const PLAYER_COLORS = [
    "--sky", "--pink", "--lime", "--gold", "--violet",
    "--teal", "--crimson", "--orange", "--indigo", "--cyan", "--amber"
  ];
  // Up to 4 seats arranged around the phone: south = default/near side, north = opposite
  // side (rotated 180deg), west/east = the two side seats (rotated +-90deg).
  const SEAT_DEFS = {
    1: ["south"],
    2: ["north", "south"],
    3: ["north", "west", "south"],
    4: ["north", "west", "east", "south"]
  };

  const setupPanel = document.getElementById("setupPanel");
  const gamePanel = document.getElementById("gamePanel");
  const roundEndPanel = document.getElementById("roundEndPanel");
  const gameEndPanel = document.getElementById("gameEndPanel");

  const modeSwitch = document.getElementById("modeSwitch");
  const playerNameInput = document.getElementById("playerNameInput");
  const addPlayerBtn = document.getElementById("addPlayerBtn");
  const playerChips = document.getElementById("playerChips");
  const startGameBtn = document.getElementById("startGameBtn");
  const setupError = document.getElementById("setupError");

  const scoreboard = document.getElementById("scoreboard");
  const mainEliminateBtn = document.getElementById("eliminateBtn");
  const dualViewBtn = document.getElementById("dualViewBtn");

  const roundEndTitle = document.getElementById("roundEndTitle");
  const roundEndScoreboard = document.getElementById("roundEndScoreboard");
  const nextRoundBtn = document.getElementById("nextRoundBtn");

  const gameEndTitle = document.getElementById("gameEndTitle");
  const gameEndHint = document.getElementById("gameEndHint");
  const resetGameBtn = document.getElementById("resetGameBtn");

  const dualView = document.getElementById("dualView");
  const dualPanesEl = document.getElementById("dualPanes");
  const exitDualViewBtn = document.getElementById("exitDualViewBtn");

  const mainCategoryEl = document.getElementById("categoryText");
  const mainTurnEl = document.getElementById("turnLabel");
  const mainTimerEl = document.getElementById("timerNum");
  const mainLetterGridEl = document.getElementById("letterGrid");

  // These registries always start with the main-panel element, then get the dual-view
  // seat panes appended once buildDualPanes() runs at game start.
  let categoryEls = [mainCategoryEl];
  let turnEls = [mainTurnEl];
  let timerEls = [mainTimerEl];
  let letterGridContainers = [mainLetterGridEl];
  let eliminateBtnEls = [mainEliminateBtn];

  let mode = "th";
  let currentLetters = TH_LETTERS;
  let currentCategories = TAPPLE_CATEGORIES;

  let players = [];
  let usedCategoryIndexes = [];
  let lockedLetters = new Set();
  let roundAlive = [];
  let currentTurnIdx = 0;
  let currentTurnColorVar = "--sky";
  let secondsLeft = TURN_SECONDS;
  let timerInterval = null;

  modeSwitch.querySelectorAll(".tp-mode-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      mode = btn.dataset.mode;
      modeSwitch.querySelectorAll(".tp-mode-btn").forEach((b) => b.classList.toggle("active", b === btn));
    });
  });

  function renderChips() {
    playerChips.innerHTML = "";
    players.forEach((p, i) => {
      const chip = document.createElement("span");
      chip.className = "tp-chip";
      chip.innerHTML = p.name + ' <button aria-label="ลบ">×</button>';
      chip.querySelector("button").addEventListener("click", () => {
        players.splice(i, 1);
        renderChips();
      });
      playerChips.appendChild(chip);
    });
    startGameBtn.disabled = players.length < 2;
  }

  function addPlayer() {
    const name = playerNameInput.value.trim();
    if (!name) return;
    if (players.some((p) => p.name === name)) {
      setupError.textContent = "มีชื่อนี้ในวงแล้ว ลองชื่ออื่นดูนะ";
      return;
    }
    setupError.textContent = "";
    players.push({ name, cards: 0, color: "--sky" });
    playerNameInput.value = "";
    playerNameInput.focus();
    renderChips();
  }

  addPlayerBtn.addEventListener("click", addPlayer);
  playerNameInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") { e.preventDefault(); addPlayer(); }
  });

  function pickCategory() {
    if (usedCategoryIndexes.length >= currentCategories.length) usedCategoryIndexes = [];
    let idx;
    do {
      idx = Math.floor(Math.random() * currentCategories.length);
    } while (usedCategoryIndexes.includes(idx));
    usedCategoryIndexes.push(idx);
    return currentCategories[idx];
  }

  function renderScoreboard(target) {
    target.innerHTML = "";
    players.forEach((p, i) => {
      const row = document.createElement("div");
      const isAlive = roundAlive.includes(i);
      const isCurrent = target === scoreboard && isAlive && roundAlive[currentTurnIdx] === i;
      row.className = "tp-score-row" +
        (target === scoreboard && !isAlive ? " out" : "") +
        (isCurrent ? " current" : "");
      if (isCurrent) row.style.setProperty("--tc", "var(" + p.color + ")");
      row.innerHTML =
        '<span class="tp-score-name">' + p.name + "</span>" +
        '<span class="tp-score-cards">' + "🃏".repeat(p.cards) + "</span>";
      target.appendChild(row);
    });
  }

  function renderLetterGrids() {
    letterGridContainers.forEach((container) => {
      container.innerHTML = "";
      currentLetters.forEach((letter) => {
        const btn = document.createElement("button");
        btn.type = "button";
        btn.className = "tp-letter" + (lockedLetters.has(letter) ? " used" : "");
        btn.textContent = letter;
        btn.disabled = lockedLetters.has(letter);
        btn.addEventListener("click", () => handleLetterTap(letter));
        container.appendChild(btn);
      });
    });
  }

  function buildDualPanes() {
    dualPanesEl.innerHTML = "";
    categoryEls = [mainCategoryEl];
    turnEls = [mainTurnEl];
    timerEls = [mainTimerEl];
    letterGridContainers = [mainLetterGridEl];
    eliminateBtnEls = [mainEliminateBtn];

    const seatCount = Math.min(Math.max(players.length, 1), 4);
    dualPanesEl.className = "tp-dual-cross seats-" + seatCount;

    SEAT_DEFS[seatCount].forEach((seatKey) => {
      const pane = document.createElement("div");
      pane.className = "tp-seat tp-seat-" + seatKey;
      pane.innerHTML =
        '<div class="tp-dual-turn"></div>' +
        '<div class="tp-dual-category"></div>' +
        '<div class="tp-dual-timer">' + TURN_SECONDS + "</div>" +
        '<div class="tp-dual-letters"></div>' +
        '<button type="button" class="btn secondary tp-dual-eliminate">ตกรอบ ❌</button>';
      dualPanesEl.appendChild(pane);

      turnEls.push(pane.querySelector(".tp-dual-turn"));
      categoryEls.push(pane.querySelector(".tp-dual-category"));
      timerEls.push(pane.querySelector(".tp-dual-timer"));
      letterGridContainers.push(pane.querySelector(".tp-dual-letters"));
      const elimBtn = pane.querySelector(".tp-dual-eliminate");
      elimBtn.addEventListener("click", () => {
        stopTimer();
        eliminateCurrent();
      });
      eliminateBtnEls.push(elimBtn);
    });
  }

  function setAllText(els, text) {
    els.forEach((el) => { el.textContent = text; });
  }

  function applyTurnBadge(text, colorVar) {
    turnEls.forEach((el) => {
      el.textContent = text;
      el.style.background = "var(" + colorVar + ")";
    });
  }

  function stopTimer() {
    if (timerInterval) {
      clearInterval(timerInterval);
      timerInterval = null;
    }
  }

  function startTurn() {
    secondsLeft = TURN_SECONDS;
    setAllText(timerEls, secondsLeft);
    timerEls.forEach((el) => el.classList.remove("low"));
    const playerIdx = roundAlive[currentTurnIdx];
    currentTurnColorVar = players[playerIdx].color;
    applyTurnBadge("👉 ตาของ " + players[playerIdx].name, currentTurnColorVar);
    renderScoreboard(scoreboard);

    stopTimer();
    timerInterval = setInterval(() => {
      secondsLeft--;
      setAllText(timerEls, secondsLeft);
      if (secondsLeft <= 3) timerEls.forEach((el) => el.classList.add("low"));
      if (secondsLeft <= 0) {
        stopTimer();
        eliminateCurrent();
      }
    }, 1000);
  }

  function startRound() {
    const category = pickCategory();
    setAllText(categoryEls, category);
    lockedLetters = new Set();
    roundAlive = players.map((_, i) => i);
    currentTurnIdx = 0;
    renderLetterGrids();
    setupPanel.style.display = "none";
    roundEndPanel.style.display = "none";
    gameEndPanel.style.display = "none";
    gamePanel.style.display = "";
    startTurn();
  }

  function handleLetterTap(letter) {
    if (lockedLetters.has(letter)) return;
    lockedLetters.add(letter);
    renderLetterGrids();
    stopTimer();

    if (lockedLetters.size >= currentLetters.length) {
      endRound(null);
      return;
    }
    currentTurnIdx = (currentTurnIdx + 1) % roundAlive.length;
    startTurn();
  }

  function eliminateCurrent() {
    roundAlive.splice(currentTurnIdx, 1);
    if (currentTurnIdx >= roundAlive.length) currentTurnIdx = 0;

    if (roundAlive.length <= 1) {
      endRound(roundAlive.length === 1 ? roundAlive[0] : null);
    } else {
      startTurn();
    }
  }

  mainEliminateBtn.addEventListener("click", () => {
    stopTimer();
    eliminateCurrent();
  });

  function endRound(winnerIdx) {
    stopTimer();
    gamePanel.style.display = "none";
    exitDualView();

    if (winnerIdx === null) {
      roundEndTitle.textContent = "ตัวอักษรหมด! รอบนี้ไม่มีใครได้ป้าย";
    } else {
      players[winnerIdx].cards++;
      roundEndTitle.textContent = "🎉 " + players[winnerIdx].name + " ชนะรอบนี้! ได้ป้ายหมวด";
    }
    renderScoreboard(roundEndScoreboard);

    const champion = players.find((p) => p.cards >= CARDS_TO_WIN);
    if (champion) {
      gameEndTitle.textContent = "🏆 " + champion.name + " ชนะเกม!";
      gameEndHint.textContent = "เก็บครบ " + CARDS_TO_WIN + " ป้ายหมวดก่อนใคร";
      roundEndPanel.style.display = "none";
      gameEndPanel.style.display = "";
    } else {
      roundEndPanel.style.display = "";
    }
  }

  nextRoundBtn.addEventListener("click", startRound);

  startGameBtn.addEventListener("click", () => {
    if (players.length < 2) return;
    players.forEach((p, i) => { p.color = PLAYER_COLORS[i % PLAYER_COLORS.length]; });
    currentLetters = mode === "en" ? EN_LETTERS : TH_LETTERS;
    currentCategories = mode === "en" ? TAPPLE_CATEGORIES_EN : TAPPLE_CATEGORIES;
    buildDualPanes();
    startRound();
  });

  resetGameBtn.addEventListener("click", () => {
    stopTimer();
    exitDualView();
    players = [];
    usedCategoryIndexes = [];
    dualPanesEl.innerHTML = "";
    categoryEls = [mainCategoryEl];
    turnEls = [mainTurnEl];
    timerEls = [mainTimerEl];
    letterGridContainers = [mainLetterGridEl];
    eliminateBtnEls = [mainEliminateBtn];
    renderChips();
    gamePanel.style.display = "none";
    roundEndPanel.style.display = "none";
    gameEndPanel.style.display = "none";
    setupPanel.style.display = "";
  });

  function requestFs(el) {
    const method = el.requestFullscreen || el.webkitRequestFullscreen || el.msRequestFullscreen;
    if (method) {
      const result = method.call(el);
      if (result && result.catch) result.catch(() => {});
    }
  }

  function exitFs() {
    const method = document.exitFullscreen || document.webkitExitFullscreen || document.msExitFullscreen;
    if (method && (document.fullscreenElement || document.webkitFullscreenElement)) {
      const result = method.call(document);
      if (result && result.catch) result.catch(() => {});
    }
  }

  function enterDualView() {
    dualView.style.display = "block";
    document.documentElement.classList.add("tp-no-scroll");
    requestFs(dualView);
  }

  function exitDualView() {
    if (dualView.style.display === "none") return;
    dualView.style.display = "none";
    document.documentElement.classList.remove("tp-no-scroll");
    exitFs();
  }

  dualViewBtn.addEventListener("click", enterDualView);
  exitDualViewBtn.addEventListener("click", exitDualView);
  document.addEventListener("fullscreenchange", () => {
    if (!document.fullscreenElement) dualView.style.display = "none";
  });

  renderChips();
});
