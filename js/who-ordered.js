document.addEventListener("DOMContentLoaded", () => {
  const entryPanel = document.getElementById("entryPanel");
  const passPanel = document.getElementById("passPanel");
  const revealPanel = document.getElementById("revealPanel");

  const entryCount = document.getElementById("entryCount");
  const nameInput = document.getElementById("nameInput");
  const dishInput = document.getElementById("dishInput");
  const saveEntryBtn = document.getElementById("saveEntryBtn");

  const passCount = document.getElementById("passCount");
  const nextPersonBtn = document.getElementById("nextPersonBtn");
  const startServeBtn = document.getElementById("startServeBtn");

  const dishGrid = document.getElementById("dishGrid");
  const doneHint = document.getElementById("doneHint");
  const resetBtn = document.getElementById("resetBtn");

  let entries = [];
  let serveQueue = [];
  let revealedCount = 0;

  function showEntryForm() {
    entryCount.textContent = entries.length + 1;
    nameInput.value = "";
    dishInput.value = "";
    passPanel.style.display = "none";
    revealPanel.style.display = "none";
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

  function renderGrid() {
    dishGrid.innerHTML = "";
    serveQueue.forEach((entry, i) => {
      const card = document.createElement("button");
      card.type = "button";
      card.className = "wo-card";
      card.innerHTML =
        '<div class="wo-card-dish">' + entry.dish + "</div>" +
        '<div class="wo-card-hint">แตะเพื่อเฉลย</div>';
      card.addEventListener("click", () => revealCard(i, card));
      dishGrid.appendChild(card);
    });
  }

  function revealCard(i, card) {
    if (card.classList.contains("revealed")) return;
    card.classList.add("revealed");
    card.innerHTML =
      '<div class="wo-card-dish">' + serveQueue[i].dish + "</div>" +
      '<div class="wo-card-name">' + serveQueue[i].name + "</div>";
    revealedCount++;
    doneHint.style.display = revealedCount >= serveQueue.length ? "" : "none";
  }

  function startServe() {
    if (entries.length < 2) return;
    serveQueue = shuffle(entries);
    revealedCount = 0;
    doneHint.style.display = "none";
    passPanel.style.display = "none";
    revealPanel.style.display = "";
    renderGrid();
  }

  startServeBtn.addEventListener("click", startServe);

  resetBtn.addEventListener("click", () => {
    entries = [];
    serveQueue = [];
    revealedCount = 0;
    showEntryForm();
  });

  showEntryForm();
});
