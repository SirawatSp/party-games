document.addEventListener("DOMContentLoaded", () => {
  const guessPanel = document.getElementById("guessPanel");
  const revealPanel = document.getElementById("revealPanel");

  const questionText = document.getElementById("questionText");
  const revealQuestionText = document.getElementById("revealQuestionText");
  const revealBtn = document.getElementById("revealBtn");
  const answerBox = document.getElementById("answerBox");
  const nextQuestionBtn = document.getElementById("nextQuestionBtn");

  let usedIndexes = [];
  let currentQuestion = null;

  function pickQuestion() {
    if (usedIndexes.length >= GUESS_NUMBER_LIST.length) usedIndexes = [];
    let idx;
    do {
      idx = Math.floor(Math.random() * GUESS_NUMBER_LIST.length);
    } while (usedIndexes.includes(idx));
    usedIndexes.push(idx);
    return GUESS_NUMBER_LIST[idx];
  }

  function fmtNum(n) {
    return Number(n).toLocaleString("th-TH", { maximumFractionDigits: 3 });
  }

  function showQuestion() {
    currentQuestion = pickQuestion();
    questionText.textContent = currentQuestion.question;
    revealPanel.style.display = "none";
    guessPanel.style.display = "";
  }

  function reveal() {
    revealQuestionText.textContent = currentQuestion.question;
    answerBox.innerHTML =
      '<div class="gn-answer-label">คำตอบจริง</div>' +
      '<div class="gn-answer-num">' + fmtNum(currentQuestion.answer) + (currentQuestion.unit ? " " + currentQuestion.unit : "") + "</div>" +
      (currentQuestion.explain ? '<div class="gn-explain">' + currentQuestion.explain + "</div>" : "");
    guessPanel.style.display = "none";
    revealPanel.style.display = "";
  }

  revealBtn.addEventListener("click", reveal);
  nextQuestionBtn.addEventListener("click", showQuestion);

  showQuestion();
});
