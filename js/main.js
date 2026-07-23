// เปิดโหมดออฟไลน์: เก็บ cache ทั้งเว็บไว้ในเครื่องตั้งแต่เปิดครั้งแรก (มีเน็ต)
// ครั้งต่อไปเปิดเล่นได้แม้ไม่มีเน็ตเลย เหมาะกับเล่นตอนเดินทางต่างประเทศประหยัดเน็ต
if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("sw.js").catch(() => {});
  });
}

// ตัวสุ่มแบบ "shuffle bag" ใช้ร่วมกันทุกเกม: การันตีว่าทุกข้อในลิสต์จะถูกสุ่มขึ้นมา
// ครบทุกตัวก่อนที่จะเริ่มวนซ้ำ และตอนวนรอบใหม่ก็จะไม่ออกซ้ำกับตัวสุดท้ายของรอบก่อน
// ทำให้สุ่มได้กระจายจริง ไม่ออกซ้ำในเวลาใกล้กันหรือเดาลำดับได้
function createPicker(list) {
  let bag = [];
  let lastIdx = null;

  function refill() {
    bag = list.map((_, i) => i);
    for (let i = bag.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [bag[i], bag[j]] = [bag[j], bag[i]];
    }
    // กันไม่ให้ตัวแรกของถุงใหม่ซ้ำกับตัวสุดท้ายที่เพิ่งออกไปตอนจบถุงก่อน
    if (bag.length > 1 && bag[bag.length - 1] === lastIdx) {
      [bag[bag.length - 1], bag[0]] = [bag[0], bag[bag.length - 1]];
    }
  }

  return function pick() {
    if (!list.length) return undefined;
    if (bag.length === 0) refill();
    const idx = bag.pop();
    lastIdx = idx;
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
