document.addEventListener("DOMContentLoaded", () => {
  const TAPPLE_LETTERS = [
    "ก", "ข", "ค", "ง", "จ", "ฉ", "ช", "ซ", "ญ", "ด", "ต", "ถ", "ท", "ธ", "น",
    "บ", "ป", "ผ", "ฝ", "พ", "ฟ", "ภ", "ม", "ย", "ร", "ล", "ว", "ศ", "ส", "ห", "อ"
  ];
  const TURN_SECONDS = 10;
  const CARDS_TO_WIN = 3;

  const setupPanel = document.getElementById("setupPanel");
  const gamePanel = document.getElementById("gamePanel");
  const roundEndPanel = document.getElementById("roundEndPanel");
  const gameEndPanel = document.getElementById("gameEndPanel");

  const playerNameInput = document.getElementById("playerNameInput");
  const addPlayerBtn = document.getElementById("addPlayerBtn");
  const playerChips = document.getElementById("playerChips");
  const startGameBtn = document.getElementById("startGameBtn");
  const setupError = document.getElementById("setupError");

  const scoreboard = document.getElementById("scoreboard");
  const eliminateBtn = document.getElementById("eliminateBtn");
  const dualViewBtn = document.getElementById("dualViewBtn");

  const roundEndTitle = document.getElementById("roundEndTitle");
  const roundEndScoreboard = document.getElementById("roundEndScoreboard");
  const nextRoundBtn = document.getElementById("nextRoundBtn");

  const gameEndTitle = document.getElementById("gameEndTitle");
  const gameEndHint = document.getElementById("gameEndHint");
  const resetGameBtn = document.getElementById("resetGameBtn");

  const dualView = document.getElementById("dualView");
  const exitDualViewBtn = document.getElementById("exitDualViewBtn");

  // Each entry: { category, turn, timer, letters } elements that must always show the same state.
  const categoryEls = [
    document.getElementById("categoryText"),
    document.getElementById("dualCategoryTop"),
    document.getElementById("dualCategoryBottom")
  ];
  const turnEls = [
    document.getElementById("turnLabel"),
    document.getElementById("dualTurnTop"),
    document.getElementById("dualTurnBottom")
  ];
  const timerEls = [
    document.getElementById("timerNum"),
    document.getElementById("dualTimerTop"),
    document.getElementById("dualTimerBottom")
  ];
  const letterGridContainers = [
    document.getElementById("letterGrid"),
    document.getElementById("dualLettersTop"),
    document.getElementById("dualLettersBottom")
  ];
  const eliminateBtns = [
    eliminateBtn,
    document.getElementById("dualEliminateTop"),
    document.getElementById("dualEliminateBottom")
  ];

  let players = [];
  let usedCategoryIndexes = [];
  let lockedLetters = new Set();
  let roundAlive = [];
  let currentTurnIdx = 0;
  let secondsLeft = TURN_SECONDS;
  let timerInterval = null;

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
    players.push({ name, cards: 0 });
    playerNameInput.value = "";
    playerNameInput.focus();
    renderChips();
  }

  addPlayerBtn.addEventListener("click", addPlayer);
  playerNameInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") { e.preventDefault(); addPlayer(); }
  });

  function pickCategory() {
    if (usedCategoryIndexes.length >= TAPPLE_CATEGORIES.length) usedCategoryIndexes = [];
    let idx;
    do {
      idx = Math.floor(Math.random() * TAPPLE_CATEGORIES.length);
    } while (usedCategoryIndexes.includes(idx));
    usedCategoryIndexes.push(idx);
    return TAPPLE_CATEGORIES[idx];
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
      row.innerHTML =
        '<span class="tp-score-name">' + p.name + "</span>" +
        '<span class="tp-score-cards">' + "🃏".repeat(p.cards) + "</span>";
      target.appendChild(row);
    });
  }

  function renderLetterGrids() {
    letterGridContainers.forEach((container) => {
      container.innerHTML = "";
      TAPPLE_LETTERS.forEach((letter) => {
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

  function setAllText(els, text) {
    els.forEach((el) => { el.textContent = text; });
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
    setAllText(turnEls, "👉 ตาของ " + players[playerIdx].name);
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

    if (lockedLetters.size >= TAPPLE_LETTERS.length) {
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

  eliminateBtns.forEach((btn) => {
    btn.addEventListener("click", () => {
      stopTimer();
      eliminateCurrent();
    });
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
    startRound();
  });

  resetGameBtn.addEventListener("click", () => {
    stopTimer();
    exitDualView();
    players = [];
    usedCategoryIndexes = [];
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
    dualView.style.display = "flex";
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
