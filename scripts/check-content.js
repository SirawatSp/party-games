#!/usr/bin/env node
// ตรวจคลังโจทย์ทุกเกมก่อน commit — ไม่ต้องติดตั้งอะไรเพิ่ม ใช้ node เปล่า ๆ
//
//   node scripts/check-content.js                     ตรวจทุกคลัง
//   node scripts/check-content.js flashquiz           ตรวจเฉพาะคลังเดียว
//   node scripts/check-content.js flashquiz --new 20  ตรวจทุกอย่างเหมือนเดิม แต่โชว์ REVIEW
//                                                     เฉพาะที่เกี่ยวกับ 20 ข้อท้ายสุด (ข้อที่เพิ่งเพิ่ม)
//
// ใช้ --new ทุกครั้งที่เพิ่มโจทย์ประจำวัน ไม่งั้นจะเจอ REVIEW ของข้อเก่าที่ตรวจไปแล้วเต็มไปหมด
//
// ออกด้วยรหัส 1 ถ้าเจอ ERROR (ห้าม commit) และรหัส 0 ถ้ามีแต่ REVIEW (ให้คนอ่านแล้วตัดสินเอง)
const { POOLS, byKey, loadPool, dupValue, uiCats } = require("./content-pools.js");

const argv = process.argv.slice(2);
const newIdx = argv.indexOf("--new");
const NEW_N = newIdx >= 0 ? parseInt(argv[newIdx + 1], 10) || 0 : 0;
const only = argv.find((a) => !a.startsWith("--") && a !== String(NEW_N));
const pools = only ? [byKey(only)].filter(Boolean) : POOLS;
if (only && !pools.length) {
  console.error("ไม่รู้จักคลังชื่อ " + only + " — มีให้เลือก: " + POOLS.map((p) => p.key).join(", "));
  process.exit(2);
}

// บางหน้าใช้ปุ่มกรองชุดเดียวร่วมกันหลายคลัง (เช่น trivia.html คุมทั้ง WORLD_TRIVIA และ WORLD_TRIVIA_QA)
// จึงต้องรวมหมวดของทุกคลังในหน้านั้นก่อน ค่อยตัดสินว่ามีปุ่มไหน "ไม่มีโจทย์รองรับ" จริง ๆ
const catsByPage = new Map();
POOLS.forEach((p) => {
  if (!p.catField) return;
  if (!catsByPage.has(p.page)) catsByPage.set(p.page, new Set());
  try {
    loadPool(p).forEach((x) => catsByPage.get(p.page).add(x[p.catField]));
  } catch (e) { /* ไฟล์พัง — เดี๋ยวรายงานตอนตรวจคลังนั้น */ }
});

const errors = [];
const reviews = [];
const err = (pool, msg) => errors.push(pool.key + ": " + msg);
// isNew = REVIEW นี้แตะข้อที่เพิ่งเพิ่มเข้ามาหรือเปล่า ถ้าสั่ง --new จะกรองเอาเฉพาะอันที่ใช่
const rev = (pool, msg, isNew) => reviews.push({ msg: pool.key + ": " + msg, isNew: isNew !== false });

