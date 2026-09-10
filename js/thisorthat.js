document.addEventListener("DOMContentLoaded", () => {
  const totTags = document.getElementById("totTags");
  const catLabel = document.getElementById("totCatLabel");
  const optionA = document.getElementById("totOptionA");
  const optionB = document.getElementById("totOptionB");
  const pickedLabel = document.getElementById("totPickedLabel");
  const nextBtn = document.getElementById("totNextBtn");

  const CAT_LABEL = {
    food: "อาหาร", lifestyle: "ไลฟ์สไตล์", entertain: "บันเทิง", travel: "ท่องเที่ยว",
    tech: "เทคโนโลยี", fantasy: "แฟนตาซี", love: "ความรัก", party: "ปาร์ตี้",
    sport: "กีฬา", animal: "สัตว์/ธรรมชาติ", work: "งาน/เรียน", weird: "มันส์ๆ",
    rather: "Would You Rather"
  };

  let activeCat = "all";
  let drawNext = null;
  let current = null;

  function pool() {
    return activeCat === "all" ? THISORTHAT_LIST : THISORTHAT_LIST.filter((p) => p.cat === activeCat);
  }

  function refreshPicker() {
    drawNext = createPicker(pool(), "pg_tot_" + activeCat);
  }

  function renderPair() {
    catLabel.textContent = CAT_LABEL[current.cat];
    optionA.textContent = current.a;
    optionB.textContent = current.b;
    optionA.classList.remove("chosen");
    optionB.classList.remove("chosen");
    pickedLabel.textContent = "";
  }

  function next() {
    if (!drawNext) return;
    const item = drawNext();
    if (!item) return;
    current = item;
    renderPair();
  }

  function pick(side) {
    optionA.classList.toggle("chosen", side === "a");
    optionB.classList.toggle("chosen", side === "b");
    pickedLabel.textContent = "ใครเลือกเหมือนกันบ้าง? 👀";
  }

  optionA.addEventListener("click", () => pick("a"));
  optionB.addEventListener("click", () => pick("b"));
  nextBtn.addEventListener("click", next);

  totTags.querySelectorAll(".tag").forEach((tagEl) => {
    tagEl.addEventListener("click", () => {
      totTags.querySelectorAll(".tag").forEach((t) => t.classList.remove("active"));
      tagEl.classList.add("active");
      activeCat = tagEl.dataset.cat;
      refreshPicker();
      next();
    });
  });

  refreshPicker();
  next();

  // ---------- mode switch ----------
  const modeSwitch = document.getElementById("totModeSwitch");
  const rulesTot = document.getElementById("rulesTot");
  const rulesArch = document.getElementById("rulesArch");
  const endlessStage = document.getElementById("endlessStage");
  const endlessControls = document.getElementById("endlessControls");
  const archStage = document.getElementById("archStage");
  const rulesTattoo = document.getElementById("rulesTattoo");
  const tattooStage = document.getElementById("tattooStage");

  modeSwitch.querySelectorAll(".tp-mode-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      modeSwitch.querySelectorAll(".tp-mode-btn").forEach((b) => b.classList.toggle("active", b === btn));
      const mode = btn.dataset.mode;
      const isEndless = mode === "endless";
      const isBracket = mode === "bracket";
      const isTattoo = mode === "tattoo";
      rulesTot.style.display = isEndless ? "" : "none";
      totTags.style.display = isEndless ? "" : "none";
      endlessStage.style.display = isEndless ? "" : "none";
      endlessControls.style.display = isEndless ? "" : "none";
      rulesArch.style.display = isBracket ? "" : "none";
      archStage.style.display = isBracket ? "" : "none";
      rulesTattoo.style.display = isTattoo ? "" : "none";
      tattooStage.style.display = isTattoo ? "" : "none";
      if (isBracket) resetBracket();
      if (isTattoo) resetTattoo();
    });
  });

  // ---------- architect elimination bracket ----------
  const archSetup = document.getElementById("archSetup");
  const archSizeSwitch = document.getElementById("archSizeSwitch");
  const archStartBtn = document.getElementById("archStartBtn");
  const archMatch = document.getElementById("archMatch");
  const archRoundLabel = document.getElementById("archRoundLabel");
  const archOptionA = document.getElementById("archOptionA");
  const archOptionB = document.getElementById("archOptionB");
  const archResult = document.getElementById("archResult");
  const archChampionName = document.getElementById("archChampionName");
  const archChampionBlurb = document.getElementById("archChampionBlurb");
  const archPathList = document.getElementById("archPathList");
  const archReplayBtn = document.getElementById("archReplayBtn");

  let bracketSize = 16;
  let currentRound = [];
  let matchIdx = 0;
  let nextRoundWinners = [];
  let matchLog = [];

  archSizeSwitch.querySelectorAll(".tp-mode-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      bracketSize = Number(btn.dataset.n);
      archSizeSwitch.querySelectorAll(".tp-mode-btn").forEach((b) => b.classList.toggle("active", b === btn));
    });
  });

  function shuffleArr(arr) {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  function buildPairs(list) {
    const shuffled = shuffleArr(list);
    const pairs = [];
    for (let i = 0; i < shuffled.length; i += 2) pairs.push([shuffled[i], shuffled[i + 1]]);
    return pairs;
  }

  function roundLabel(entrants) {
    if (entrants === 2) return "รอบชิงชนะเลิศ";
    if (entrants === 4) return "รอบรองชนะเลิศ (4 คน)";
    if (entrants === 8) return "รอบก่อนรองชนะเลิศ (8 คน)";
    return "รอบ " + entrants + " คนสุดท้าย";
  }

  function resetBracket() {
    archSetup.style.display = "";
    archMatch.style.display = "none";
    archResult.style.display = "none";
  }

  archStartBtn.addEventListener("click", () => {
    const pool = shuffleArr(ARCHITECTS).slice(0, bracketSize);
    currentRound = buildPairs(pool);
    matchIdx = 0;
    nextRoundWinners = [];
    matchLog = [];
    showArchMatch();
  });

  function renderArchOption(el, architect) {
    el.innerHTML = "<b>" + architect.name + "</b>" +
      '<div style="font-weight:400; font-size:13px; color:var(--text-dim); margin-top:8px; line-height:1.5;">' + architect.blurb + "</div>";
  }

  function showArchMatch() {
    const [a, b] = currentRound[matchIdx];
    archRoundLabel.textContent = roundLabel(currentRound.length * 2);
    renderArchOption(archOptionA, a);
    renderArchOption(archOptionB, b);
    archOptionA.onclick = () => pickWinner(a, b);
    archOptionB.onclick = () => pickWinner(b, a);
    archSetup.style.display = "none";
    archMatch.style.display = "";
    archResult.style.display = "none";
  }

  function pickWinner(winner, loser) {
    matchLog.push({ round: archRoundLabel.textContent, winner: winner.name, loser: loser.name });
    nextRoundWinners.push(winner);
    matchIdx++;
    if (matchIdx < currentRound.length) {
      showArchMatch();
    } else if (nextRoundWinners.length === 1) {
      showChampion(nextRoundWinners[0]);
    } else {
      currentRound = buildPairs(nextRoundWinners);
      nextRoundWinners = [];
      matchIdx = 0;
      showArchMatch();
    }
  }

  function showChampion(champ) {
    archChampionName.textContent = "แชมป์อันดับ 1: " + champ.name;
    archChampionBlurb.textContent = champ.blurb;
    const path = matchLog.filter((m) => m.winner === champ.name);
    archPathList.innerHTML = path.map((m) =>
      '<div class="cw-recap-item correct"><span>' + m.round + '</span><span class="cw-recap-mark">ชนะ ' + m.loser + "</span></div>"
    ).join("");
    archMatch.style.display = "none";
    archResult.style.display = "";
  }

  archReplayBtn.addEventListener("click", resetBracket);

  // ---------- Tattoo Colour song tournament ----------
  const tattooSetup = document.getElementById("tattooSetup");
  const tattooStartBtn = document.getElementById("tattooStartBtn");
  const tattooMatch = document.getElementById("tattooMatch");
  const tattooRoundLabel = document.getElementById("tattooRoundLabel");
  const tattooMatchCount = document.getElementById("tattooMatchCount");
  const tattooProgress = document.getElementById("tattooProgress");
  const tattooOptionA = document.getElementById("tattooOptionA");
  const tattooOptionB = document.getElementById("tattooOptionB");
  const tattooUndoBtn = document.getElementById("tattooUndoBtn");
  const tattooResetBtn = document.getElementById("tattooResetBtn");
  const tattooResult = document.getElementById("tattooResult");
  const tattooChampionName = document.getElementById("tattooChampionName");
  const tattooPathList = document.getElementById("tattooPathList");
  const tattooReplayBtn = document.getElementById("tattooReplayBtn");

  let tattooRound = [];
  let tattooMatchIdx = 0;
  let tattooWinners = [];
  let tattooLog = [];
  let tattooSnapshots = [];

  function tattooRoundName(entrants) {
    if (entrants === 2) return "รอบชิงชนะเลิศ";
    if (entrants === 4) return "รอบรองชนะเลิศ";
    if (entrants === 8) return "รอบ 8 เพลง";
    return "รอบ 16 เพลง";
  }

  function resetTattoo() {
    tattooSetup.style.display = "";
    tattooMatch.style.display = "none";
    tattooResult.style.display = "none";
    tattooRound = [];
    tattooMatchIdx = 0;
    tattooWinners = [];
    tattooLog = [];
    tattooSnapshots = [];
  }

  function saveTattooSnapshot() {
    tattooSnapshots.push({
      round: tattooRound.slice(),
      matchIdx: tattooMatchIdx,
      winners: tattooWinners.slice(),
      log: tattooLog.slice()
    });
  }

  function showTattooMatch() {
    const pair = tattooRound[tattooMatchIdx];
    const pickedCount = tattooLog.length;
    tattooRoundLabel.textContent = tattooRoundName(tattooRound.length * 2);
    tattooMatchCount.textContent = "คู่ที่ " + (tattooMatchIdx + 1) + " / " + tattooRound.length + " · เลือกแล้ว " + pickedCount + " / 15";
    tattooProgress.style.width = ((pickedCount / 15) * 100) + "%";
    tattooOptionA.textContent = pair[0];
    tattooOptionB.textContent = pair[1];
    tattooOptionA.onclick = () => pickTattooWinner(pair[0], pair[1]);
    tattooOptionB.onclick = () => pickTattooWinner(pair[1], pair[0]);
    tattooUndoBtn.disabled = tattooSnapshots.length === 0;
    tattooSetup.style.display = "none";
    tattooMatch.style.display = "";
    tattooResult.style.display = "none";
  }

  function pickTattooWinner(winner, loser) {
    saveTattooSnapshot();
    tattooLog.push({ round: tattooRoundLabel.textContent, winner, loser });
    tattooWinners.push(winner);
    tattooMatchIdx++;
    if (tattooMatchIdx < tattooRound.length) {
      showTattooMatch();
    } else if (tattooWinners.length === 1) {
      showTattooChampion(tattooWinners[0]);
    } else {
      tattooRound = buildPairs(tattooWinners);
      tattooWinners = [];
      tattooMatchIdx = 0;
      showTattooMatch();
    }
  }

  function showTattooChampion(champion) {
    tattooChampionName.textContent = champion;
    tattooProgress.style.width = "100%";
    const path = tattooLog.filter((match) => match.winner === champion);
    tattooPathList.innerHTML = path.map((match) =>
      '<div class="cw-recap-item correct"><span>' + match.round + '</span><span class="cw-recap-mark">ชนะ ' + match.loser + "</span></div>"
    ).join("");
    tattooMatch.style.display = "none";
    tattooResult.style.display = "";
  }

  tattooStartBtn.addEventListener("click", () => {
    tattooRound = buildPairs(TATTOO_COLOUR_SONGS);
    tattooMatchIdx = 0;
    tattooWinners = [];
    tattooLog = [];
    tattooSnapshots = [];
    showTattooMatch();
  });

  tattooUndoBtn.addEventListener("click", () => {
    const previous = tattooSnapshots.pop();
    if (!previous) return;
    tattooRound = previous.round;
    tattooMatchIdx = previous.matchIdx;
    tattooWinners = previous.winners;
    tattooLog = previous.log;
    showTattooMatch();
  });

  tattooResetBtn.addEventListener("click", resetTattoo);
  tattooReplayBtn.addEventListener("click", resetTattoo);
});
