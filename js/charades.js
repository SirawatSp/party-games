document.addEventListener("DOMContentLoaded", () => {
  const CAT_LABELS = {
    animal: "สัตว์", food: "อาหาร/เครื่องดื่ม", object: "ของใช้", job: "อาชีพ",
    place: "สถานที่", sport: "กีฬา", movie: "หนัง/การ์ตูน", action: "ท่าทาง", country: "ประเทศ",
    restaurant: "ร้านอาหารในไทย"
  };

  const setupPanel = document.getElementById("setupPanel");
  const passPanel = document.getElementById("passPanel");
  const playPanel = document.getElementById("playPanel");
  const recapPanel = document.getElementById("recapPanel");
  const matchEndPanel = document.getElementById("matchEndPanel");

  const categoryChips = document.getElementById("categoryChips");
  const timeSwitch = document.getElementById("timeSwitch");
  const roundsSwitch = document.getElementById("roundsSwitch");
  const startMatchBtn = document.getElementById("startMatchBtn");

  const passText = document.getElementById("passText");
  const passBtn = document.getElementById("passBtn");

  const playTurn = document.getElementById("playTurn");
  const playTimer = document.getElementById("playTimer");
  const playWord = document.getElementById("playWord");
  const wordCount = document.getElementById("wordCount");
  const skipBtn = document.getElementById("skipBtn");
  const correctBtn = document.getElementById("correctBtn");

  const recapTitle = document.getElementById("recapTitle");
  const recapList = document.getElementById("recapList");
  const confirmScoreBtn = document.getElementById("confirmScoreBtn");

  const matchEndTitle = document.getElementById("matchEndTitle");
  const matchEndScore = document.getElementById("matchEndScore");
  const matchEndHint = document.getElementById("matchEndHint");
  const tiebreakBtn = document.getElementById("tiebreakBtn");
  const resetMatchBtn = document.getElementById("resetMatchBtn");

  let activeCategory = "all";
  let timeBank = 45;
  let roundsPerPlayer = 2;
  let totalRounds = 4;

  let wordDeck = [];
  let currentWord = null;
  let usedCount = 0;
  let roundIdx = 0;
  let roundWords = [];   // [{word, correct}] in play order this round
  let timeLeft = 45;
  let timerInterval = null;
  let score = [0, 0];

  function showOnly(panel) {
    [setupPanel, passPanel, playPanel, recapPanel, matchEndPanel]
      .forEach((p) => { p.style.display = p === panel ? "" : "none"; });
  }

  // ---------- setup ----------
  const categories = ["all", ...Object.keys(CAT_LABELS)];
  categories.forEach((cat) => {
    const chip = document.createElement("span");
    chip.className = "tag" + (cat === "all" ? " active" : "");
    const count = cat === "all" ? CHARADES_WORDS.length : CHARADES_WORDS.filter((w) => w.cat === cat).length;
    chip.textContent = (cat === "all" ? "ทั้งหมด" : CAT_LABELS[cat]) + " (" + count + ")";
    chip.dataset.cat = cat;
    chip.addEventListener("click", () => {
      activeCategory = cat;
      categoryChips.querySelectorAll(".tag").forEach((c) => c.classList.toggle("active", c === chip));
    });
    categoryChips.appendChild(chip);
  });

  timeSwitch.querySelectorAll(".tp-mode-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      timeBank = Number(btn.dataset.sec);
      timeSwitch.querySelectorAll(".tp-mode-btn").forEach((b) => b.classList.toggle("active", b === btn));
    });
  });

  roundsSwitch.querySelectorAll(".tp-mode-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      roundsPerPlayer = Number(btn.dataset.n);
      roundsSwitch.querySelectorAll(".tp-mode-btn").forEach((b) => b.classList.toggle("active", b === btn));
    });
  });

  function pool() {
    return activeCategory === "all" ? CHARADES_WORDS : CHARADES_WORDS.filter((w) => w.cat === activeCategory);
  }

  function updateWordCount() {
    wordCount.textContent = "ใช้แล้ว " + usedCount + " คำ · เหลือ " + (wordDeck.length + (currentWord ? 1 : 0)) + " คำ";
  }

  // clue-giver for a given round index; guesser (who scores) is the other side
  function clueSideFor(idx) { return idx % 2 === 0 ? 0 : 1; }
  function guesserSideFor(idx) { return 1 - clueSideFor(idx); }

  startMatchBtn.addEventListener("click", () => {
    totalRounds = roundsPerPlayer * 2;
    roundIdx = 0;
    wordDeck = pool().slice();
    for (let i = wordDeck.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [wordDeck[i], wordDeck[j]] = [wordDeck[j], wordDeck[i]];
    }
    currentWord = null;
    usedCount = 0;
    score = [0, 0];
    goToPass();
  });

  // ---------- pass interstitial ----------
  function goToPass() {
    const clueSide = clueSideFor(roundIdx);
    passText.innerHTML = "ส่งมือถือให้ <b>ฝั่ง " + (clueSide + 1) + "</b> (คนใบ้) ถือไว้คนเดียว<br>อีกฝั่งห้ามดูจอ ฟังคำใบ้แล้วทายออกเสียงอย่างเดียว";
    passBtn.onclick = startRound;
    showOnly(passPanel);
  }

  // ---------- play round ----------
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

  function nextWord() {
    currentWord = wordDeck.pop() || null;
    playWord.textContent = currentWord ? currentWord.word : "คลังคำหมดแล้ว!";
    correctBtn.disabled = !currentWord;
    skipBtn.disabled = !currentWord;
    updateWordCount();
  }

  function startRound() {
    const clueSide = clueSideFor(roundIdx);
    playTurn.innerHTML = "<b>ฝั่ง " + (clueSide + 1) + "</b> กำลังใบ้ — ฝั่ง " + (guesserSideFor(roundIdx) + 1) + " ทาย";
    roundWords = [];
    timeLeft = timeBank;
    playTimer.textContent = fmtClock(timeLeft);
    playTimer.classList.remove("low");
    if (currentWord) {
      wordDeck.push(currentWord);
      currentWord = null;
    }
    nextWord();
    showOnly(playPanel);

    if (!currentWord) {
      endRound();
      return;
    }

    stopTimer();
    timerInterval = setInterval(() => {
      timeLeft--;
      playTimer.textContent = fmtClock(timeLeft);
      if (timeLeft <= 5) playTimer.classList.add("low");
      if (timeLeft <= 0) {
        stopTimer();
        pgTimeUp();
        endRound();
      }
    }, 1000);
  }

  function judge(correct) {
    if (!currentWord) return;
    roundWords.push({ word: currentWord.word, correct });
    currentWord = null;
    usedCount++;
    nextWord();
    if (!currentWord) endRound();
  }

  correctBtn.addEventListener("click", () => judge(true));
  skipBtn.addEventListener("click", () => judge(false));

  // ---------- recap ----------
  function renderRecap() {
    const correctCount = roundWords.filter((w) => w.correct).length;
    const guesserSide = guesserSideFor(roundIdx);
    recapTitle.textContent = "🎉 ฝั่ง " + (guesserSide + 1) + " ทายถูก " + correctCount + " จาก " + roundWords.length + " คำ";
    recapList.innerHTML = "";
    roundWords.forEach((w, i) => {
      const row = document.createElement("div");
      row.className = "cw-recap-item " + (w.correct ? "correct" : "skip");
      row.innerHTML = '<span>' + w.word + '</span><span class="cw-recap-mark">' + (w.correct ? "✅" : "⏭") + '</span>';
      row.addEventListener("click", () => {
        roundWords[i].correct = !roundWords[i].correct;
        renderRecap();
      });
      recapList.appendChild(row);
    });
  }

  function endRound() {
    stopTimer();
    if (currentWord) {
      wordDeck.push(currentWord);
      currentWord = null;
    }
    renderRecap();
    showOnly(recapPanel);
  }

  confirmScoreBtn.addEventListener("click", () => {
    const correctCount = roundWords.filter((w) => w.correct).length;
    score[guesserSideFor(roundIdx)] += correctCount;
    roundIdx++;
    if (roundIdx >= totalRounds) {
      endMatch();
    } else {
      goToPass();
    }
  });

  // ---------- match end ----------
  function endMatch() {
    if (score[0] === score[1]) {
      matchEndTitle.textContent = "🤝 เสมอกัน!";
      matchEndHint.textContent = wordDeck.length ? "ทายถูกเท่ากันเป๊ะ ต้องตัดสินกันอีกสักรอบ" : "ทายถูกเท่ากันและคลังคำหมดแล้ว เริ่มแมตช์ใหม่เพื่อเล่นต่อ";
      tiebreakBtn.style.display = wordDeck.length ? "" : "none";
    } else {
      const winner = score[0] > score[1] ? 0 : 1;
      matchEndTitle.textContent = "🏆 ฝั่ง " + (winner + 1) + " ชนะแมตช์!";
      matchEndHint.textContent = "ทายถูกรวมมากกว่า";
      tiebreakBtn.style.display = "none";
    }
    matchEndScore.textContent = "ฝั่ง 1: " + score[0] + " คำ   •   ฝั่ง 2: " + score[1] + " คำ";
    showOnly(matchEndPanel);
  }

  tiebreakBtn.addEventListener("click", () => {
    totalRounds += 2;
    goToPass();
  });

  resetMatchBtn.addEventListener("click", () => {
    stopTimer();
    showOnly(setupPanel);
  });
});
