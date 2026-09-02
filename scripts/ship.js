#!/usr/bin/env node
// เตรียมของให้พร้อม commit หลังเพิ่มโจทย์: ตรวจคลัง -> สร้างป้ายจำนวนใหม่ -> เลื่อนเลข cache
//
//   node scripts/ship.js
//
// สามอย่างนี้ลืมไม่ได้เลย:
//   1. ถ้าไม่รัน build-game-counts.js ป้ายจำนวนโจทย์บนหน้าแรกจะค้างเลขเก่า
//   2. ถ้าไม่เลื่อน CACHE_VERSION ใน sw.js คนที่เคยเปิดเว็บไว้จะไม่เห็นโจทย์ใหม่เลย
//      เพราะ service worker เสิร์ฟไฟล์เก่าจาก cache
//   3. ถ้าคลังมี ERROR แล้ว commit ไป เว็บอาจพังทั้งหน้า
const { execFileSync } = require("child_process");
const fs = require("fs");
const path = require("path");

const ROOT = path.join(__dirname, "..");
const run = (args) => execFileSync(process.execPath, args, { cwd: ROOT, stdio: "inherit" });

console.log("1/3 ตรวจคลังโจทย์");
try {
  run([path.join(__dirname, "check-content.js")]);
} catch (e) {
  console.error("\nมี ERROR ในคลังโจทย์ — แก้ให้หมดก่อน ยังไม่เลื่อน cache ให้");
  process.exit(1);
}

console.log("\n2/3 สร้างป้ายจำนวนโจทย์หน้าแรกใหม่");
run([path.join(__dirname, "build-game-counts.js")]);

console.log("\n3/3 เลื่อนเลข cache ของ service worker");
const swPath = path.join(ROOT, "sw.js");
const sw = fs.readFileSync(swPath, "utf8");
const m = sw.match(/const CACHE_VERSION = "party-games-v(\d+)";/);
if (!m) {
  console.error("หา CACHE_VERSION ใน sw.js ไม่เจอ — ต้องเลื่อนเลขเอง");
  process.exit(1);
}
const next = parseInt(m[1], 10) + 1;
fs.writeFileSync(swPath, sw.replace(m[0], 'const CACHE_VERSION = "party-games-v' + next + '";'));
console.log("  v" + m[1] + " -> v" + next);

console.log("\nพร้อม commit แล้ว");
