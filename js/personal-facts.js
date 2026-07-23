document.addEventListener("DOMContentLoaded", () => {
  const questionText = document.getElementById("questionText");
  const nextQuestionBtn = document.getElementById("nextQuestionBtn");

  const pickQuestion = createPicker(PERSONAL_FACTS, "pg_personalfacts");

  function showQuestion() {
    const q = pickQuestion();
    questionText.textContent = q.question + (q.unit ? " (หน่วย: " + q.unit + ")" : "");
  }

  nextQuestionBtn.addEventListener("click", showQuestion);

  showQuestion();
});
