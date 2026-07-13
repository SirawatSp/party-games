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

  let activeTag = "all";
  let lastIndex = -1;
  let current = null;
  let revealed = false;

  function pool() {
    return activeTag === "all" ? FLASHQUIZ_LIST : FLASHQUIZ_LIST.filter((q) => q.tag === activeTag);
  }

  function renderCard() {
    cardHolder.innerHTML = "";
    const card = document.createElement("div");
    card.className = "trivia-card";
    card.innerHTML =
      '<div class="cat">' + TAG_LABEL[current.tag] + "</div>" +
      '<div class="statement">' + current.question + "</div>" +
      (revealed
        ? '<div class="verdict qa">คำตอบ</div>' +
          '<div class="explain qa-answer">' + current.answer + "</div>"
        : '<button class="btn reveal-btn" id="revealBtn">เฉลย!</button>');
    cardHolder.appendChild(card);

    if (!revealed) {
      document.getElementById("revealBtn").addEventListener("click", () => {
        revealed = true;
        renderCard();
      });
    }
  }

  function next() {
    const list = pool();
    if (!list.length) return;
    let idx;
    do {
      idx = Math.floor(Math.random() * list.length);
    } while (list.length > 1 && idx === lastIndex);
    lastIndex = idx;
    current = list[idx];
    revealed = false;
    renderCard();
  }

  nextBtn.addEventListener("click", next);
  filterTags.querySelectorAll(".tag").forEach((tagEl) => {
    tagEl.addEventListener("click", () => {
      filterTags.querySelectorAll(".tag").forEach((t) => t.classList.remove("active"));
      tagEl.classList.add("active");
      activeTag = tagEl.dataset.tag;
      lastIndex = -1;
      next();
    });
  });

  // ---------- Flash Quiz Battle (turn-based team race) ----------
  const battleSetupPanel = document.getElementById("battleSetupPanel");
  const battlePlayPanel = document.getElementById("battlePlayPanel");
  const battleEndPanel = document.getElementById("battleEndPanel");

  const teamNameInput = document.getElementById("teamNameInput");
  const addTeamBtn = document.getElementById("addTeamBtn");
  const teamChips = document.getElementById("teamChips");
  const startBattleBtn = document.getElementById("startBattleBtn");
  const battleSetupError = document.getElementById("battleSetupError");

  const battleTurnLabel = document.getElementById("battleTurnLabel");
  const battleQuestionText = document.getElementById("battleQuestionText");
  const battleAnswerBox = document.getElementById("battleAnswerBox");
  const revealBattleAnswerBtn = document.getElementById("revealBattleAnswerBtn");
  const correctBtn = document.getElementById("correctBtn");
  const wrongBtn = document.getElementById("wrongBtn");

  const clockNameA = document.getElementById("clockNameA");
  const clockTimeA = document.getElementById("clockTimeA");
  const clockScoreA = document.getElementById("clockScoreA");
  const clockA = document.getElementById("clockA");
  const clockNameB = document.getElementById("clockNameB");
  const clockTimeB = document.getElementById("clockTimeB");
  const clockScoreB = document.getElementById("clockScoreB");
  const clockB = document.getElementById("clockB");

  const battleEndTitle = document.getElementById("battleEndTitle");
  const battleEndHint = document.getElementById("battleEndHint");
  const resetBattleBtn = document.getElementById("resetBattleBtn");

  let teams = [];
  let usedBattleIndexes = [];
  let currentTeamIdx = 0;
  let currentBattleQuestion = null;
  let battleTimerInterval = null;

  function renderTeamChips() {
    teamChips.innerHTML = "";
    teams.forEach((t, i) => {
      const chip = document.createElement("span");
      chip.className = "fq-chip";
      chip.innerHTML = t.name + ' <button aria-label="ลบ">×</button>';
      chip.querySelector("button").addEventListener("click", () => {
        teams.splice(i, 1);
        renderTeamChips();
      });
      teamChips.appendChild(chip);
    });
    startBattleBtn.disabled = teams.length !== 2;
  }

  function addTeam() {
    const name = teamNameInput.value.trim();
    if (!name) return;
    if (teams.length >= 2) {
      battleSetupError.textContent = "ครบ 2 ฝั่งแล้ว ลบออกก่อนถ้าจะเปลี่ยน";
      return;
    }
    if (teams.some((t) => t.name === name)) {
      battleSetupError.textContent = "มีชื่อนี้แล้ว ลองชื่ออื่นดูนะ";
      return;
    }
    battleSetupError.textContent = "";
    teams.push({ name, score: 0, timeLeft: TIME_BANK_SECONDS });
    teamNameInput.value = "";
    teamNameInput.focus();
    renderTeamChips();
  }

  addTeamBtn.addEventListener("click", addTeam);
  teamNameInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") { e.preventDefault(); addTeam(); }
  });

  function pickBattleQuestion() {
    if (usedBattleIndexes.length >= FLASHQUIZ_LIST.length) usedBattleIndexes = [];
    let idx;
    do {
      idx = Math.floor(Math.random() * FLASHQUIZ_LIST.length);
    } while (usedBattleIndexes.includes(idx));
    usedBattleIndexes.push(idx);
    return FLASHQUIZ_LIST[idx];
  }

  function fmtClock(seconds) {
    const s = Math.max(0, Math.ceil(seconds));
    const m = Math.floor(s / 60);
    const rem = s % 60;
    return m + ":" + String(rem).padStart(2, "0");
  }

  function renderClocks() {
    const [a, b] = teams;
    clockNameA.textContent = a.name;
    clockTimeA.textContent = fmtClock(a.timeLeft);
    clockScoreA.textContent = "ถูก " + a.score + " ข้อ";
    clockNameB.textContent = b.name;
    clockTimeB.textContent = fmtClock(b.timeLeft);
    clockScoreB.textContent = "ถูก " + b.score + " ข้อ";

    clockA.classList.toggle("active", currentTeamIdx === 0);
    clockB.classList.toggle("active", currentTeamIdx === 1);
    clockA.classList.toggle("low", a.timeLeft <= 10);
    clockB.classList.toggle("low", b.timeLeft <= 10);
  }

  function stopBattleTimer() {
    if (battleTimerInterval) {
      clearInterval(battleTimerInterval);
      battleTimerInterval = null;
    }
  }

  function startBattleTurn() {
    currentBattleQuestion = pickBattleQuestion();
    battleQuestionText.textContent = currentBattleQuestion.question;
    battleAnswerBox.style.display = "none";
    revealBattleAnswerBtn.style.display = "";
    correctBtn.style.display = "none";
    wrongBtn.style.display = "none";
    battleTurnLabel.textContent = "⏱ นาฬิกาฝั่ง " + teams[currentTeamIdx].name + " กำลังเดิน";
    renderClocks();

    stopBattleTimer();
    battleTimerInterval = setInterval(() => {
      teams[currentTeamIdx].timeLeft--;
      renderClocks();
      if (teams[currentTeamIdx].timeLeft <= 0) {
        stopBattleTimer();
        endBattle(currentTeamIdx);
      }
    }, 1000);
  }

  function endBattle(loserIdx) {
    stopBattleTimer();
    const loser = teams[loserIdx];
    const winner = teams[1 - loserIdx];
    battlePlayPanel.style.display = "none";
    battleEndTitle.textContent = "🏆 " + winner.name + " ชนะการดวล!";
    battleEndHint.textContent = "เพราะเวลาของฝั่ง " + loser.name + " หมดก่อน";
    battleEndPanel.style.display = "";
  }

  function revealBattleAnswer() {
    battleAnswerBox.innerHTML =
      '<div class="fq-answer-label">คำตอบ</div>' +
      '<div class="fq-answer-num">' + currentBattleQuestion.answer + "</div>";
    battleAnswerBox.style.display = "";
    revealBattleAnswerBtn.style.display = "none";
    correctBtn.style.display = "";
    wrongBtn.style.display = "";
  }

  revealBattleAnswerBtn.addEventListener("click", revealBattleAnswer);

  function afterJudged(wasCorrect) {
    stopBattleTimer();
    if (wasCorrect) teams[currentTeamIdx].score++;
    currentTeamIdx = 1 - currentTeamIdx;
    startBattleTurn();
  }

  correctBtn.addEventListener("click", () => afterJudged(true));
  wrongBtn.addEventListener("click", () => afterJudged(false));

  startBattleBtn.addEventListener("click", () => {
    if (teams.length !== 2) return;
    teams.forEach((t) => { t.timeLeft = TIME_BANK_SECONDS; t.score = 0; });
    currentTeamIdx = 0;
    usedBattleIndexes = [];
    battleSetupPanel.style.display = "none";
    battleEndPanel.style.display = "none";
    battlePlayPanel.style.display = "";
    startBattleTurn();
  });

  resetBattleBtn.addEventListener("click", () => {
    stopBattleTimer();
    teams = [];
    renderTeamChips();
    battlePlayPanel.style.display = "none";
    battleEndPanel.style.display = "none";
    battleSetupPanel.style.display = "";
  });

  renderTeamChips();

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

      if (!isQuiz) stopBattleTimer();
    });
  });

  next();
});
