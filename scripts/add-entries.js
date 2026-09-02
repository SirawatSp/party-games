#!/usr/bin/env node
// ต่อโจทย์ใหม่เข้าท้ายคลัง โดยไม่ทำไฟล์เดิมพัง
//
//   node scripts/add-entries.js flashquiz new.json
//   node scripts/add-entries.js flashquiz new.json --dry     ลองดูก่อนว่าจะเขียนอะไร ยังไม่แตะไฟล์จริง
//
// new.json คือ array ของ object ตามโครงของคลังนั้น เช่น
//   [{ "question": "...", "answer": "...", "explain": "...", "tag": "science" }]
//
// ทำไมต้องใช้สคริปต์นี้แทนการแก้ไฟล์เอง:
//   คลังบางไฟล์ข้อสุดท้ายไม่มีจุลภาคปิดท้าย ถ้าต่อข้อใหม่ตรง ๆ จะได้ "} { question:" ซึ่งพัง
//   สคริปต์นี้เติมจุลภาคให้เองและตรวจโครงสร้างกับข้อซ้ำให้ก่อนเขียน
const fs = require("fs");
const path = require("path");
const { byKey, loadPool, dupValue, uiCats, DATA_DIR, POOLS } = require("./content-pools.js");

const [key, jsonPath, ...flags] = process.argv.slice(2);
const DRY = flags.includes("--dry");

if (!key || !jsonPath) {
  console.error("ใช้: node scripts/add-entries.js <คลัง> <ไฟล์.json> [--dry]");
  console.error("คลังที่ต่อท้ายได้: " + POOLS.filter((p) => p.appendable !== false).map((p) => p.key).join(", "));
  process.exit(2);
}
const pool = byKey(key);
if (!pool) {
  console.error("ไม่รู้จักคลังชื่อ " + key);
  process.exit(2);
}
if (pool.appendable === false) {
  console.error("คลัง " + key + " ต่อท้ายอัตโนมัติไม่ได้ ต้องแก้ในไฟล์เอง (ดูหมายเหตุใน scripts/content-pools.js)");
  process.exit(2);
}

let incoming;
try {
  incoming = JSON.parse(fs.readFileSync(jsonPath, "utf8"));
} catch (e) {
  console.error("อ่าน json ไม่ได้: " + e.message);
  process.exit(2);
}
if (!Array.isArray(incoming) || !incoming.length) {
  console.error("ไฟล์ json ต้องเป็น array ที่มีอย่างน้อย 1 ข้อ");
  process.exit(2);
}

const existing = loadPool(pool);
const seen = new Set(existing.map((x) => dupValue(pool, x)));
const norm = (s) => String(s).toLowerCase().replace(/[\s?!.,:;"'()]/g, "");
const seenNorm = new Set(existing.map((x) => norm(dupValue(pool, x))));
const cats = pool.catField && pool.closedCats ? uiCats(pool) : null;

const problems = [];
const keep = [];
incoming.forEach((item, i) => {
  const at = "ข้อใหม่ #" + (i + 1);
  if (typeof item !== "object" || Array.isArray(item)) {
    if (!pool.isStringArray && !pool.isPairArray) return problems.push(at + " ไม่ใช่ object");
  }
  const mayBeEmpty = new Set(pool.allowEmpty || []);
  (pool.required || []).forEach((f) => {
    const v = item[f];
    if (v === undefined || v === null) return problems.push(at + ' ขาดฟิลด์ "' + f + '"');
    if (mayBeEmpty.has(f)) return;
    if ((typeof v === "string" && !v.trim()) || (Array.isArray(v) && !v.length))
      problems.push(at + ' ฟิลด์ "' + f + '" ปล่อยว่าง');
  });
  const known = new Set([...(pool.required || []), ...(pool.optional || [])]);
  Object.keys(item).forEach((k) => {
    if (known.size && !known.has(k)) problems.push(at + ' มีฟิลด์แปลกปลอม "' + k + '"');
  });
  if (cats && cats.size && !cats.has(item[pool.catField]))
    problems.push(at + ' หมวด "' + item[pool.catField] + '" ยังไม่มีปุ่มกรองในหน้า ' + pool.page);

  const d = dupValue(pool, item);
  if (seen.has(d)) return problems.push(at + " ซ้ำกับข้อที่มีอยู่แล้ว: " + d.slice(0, 60));
  if (seenNorm.has(norm(d))) return problems.push(at + " เกือบซ้ำกับข้อเดิม (ต่างแค่วรรคตอน): " + d.slice(0, 60));
  seen.add(d);
  seenNorm.add(norm(d));
  keep.push(item);
});

if (problems.length) {
  console.error("ไม่เขียนอะไรเลย เพราะเจอปัญหา " + problems.length + " จุด:");
  problems.forEach((p) => console.error("  x " + p));
  process.exit(1);
}

// เขียนเป็น object literal สไตล์เดียวกับไฟล์เดิม: คีย์ไม่ใส่เครื่องหมายคำพูด ค่าสตริงใช้ "
function lit(v) {
  if (typeof v === "string") return JSON.stringify(v);
  if (Array.isArray(v)) return "[" + v.map(lit).join(", ") + "]";
  return String(v);
}
function line(item) {
  const order = [...(pool.required || []), ...(pool.optional || [])];
  const keys = order.filter((k) => item[k] !== undefined);
  return "  { " + keys.map((k) => k + ": " + lit(item[k])).join(", ") + " },";
}

const file = path.join(DATA_DIR, pool.file);
const src = fs.readFileSync(file, "utf8");
const close = src.lastIndexOf("\n];");
if (close < 0) {
  console.error("หาจุดปิด array ในไฟล์ไม่เจอ — ต้องแก้ไฟล์เอง");
  process.exit(1);
}
let head = src.slice(0, close);
// ข้อสุดท้ายของไฟล์เดิมอาจไม่มีจุลภาคปิดท้าย ต้องเติมก่อน ไม่งั้นต่อข้อใหม่แล้วพัง
if (!/[,[]\s*$/.test(head)) head += ",";
const out = head + "\n" + keep.map(line).join("\n") + src.slice(close);

if (DRY) {
  console.log("--dry: จะเพิ่ม " + keep.length + " ข้อเข้า data/" + pool.file + " แบบนี้");
  keep.slice(0, 5).forEach((x) => console.log(line(x)));
  if (keep.length > 5) console.log("  ... อีก " + (keep.length - 5) + " ข้อ");
  process.exit(0);
}

fs.writeFileSync(file, out);
console.log("เพิ่ม " + keep.length + " ข้อเข้า data/" + pool.file + " แล้ว (รวมเป็น " + (existing.length + keep.length) + " ข้อ)");
console.log("ขั้นถัดไป: node scripts/check-content.js " + pool.key + " --new " + keep.length);
