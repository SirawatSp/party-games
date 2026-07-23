document.addEventListener("DOMContentLoaded", () => {
  const modeSwitch = document.getElementById("modeSwitch");
  const rulesQuiz = document.getElementById("rulesQuiz");
  const rulesBattle = document.getElementById("rulesBattle");
  const filterTags = document.getElementById("filterTags");
  const quizPanel = document.getElementById("quizPanel");
  const battlePanel = document.getElementById("battlePanel");

  const TAG_LABEL = {
    thai: "ไทย", general: "ทั่วไป", science: "วิทยาศาสตร์", history: "ประวัติศาสตร์",
    movie: "หนัง/การ์ตูน", music: "เพลง", sport: "กีฬา", game: "เกม"
  };
  const TIME_BANK_SECONDS = 60;

  // ---------- Flash Quiz (flip-card review mode) ----------
  const cardHolder = document.getElementById("cardHolder");
  const nextBtn = document.getElementById("nextBtn");
  const quizScoreText = document.getElementById("quizScoreText");
  const quizScoreResetBtn = document.getElementById("quizScoreResetBtn");

  let activeTag = "all";
  let drawNext = null;
  let current = null;
  let revealed = false;
  let quizCorrect = 0;
  let quizTotal = 0;

  function pool() {
    return activeTag === "all" ? FLASHQUIZ_LIST : FLASHQUIZ_LIST.filter((q) => q.tag === activeTag);
  }

  function refreshPicker() {
    drawNext = createPicker(pool(), "pg_flashquiz_" + activeTag);
  }

  function updateQuizScoreText() {
    quizScoreText.textContent = "✅ ตอบถูก " + quizCorrect + " จาก " + quizTotal + " ข้อ";
  }

  function judgeQuiz(correct) {
    quizTotal++;
    if (correct) quizCorrect++;
    updateQuizScoreText();
    next();
  }

  quizScoreResetBtn.addEventListener("click", () => {
    quizCorrect = 0;
    quizTotal = 0;
    updateQuizScoreText();
  });

  function renderCard() {
    cardHolder.innerHTML = "";
    const card = document.createElement("div");
    card.className = "trivia-card";
    card.innerHTML =
      '<div class="cat">' + TAG_LABEL[current.tag] + "</div>" +
      '<div class="statement">' + current.question + "</div>" +
      (revealed
        ? '<div class="verdict qa">คำตอบ</div>' +
          '<div class="explain qa-answer">' + current.answer + "</div>" +
          '<div class="fq-judge quiz-judge">' +
            '<button class="btn fq-judge-correct" id="quizCorrectBtn">ตอบถูก ✓</button>' +
            '<button class="btn secondary fq-judge-wrong" id="quizWrongBtn">ตอบผิด ✗</button>' +
          "</div>"
        : '<button class="btn reveal-btn" id="revealBtn">เฉลย!</button>');
    cardHolder.appendChild(card);

    if (!revealed) {
      document.getElementById("revealBtn").addEventListener("click", () => {
        revealed = true;
        renderCard();
      });
    } else {
      document.getElementById("quizCorrectBtn").addEventListener("click", () => judgeQuiz(true));
      document.getElementById("quizWrongBtn").addEventListener("click", () => judgeQuiz(false));
    }
  }

  function next() {
    if (!drawNext) return;
    const item = drawNext();
    if (!item) return;
    current = item;
    revealed = false;
    renderCard();
  }

  nextBtn.addEventListener("click", next);
  filterTags.querySelectorAll(".tag").forEach((tagEl) => {
    tagEl.addEventListener("click", () => {
      filterTags.querySelectorAll(".tag").forEach((t) => t.classList.remove("active"));
      tagEl.classList.add("active");
      activeTag = tagEl.dataset.tag;
      refreshPicker();
      next();
    });
  });

  // ---------- Flash Quiz Battle (2-sided chess clock) ----------
  const battleIntroPanel = document.getElementById("battleIntroPanel");
  const battlePlayPanel = document.getElementById("battlePlayPanel");
  const battleEndPanel = document.getElementById("battleEndPanel");
  const startBattleBtn = document.getElementById("startBattleBtn");

  const battleTurnLabel = document.getElementById("battleTurnLabel");
  const battleEndTitle = document.getElementById("battleEndTitle");
  const battleEndHint = document.getElementById("battleEndHint");
  const battleEndScore = document.getElementById("battleEndScore");
  const resetBattleBtn = document.getElementById("resetBattleBtn");

  const fqDualView = document.getElementById("fqDualView");
  const fqDualViewBtn = document.getElementById("fqDualViewBtn");
  const exitFqDualBtn = document.getElementById("exitFqDualBtn");

  // Side 0 = "ฝั่ง 1" = main clockA + fullscreen bottom half (upright).
  // Side 1 = "ฝั่ง 2" = main clockB + fullscreen top half (rotated 180deg).
  const questionEls = [
    document.getElementById("battleQuestionText"),
    document.getElementById("dualQuestionTop"),
    document.getElementById("dualQuestionBottom")
  ];
  const answerEls = [
    document.getElementById("battleAnswerBox"),
    document.getElementById("dualAnswerTop"),
    document.getElementById("dualAnswerBottom")
  ];
  const revealBtnEls = [
    document.getElementById("revealBattleAnswerBtn"),
    document.getElementById("dualRevealTop"),
    document.getElementById("dualRevealBottom")
  ];
  const judgeRowEls = [
    document.getElementById("battleJudgeRow"),
    document.getElementById("dualJudgeTop"),
    document.getElementById("dualJudgeBottom")
  ];
  const side0TimeEls = [document.getElementById("clockTimeA"), document.getElementById("dualClockTimeBottom")];
  const side1TimeEls = [document.getElementById("clockTimeB"), document.getElementById("dualClockTimeTop")];
  const side0ScoreEls = [document.getElementById("clockScoreA"), document.getElementById("dualClockScoreBottom")];
  const side1ScoreEls = [document.getElementById("clockScoreB"), document.getElementById("dualClockScoreTop")];
  // In fullscreen dual view the whole half-screen is the tap target, not just the clock box.
  const side0ClockEls = [document.getElementById("clockA"), document.getElementById("dualClockBottom"), document.getElementById("dualHalfBottom")];
  const side1ClockEls = [document.getElementById("clockB"), document.getElementById("dualClockTop"), document.getElementById("dualHalfTop")];

  let sides = [{ timeLeft: TIME_BANK_SECONDS, correct: 0 }, { timeLeft: TIME_BANK_SECONDS, correct: 0 }];
  let drawBattleQuestion = createPicker(FLASHQUIZ_LIST, "pg_flashquiz_battle");
  let currentSideIdx = 0;
  let currentBattleQuestion = null;
  let battleTimerInterval = null;
  let battleAnswerRevealed = false;

  function pickBattleQuestion() {
    return drawBattleQuestion();
  }

  function fmtClock(seconds) {
    const s = Math.max(0, Math.ceil(seconds));
    const m = Math.floor(s / 60);
    const rem = s % 60;
    return m + ":" + String(rem).padStart(2, "0");
  }

  function renderClocks() {
    side0TimeEls.forEach((el) => { el.textContent = fmtClock(sides[0].timeLeft); });
    side1TimeEls.forEach((el) => { el.textContent = fmtClock(sides[1].timeLeft); });
    side0ScoreEls.forEach((el) => { el.textContent = "ถูก " + sides[0].correct + " ข้อ"; });
    side1ScoreEls.forEach((el) => { el.textContent = "ถูก " + sides[1].correct + " ข้อ"; });
    side0ClockEls.forEach((el) => {
      el.classList.toggle("active", currentSideIdx === 0);
      el.classList.toggle("low", sides[0].timeLeft <= 10);
    });
    side1ClockEls.forEach((el) => {
      el.classList.toggle("active", currentSideIdx === 1);
      el.classList.toggle("low", sides[1].timeLeft <= 10);
    });
    battleTurnLabel.textContent = "⏱ นาฬิกาฝั่ง " + (currentSideIdx + 1) + " กำลังเดิน — แตะนาฬิกาฝั่งตัวเองเพื่อสลับตา";
  }

  function stopBattleTimer() {
    if (battleTimerInterval) {
      clearInterval(battleTimerInterval);
      battleTimerInterval = null;
    }
  }

  function startBattleTurn() {
    currentBattleQuestion = pickBattleQuestion();
    questionEls.forEach((el) => { el.textContent = currentBattleQuestion.question; });
    answerEls.forEach((el) => { el.style.display = "none"; });
    revealBtnEls.forEach((el) => { el.style.display = ""; });
    judgeRowEls.forEach((el) => { el.style.display = "none"; });
    battleAnswerRevealed = false;
    renderClocks();

    stopBattleTimer();
    battleTimerInterval = setInterval(() => {
      sides[currentSideIdx].timeLeft--;
      renderClocks();
      if (sides[currentSideIdx].timeLeft <= 0) {
        stopBattleTimer();
        vibrateTimeout();
        endBattle(currentSideIdx);
      }
    }, 1000);
  }

  function endBattle(loserIdx) {
    stopBattleTimer();
    const winnerIdx = 1 - loserIdx;
    battlePlayPanel.style.display = "none";
    exitFqDualView();
    battleEndTitle.textContent = "🏆 ฝั่ง " + (winnerIdx + 1) + " ชนะการดวล!";
    battleEndHint.textContent = "เพราะเวลาของฝั่ง " + (loserIdx + 1) + " หมดก่อน";
    battleEndScore.textContent =
      "ฝั่ง 1 ตอบถูก " + sides[0].correct + " ข้อ  •  ฝั่ง 2 ตอบถูก " + sides[1].correct + " ข้อ";
    battleEndPanel.style.display = "";
  }

  function revealBattleAnswer() {
    battleAnswerRevealed = true;
    revealBtnEls.forEach((el) => { el.style.display = "none"; });
    answerEls.forEach((el) => {
      el.innerHTML =
        '<div class="fq-answer-label">คำตอบ</div>' +
        '<div class="fq-answer-num">' + currentBattleQuestion.answer + "</div>";
      el.style.display = "";
    });
    judgeRowEls.forEach((el) => { el.style.display = ""; });
  }

  revealBtnEls.forEach((btn) => btn.addEventListener("click", (e) => {
    e.stopPropagation();
    revealBattleAnswer();
  }));

  function advanceTurn() {
    stopBattleTimer();
    currentSideIdx = 1 - currentSideIdx;
    startBattleTurn();
  }

  function judgeBattleAnswer(correct) {
    if (correct) sides[currentSideIdx].correct++;
    advanceTurn();
  }

  judgeRowEls.forEach((row) => {
    row.querySelector(".fq-judge-correct").addEventListener("click", (e) => {
      e.stopPropagation();
      judgeBattleAnswer(true);
    });
    row.querySelector(".fq-judge-wrong").addEventListener("click", (e) => {
      e.stopPropagation();
      judgeBattleAnswer(false);
    });
  });

  function switchSide(sideIdx) {
    if (sideIdx !== currentSideIdx) return;
    advanceTurn();
  }

  side0ClockEls.forEach((el) => el.addEventListener("click", () => switchSide(0)));
  side1ClockEls.forEach((el) => el.addEventListener("click", () => switchSide(1)));

  startBattleBtn.addEventListener("click", () => {
    sides = [{ timeLeft: TIME_BANK_SECONDS, correct: 0 }, { timeLeft: TIME_BANK_SECONDS, correct: 0 }];
    currentSideIdx = 0;
    drawBattleQuestion = createPicker(FLASHQUIZ_LIST, "pg_flashquiz_battle");
    battleIntroPanel.style.display = "none";
    battleEndPanel.style.display = "none";
    battlePlayPanel.style.display = "";
    startBattleTurn();
  });

  resetBattleBtn.addEventListener("click", () => {
    stopBattleTimer();
    exitFqDualView();
    battlePlayPanel.style.display = "none";
    battleEndPanel.style.display = "none";
    battleIntroPanel.style.display = "";
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

  function enterFqDualView() {
    fqDualView.style.display = "flex";
    document.documentElement.classList.add("tp-no-scroll");
    requestFs(fqDualView);
  }

  function exitFqDualView() {
    if (fqDualView.style.display === "none") return;
    fqDualView.style.display = "none";
    document.documentElement.classList.remove("tp-no-scroll");
    exitFs();
  }

  fqDualViewBtn.addEventListener("click", enterFqDualView);
  exitFqDualBtn.addEventListener("click", exitFqDualView);
  document.addEventListener("fullscreenchange", () => {
    if (!document.fullscreenElement) exitFqDualView();
  });

  // ---------- Mode switch ----------
  modeSwitch.querySelectorAll(".mode-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      const targetMode = btn.dataset.mode;
      modeSwitch.querySelectorAll(".mode-btn").forEach((b) => b.classList.toggle("active", b === btn));

      const isQuiz = targetMode === "quiz";
      rulesQuiz.style.display = isQuiz ? "" : "none";
      rulesBattle.style.display = isQuiz ? "none" : "";
      filterTags.style.display = isQuiz ? "" : "none";
      quizPanel.style.display = isQuiz ? "" : "none";
      battlePanel.style.display = isQuiz ? "none" : "";

      if (isQuiz) {
        stopBattleTimer();
        exitFqDualView();
      }
    });
  });

  refreshPicker();
  next();
});
