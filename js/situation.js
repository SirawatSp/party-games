document.addEventListener("DOMContentLoaded", () => {
  const tags = document.getElementById("situationTags");
  const categoryEl = document.getElementById("situationCategory");
  const caseEl = document.getElementById("situationCase");
  const textEl = document.getElementById("situationText");
  const card = document.getElementById("situationCard");
  const nextBtn = document.getElementById("situationNextBtn");
  const timerBtn = document.getElementById("situationTimerBtn");

  const CAT_LABEL = {
    circle: "เลือกคนในวง", work: "ที่ทำงาน", event: "ออกงาน", travel: "เดินทาง",
    emergency: "เหตุฉุกเฉิน", money: "เงินและของมีค่า", family: "ครอบครัว",
    digital: "โลกออนไลน์", everyday: "ชีวิตประจำวัน", wild: "เหนือความคาดหมาย"
  };
  const TIMER_SECONDS = 30;
  let activeCat = "all";
  let drawNext = null;
  let timer = null;
  let timeLeft = TIMER_SECONDS;

  function currentPool() {
    return activeCat === "all" ? SITUATION_LIST : SITUATION_LIST.filter((item) => item.cat === activeCat);
  }

  function refreshPicker() {
    drawNext = createPicker(currentPool(), "pg_situation_" + activeCat);
  }

  function stopTimer() {
    if (timer) clearInterval(timer);
    timer = null;
    timerBtn.textContent = "คิด 30 วิ ⏱";
    timerBtn.classList.remove("timer-running");
  }

  function showNext() {
    stopTimer();
    const item = drawNext && drawNext();
    if (!item) return;
    const index = SITUATION_LIST.indexOf(item) + 1;
    categoryEl.textContent = CAT_LABEL[item.cat];
    caseEl.textContent = "CASE " + String(index).padStart(3, "0");
    textEl.textContent = item.scenario;
    card.classList.remove("situation-pop");
    void card.offsetWidth;
    card.classList.add("situation-pop");
  }

  tags.querySelectorAll(".tag").forEach((tag) => {
    tag.addEventListener("click", () => {
      tags.querySelectorAll(".tag").forEach((item) => item.classList.remove("active"));
      tag.classList.add("active");
      activeCat = tag.dataset.cat;
      refreshPicker();
      showNext();
    });
  });

  nextBtn.addEventListener("click", showNext);
  timerBtn.addEventListener("click", () => {
    if (timer) {
      stopTimer();
      return;
    }
    timeLeft = TIMER_SECONDS;
    timerBtn.textContent = timeLeft + " วินาที ⏱";
    timerBtn.classList.add("timer-running");
    timer = setInterval(() => {
      timeLeft--;
      if (timeLeft <= 0) {
        clearInterval(timer);
        timer = null;
        timerBtn.textContent = "ได้คำตอบหรือยัง! ⏱";
        pgTimeUp();
        setTimeout(stopTimer, 1400);
        return;
      }
      timerBtn.textContent = timeLeft + " วินาที ⏱";
    }, 1000);
  });

  refreshPicker();
  showNext();
});
