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
const fs = require("fs");
const path = require("path");
const ROOT = path.join(__dirname, "..");

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

// ชื่ออื่นใช้ตอบได้เหมือนเฉลย จึงห้ามชนกันข้ามรูป แม้อยู่คนละหมวด
function checkPicturePool(pool, list) {
  const names = new Map();
  const files = new Map();
  const images = new Map();
  const normalizeName = (s) => s.normalize("NFKC").toLowerCase().replace(/[\p{P}\p{Z}\s\u200b-\u200d\ufeff]/gu, "");
  const isWebUrl = (s) => {
    if (typeof s !== "string" || !s.trim()) return false;
    try { return ["http:", "https:"].includes(new URL(s).protocol); }
    catch (e) { return false; }
  };
  const readOptional = (file) => fs.existsSync(file) ? fs.readFileSync(file, "utf8") : "";
  const credits = readOptional(path.join(ROOT, "assets/picture-reveal/CREDITS.md"));
  const sw = readOptional(path.join(ROOT, "sw.js"));
  list.forEach((item, i) => {
    const at = "ข้อ #" + (i + 1);
    (pool.required || []).forEach((field) => {
      if (typeof item[field] !== "string") err(pool, at + " ฟิลด์ " + field + " ต้องเป็นข้อความ");
    });
    if (item.aliases !== undefined && (!Array.isArray(item.aliases) || !item.aliases.length
      || item.aliases.some((s) => typeof s !== "string" || !s.trim())))
      err(pool, at + " aliases ต้องเป็นรายชื่อข้อความไม่ว่าง หรือไม่ใส่ฟิลด์นี้");
    const aliases = Array.isArray(item.aliases) ? item.aliases : [];
    [item.answer, ...aliases].filter((s) => typeof s === "string").forEach((name) => {
      const key = normalizeName(name);
      if (!key) return err(pool, at + " มีชื่อคำตอบที่ไม่มีตัวอักษรหรือตัวเลข");
      if (names.has(key) && names.get(key) !== at)
        err(pool, at + " คำตอบหรือชื่ออื่นซ้ำกับ " + names.get(key) + " — " + name);
      else names.set(key, at);
    });
    if (typeof item.sourceFile === "string") {
      const key = item.sourceFile.normalize("NFKC").toLowerCase();
      if (files.has(key)) err(pool, at + " sourceFile ซ้ำกับ " + files.get(key) + " — " + item.sourceFile);
      else files.set(key, at);
    }
    ["source", "rightsUrl"].forEach((field) => {
      if (!isWebUrl(item[field])) err(pool, at + " ฟิลด์ " + field + " ต้องเป็น URL แบบ http หรือ https");
    });
    ["image", "fallback"].forEach((field) => {
      if (field === "fallback" && item[field] === undefined) return;
      const value = item[field];
      let key;
      if (isWebUrl(value)) {
        const url = new URL(value);
        url.hash = "";
        // พารามิเตอร์ติดตามไม่เปลี่ยนตัวภาพ
        [...url.searchParams.keys()].filter((k) => k.startsWith("utm_")).forEach((k) => url.searchParams.delete(k));
        key = url.href;
      } else if (typeof value === "string" && /^assets\/picture-reveal\/[^/]+\.(?:jpg|jpeg|png|webp)$/i.test(value)) {
        key = value;
      } else {
        err(pool, at + " ฟิลด์ " + field + " ต้องเป็น URL ภาพ หรือไฟล์ใน assets/picture-reveal/");
        return;
      }
      if (images.has(key) && images.get(key) !== at) err(pool, at + " ภาพซ้ำกับ " + images.get(key) + " — " + value);
      else images.set(key, at);
    });
    if (item.cat === "thai_food") {
      const image = item.image;
      if (typeof image !== "string" || !/^assets\/picture-reveal\/[^/]+\.(?:jpg|jpeg|png|webp)$/i.test(image)) {
        err(pool, at + " อาหารไทยต้องใช้ไฟล์ภาพในเครื่องเพื่อเล่นออฟไลน์");
        return;
      }
      const file = path.join(ROOT, image);
      if (!fs.existsSync(file) || !fs.statSync(file).isFile() || !fs.statSync(file).size)
        err(pool, at + " ไม่มีไฟล์ภาพอาหารหรือไฟล์ว่าง — " + image);
      const credit = credits.split("\n").find((line) => line.split("|")[1]?.trim() === path.basename(image));
      if (!credit || credit.split("|")[2]?.trim() !== item.answer || !credit.includes(item.rightsUrl))
        err(pool, at + " เครดิตภาพอาหารต้องมีชื่อไฟล์ เฉลย และลิงก์สิทธิ์ตรงกับคลัง — " + image);
      if (!sw.includes(JSON.stringify(image))) err(pool, at + " ภาพอาหารยังไม่อยู่ในรายการเก็บออฟไลน์ — " + image);
    }
  });
}

