document.addEventListener("DOMContentLoaded", () => {
  const CAT_LABEL = {
    truth_light: "💬 Truth · เบา", truth_heavy: "💬 Truth · หนัก",
    dare_light: "⚡ Dare · เบา", dare_heavy: "⚡ Dare · หนัก"
  };
  const levels = document.querySelectorAll("[data-intensity]");
  const choices = document.querySelectorAll("button[data-kind]");
  const card = document.getElementById("tdCard");
  const prompt = document.getElementById("tdPrompt");
  const subtext = document.getElementById("tdSubtext");
  const badge = document.getElementById("tdBadge");
  const symbol = card.querySelector(".td-symbol");
  const skip = document.getElementById("tdSkip");
  const next = document.getElementById("tdNext");
  const pickers = new Map();
  let level = "light";
  let turn = 1;
  let lastKind = null;

  function pool(kind) {
    return TRUTH_OR_DARE_LIST.filter((item) =>
      item.cat.endsWith("_" + level) && (kind === "random" || item.cat === kind + "_" + level));
  }

  function resetCard() {
    lastKind = null;
    card.removeAttribute("data-kind");
    symbol.textContent = "?";
    prompt.textContent = "พูดจริง หรือ กล้าทำ?";
    subtext.textContent = "เลือก Truth, Dare หรือให้เกมสุ่มให้";
    badge.textContent = "พร้อมเมื่อไรก็เลือกเลย";
    skip.disabled = true;
    next.disabled = true;
  }

  function show(kind) {
    const key = level + "_" + kind;
    if (!pickers.has(key)) pickers.set(key, createPicker(pool(kind), "pg_truthordare_" + key));
    const item = pickers.get(key)();
    if (!item) {
      prompt.textContent = "หมวดนี้ยังไม่มีโจทย์ ลองเลือกหมวดอื่น";
      return;
    }
    lastKind = kind;
    const type = item.cat.startsWith("truth_") ? "truth" : "dare";
    card.dataset.kind = type;
    symbol.textContent = type === "truth" ? "💬" : "⚡";
    prompt.textContent = item.prompt;
    badge.textContent = CAT_LABEL[item.cat];
    subtext.textContent = type === "truth"
      ? "เล่าเท่าที่พร้อม · ไม่ต้องเอ่ยชื่อใคร"
      : "ทำเท่าที่สบายใจ · ข้ามหรือเปลี่ยนข้อได้";
    skip.disabled = false;
    next.disabled = false;
  }

  function updateLevel() {
    const count = pool("random").length;
    document.getElementById("tdPoolCount").textContent =
      "หมวดนี้ " + count + " โจทย์ · Truth " + pool("truth").length + " · Dare " + pool("dare").length;
    document.getElementById("tdLevelHint").textContent = level === "light"
      ? "คำถามสบาย ๆ และคำท้าสั้น ๆ ที่เล่นได้ทันที"
      : "คำถามเปิดใจและคำท้าที่ใช้ความกล้าต่อหน้าวง เลือกเล่าและทำเท่าที่พร้อม";
    resetCard();
  }

  levels.forEach((button) => button.addEventListener("click", () => {
    level = button.dataset.intensity;
    levels.forEach((item) => {
      const active = item === button;
      item.classList.toggle("active", active);
      item.setAttribute("aria-pressed", String(active));
    });
    updateLevel();
  }));
  choices.forEach((button) => button.addEventListener("click", () => show(button.dataset.kind)));
  skip.addEventListener("click", () => { if (lastKind) show(lastKind); });
  next.addEventListener("click", () => {
    if (!lastKind) return;
    turn++;
    document.getElementById("tdTurn").textContent = "ตาที่ " + turn;
    resetCard();
    choices[0].focus();
  });
  updateLevel();
});
