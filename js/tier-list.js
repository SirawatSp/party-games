// Tier Talk — จัดตัวเลือก 20 อย่างลง S/A/B/C/D แล้วใช้เหตุผลเปิดบทสนทนา
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

  const ITEM_BANKS = {
    date: ["ร้านอาหารบรรยากาศดี","เดินริมแม่น้ำ","ดูนิทรรศการ","ทำขนมด้วยกัน","สวนสัตว์","ร้านแผ่นเสียง","งานวัด","ดูดาว","บรันช์","งานคราฟต์","ปั่นจักรยาน","เกมอาร์เคด","แลกหนังสือ","ทัวร์ชิมอาหาร","โฟโต้บูธ","คุยบนดาดฟ้า","คอนเสิร์ตเล็ก","ตลาดต้นไม้","ทำมื้อเย็น","นั่งเรือชมเมือง"],
    food: ["กะเพราไข่ดาว","หมูกระทะ","ส้มตำ","ข้าวมันไก่","ราเมง","พิซซ่า","ซูชิ","ไก่ทอด","ข้าวต้ม","ชาบู","ข้าวเหนียวมะม่วง","ติ่มซำ","ก๋วยเตี๋ยวเรือ","แกงกะหรี่","เบอร์เกอร์","บัวลอย","ขนมครก","ไอศกรีม","ป๊อปคอร์น","ผลไม้แช่เย็น"],
    travel: ["ทะเล","ภูเขา","เมืองเก่า","มหานคร","เกาะเงียบ","รถไฟกลางคืน","โรดทริป","กางเต็นท์","เที่ยวคนเดียว","ตลาดเช้า","พิพิธภัณฑ์","สวนสนุก","คาเฟ่ท้องถิ่น","เดินป่า","สตรีทฟู้ด","ดูพระอาทิตย์ขึ้น","ทริปไม่วางแผน","โฮมสเตย์","เทศกาลท้องถิ่น","ล่องเรือ"],
    hangout: ["กินข้าว","คาราโอเกะ","บอร์ดเกม","ดูหนัง","ปิกนิก","ทำอาหาร","ร้านเกม","คาเฟ่","คอนเสิร์ต","โบว์ลิ่ง","เวิร์กช็อป","ตลาดกลางคืน","ทริปหนึ่งวัน","ดูบอล","แลกของขวัญ","เล่าเรื่องผี","เกมทายคำ","ถ่ายรูปหมู่","ปาร์ตี้ธีม","นั่งคุยที่บ้าน"],
    life: ["นอนให้ครบ","จัดโต๊ะ","เดินหลังอาหาร","ปิดแจ้งเตือน","ทำอาหารเอง","จดรายจ่าย","อ่านก่อนนอน","ออกกำลังกาย","โทรหาครอบครัว","เก็บบ้านทีละน้อย","วางแผนพรุ่งนี้","ดื่มน้ำ","รับแดดเช้า","พักสายตา","เตรียมเสื้อผ้า","เขียนบันทึก","ฝึกหายใจ","งีบสั้น","เก็บของเข้าที่","อยู่คนเดียว"],
    media: ["หนังตลก","หนังสยองขวัญ","แอนิเมชัน","สารคดี","ซีรีส์สืบสวน","รายการแข่งขัน","พอดแคสต์","นิยาย","มังงะ","เกมเนื้อเรื่อง","เพลงสด","มิวสิกวิดีโอ","คลิปทำอาหาร","วิดีโอเที่ยว","ละครเวที","ซิตคอม","เรียลลิตี้","หนังสั้น","คอนเสิร์ตออนไลน์","รายการสัมภาษณ์"],
    values: ["ความซื่อสัตย์","ความเมตตา","ความรับผิดชอบ","ความกล้าหาญ","ความยุติธรรม","รักษาคำพูด","การฟัง","การให้อภัย","ความอยากรู้","ความอดทน","เคารพขอบเขต","ความถ่อมตัว","การแบ่งปัน","ความสม่ำเสมอ","การยอมรับผิด","อารมณ์ขัน","ความคิดสร้างสรรค์","ความเป็นอิสระ","ดูแลคนรอบตัว","การเปิดใจ"],
    nostalgia: ["ขนมหน้าโรงเรียน","การ์ตูนเย็น","ร้านเกม","สมุดสติกเกอร์","เทปคาสเซ็ต","มือถือปุ่มกด","เน็ตต่อสาย","จดหมายพับ","จักรยานคันแรก","เกมตลับ","ละครหลังข่าว","วิทยุในรถ","กล้องฟิล์ม","นอนบ้านเพื่อน","งานกีฬาสี","ตลาดนัดโรงเรียน","ไอศกรีมรถเข็น","หนังเช่าแผ่น","เพลงริงโทน","ของเล่นร้านชำ"],
    absurd: ["หยุดเวลา","ล่องหน","อ่านใจ","วาร์ป","คุยกับสัตว์","บินได้","เสกอาหาร","ย้อนเวลา","หายใจใต้น้ำ","จำทุกอย่าง","เปลี่ยนร่าง","คุมอากาศ","ชาร์จแบตด้วยมือ","คุยกับผี","ย่อส่วน","ขยายร่าง","ทะลุกำแพง","เห็นอนาคต","สร้างร่างแยก","ทำให้ทุกคนหัวเราะ"],
    money: ["ที่นอนดี","รองเท้าทน","เก้าอี้ทำงาน","ตรวจสุขภาพ","เรียนภาษา","ทริปครอบครัว","กองทุนฉุกเฉิน","ปิดหนี้","ลงทุนระยะยาว","คอร์สทักษะ","เครื่องใช้ประหยัดไฟ","อาหารคุณภาพดี","ประกันสุขภาพ","บ้านใกล้งาน","โทรศัพท์","หูฟัง","งานอดิเรก","สมาชิกฟิตเนส","ส่งอาหาร","วันหยุดเพิ่ม"]
  };
  const state = { cat: "all", prompt: null, items: [], selected: null, placed: new Map() };
  const pickers = {};

  function pool() {
    return state.cat === "all" ? TIER_LIST_PROMPTS : TIER_LIST_PROMPTS.filter((item) => item.cat === state.cat);
  }

  function picker() {
    if (!pickers[state.cat]) pickers[state.cat] = createPicker(pool(), "pg_tierlist_" + state.cat);
    return pickers[state.cat];
  }

  function effectiveItems(prompt) {
    return [...new Set([...prompt.items, ...(ITEM_BANKS[prompt.cat] || [])])].slice(0, 20);
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
    state.items = effectiveItems(state.prompt);
    state.selected = null;
    render();
    $("tierLive").textContent = `วาง “${name}” ไว้เทียร์ ${tierKey} แล้ว — เล่าเหตุผลให้วงฟังด้วย`;
  }

  function render() {
    const itemWrap = $("tierItems");
    itemWrap.innerHTML = "";
    state.items.forEach((name) => itemWrap.appendChild(itemButton(name, state.placed.has(name))));

    const board = $("tierBoard");
    board.innerHTML = "";
    TIERS.forEach((tier) => {
      const row = document.createElement("button");
      row.type = "button";
      row.className = "tier-row" + (state.selected ? " can-drop" : "");
      row.style.setProperty("--tier-color", tier.color);
      row.setAttribute("aria-label", `วางตัวเลือกที่เลือกในเทียร์ ${tier.key} ${tier.note}`);
      const ranked = state.items.filter((name) => state.placed.get(name) === tier.key);
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
    $("tierProgress").textContent = `${state.placed.size} / ${state.items.length}`;
    document.querySelector(".tier-game").classList.toggle("complete", state.placed.size === state.items.length);
  }

  function nextPrompt() {
    state.prompt = picker()();
    state.items = effectiveItems(state.prompt);
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
    state.items = effectiveItems(state.prompt);
    state.selected = null;
    state.placed.clear();
    $("tierLive").textContent = "ล้างกระดานแล้ว เริ่มจัดใหม่ได้เลย";
    render();
  });
  $("tierNext").addEventListener("click", nextPrompt);
  nextPrompt();
});
