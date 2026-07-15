document.addEventListener("DOMContentLoaded", () => {
  const promptText = document.getElementById("promptText");
  const nextPromptBtn = document.getElementById("nextPromptBtn");

  const pickPrompt = createPicker(WHO_IS_MOST);

  function showPrompt() {
    promptText.textContent = pickPrompt().prompt;
  }

  nextPromptBtn.addEventListener("click", showPrompt);

  showPrompt();
});
