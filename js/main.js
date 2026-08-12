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

// ---------------------------------------------------------------------------
// เสียงเตือนหมดเวลา
// สังเคราะห์เสียงเองด้วย Web Audio API ไม่ได้โหลดไฟล์เสียงจากที่ไหน เพราะ
// (1) เล่นออฟไลน์ได้ทันทีไม่ต้องเพิ่มไฟล์ลง cache ของ service worker
// (2) เว็บโหลดเร็วเท่าเดิม ไม่มีไฟล์เสียงมาถ่วง
// เบราว์เซอร์เก่าที่ไม่มี AudioContext จะข้ามไปเงียบ ๆ ไม่พังทั้งหน้า
// ---------------------------------------------------------------------------
const PG_SOUND_KEY = "pg_sound";
let pgAudioCtx = null;

function pgSoundOn() {
  try {
    return localStorage.getItem(PG_SOUND_KEY) !== "off";
  } catch (e) {
    return true; // โหมดส่วนตัวบางเบราว์เซอร์อ่าน localStorage ไม่ได้ ให้ถือว่าเปิดเสียงไว้
  }
}

function pgSetSound(on) {
  try {
    localStorage.setItem(PG_SOUND_KEY, on ? "on" : "off");
  } catch (e) {
    /* เขียนไม่ได้ก็ปล่อยผ่าน อย่างน้อยรอบนี้ยังใช้ค่าที่กดได้ */
  }
}

// มือถือ (โดยเฉพาะ iOS) ห้ามเล่นเสียงจนกว่าผู้ใช้จะแตะหน้าจอก่อน
// เลยต้อง "ปลุก" AudioContext ตอนแตะครั้งแรก แล้วเก็บไว้ใช้ยาว ๆ
function pgPrimeAudio() {
  const Ctx = window.AudioContext || window.webkitAudioContext;
  if (!Ctx) return null;
  if (!pgAudioCtx) {
    try {
      pgAudioCtx = new Ctx();
    } catch (e) {
      return null;
    }
  }
  if (pgAudioCtx.state === "suspended") pgAudioCtx.resume();
  return pgAudioCtx;
}

document.addEventListener("pointerdown", pgPrimeAudio, { once: true });
document.addEventListener("keydown", pgPrimeAudio, { once: true });

// บี๊บ 1 ครั้ง — ใส่ envelope ขึ้น/ลงกันเสียง "แปะ" ตอนตัดคลื่นกลางลูก
function pgBeep(freq, startAt, durSec, volume) {
  const ctx = pgAudioCtx;
  if (!ctx) return;
  const t0 = ctx.currentTime + startAt;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = "triangle"; // นุ่มกว่า square แต่ยังดังพอให้ได้ยินในวงที่คุยกันเสียงดัง
  osc.frequency.setValueAtTime(freq, t0);
  gain.gain.setValueAtTime(0.0001, t0);
  gain.gain.exponentialRampToValueAtTime(volume, t0 + 0.012);
  gain.gain.exponentialRampToValueAtTime(0.0001, t0 + durSec);
  osc.connect(gain).connect(ctx.destination);
  osc.start(t0);
  osc.stop(t0 + durSec + 0.02);
}

// เสียงหมดเวลา: 3 ตัวโน้ตไล่ลง ฟังแล้วรู้ทันทีว่า "จบแล้ว" ไม่ใช่แค่เตือน
function pgTimeUpSound() {
  if (!pgSoundOn()) return;
  if (!pgPrimeAudio()) return;
  pgBeep(880, 0, 0.16, 0.28);
  pgBeep(660, 0.18, 0.16, 0.28);
  pgBeep(440, 0.36, 0.34, 0.3);
}

// เสียงติ๊กช่วงใกล้หมดเวลา (สั้นและเบากว่ามาก จะได้ไม่กลบเสียงคุยกัน)
function pgTickSound() {
  if (!pgSoundOn()) return;
  if (!pgPrimeAudio()) return;
  pgBeep(1200, 0, 0.05, 0.12);
}

// เรียกตอนหมดเวลาจริง ๆ: สั่น + มีเสียง ใช้แทน vibrateTimeout() ในทุกเกมที่จับเวลา
function pgTimeUp() {
  vibrateTimeout();
  pgTimeUpSound();
}

// ปุ่มเปิด/ปิดเสียง แปะเพิ่มให้อัตโนมัติทุกหน้าที่มีแถบเมนูบน จะได้ไม่ต้องแก้ HTML ทีละไฟล์
document.addEventListener("DOMContentLoaded", () => {
  const nav = document.querySelector(".topnav");
  if (!nav || !(window.AudioContext || window.webkitAudioContext)) return;

  const btn = document.createElement("button");
  btn.type = "button";
  btn.className = "sound-toggle";
  const paint = () => {
    const on = pgSoundOn();
    btn.textContent = on ? "🔊" : "🔇";
    btn.classList.toggle("is-off", !on);
    btn.setAttribute("aria-label", on ? "ปิดเสียงเตือนหมดเวลา" : "เปิดเสียงเตือนหมดเวลา");
    btn.title = on ? "เสียงเตือนหมดเวลา: เปิด" : "เสียงเตือนหมดเวลา: ปิด";
  };
  btn.addEventListener("click", () => {
    const next = !pgSoundOn();
    pgSetSound(next);
    paint();
    if (next) pgTimeUpSound(); // เปิดแล้วให้ลองฟังเลยว่าเสียงประมาณไหน
  });
  paint();
  nav.appendChild(btn);
});

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

// พฤติกรรมร่วมของทุกหน้า: แปะ HUD เครดิตมุมจอสไตล์ตู้เกมอาร์เคด (ตกแต่งล้วน ๆ
// pointer-events:none ไม่บังการกดอะไร และ aria-hidden กันไม่ให้ screen reader อ่าน)
document.addEventListener("DOMContentLoaded", () => {
  if (document.querySelector(".arcade-hud")) return;
  const hud = document.createElement("div");
  hud.className = "arcade-hud";
  hud.setAttribute("aria-hidden", "true");
  hud.innerHTML = '<span class="ah-credit">CREDIT 00</span><span class="ah-blink">INSERT COIN</span>';
  document.body.appendChild(hud);
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
