document.addEventListener("DOMContentLoaded", () => {
  const setupPanel = document.getElementById("setupPanel");
  const guessPanel = document.getElementById("guessPanel");
  const passPanel = document.getElementById("passPanel");
  const revealPanel = document.getElementById("revealPanel");

  const playerNameInput = document.getElementById("playerNameInput");
  const addPlayerBtn = document.getElementById("addPlayerBtn");
  const playerChips = document.getElementById("playerChips");
  const startGameBtn = document.getElementById("startGameBtn");
  const setupError = document.getElementById("setupError");

  const questionText = document.getElementById("questionText");
  const turnLabel = document.getElementById("turnLabel");
  const guessInput = document.getElementById("guessInput");
  const lockGuessBtn = document.getElementById("lockGuessBtn");

  const passNextName = document.getElementById("passNextName");
  const readyBtn = document.getElementById("readyBtn");
  const revealBtn = document.getElementById("revealBtn");
  const progressDots = document.getElementById("progressDots");

  const resultList = document.getElementById("resultList");
  const answerBox = document.getElementById("answerBox");
  const nextQuestionBtn = document.getElementById("nextQuestionBtn");
  const resetPlayersBtn = document.getElementById("resetPlayersBtn");

  let players = [];
  let usedIndexes = [];
  let currentQuestion = null;
  let turnIndex = 0;
  let guesses = [];

  function renderChips() {
    playerChips.innerHTML = "";
    players.forEach((name, i) => {
      const chip = document.createElement("span");
      chip.className = "gn-chip";
      chip.innerHTML = name + ' <button aria-label="ลบ">×</button>';
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
    if (players.includes(name)) {
      setupError.textContent = "มีชื่อนี้ในวงแล้ว ลองชื่ออื่นดูนะ";
      return;
    }
    setupError.textContent = "";
    players.push(name);
    playerNameInput.value = "";
    playerNameInput.focus();
    renderChips();
  }

  addPlayerBtn.addEventListener("click", addPlayer);
  playerNameInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") { e.preventDefault(); addPlayer(); }
  });

  function pickQuestion() {
    if (usedIndexes.length >= GUESS_NUMBER_LIST.length) usedIndexes = [];
    let idx;
    do {
      idx = Math.floor(Math.random() * GUESS_NUMBER_LIST.length);
    } while (usedIndexes.includes(idx));
    usedIndexes.push(idx);
    return GUESS_NUMBER_LIST[idx];
  }

  function renderProgress() {
    progressDots.innerHTML = "";
    players.forEach((name, i) => {
      const dot = document.createElement("span");
      dot.className = "gn-dot" + (i < turnIndex ? " done" : i === turnIndex ? " active" : "");
      dot.textContent = name;
      progressDots.appendChild(dot);
    });
  }

  function showGuessScreen() {
    passPanel.style.display = "none";
    guessPanel.style.display = "";
    revealPanel.style.display = "none";
    questionText.textContent = currentQuestion.question;
    turnLabel.textContent = "ตาของ " + players[turnIndex];
    guessInput.value = "";
    renderProgress();
    setTimeout(() => guessInput.focus(), 50);
  }

  function showPassScreen(nextName) {
    guessPanel.style.display = "none";
    passPanel.style.display = "";
    passNextName.textContent = nextName;
  }

  function startRound() {
    currentQuestion = pickQuestion();
    turnIndex = 0;
    guesses = [];
    setupPanel.style.display = "none";
    revealPanel.style.display = "none";
    showGuessScreen();
  }

  startGameBtn.addEventListener("click", () => {
    if (players.length < 2) return;
    startRound();
  });

  function lockGuess() {
    const val = parseFloat(guessInput.value);
    if (isNaN(val)) {
      guessInput.focus();
      return;
    }
    guesses.push({ name: players[turnIndex], value: val });
    turnIndex++;
    if (turnIndex >= players.length) {
      renderProgress();
      revealAll();
    } else {
      showPassScreen(players[turnIndex]);
    }
  }

  lockGuessBtn.addEventListener("click", lockGuess);
  guessInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") { e.preventDefault(); lockGuess(); }
  });

  readyBtn.addEventListener("click", showGuessScreen);

  function fmtNum(n) {
    return Number(n).toLocaleString("th-TH", { maximumFractionDigits: 3 });
  }

  function revealAll() {
    passPanel.style.display = "none";
    guessPanel.style.display = "none";
    revealPanel.style.display = "";

    const sorted = guesses.slice().sort((a, b) => a.value - b.value);
    let winnerName = sorted[0].name;
    let bestDiff = Infinity;
    sorted.forEach((g) => {
      const diff = Math.abs(g.value - currentQuestion.answer);
      if (diff < bestDiff) { bestDiff = diff; winnerName = g.name; }
    });

    resultList.innerHTML = "";
    sorted.forEach((g) => {
      const row = document.createElement("div");
      row.className = "gn-row" + (g.name === winnerName ? " winner" : "");
      row.innerHTML =
        '<span class="gn-row-name">' + (g.name === winnerName ? "🏆 " : "") + g.name + "</span>" +
        '<span class="gn-row-val">' + fmtNum(g.value) + (currentQuestion.unit ? " " + currentQuestion.unit : "") + "</span>";
      resultList.appendChild(row);
    });

    answerBox.innerHTML =
      '<div class="gn-answer-label">คำตอบจริง</div>' +
      '<div class="gn-answer-num">' + fmtNum(currentQuestion.answer) + (currentQuestion.unit ? " " + currentQuestion.unit : "") + "</div>" +
      (currentQuestion.explain ? '<div class="gn-explain">' + currentQuestion.explain + "</div>" : "");
  }

  nextQuestionBtn.addEventListener("click", startRound);

  resetPlayersBtn.addEventListener("click", () => {
    players = [];
    usedIndexes = [];
    renderChips();
    revealPanel.style.display = "none";
    guessPanel.style.display = "none";
    passPanel.style.display = "none";
    setupPanel.style.display = "";
  });

  renderChips();
});
