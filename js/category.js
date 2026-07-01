document.addEventListener("DOMContentLoaded", () => {
  const catText = document.getElementById("catText");
  const newCatBtn = document.getElementById("newCatBtn");
  const catList = document.getElementById("catList");
  const catCount = document.getElementById("catCount");

  let lastIndex = -1;

  function pickCategory() {
    let idx;
    do {
      idx = Math.floor(Math.random() * CATEGORIES.length);
    } while (CATEGORIES.length > 1 && idx === lastIndex);
    lastIndex = idx;
    catText.textContent = CATEGORIES[idx];
  }

  newCatBtn.addEventListener("click", pickCategory);

  catCount.textContent = CATEGORIES.length;
  CATEGORIES.forEach((c) => {
    const span = document.createElement("span");
    span.className = "tag";
    span.textContent = c;
    span.addEventListener("click", () => { catText.textContent = c; });
    catList.appendChild(span);
  });

  // ---------- countdown timer ----------
  const timerNum = document.getElementById("timerNum");
  const timerFg = document.getElementById("timerFg");
  const startBtn = document.getElementById("startTimerBtn");
  const CIRC = 326.7;
  let duration = 5;
  let remaining = duration;
  let tickHandle = null;

  function renderTime() {
    timerNum.textContent = "0:" + String(remaining).padStart(2, "0");
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
