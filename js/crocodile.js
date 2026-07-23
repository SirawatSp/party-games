document.addEventListener("DOMContentLoaded", () => {
  const setupPanel = document.getElementById("setupPanel");
  const gamePanel = document.getElementById("gamePanel");
  const teethSwitch = document.getElementById("teethSwitch");
  const trapSwitch = document.getElementById("trapSwitch");
  const startBtn = document.getElementById("startBtn");
  const teethGrid = document.getElementById("teethGrid");
  const crocHead = document.getElementById("crocHead");
  const crocScene = document.getElementById("crocScene");
  const crocFlash = document.getElementById("crocFlash");
  const crocHint = document.getElementById("crocHint");
  const safeCount = document.getElementById("safeCount");
  const riskText = document.getElementById("riskText");
  const riskFill = document.getElementById("riskFill");
  const biteResult = document.getElementById("biteResult");
  const biteMsg = document.getElementById("biteMsg");
  const newRoundBtn = document.getElementById("newRoundBtn");
  const backSetupBtn = document.getElementById("backSetupBtn");

  let totalTeeth = 16;
  let trapCount = 1;
  let traps = new Set();
  let pressedSafe = 0;
  let over = false;

  const SAFE_QUIPS = [
    "รอด! ส่งต่อคนถัดไปเลย 😮‍💨",
    "หวุดหวิด… จระเข้แค่ขยับหนวด 🐊",
    "ยังไม่โดน แต่อย่าเพิ่งชะล่าใจ 👀",
    "ผ่าน! ใครต่อ กดเลยอย่าลังเล 😏",
    "เฉียดไปนิดเดียว ใจเย็น ๆ 🫣",
  ];
  const drawQuip = createPicker(SAFE_QUIPS, "pg_crocodile");

  function switchHandler(switchEl, onPick) {
    switchEl.addEventListener("click", (e) => {
      const btn = e.target.closest(".tp-mode-btn");
      if (!btn) return;
      switchEl.querySelectorAll(".tp-mode-btn").forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");
      onPick(parseInt(btn.dataset.n, 10));
    });
  }
  switchHandler(teethSwitch, (n) => { totalTeeth = n; });
  switchHandler(trapSwitch, (n) => { trapCount = n; });

  function updateStatus() {
    const remaining = totalTeeth - pressedSafe;
    safeCount.textContent = "ฟันเหลือ " + remaining + "/" + totalTeeth + " ซี่";
    const risk = Math.min(100, Math.round((trapCount / Math.max(1, remaining)) * 100));
    riskText.textContent = "โอกาสโดนงับ " + risk + "%";
    riskFill.style.width = risk + "%";
    riskFill.classList.toggle("hot", risk >= 50);
  }

  function newRound() {
    over = false;
    pressedSafe = 0;
    traps = new Set();
    while (traps.size < trapCount) {
      traps.add(Math.floor(Math.random() * totalTeeth));
    }

    teethGrid.innerHTML = "";
    for (let i = 0; i < totalTeeth; i++) {
      const b = document.createElement("button");
      b.type = "button";
      b.className = "croc-tooth";
      b.addEventListener("click", () => pressTooth(i, b));
      teethGrid.appendChild(b);
    }

    crocHead.classList.remove("bite");
    crocScene.classList.remove("shake");
    biteResult.style.display = "none";
    newRoundBtn.style.display = "none";
    crocHint.style.display = "";
    crocHint.textContent = "ผลัดกันกดฟันคนละ 1 ซี่ — ขอให้โชคดี 🙏";
    updateStatus();
  }

  function pressTooth(i, btn) {
    if (over || btn.classList.contains("pressed")) return;

    if (traps.has(i)) {
      bite(btn);
      return;
    }

    btn.classList.add("pressed");
    pressedSafe++;
    crocHint.textContent = drawQuip();
    updateStatus();
  }

  function bite(trapBtn) {
    over = true;
    trapBtn.classList.add("trap");
    // เฉลยฟันผุซี่อื่น (กรณีตั้งไว้ 2 ซี่) ให้เห็นว่ารอดจากซี่ไหนมาบ้าง
    teethGrid.querySelectorAll(".croc-tooth").forEach((b, idx) => {
      b.disabled = true;
      if (traps.has(idx)) b.classList.add("trap");
    });

    crocHead.classList.add("bite");
    crocScene.classList.add("shake");
    crocFlash.classList.remove("flash");
    void crocFlash.getBoundingClientRect();
    crocFlash.classList.add("flash");

    crocHint.style.display = "none";
    biteMsg.textContent = "คนที่เพิ่งกดโดนฟันผุเต็ม ๆ — รับบทลงโทษของวงไปเลย! 🍻";
    biteResult.style.display = "";
    newRoundBtn.style.display = "";
    updateStatus();
  }

  startBtn.addEventListener("click", () => {
    setupPanel.style.display = "none";
    gamePanel.style.display = "";
    newRound();
  });

  newRoundBtn.addEventListener("click", newRound);

  backSetupBtn.addEventListener("click", () => {
    gamePanel.style.display = "none";
    setupPanel.style.display = "";
  });
});
