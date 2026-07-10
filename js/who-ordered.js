document.addEventListener("DOMContentLoaded", () => {
  const entryPanel = document.getElementById("entryPanel");
  const passPanel = document.getElementById("passPanel");
  const revealPanel = document.getElementById("revealPanel");
  const donePanel = document.getElementById("donePanel");

  const entryCount = document.getElementById("entryCount");
  const nameInput = document.getElementById("nameInput");
  const dishInput = document.getElementById("dishInput");
  const saveEntryBtn = document.getElementById("saveEntryBtn");

  const passCount = document.getElementById("passCount");
  const nextPersonBtn = document.getElementById("nextPersonBtn");
  const startServeBtn = document.getElementById("startServeBtn");

  const dishText = document.getElementById("dishText");
  const answerBox = document.getElementById("answerBox");
  const revealNameBtn = document.getElementById("revealNameBtn");
  const nextDishBtn = document.getElementById("nextDishBtn");

  const resetBtn = document.getElementById("resetBtn");

  let entries = [];
  let serveQueue = [];
  let serveIndex = 0;

  function showEntryForm() {
    entryCount.textContent = entries.length + 1;
    nameInput.value = "";
    dishInput.value = "";
    passPanel.style.display = "none";
    donePanel.style.display = "none";
    entryPanel.style.display = "";
    setTimeout(() => nameInput.focus(), 50);
  }

  function saveEntry() {
    const name = nameInput.value.trim();
    const dish = dishInput.value.trim();
    if (!name || !dish) {
      (name ? dishInput : nameInput).focus();
      return;
    }
    entries.push({ name, dish });
    entryPanel.style.display = "none";
    passPanel.style.display = "";
    passCount.textContent = "ตอนนี้มี " + entries.length + " คนแล้ว";
    startServeBtn.disabled = entries.length < 2;
  }

  saveEntryBtn.addEventListener("click", saveEntry);
  [nameInput, dishInput].forEach((el) => {
    el.addEventListener("keydown", (e) => {
      if (e.key !== "Enter") return;
      e.preventDefault();
      if (el === nameInput) dishInput.focus();
      else saveEntry();
    });
  });

  nextPersonBtn.addEventListener("click", showEntryForm);

  function shuffle(arr) {
    const copy = arr.slice();
    for (let i = copy.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    return copy;
  }

  function showDish() {
    const current = serveQueue[serveIndex];
    dishText.textContent = current.dish;
    answerBox.style.display = "none";
    revealNameBtn.style.display = "";
    nextDishBtn.style.display = "none";
  }

  function startServe() {
    if (entries.length < 2) return;
    serveQueue = shuffle(entries);
    serveIndex = 0;
    passPanel.style.display = "none";
    revealPanel.style.display = "";
    showDish();
  }

  startServeBtn.addEventListener("click", startServe);

  function revealName() {
    const current = serveQueue[serveIndex];
    answerBox.innerHTML =
      '<div class="gn-answer-label">คนสั่งคือ</div>' +
      '<div class="gn-answer-num" style="color:var(--gold);">' + current.name + "</div>";
    answerBox.style.display = "";
    revealNameBtn.style.display = "none";
    nextDishBtn.style.display = "";
  }

  revealNameBtn.addEventListener("click", revealName);

  function nextDish() {
    serveIndex++;
    if (serveIndex >= serveQueue.length) {
      revealPanel.style.display = "none";
      donePanel.style.display = "";
    } else {
      showDish();
    }
  }

  nextDishBtn.addEventListener("click", nextDish);

  resetBtn.addEventListener("click", () => {
    entries = [];
    serveQueue = [];
    serveIndex = 0;
    showEntryForm();
  });

  showEntryForm();
});
