document.addEventListener("DOMContentLoaded", () => {
  const promptText = document.getElementById("promptText");
  const nextPromptBtn = document.getElementById("nextPromptBtn");

  let usedIndexes = [];

  function pickPrompt() {
    if (usedIndexes.length >= WHO_IS_MOST.length) usedIndexes = [];
    let idx;
    do {
      idx = Math.floor(Math.random() * WHO_IS_MOST.length);
    } while (usedIndexes.includes(idx));
    usedIndexes.push(idx);
    return WHO_IS_MOST[idx];
  }

  function showPrompt() {
    promptText.textContent = pickPrompt().prompt;
  }

  nextPromptBtn.addEventListener("click", showPrompt);

  showPrompt();
});