// ตรวจชั้นสินค้าและโจทย์ร่วมกัน แม้สั่งตรวจเฉพาะคลังใดคลังหนึ่ง
function checkConvenienceStorePools() {
  const scenarioPool = byKey("conveniencestore");
  const productPool = byKey("convenienceproducts");
  const readList = (pool) => {
    try {
      const list = loadPool(pool);
      if (Array.isArray(list) && list.length) return list;
      err(pool, "ต้องเป็นคลังที่ไม่ว่าง จึงจะตรวจชั้นสินค้าได้");
    } catch (e) {
      err(pool, "โหลดคลังที่ใช้ร่วมกันไม่ผ่าน — " + e.message);
    }
    return null;
  };
  const scenarios = readList(scenarioPool);
  const products = readList(productPool);
  if (!scenarios || !products) return;

  const isObject = (item) => item && typeof item === "object" && !Array.isArray(item);
  const nameKey = (value) => String(value).normalize("NFKC").trim().toLowerCase();
  const scenarioCats = new Set();
  scenarios.forEach((item, i) => {
    const at = "ข้อ #" + (i + 1);
    if (!isObject(item)) return err(scenarioPool, at + " ต้องเป็นข้อมูลโจทย์");
    ["q", "cat"].forEach((field) => {
      if (typeof item[field] !== "string" || !item[field].trim())
        err(scenarioPool, at + " ฟิลด์ " + field + " ต้องเป็นข้อความไม่ว่าง");
    });
    if (typeof item.cat === "string" && item.cat.trim()) scenarioCats.add(item.cat);
  });

  const localFile = (pool, value, at, extensions, allowFragment) => {
    const local = typeof value === "string" ? value.split("#")[0] : "";
    if (!/^assets\/convenience-store\/[A-Za-z0-9_./-]+$/.test(local)
      || local.split("/").some((part) => part === "." || part === ".." || !part)
      || !extensions.includes(path.extname(local).toLowerCase())
      || (!allowFragment && value.includes("#"))) {
      err(pool, at + " ต้องเป็นพาธไฟล์ใน assets/convenience-store/ ที่ไม่ย้อนออกนอกโฟลเดอร์ — " + String(value));
      return null;
    }
    const absolute = path.resolve(ROOT, local);
    try {
      if (!fs.statSync(absolute).isFile() || !fs.statSync(absolute).size)
        throw new Error("ไฟล์ว่างหรือไม่ใช่ไฟล์");
      const realFile = fs.realpathSync(absolute);
      const realRoot = fs.realpathSync(ROOT) + path.sep;
      if (!realFile.startsWith(realRoot)) {
        err(pool, at + " พาธไฟล์ชี้ออกนอก repository — " + local);
        return null;
      }
      return { local, absolute, realFile };
    } catch (e) {
      err(pool, at + " ไม่มีไฟล์หรือไฟล์ว่าง — " + local);
      return null;
    }
  };

  const ids = new Map();
  const cells = new Map();
  const creditsByFile = new Map();
  const localUrls = new Set([
    scenarioPool.page, "css/convenience-store.css", scenarioPool.script,
    "data/" + scenarioPool.file, "data/" + productPool.file,
  ]);
  products.forEach((item, i) => {
    const at = "สินค้า #" + (i + 1);
    if (!isObject(item)) return err(productPool, at + " ต้องเป็นข้อมูลสินค้า");
    productPool.required.filter((field) => field !== "sprite").forEach((field) => {
      if (typeof item[field] !== "string" || !item[field].trim())
        err(productPool, at + " ฟิลด์ " + field + " ต้องเป็นข้อความไม่ว่าง");
    });
    if (typeof item.id === "string" && item.id.trim()) {
      const key = nameKey(item.id);
      if (ids.has(key)) err(productPool, at + " id ซ้ำกับ " + ids.get(key) + " — " + item.id);
      else ids.set(key, at);
    }

    const image = localFile(productPool, item.image, at + " ภาพ", [".png", ".jpg", ".jpeg", ".webp"], false);
    if (image) localUrls.add(image.local);
    const validSprite = Array.isArray(item.sprite) && item.sprite.length === 2
      && item.sprite.every((n) => Number.isInteger(n) && n >= 0 && n < 6);
    if (!validSprite) err(productPool, at + " sprite ต้องเป็น [คอลัมน์, แถว] จำนวนเต็ม 0-5");
    else if (image) {
      const key = image.realFile + ":" + item.sprite.join(",");
      if (cells.has(key)) err(productPool, at + " sprite ซ้ำกับ " + cells.get(key) + " ในภาพเดียวกัน");
      else cells.set(key, at);
    }

    const creditFiles = new Map();
    ["source", "rightsUrl"].forEach((field) => {
      const file = localFile(productPool, item[field], at + " " + field, [".md"], true);
      if (file) {
        localUrls.add(file.local);
        creditFiles.set(file.realFile, file);
      }
    });
    creditFiles.forEach((file) => {
      if (!creditsByFile.has(file.realFile)) {
        const rows = fs.readFileSync(file.absolute, "utf8").split("\n")
          .filter((line) => /^\s*\|/.test(line))
          .map((line) => line.split("|").slice(1, -1).map((cell) => cell.trim().replace(/^`(.*)`$/, "$1")));
        creditsByFile.set(file.realFile, rows);
      }
      const rows = creditsByFile.get(file.realFile);
      if (!rows.some((row) => row.includes(item.id) && row.includes(item.brand)))
        err(productPool, at + " เครดิตต้องมี id และแบรนด์ตรงกันในแถวเดียว — " + item.id + " / " + file.local);
    });
  });

  scenarioCats.forEach((cat) => {
    const shelf = products.filter((item) => isObject(item) && item.cat === cat);
    if (shelf.length < 4)
      err(scenarioPool, 'หมวด "' + cat + '" ต้องมีสินค้าอย่างน้อย 4 รายการในชั้นเดียวกัน (ตอนนี้ ' + shelf.length + ")");
    const brands = new Set(shelf.filter((item) => typeof item.brand === "string" && item.brand.trim()).map((item) => nameKey(item.brand)));
    if (brands.size < 2)
      err(scenarioPool, 'หมวด "' + cat + '" ต้องมีสินค้าอย่างน้อย 2 แบรนด์ให้ทายใจ');
  });
  new Set(products.filter(isObject).map((item) => item.cat)).forEach((cat) => {
    if (!scenarioCats.has(cat))
      err(productPool, 'หมวดสินค้า "' + cat + '" ไม่มีสถานการณ์ให้เล่น');
  });

  const swPath = path.join(ROOT, "sw.js");
  const sw = fs.existsSync(swPath) ? fs.readFileSync(swPath, "utf8") : "";
  const precacheBlock = sw.match(/const\s+PRECACHE_URLS\s*=\s*\[([\s\S]*?)\];/);
  const precache = new Set();
  if (precacheBlock) precacheBlock[1].split("\n").forEach((line) => {
    const entry = line.match(/^\s*(["'])([^"']+)\1\s*,?\s*(?:\/\/.*)?$/);
    if (entry) precache.add(entry[2]);
  });
  localUrls.forEach((url) => {
    const file = path.join(ROOT, url);
    if (!fs.existsSync(file) || !fs.statSync(file).isFile() || !fs.statSync(file).size)
      err(productPool, "ไฟล์ที่ต้องใช้เล่นออฟไลน์ไม่มีหรือว่าง — " + url);
    if (!precache.has(url))
      err(productPool, "ไฟล์ยังไม่อยู่ใน PRECACHE_URLS สำหรับเล่นออฟไลน์ — " + url);
  });
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
  if (pool.key === "picturereveal") checkPicturePool(pool, list);

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
    if (pool.arrayRange) {
      const { field, min, max } = pool.arrayRange;
      const values = item[field];
      if (!Array.isArray(values) || values.length < min || values.length > max)
        err(pool, at + " ฟิลด์ " + field + " ต้องมี " + min + "-" + max + " รายการ");
      else if (new Set(values).size !== values.length)
        err(pool, at + " ฟิลด์ " + field + " มีรายการซ้ำกันเอง");
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

if (pools.some((pool) => ["conveniencestore", "convenienceproducts"].includes(pool.key)))
  checkConvenienceStorePools();

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
