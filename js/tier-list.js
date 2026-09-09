// Tier Talk — จัดตัวเลือก 6 อย่างลง S/A/B/C/D แล้วใช้เหตุผลเปิดบทสนทนา
document.addEventListener("DOMContentLoaded", () => {
  const $ = (id) => document.getElementById(id);
  const CAT_LABEL = {
    date: "💘 เดต & ความรัก", food: "🍜 ของกิน", travel: "🧳 เที่ยว",
    hangout: "🎉 วงเพื่อน", life: "🏠 ชีวิตประจำวัน", media: "🎬 บันเทิง",
    values: "🧭 ค่านิยม", nostalgia: "📼 ความทรงจำ", absurd: "🌀 สมมติเล่น",
    money: "💸 ใช้เงิน"
  };
  const TIERS = [
    { key: "S", score: 5, note: "ที่สุดของวง", color: "#ff5b6e" },
    { key: "A", score: 4, note: "ดีมาก", color: "#ff9f43" },
    { key: "B", score: 3, note: "โอเคเลย", color: "#ffd93d" },
    { key: "C", score: 2, note: "พอได้", color: "#63e6be" },
    { key: "D", score: 1, note: "ขอผ่าน", color: "#74c0fc" }
  ];

  const state = { cat: "all", prompt: null, selected: null, placed: new Map() };
  const pickers = {};

  function pool() {
    return state.cat === "all" ? TIER_LIST_PROMPTS : TIER_LIST_PROMPTS.filter((item) => item.cat === state.cat);
  }

  function picker() {
    if (!pickers[state.cat]) pickers[state.cat] = createPicker(pool(), "pg_tierlist_" + state.cat);
    return pickers[state.cat];
  }

  function itemButton(name, placed) {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "tier-item" + (state.selected === name ? " selected" : "") + (placed ? " placed" : "");
    button.textContent = name;
    button.dataset.item = name;
    button.setAttribute("aria-pressed", state.selected === name ? "true" : "false");
    button.addEventListener("click", () => {
      state.selected = state.selected === name ? null : name;
      render();
      if (state.selected) $("tierLive").textContent = `เลือก “${name}” แล้ว — แตะแถว S ถึง D เพื่อให้คะแนน`;
    });
    return button;
  }

  function place(tierKey) {
    if (!state.selected) {
      $("tierLive").textContent = "เลือกตัวเลือกจากกองด้านบนก่อน แล้วค่อยแตะแถวเทียร์";
      return;
    }
    const name = state.selected;
    state.placed.set(name, tierKey);
    state.selected = null;
    render();
    $("tierLive").textContent = `วาง “${name}” ไว้เทียร์ ${tierKey} แล้ว — เล่าเหตุผลให้วงฟังด้วย`;
  }

  function render() {
    const itemWrap = $("tierItems");
    itemWrap.innerHTML = "";
    state.prompt.items.forEach((name) => itemWrap.appendChild(itemButton(name, state.placed.has(name))));

    const board = $("tierBoard");
    board.innerHTML = "";
    TIERS.forEach((tier) => {
      const row = document.createElement("button");
      row.type = "button";
      row.className = "tier-row" + (state.selected ? " can-drop" : "");
      row.style.setProperty("--tier-color", tier.color);
      row.setAttribute("aria-label", `วางตัวเลือกที่เลือกในเทียร์ ${tier.key} ${tier.note}`);
      const ranked = state.prompt.items.filter((name) => state.placed.get(name) === tier.key);
      row.innerHTML = `<span class="tier-grade">${tier.key}<small>${tier.score}</small></span><span class="tier-drop"><span class="tier-note">${tier.note}</span></span>`;
      const drop = row.querySelector(".tier-drop");
      ranked.forEach((name) => {
        const chip = document.createElement("span");
        chip.className = "tier-ranked";
        chip.textContent = name;
        drop.appendChild(chip);
      });
      row.addEventListener("click", () => place(tier.key));
      board.appendChild(row);
    });
    $("tierProgress").textContent = `${state.placed.size} / ${state.prompt.items.length}`;
    document.querySelector(".tier-game").classList.toggle("complete", state.placed.size === state.prompt.items.length);
  }

  function nextPrompt() {
    state.prompt = picker()();
    state.selected = null;
    state.placed.clear();
    $("tierCatLabel").textContent = CAT_LABEL[state.prompt.cat];
    $("tierTitle").textContent = state.prompt.title;
    $("tierTalk").textContent = "คุยต่อ: " + state.prompt.talk;
    $("tierLive").textContent = "";
    render();
  }

  $("tierCats").querySelectorAll(".tag").forEach((button) => {
    button.addEventListener("click", () => {
      $("tierCats").querySelectorAll(".tag").forEach((item) => item.classList.remove("active"));
      button.classList.add("active");
      state.cat = button.dataset.cat;
      nextPrompt();
    });
  });
  $("tierReset").addEventListener("click", () => {
    state.selected = null;
    state.placed.clear();
    $("tierLive").textContent = "ล้างกระดานแล้ว เริ่มจัดใหม่ได้เลย";
    render();
  });
  $("tierNext").addEventListener("click", nextPrompt);
  nextPrompt();
});
