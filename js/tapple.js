document.addEventListener("DOMContentLoaded", () => {
  const TH_LETTERS = [
    "ก", "ข", "ค", "ง", "จ", "ฉ", "ช", "ซ", "ญ", "ด", "ต", "ถ", "ท", "ธ", "น",
    "บ", "ป", "ผ", "ฝ", "พ", "ฟ", "ภ", "ม", "ย", "ร", "ล", "ว", "ศ", "ส", "ห", "อ"
  ];
  const EN_LETTERS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");
  const WINS_TO_CHAMPION = 3;

  const setupPanel = document.getElementById("setupPanel");
  const categoryPanel = document.getElementById("categoryPanel");
  const gamePanel = document.getElementById("gamePanel");
  const roundEndPanel = document.getElementById("roundEndPanel");
  const gameEndPanel = document.getElementById("gameEndPanel");

  const modeSwitch = document.getElementById("modeSwitch");
  const timeSwitch = document.getElementById("timeSwitch");
  const startGameBtn = document.getElementById("startGameBtn");

  const categoryPreviewText = document.getElementById("categoryPreviewText");
  const startSideHint = document.getElementById("startSideHint");
  const rerollCategoryBtn = document.getElementById("rerollCategoryBtn");
  const beginRoundBtn = document.getElementById("beginRoundBtn");

  const categoryText = document.getElementById("categoryText");
  const letterGrid = document.getElementById("letterGrid");
  const giveUpBtn = document.getElementById("giveUpBtn");
  const dualViewBtn = document.getElementById("dualViewBtn");

  const dualView = document.getElementById("dualView");
  const exitDualViewBtn = document.getElementById("exitDualViewBtn");
  const dualGiveUpTop = document.getElementById("dualGiveUpTop");
  const dualGiveUpBottom = document.getElementById("dualGiveUpBottom");

  // Side 0 = ฝั่ง 1 = main clockA + fullscreen bottom half (upright).
  // Side 1 = ฝั่ง 2 = main clockB + fullscreen top half (rotated 180deg).
  const categoryEls = [categoryText, document.getElementById("dualCatBottom"), document.getElementById("dualCatTop")];
  const letterGridEls = [letterGrid, document.getElementById("dualLettersBottom"), document.getElementById("dualLettersTop")];
  const sideTimeEls = [
    [document.getElementById("clockTimeA"), document.getElementById("dualTimeBottom")],
    [document.getElementById("clockTimeB"), document.getElementById("dualTimeTop")]
  ];
  const sideWinEls = [
    [document.getElementById("clockWinsA"), document.getElementById("dualWinsBottom")],
    [document.getElementById("clockWinsB"), document.getElementById("dualWinsTop")]
  ];
  const sideClockEls = [
    [document.getElementById("clockA"), document.getElementById("dualClockBottom"), document.getElementById("dualHalfBottom")],
    [document.getElementById("clockB"), document.getElementById("dualClockTop"), document.getElementById("dualHalfTop")]
  ];

  const roundEndTitle = document.getElementById("roundEndTitle");
  const roundEndReason = document.getElementById("roundEndReason");
  const matchScore = document.getElementById("matchScore");
  const nextRoundBtn = document.getElementById("nextRoundBtn");
  const backSetupBtn = document.getElementById("backSetupBtn");

  const gameEndTitle = document.getElementById("gameEndTitle");
  const gameEndHint = document.getElementById("gameEndHint");
  const resetGameBtn = document.getElementById("resetGameBtn");

  let mode = "th";
  let timeBank = 60;
  let currentLetters = TH_LETTERS;
  let currentCategories = TAPPLE_CATEGORIES;

  let usedCategoryIndexes = [];
  let lockedLetters = new Set();
  let wins = [0, 0];
  let times = [60, 60];
  let activeSide = 0;
  let startingSide = 0;   // alternates every round for fairness
  let pendingCategory = null;
  let roundLive = false;
  let timerInterval = null;

  function showOnly(panel) {
    [setupPanel, categoryPanel, gamePanel, roundEndPanel, gameEndPanel]
      .forEach((p) => { p.style.display = p === panel ? "" : "none"; });
  }

  modeSwitch.querySelectorAll(".tp-mode-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      mode = btn.dataset.mode;
      modeSwitch.querySelectorAll(".tp-mode-btn").forEach((b) => b.classList.toggle("active", b === btn));
    });
  });

  timeSwitch.querySelectorAll(".tp-mode-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      timeBank = Number(btn.dataset.sec);
      timeSwitch.querySelectorAll(".tp-mode-btn").forEach((b) => b.classList.toggle("active", b === btn));
    });
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

  function fmtClock(seconds) {
    const s = Math.max(0, seconds);
    return Math.floor(s / 60) + ":" + String(s % 60).padStart(2, "0");
  }

  function renderClocks() {
    [0, 1].forEach((i) => {
      sideTimeEls[i].forEach((el) => { el.textContent = fmtClock(times[i]); });
      sideWinEls[i].forEach((el) => { el.textContent = "ชนะ " + wins[i] + " รอบ"; });
      sideClockEls[i].forEach((el) => {
        el.classList.toggle("active", roundLive && activeSide === i);
        el.classList.toggle("low", times[i] <= 10);
      });
    });
  }

  function renderLetters() {
    letterGridEls.forEach((container) => {
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

  function stopTimer() {
    if (timerInterval) {
      clearInterval(timerInterval);
      timerInterval = null;
    }
  }

  function showCategoryPanel() {
    pendingCategory = pickCategory();
    categoryPreviewText.textContent = pendingCategory;
    startSideHint.textContent = "รอบนี้ฝั่ง " + (startingSide + 1) + " เริ่มก่อน";
    showOnly(categoryPanel);
  }

  rerollCategoryBtn.addEventListener("click", () => {
    pendingCategory = pickCategory();
    categoryPreviewText.textContent = pendingCategory;
  });

  beginRoundBtn.addEventListener("click", () => {
    lockedLetters = new Set();
    times = [timeBank, timeBank];
    activeSide = startingSide;
    roundLive = true;
    categoryEls.forEach((el) => { el.textContent = pendingCategory; });
    renderLetters();
    renderClocks();
    showOnly(gamePanel);

    stopTimer();
    timerInterval = setInterval(() => {
      times[activeSide]--;
      renderClocks();
      if (times[activeSide] <= 0) {
        endRound(1 - activeSide, "เวลาฝั่ง " + (activeSide + 1) + " หมดก่อน");
      }
    }, 1000);
  });

  function handleLetterTap(letter) {
    if (!roundLive || lockedLetters.has(letter)) return;
    lockedLetters.add(letter);
    renderLetters();

    if (lockedLetters.size >= currentLetters.length) {
      // board exhausted — more time left on the clock wins
      if (times[0] === times[1]) {
        endRound(null, "ตัวอักษรหมดกระดานและเวลาเหลือเท่ากันพอดี");
      } else {
        const winner = times[0] > times[1] ? 0 : 1;
        endRound(winner, "ตัวอักษรหมดกระดาน — ฝั่ง " + (winner + 1) + " เหลือเวลามากกว่า");
      }
      return;
    }
    activeSide = 1 - activeSide;
    renderClocks();
  }

  function giveUp(side) {
    // only the side whose clock is running can concede
    if (!roundLive || side !== activeSide) return;
    endRound(1 - side, "ฝั่ง " + (side + 1) + " ยอมแพ้");
  }

  giveUpBtn.addEventListener("click", () => giveUp(activeSide));
  dualGiveUpBottom.addEventListener("click", () => giveUp(0));
  dualGiveUpTop.addEventListener("click", () => giveUp(1));

  function endRound(winnerIdx, reason) {
    stopTimer();
    roundLive = false;
    exitDualView();
    startingSide = 1 - startingSide;

    if (winnerIdx === null) {
      roundEndTitle.textContent = "🤝 เสมอ!";
    } else {
      wins[winnerIdx]++;
      if (wins[winnerIdx] >= WINS_TO_CHAMPION) {
        gameEndTitle.textContent = "🏆 ฝั่ง " + (winnerIdx + 1) + " เป็นแชมป์!";
        gameEndHint.textContent = "ชนะครบ " + WINS_TO_CHAMPION + " รอบก่อน — สกอร์รวม " + wins[0] + " : " + wins[1];
        showOnly(gameEndPanel);
        return;
      }
      roundEndTitle.textContent = "🎉 ฝั่ง " + (winnerIdx + 1) + " ชนะรอบนี้!";
    }
    roundEndReason.textContent = reason;
    matchScore.textContent = wins[0] + " : " + wins[1];
    showOnly(roundEndPanel);
  }

  nextRoundBtn.addEventListener("click", showCategoryPanel);

  function resetMatch() {
    stopTimer();
    roundLive = false;
    exitDualView();
    wins = [0, 0];
    startingSide = 0;
    usedCategoryIndexes = [];
    showOnly(setupPanel);
  }

  // ---------- face-to-face fullscreen view ----------
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
    if (!document.fullscreenElement) exitDualView();
  });

  backSetupBtn.addEventListener("click", resetMatch);
  resetGameBtn.addEventListener("click", resetMatch);

  startGameBtn.addEventListener("click", () => {
    currentLetters = mode === "en" ? EN_LETTERS : TH_LETTERS;
    currentCategories = mode === "en" ? TAPPLE_CATEGORIES_EN : TAPPLE_CATEGORIES;
    wins = [0, 0];
    startingSide = 0;
    usedCategoryIndexes = [];
    showCategoryPanel();
  });
});
