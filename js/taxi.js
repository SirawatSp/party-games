document.addEventListener("DOMContentLoaded", () => {
  const setupPanel = document.getElementById("setupPanel");
  const passPanel = document.getElementById("passPanel");
  const playPanel = document.getElementById("playPanel");
  const recapPanel = document.getElementById("recapPanel");

  const zoneChips = document.getElementById("zoneChips");
  const timeSwitch = document.getElementById("timeSwitch");
  const bestBox = document.getElementById("bestBox");
  const startBtn = document.getElementById("startBtn");
  const goBtn = document.getElementById("goBtn");

  const meterCount = document.getElementById("meterCount");
  const playTimer = document.getElementById("playTimer");
  const playPlace = document.getElementById("playPlace");
  const skipBtn = document.getElementById("skipBtn");
  const arriveBtn = document.getElementById("arriveBtn");

  const recapTitle = document.getElementById("recapTitle");
  const recapList = document.getElementById("recapList");
  const againBtn = document.getElementById("againBtn");
  const backSetupBtn = document.getElementById("backSetupBtn");

  let activeZone = "all";
  let timeBank = 90;
  let drawPlace = createPicker(TAXI_PLACES);
  let currentPlace = null;
  let rideLog = [];   // [{name, arrived}] ตามลำดับที่เจอในรอบนี้
  let timeLeft = 90;
  let timerInterval = null;
  let bestScore = 0;  // สถิติดีที่สุดของวงในเซสชันนี้

  function showOnly(panel) {
    [setupPanel, passPanel, playPanel, recapPanel]
      .forEach((p) => { p.style.display = p === panel ? "" : "none"; });
  }

  function pool() {
    return activeZone === "all" ? TAXI_PLACES : TAXI_PLACES.filter((p) => p.cat === activeZone);
  }

  zoneChips.querySelectorAll(".tag").forEach((chip) => {
    chip.addEventListener("click", () => {
      activeZone = chip.dataset.cat;
      zoneChips.querySelectorAll(".tag").forEach((c) => c.classList.toggle("active", c === chip));
    });
  });

  timeSwitch.querySelectorAll(".tp-mode-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      timeBank = Number(btn.dataset.sec);
      timeSwitch.querySelectorAll(".tp-mode-btn").forEach((b) => b.classList.toggle("active", b === btn));
    });
  });

  function fmtClock(seconds) {
    const s = Math.max(0, seconds);
    return Math.floor(s / 60) + ":" + String(s % 60).padStart(2, "0");
  }

  function stopTimer() {
    if (timerInterval) {
      clearInterval(timerInterval);
      timerInterval = null;
    }
  }

  function arrivedCount() {
    return rideLog.filter((r) => r.arrived).length;
  }

  function updateMeter() {
    meterCount.textContent = "ส่งแล้ว " + arrivedCount() + " ที่";
  }

  function nextPlace() {
    currentPlace = drawPlace() || null;
    playPlace.textContent = currentPlace ? currentPlace.name : "สถานที่หมดคลังแล้ว!";
  }

  startBtn.addEventListener("click", () => {
    drawPlace = createPicker(pool());
    showOnly(passPanel);
  });

  goBtn.addEventListener("click", startRound);

  function startRound() {
    rideLog = [];
    timeLeft = timeBank;
    playTimer.textContent = fmtClock(timeLeft);
    playTimer.classList.remove("low");
    updateMeter();
    nextPlace();
    showOnly(playPanel);

    stopTimer();
    timerInterval = setInterval(() => {
      timeLeft--;
      playTimer.textContent = fmtClock(timeLeft);
      if (timeLeft <= 5) playTimer.classList.add("low");
      if (timeLeft <= 0) {
        stopTimer();
        vibrateTimeout();
        endRound();
      }
    }, 1000);
  }

  function judge(arrived) {
    if (!currentPlace) return;
    rideLog.push({ name: currentPlace.name, arrived });
    updateMeter();
    nextPlace();
  }

  arriveBtn.addEventListener("click", () => judge(true));
  skipBtn.addEventListener("click", () => judge(false));

  function renderRecap() {
    const n = arrivedCount();
    const isRecord = n > bestScore;
    recapTitle.textContent = "🏁 หมดเวลา! ส่งผู้โดยสารถึง " + n + " ที่" +
      (isRecord && bestScore > 0 ? " — สถิติใหม่ของวง!" : "");
    recapList.innerHTML = "";
    rideLog.forEach((r, i) => {
      const row = document.createElement("div");
      row.className = "cw-recap-item " + (r.arrived ? "correct" : "skip");
      row.innerHTML = "<span>" + r.name + '</span><span class="cw-recap-mark">' + (r.arrived ? "📍" : "🔁") + "</span>";
      row.addEventListener("click", () => {
        rideLog[i].arrived = !rideLog[i].arrived;
        renderRecap();
      });
      recapList.appendChild(row);
    });
  }

  function endRound() {
    stopTimer();
    renderRecap();
    showOnly(recapPanel);
  }

  function commitBest() {
    bestScore = Math.max(bestScore, arrivedCount());
    if (bestScore > 0) {
      bestBox.style.display = "";
      bestBox.textContent = "🏆 สถิติวงนี้: ส่งถึง " + bestScore + " ที่ ใน " + timeBank + " วิ";
    }
  }

  againBtn.addEventListener("click", () => {
    commitBest();
    showOnly(passPanel);
  });

  backSetupBtn.addEventListener("click", () => {
    commitBest();
    stopTimer();
    showOnly(setupPanel);
  });
});
