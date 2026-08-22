// สร้าง data/worldmap.js — แผนที่โลกแบบเส้น SVG สำหรับเกม "ทายถนน"
//
// ที่มาข้อมูลรูปร่างประเทศ: แพ็กเกจ world-atlas 2.0.2 (ไฟล์ countries-110m.json)
// ซึ่งแปลงมาจาก Natural Earth 1:110m — Natural Earth เป็นสาธารณสมบัติ (public domain)
// ที่มารหัสประเทศ/พิกัดกลางประเทศ: แพ็กเกจ world-countries 5.1.0 (ODbL 1.0)
//
// วิธีใช้ (ต้องมีแพ็กเกจสามตัวข้างล่างวางไว้ในโฟลเดอร์เดียวกันก่อน ไม่ได้ผูกกับ CI):
//   node scripts/build-worldmap.js <countries-110m.json> <world-countries/countries.json> <topojson-client.js>
//
// สคริปต์นี้รันมือครั้งเดียวแล้ว commit ผลลัพธ์ เว็บนี้ไม่มีขั้นตอน build ตอน deploy
// ฉายภาพแบบ equirectangular: x = (lon+180)/360*W, y = (90-lat)/180*H
// เขตแดนบนแผนที่ใช้เพื่อความบันเทิงเท่านั้น ไม่ใช่การรับรองเขตแดนอย่างเป็นทางการ

const fs = require("fs");

const [topoPath, wcPath, tjcPath] = process.argv.slice(2);
const topojson = require(tjcPath);
const topo = JSON.parse(fs.readFileSync(topoPath, "utf8"));
const wc = JSON.parse(fs.readFileSync(wcPath, "utf8"));

const W = 2000;
const H = 1000;
const PREC = 1; // ทศนิยม 1 ตำแหน่งบนผืนผ้าใบ 2000 หน่วย ≈ ละเอียดราว 20 กม. พอสำหรับแผนที่ทายพิกัด

const byNum = {};
wc.forEach((c) => {
  if (c.ccn3) byNum[String(parseInt(c.ccn3, 10))] = c;
});

const geo = topojson.feature(topo, topo.objects.countries);

// ชื่อไทยดึงจากคลังของเกม "ต่อพรมแดน" ที่เขียนไว้แล้ว 155 ประเทศ (data/borderchain.js)
// เหลือแต่ประเทศเกาะที่ไม่มีพรมแดนทางบก จึงไม่ได้อยู่ในเกมนั้น ต้องเติมชื่อไทยเพิ่มตรงนี้
const EXTRA_TH = {
  AUS: "ออสเตรเลีย",
  BHS: "บาฮามาส",
  CUB: "คิวบา",
  CYP: "ไซปรัส",
  FJI: "ฟิจิ",
  ISL: "ไอซ์แลนด์",
  JAM: "จาเมกา",
  JPN: "ญี่ปุ่น",
  LKA: "ศรีลังกา",
  MDG: "มาดากัสการ์",
  NZL: "นิวซีแลนด์",
  PHL: "ฟิลิปปินส์",
  SLB: "หมู่เกาะโซโลมอน",
  TTO: "ตรินิแดดและโตเบโก",
  VUT: "วานูอาตู",
};

const TH = Object.assign({}, EXTRA_TH);
const bcSrc = fs.readFileSync(__dirname + "/../data/borderchain.js", "utf8");
const bcRe = /code: "([A-Z]{3})", th: "([^"]+)"/g;
let bcM;
while ((bcM = bcRe.exec(bcSrc))) TH[bcM[1]] = bcM[2];

function px(lon) {
  return ((lon + 180) / 360) * W;
}
function py(lat) {
  return ((90 - lat) / 180) * H;
}
function r(n) {
  return Number(n.toFixed(PREC));
}

// แปลงวงรอบเป็นคำสั่ง path พร้อมตัดจุดที่ซ้ำกับจุดก่อนหน้าหลังปัดเศษ (ลดขนาดไฟล์)
function ringToPath(ring) {
  let d = "";
  let lastX = null;
  let lastY = null;
  let count = 0;
  for (const [lon, lat] of ring) {
    const x = r(px(lon));
    const y = r(py(lat));
    if (x === lastX && y === lastY) continue;
    d += (count === 0 ? "M" : "L") + x + " " + y;
    lastX = x;
    lastY = y;
    count++;
  }
  return count >= 3 ? d + "Z" : "";
}

function polysOf(g) {
  if (!g) return [];
  if (g.type === "Polygon") return [g.coordinates];
  if (g.type === "MultiPolygon") return g.coordinates;
  return [];
}

const out = [];
// รูปร่างที่ไม่มีรหัส ISO ตัวเลข (ดินแดนที่สถานะยังเป็นข้อพิพาท) วาดเป็นพื้นดินเฉย ๆ
// ไม่ใส่ชื่อและไม่ให้เลือกตอบ เพื่อไม่ให้แผนที่มีรูโหว่ และไม่ต้องตัดสินสถานะทางการเมือง
const filler = [];

