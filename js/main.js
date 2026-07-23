// เปิดโหมดออฟไลน์: เก็บ cache ทั้งเว็บไว้ในเครื่องตั้งแต่เปิดครั้งแรก (มีเน็ต)
// ครั้งต่อไปเปิดเล่นได้แม้ไม่มีเน็ตเลย เหมาะกับเล่นตอนเดินทางต่างประเทศประหยัดเน็ต
if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("sw.js").catch(() => {});
  });
}

// แฮชเนื้อหาโจทย์แบบสั้น ๆ ใช้เป็น "ลายนิ้วมือ" ของแต่ละข้อ กันปัญหา index เลื่อนตอนมีการ
// เพิ่ม/แทรกโจทย์ใหม่เข้าคลังทีหลัง (อ้างอิงตามเนื้อหาจริง ไม่ใช่ตำแหน่งในลิสต์)
function pgHash(item) {
  const s = JSON.stringify(item);
  let h = 5381;
  for (let i = 0; i < s.length; i++) {
    h = ((h << 5) + h + s.charCodeAt(i)) | 0;
  }
  return h.toString(36);
}

// ตัวสุ่มแบบ "shuffle bag" ใช้ร่วมกันทุกเกม: การันตีว่าทุกข้อในลิสต์จะถูกสุ่มขึ้นมา
// ครบทุกตัวก่อนที่จะเริ่มวนซ้ำ และตอนวนรอบใหม่ก็จะไม่ออกซ้ำกับตัวสุดท้ายของรอบก่อน
// ถ้าใส่ storageKey มาด้วย จะจำว่าข้อไหนออกไปแล้วลง localStorage ทำให้ต่อให้ปิดแอป/รีเฟรช
// หน้าเว็บแล้วกลับเข้ามาเล่นใหม่ ก็จะยังไม่ออกซ้ำกับที่เพิ่งเล่นไปจนกว่าจะครบรอบคลังจริง ๆ
function createPicker(list, storageKey) {
  let used = new Set();
  let lastKey = null;
  const keys = list.map(pgHash);

  function load() {
    if (!storageKey) return;
    try {
      const raw = localStorage.getItem(storageKey);
      if (!raw) return;
      const saved = JSON.parse(raw);
      if (Array.isArray(saved.used)) used = new Set(saved.used);
      if (typeof saved.lastKey === "string") lastKey = saved.lastKey;
    } catch (e) {
      // localStorage ใช้ไม่ได้ (เช่น โหมดส่วนตัว) ก็แค่สุ่มแบบไม่มีความจำข้ามเซสชัน
    }
  }

  function save() {
    if (!storageKey) return;
    try {
      localStorage.setItem(storageKey, JSON.stringify({ used: Array.from(used), lastKey }));
    } catch (e) {}
  }

  load();

  return function pick() {
    if (!list.length) return undefined;
    let remaining = [];
    for (let i = 0; i < list.length; i++) {
      if (!used.has(keys[i])) remaining.push(i);
    }
    if (remaining.length === 0) {
      used = new Set();
      remaining = list.map((_, i) => i);
    }
    // กันไม่ให้ออกซ้ำกับตัวล่าสุดที่เพิ่งออกไป (ทั้งในเซสชันนี้และเซสชันก่อนถ้าจำไว้)
    if (remaining.length > 1 && lastKey !== null) {
      const filtered = remaining.filter((i) => keys[i] !== lastKey);
      if (filtered.length) remaining = filtered;
    }
    const idx = remaining[Math.floor(Math.random() * remaining.length)];
    used.add(keys[idx]);
    lastKey = keys[idx];
    save();
    return list[idx];
  };
}

// สั่นมือถือสั้น ๆ ตอนตัวจับเวลานับถอยหลังหมด (เบราว์เซอร์ที่ไม่รองรับ Vibration API จะข้ามเงียบ ๆ)
function vibrateTimeout() {
  if (navigator.vibrate) navigator.vibrate([120, 60, 120]);
}

// หน้าแรก: แปะ label จำนวนโจทย์ปัจจุบันบนการ์ดแต่ละเกม (ข้อมูลมาจาก data/game-counts.js
// ซึ่งสร้างอัตโนมัติจากคลังโจทย์จริง จะได้เช็คได้ตลอดว่าเกมไหนคลังเยอะหรือน้อย)
document.addEventListener("DOMContentLoaded", () => {
  if (typeof GAME_COUNTS === "undefined") return;
  document.querySelectorAll(".card[href]").forEach((card) => {
    const info = GAME_COUNTS[card.getAttribute("href")];
    if (!info) return;
    const badge = document.createElement("span");
    badge.className = "card-count";
    badge.textContent = info.count.toLocaleString("th-TH") + " " + info.unit;
    card.appendChild(badge);
  });
});

// พฤติกรรมร่วมของทุกหน้า: scroll-reveal animation
document.addEventListener("DOMContentLoaded", () => {
  const items = document.querySelectorAll(".reveal-up");
  if (!items.length) return;
  const io = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      if (e.isIntersecting) {
        e.target.classList.add("in");
        io.unobserve(e.target);
      }
    });
  }, { threshold: 0.15 });
  items.forEach((el) => io.observe(el));
});
