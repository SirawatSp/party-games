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
  const TURN_SECONDS = 7;
  const SCORE_TO_WIN = 10;

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

  const battleScoreboard = document.getElementById("battleScoreboard");
  const battleTurnLabel = document.getElementById("battleTurnLabel");
  const battleTimer = document.getElementById("battleTimer");
  const battleQuestionText = document.getElementById("battleQuestionText");
  const battleAnswerBox = document.getElementById("battleAnswerBox");
  const revealBattleAnswerBtn = document.getElementById("revealBattleAnswerBtn");
  const correctBtn = document.getElementById("correctBtn");
  const wrongBtn = document.getElementById("wrongBtn");

  const battleEndTitle = document.getElementById("battleEndTitle");
  const resetBattleBtn = document.getElementById("resetBattleBtn");

  let teams = [];
  let usedBattleIndexes = [];
  let currentTeamIdx = 0;
  let currentBattleQuestion = null;
  let battleSecondsLeft = TURN_SECONDS;
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
    startBattleBtn.disabled = teams.length < 2;
  }

  function addTeam() {
    const name = teamNameInput.value.trim();
    if (!name) return;
    if (teams.some((t) => t.name === name)) {
      battleSetupError.textContent = "มีชื่อนี้แล้ว ลองชื่ออื่นดูนะ";
      return;
    }
    battleSetupError.textContent = "";
    teams.push({ name, score: 0 });
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

  function renderBattleScoreboard() {
    battleScoreboard.innerHTML = "";
    teams.forEach((t, i) => {
      const row = document.createElement("div");
      row.className = "fq-score-row" + (i === currentTeamIdx ? " current" : "");
      row.innerHTML =
        '<span class="fq-score-name">' + t.name + "</span>" +
        '<span class="fq-score-num">' + t.score + "</span>";
      battleScoreboard.appendChild(row);
    });
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
    battleTurnLabel.textContent = "ตาของ " + teams[currentTeamIdx].name;
    renderBattleScoreboard();

    battleSecondsLeft = TURN_SECONDS;
    battleTimer.textContent = battleSecondsLeft;
    battleTimer.classList.remove("low");
    stopBattleTimer();
    battleTimerInterval = setInterval(() => {
      battleSecondsLeft--;
      battleTimer.textContent = battleSecondsLeft;
      if (battleSecondsLeft <= 2) battleTimer.classList.add("low");
      if (battleSecondsLeft <= 0) {
        stopBattleTimer();
        revealBattleAnswer();
      }
    }, 1000);
  }

  function revealBattleAnswer() {
    stopBattleTimer();
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
    if (wasCorrect) teams[currentTeamIdx].score++;

    const champion = teams.find((t) => t.score >= SCORE_TO_WIN);
    if (champion) {
      battlePlayPanel.style.display = "none";
      battleEndTitle.textContent = "🏆 " + champion.name + " ชนะการดวล!";
      battleEndPanel.style.display = "";
      return;
    }

    currentTeamIdx = (currentTeamIdx + 1) % teams.length;
    startBattleTurn();
  }

  correctBtn.addEventListener("click", () => afterJudged(true));
  wrongBtn.addEventListener("click", () => afterJudged(false));

  startBattleBtn.addEventListener("click", () => {
    if (teams.length < 2) return;
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
