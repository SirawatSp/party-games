document.addEventListener("DOMContentLoaded", () => {
  const levelTags = document.getElementById("levelTags");
  const cardHolder = document.getElementById("psyCardHolder");
  const nextBtn = document.getElementById("psyNextBtn");
  const timerBtn = document.getElementById("psyTimerBtn");

  const LEVEL_LABEL = { light: "เบา ๆ", medium: "กลาง ๆ", deep: "ลึกซึ้ง" };
  const LEVEL_COLOR = { light: "var(--mint)", medium: "var(--amber)", deep: "var(--rose)" };
  const TIMER_SECONDS = 60;

  let activeLevel = "all";
  let lastIndex = -1;
  let current = null;
  let timerInterval = null;
  let timerLeft = TIMER_SECONDS;

  function pool() {
    return activeLevel === "all" ? PSYCHOLOGY_LIST : PSYCHOLOGY_LIST.filter((q) => q.level === activeLevel);
  }

  function stopTimer() {
    if (timerInterval) {
      clearInterval(timerInterval);
      timerInterval = null;
    }
    timerBtn.textContent = "จับเวลา 60 วิ ⏱";
    timerBtn.classList.remove("timer-running");
  }

  function renderCard() {
    cardHolder.innerHTML = "";
    const card = document.createElement("div");
    card.className = "trivia-card";
    card.innerHTML =
      '<div class="cat" style="color:' + LEVEL_COLOR[current.level] + ';">' +
        LEVEL_LABEL[current.level] + " · " + current.theme +
      "</div>" +
      '<div class="statement">' + current.question + "</div>";
    cardHolder.appendChild(card);
  }

  function next() {
    stopTimer();
    const list = pool();
    if (!list.length) return;
    let idx;
    do {
      idx = Math.floor(Math.random() * list.length);
    } while (list.length > 1 && idx === lastIndex);
    lastIndex = idx;
    current = list[idx];
    renderCard();
  }

  nextBtn.addEventListener("click", next);

  levelTags.querySelectorAll(".tag").forEach((tagEl) => {
    tagEl.addEventListener("click", () => {
      levelTags.querySelectorAll(".tag").forEach((t) => t.classList.remove("active"));
      tagEl.classList.add("active");
      activeLevel = tagEl.dataset.level;
      lastIndex = -1;
      next();
    });
  });

  timerBtn.addEventListener("click", () => {
    if (timerInterval) {
      stopTimer();
      return;
    }
    timerLeft = TIMER_SECONDS;
    timerBtn.textContent = timerLeft + " วินาที ⏱";
    timerBtn.classList.add("timer-running");
    timerInterval = setInterval(() => {
      timerLeft--;
      if (timerLeft <= 0) {
        timerBtn.textContent = "หมดเวลา! ⏱";
        setTimeout(stopTimer, 1200);
        clearInterval(timerInterval);
        timerInterval = null;
        return;
      }
      timerBtn.textContent = timerLeft + " วินาที ⏱";
    }, 1000);
  });

  next();
});
