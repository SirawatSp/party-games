document.addEventListener("DOMContentLoaded", () => {
  const questionText = document.getElementById("questionText");
  const nextQuestionBtn = document.getElementById("nextQuestionBtn");

  let usedIndexes = [];

  function pickQuestion() {
    if (usedIndexes.length >= PERSONAL_FACTS.length) usedIndexes = [];
    let idx;
    do {
      idx = Math.floor(Math.random() * PERSONAL_FACTS.length);
    } while (usedIndexes.includes(idx));
    usedIndexes.push(idx);
    return PERSONAL_FACTS[idx];
  }

  function showQuestion() {
    const q = pickQuestion();
    questionText.textContent = q.question + (q.unit ? " (หน่วย: " + q.unit + ")" : "");
  }

  nextQuestionBtn.addEventListener("click", showQuestion);

  showQuestion();
});
