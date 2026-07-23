document.addEventListener("DOMContentLoaded", () => {
  const stage = document.getElementById("stage");
  const tapHint = document.getElementById("tapHint");
  const catEl = document.getElementById("wordCategory");
  const wordEl = document.getElementById("wordText");
  const newWordBtn = document.getElementById("newWordBtn");
  const hideBtn = document.getElementById("hideBtn");

  let current = null;
  const drawWord = createPicker(INSIDER_WORDS, "pg_insider");

  function pickWord() {
    current = drawWord();
    catEl.textContent = "หมวด: " + current.category;
    wordEl.textContent = current.word;
  }

  function reveal() {
    if (!current) pickWord();
    stage.classList.remove("blur");
  }

  function hide() {
    stage.classList.add("blur");
  }

  tapHint.addEventListener("click", reveal);
  newWordBtn.addEventListener("click", () => {
    pickWord();
    stage.classList.remove("blur");
  });
  hideBtn.addEventListener("click", hide);

  // ---------- countdown timer ----------
  const timerNum = document.getElementById("timerNum");
  const timerFg = document.getElementById("timerFg");
  const startBtn = document.getElementById("startTimerBtn");
  const CIRC = 326.7;
  let duration = 180;
  let remaining = duration;
  let tickHandle = null;

  function renderTime() {
    const m = Math.floor(remaining / 60);
    const s = remaining % 60;
    timerNum.textContent = m + ":" + String(s).padStart(2, "0");
    const frac = remaining / duration;
    timerFg.setAttribute("stroke-dashoffset", String(CIRC * (1 - frac)));
  }

  document.querySelectorAll("[data-sec]").forEach((btn) => {
    btn.addEventListener("click", () => {
      clearInterval(tickHandle);
      duration = Number(btn.dataset.sec);
      remaining = duration;
      renderTime();
    });
  });

  startBtn.addEventListener("click", () => {
    clearInterval(tickHandle);
    remaining = duration;
    renderTime();
    tickHandle = setInterval(() => {
      remaining--;
      if (remaining <= 0) {
        remaining = 0;
        renderTime();
        clearInterval(tickHandle);
        timerNum.textContent = "หมดเวลา!";
      } else {
        renderTime();
      }
    }, 1000);
  });

  renderTime();
});