geo.features.forEach((f) => {
  const info = byNum[String(parseInt(f.id, 10))];
  // ตั้งชื่อเฉพาะรัฐสมาชิกสหประชาชาติ ให้ตรงกับเกณฑ์ที่เกม "ต่อพรมแดน" ใช้อยู่แล้ว
  // ที่เหลือ (แอนตาร์กติกา ดินแดนในปกครอง ดินแดนพิพาท) วาดเป็นพื้นดินไม่มีชื่อ
  if (!info || !info.unMember) {
    let fd = "";
    polysOf(f.geometry).forEach((poly) => {
      poly.forEach((ring) => {
        fd += ringToPath(ring);
      });
    });
    if (fd) filler.push(fd);
    return;
  }
  let d = "";
  polysOf(f.geometry).forEach((poly) => {
    poly.forEach((ring) => {
      d += ringToPath(ring);
    });
  });
  if (!d) return;
  if (!TH[info.cca3]) throw new Error("ยังไม่มีชื่อไทยของ " + info.cca3 + " (" + info.name.common + ")");
  out.push({
    code: info.cca3,
    th: TH[info.cca3],
    en: info.name.common,
    lat: info.latlng[0],
    lon: info.latlng[1],
    d: d,
  });
});

out.sort((a, b) => a.code.localeCompare(b.code));

// ประเทศจิ๋วอย่างโมนาโก ซานมารีโน วาติกัน เล็กเกินกว่าจะมีรูปร่างในข้อมูล 1:110m
// แต่เกม "ต่อพรมแดน" มีประเทศพวกนี้อยู่ ถ้าไม่วาดอะไรเลย ตอบถูกแล้วแผนที่จะเงียบ
// จึงเก็บเป็นจุดพร้อมพิกัดกลางประเทศไว้ ให้วาดเป็นวงกลมเล็ก ๆ แทนรูปร่าง
const haveShape = {};
out.forEach((c) => (haveShape[c.code] = true));
const dots = [];
const seenDot = {};
const dotRe = /code: "([A-Z]{3})"/g;
let dotM;
while ((dotM = dotRe.exec(bcSrc))) {
  const code = dotM[1];
  if (haveShape[code] || seenDot[code]) continue;
  seenDot[code] = true;
  const info = wc.find((c) => c.cca3 === code);
  if (!info) throw new Error("ไม่รู้จักประเทศ " + code + " จึงหาพิกัดกลางประเทศไม่ได้");
  if (!TH[code]) throw new Error("ยังไม่มีชื่อไทยของ " + code);
  dots.push({ code: code, th: TH[code], en: info.name.common, lat: info.latlng[0], lon: info.latlng[1] });
}
dots.sort((a, b) => a.code.localeCompare(b.code));
console.error("dot countries " + dots.length + ": " + dots.map((d) => d.code).join(" "));

console.error("matched " + out.length + " countries, filler shapes " + filler.length);

const header = [
  '// แผนที่โลกแบบเส้น SVG สำหรับเกม "ทายถนน" — ไฟล์นี้สร้างด้วย scripts/build-worldmap.js อย่าแก้มือ',
  "//",
  "// รูปร่างประเทศ: Natural Earth 1:110m (สาธารณสมบัติ) ผ่านแพ็กเกจ world-atlas 2.0.2",
  "// รหัสประเทศและพิกัดกลางประเทศ: แพ็กเกจ world-countries 5.1.0 (ODbL 1.0)",
  "//",
  "// ระบบพิกัด: equirectangular บนผืนผ้าใบ " + W + "x" + H + " หน่วย",
  "//   x = (lon + 180) / 360 * " + W + "   ,   y = (90 - lat) / 180 * " + H,
  "// countries = รัฐสมาชิกสหประชาชาติที่มีชื่อและเลือกตอบได้ เก็บเป็นรูปร่าง path",
  "// dots      = ประเทศจิ๋วที่เล็กเกินกว่าจะมีรูปร่างในข้อมูล 1:110m (โมนาโก วาติกัน ฯลฯ)",
  "//             เก็บแค่พิกัดกลางประเทศไว้ ให้วาดเป็นวงกลมเล็ก ๆ แทน",
  "// filler    = รูปร่างพื้นดินที่ไม่ตั้งชื่อ (แอนตาร์กติกา ดินแดนในปกครอง ดินแดนพิพาท)",
  "//             วาดไว้ไม่ให้แผนที่มีรูโหว่ แต่ไม่นับเป็นคำตอบและไม่แสดงชื่อ",
  "//",
  "// เส้นเขตแดนบนแผนที่นี้ใช้เพื่อความบันเทิงเท่านั้น ไม่ใช่การรับรองเขตแดนอย่างเป็นทางการ",
  "",
  "const WORLD_MAP = {",
  "  width: " + W + ",",
  "  height: " + H + ",",
  "  countries: [",
].join("\n");

const body = out
  .map(
    (c) =>
      "    { code: " +
      JSON.stringify(c.code) +
      ", th: " +
      JSON.stringify(c.th) +
      ", en: " +
      JSON.stringify(c.en) +
      ", lat: " +
      c.lat +
      ", lon: " +
      c.lon +
      ", d: " +
      JSON.stringify(c.d) +
      " },"
  )
  .join("\n");

const tail = [
  "  ],",
  "  dots: [",
  dots
    .map(
      (d) =>
        "    { code: " + JSON.stringify(d.code) + ", th: " + JSON.stringify(d.th) +
        ", en: " + JSON.stringify(d.en) + ", lat: " + d.lat + ", lon: " + d.lon + " },"
    )
    .join("\n"),
  "  ],",
  "  filler: [",
  filler.map((d) => "    " + JSON.stringify(d) + ",").join("\n"),
  "  ],",
  "};",
  "",
].join("\n");

fs.writeFileSync(process.env.OUT || "/dev/stdout", header + "\n" + body + "\n" + tail);
