document.addEventListener("DOMContentLoaded", () => {
  const guessPanel = document.getElementById("guessPanel");
  const revealPanel = document.getElementById("revealPanel");

  const questionText = document.getElementById("questionText");
  const revealQuestionText = document.getElementById("revealQuestionText");
  const revealBtn = document.getElementById("revealBtn");
  const answerBox = document.getElementById("answerBox");
  const nextQuestionBtn = document.getElementById("nextQuestionBtn");

  let currentQuestion = null;
  const pickQuestion = createPicker(GUESS_NUMBER_LIST);

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
