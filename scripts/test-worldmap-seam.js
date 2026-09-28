#!/usr/bin/env node
// ตรวจว่าเส้นประเทศที่คร่อมขอบโลกไม่พาดทับแผนที่ทั้งผืน
const assert = require("node:assert/strict");
const fs = require("node:fs");
const vm = require("node:vm");
const path = require("node:path");

const root = path.join(__dirname, "..");
const source = ["data/worldmap.js", "js/worldmap.js"]
  .map((file) => fs.readFileSync(path.join(root, file), "utf8"))
  .join("\n");
const { WORLD_MAP, wmCountryPath } = vm.runInNewContext(source + "\n;({ WORLD_MAP, wmCountryPath })");

let changed = 0;
for (const country of WORLD_MAP.countries) {
  const safe = wmCountryPath(country);
  if (safe !== country.d) changed++;
  for (const ring of safe.split("Z").filter(Boolean)) {
    const xs = Array.from(ring.matchAll(/[ML](-?[\d.]+) -?[\d.]+/g), (match) => Number(match[1]));
    assert.ok(xs.length >= 3, country.code + " มีรูปปิดไม่ครบ");
    xs.forEach((x, i) => {
      assert.ok(x >= 0 && x <= WORLD_MAP.width, country.code + " เลยขอบแผนที่");
      const next = xs[(i + 1) % xs.length];
      assert.ok(Math.abs(x - next) <= WORLD_MAP.width / 2, country.code + " มีเส้นพาดข้ามโลก");
    });
  }
}
assert.equal(changed, 2, "ควรตัดรูปเฉพาะรัสเซียกับฟิจิในข้อมูลชุดนี้");
console.log("แผนที่ผ่าน: รูปประเทศทั้งหมดไม่มีเส้นพาดข้ามโลก");