// ตัดช่องว่าง เครื่องหมายวรรคตอน และคำลงท้ายออก เพื่อจับคำถามที่เขียนต่างกันนิดเดียวแต่ถามเรื่องเดียวกัน
function normalize(s) {
  return String(s)
    .toLowerCase()
    .replace(/[\s​]+/g, "")
    .replace(/[?!.,:;"'`~\-–—()[\]{}]/g, "")
    .replace(/(คืออะไร|คือข้อใด|ข้อใด|อะไรบ้าง|ใช่ไหม|หรือไม่|เท่าไหร่|เท่าไร|กี่)/g, "");
}

// อักขระที่ยอมให้มีได้: ไทย ละติน ตัวเลข วรรคตอนพื้นฐาน สัญลักษณ์คณิต/หน่วยที่ใช้จริง และ emoji
const ALLOWED = /[฀-๿ -~ -ÿ‐-※−°²³ΔΩπµ]/;
const isAllowed = (ch) => ALLOWED.test(ch) || /\p{Extended_Pictographic}|️|‍/u.test(ch);

function textFields(pool, item) {
  if (pool.isStringArray) return [["value", item]];
  if (pool.isPairArray) return item.map((v, i) => ["ขั้ว" + (i + 1), v]);
  return Object.entries(item)
    .filter(([, v]) => typeof v === "string")
    .concat(
      Object.entries(item)
        .filter(([, v]) => Array.isArray(v))
        .flatMap(([k, v]) => v.map((s, i) => [k + "[" + i + "]", s]))
    );
}

for (const pool of pools) {
  let list;
  try {
    list = loadPool(pool);
  } catch (e) {
    err(pool, "โหลดไฟล์ไม่ผ่าน (syntax พัง?) — " + e.message);
    continue;
  }
  if (!Array.isArray(list) || !list.length) {
    err(pool, "ไม่ใช่ array หรือว่างเปล่า");
    continue;
  }

  const allowedCats = pool.catField && pool.closedCats ? uiCats(pool) : null;
  const existingCats = new Set();
  const seen = new Map();
  const normSeen = new Map();
  const byAnswer = new Map();
  const firstNew = NEW_N > 0 ? list.length - NEW_N : 0;

  list.forEach((item, i) => {
    const at = "ข้อ #" + (i + 1);

    // ---- โครงสร้าง ----
    if (pool.isStringArray) {
      if (typeof item !== "string" || !item.trim()) err(pool, at + " ต้องเป็นข้อความไม่ว่าง");
    } else if (pool.isPairArray) {
      if (!Array.isArray(item) || item.length !== 2 || item.some((v) => !String(v || "").trim()))
        err(pool, at + " ต้องเป็น array 2 ช่องและห้ามว่าง");
    } else {
      const mayBeEmpty = new Set(pool.allowEmpty || []);
      (pool.required || []).forEach((f) => {
        const v = item[f];
        if (v === undefined || v === null)
          return err(pool, at + ' ขาดฟิลด์ "' + f + '" — ' + JSON.stringify(item).slice(0, 90));
        // ฟิลด์ใน allowEmpty ต้องมีอยู่จริง แต่เป็นสตริงว่างได้ (เช่น unit ของคำถามที่ตอบเป็นปี)
        if (mayBeEmpty.has(f)) return;
        const empty = (typeof v === "string" && !v.trim()) || (Array.isArray(v) && !v.length);
        if (empty) err(pool, at + ' ฟิลด์ "' + f + '" ปล่อยว่าง — ' + JSON.stringify(item).slice(0, 90));
      });
      const known = new Set([...(pool.required || []), ...(pool.optional || [])]);
      Object.keys(item).forEach((k) => {
        if (!known.has(k)) err(pool, at + ' มีฟิลด์แปลกปลอม "' + k + '" (พิมพ์ชื่อฟิลด์ผิดหรือเปล่า)');
      });
    }

    // ---- ชนิดของคำตอบ ----
    if (pool.numericAnswer && typeof item.answer !== "number")
      err(pool, at + " answer ต้องเป็นตัวเลขล้วน ไม่ใส่หน่วยปนมา (หน่วยไปไว้ในฟิลด์ unit)");
    if (pool.booleanAnswer && typeof item.answer !== "boolean")
      err(pool, at + " answer ต้องเป็น true หรือ false");
    if (pool.maxAnswerLen && typeof item.answer === "string" && item.answer.length > pool.maxAnswerLen)
      err(pool, at + " คำตอบยาวเกิน " + pool.maxAnswerLen + " ตัวอักษร — เกมนี้ต้องพูดคำตอบออกเสียงให้คนอื่นฟัง");
    if (pool.choicesRange && Array.isArray(item.choices)) {
      const [lo, hi] = pool.choicesRange;
      if (item.choices.length < lo || item.choices.length > hi)
        err(pool, at + " ต้องมีตัวเลือก " + lo + "-" + hi + " อย่าง (ตอนนี้ " + item.choices.length + ")");
      if (new Set(item.choices).size !== item.choices.length)
        err(pool, at + " มีตัวเลือกซ้ำกันเอง");
    }

    // ---- คำอธิบาย ----
    if ((pool.required || []).includes("explain")) {
      const ex = String(item.explain || "").trim();
      if (ex.length < 15)
        err(pool, at + " คำอธิบายสั้นเกินไป (ต้องอย่างน้อย 15 ตัวอักษร) — " + JSON.stringify(item.explain));
      if (ex === String(item.answer).trim())
        err(pool, at + " คำอธิบายซ้ำกับคำตอบเป๊ะ ๆ ไม่ได้เพิ่มความรู้อะไร");
    }

    // ---- หมวด ----
    if (pool.catField) {
      const c = item[pool.catField];
      existingCats.add(c);
      if (allowedCats && allowedCats.size && !allowedCats.has(c))
        err(pool, at + ' ใช้หมวด "' + c + '" ที่หน้าเว็บยังไม่รู้จัก — ต้องไปเพิ่มปุ่มกรองใน ' +
          pool.page + " และชื่อหมวดใน " + pool.script + " ก่อน");
    }

    // ---- ตัวหนังสือ ----
    textFields(pool, item).forEach(([field, val]) => {
      const s = String(val);
      if (/<[a-z/!]/i.test(s)) err(pool, at + " ฟิลด์ " + field + " มีแท็ก HTML ปนมา");
      if (s !== s.trim()) err(pool, at + " ฟิลด์ " + field + " มีช่องว่างหัวหรือท้าย");
      if (/\s{2,}/.test(s)) rev(pool, at + " ฟิลด์ " + field + " มีเว้นวรรคซ้อนกัน", i >= firstNew);
      for (const ch of s) {
        if (!isAllowed(ch)) {
          err(pool, at + " ฟิลด์ " + field + " มีอักขระแปลกปลอม U+" +
            ch.codePointAt(0).toString(16).toUpperCase().padStart(4, "0") + " [" + ch + "] — " + s.slice(0, 50));
          break;
        }
      }
    });

    // ---- ซ้ำ ----
    const raw = dupValue(pool, item);
    if (seen.has(raw)) err(pool, "ซ้ำเป๊ะกับ " + seen.get(raw) + " — " + raw.slice(0, 70));
    else seen.set(raw, at);

    const norm = normalize(raw);
    if (norm.length > 6) {
      if (normSeen.has(norm)) rev(pool, "อาจซ้ำกับ " + normSeen.get(norm) + " — " + raw.slice(0, 70), true);
      else normSeen.set(norm, at);
    }

    if (pool.answerField && item[pool.answerField] !== undefined) {
      const a = String(item[pool.answerField]).trim().toLowerCase();
      if (!byAnswer.has(a)) byAnswer.set(a, []);
      byAnswer.get(a).push({ q: raw, isNew: i >= firstNew });
    }
  });

  // คำตอบชนกันไม่ผิดเสมอไป (ประเทศ ศิลปิน ปี ซ้ำกันได้) แต่ให้คนอ่านตรวจว่าไม่ใช่คำถามเดียวกันเขียนคนละแบบ
  byAnswer.forEach((qs, a) => {
    if (qs.length > 1 && a.length > 1)
      rev(pool, 'คำตอบ "' + a + '" ใช้ร่วมกัน ' + qs.length + " ข้อ: " +
        qs.map((q) => q.q.slice(0, 46)).join("  ↔  "), qs.some((q) => q.isNew));
  });

  if (pool.minPerCat) {
    const per = {};
    list.forEach((x) => (per[x[pool.catField]] = (per[x[pool.catField]] || 0) + 1));
    Object.entries(per).forEach(([c, n]) => {
      if (n < pool.minPerCat) err(pool, 'หมวด "' + c + '" มีแค่ ' + n + " คำ ต้องมีอย่างน้อย " + pool.minPerCat);
    });
  }

  // หมวดที่หน้าเว็บมีปุ่มให้กด แต่ไม่มีโจทย์เหลืออยู่เลย = กดแล้วจอว่าง
  if (allowedCats) {
    const pageCats = catsByPage.get(pool.page) || existingCats;
    [...allowedCats].forEach((c) => {
      if (!pageCats.has(c))
        err(pool, 'หน้า ' + pool.page + ' มีปุ่มหมวด "' + c + '" แต่ไม่มีโจทย์ในหมวดนั้นเลย กดแล้วจอจะว่าง');
    });
  }

  const cats = pool.catField ? " · " + existingCats.size + " หมวด" : "";
  console.log("  " + pool.key.padEnd(14) + String(list.length).padStart(5) + " ข้อ" + cats + "   " + pool.label);
}

console.log("");
const shown = NEW_N > 0 ? reviews.filter((r) => r.isNew) : reviews;
const hidden = reviews.length - shown.length;
if (shown.length) {
  console.log("REVIEW (" + shown.length + ") — ไม่ได้ผิดเสมอไป ให้คนอ่านตัดสินเองทีละคู่:");
  shown.forEach((r) => console.log("  ~ " + r.msg));
  console.log("");
}
if (hidden) console.log("(ซ่อน REVIEW ของข้อเก่าไว้ " + hidden + " รายการ เพราะสั่ง --new " + NEW_N + ")\n");
if (errors.length) {
  console.log("ERROR (" + errors.length + ") — ต้องแก้ก่อน commit:");
  errors.forEach((m) => console.log("  x " + m));
  process.exit(1);
}
console.log("ผ่านหมด " + pools.length + " คลัง ไม่มี ERROR");
