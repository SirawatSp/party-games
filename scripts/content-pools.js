// ทะเบียนคลังโจทย์ทั้งหมดของเว็บ — ใช้ร่วมกันระหว่าง scripts/check-content.js และ scripts/add-entries.js
// เพิ่มเกมใหม่แล้วอย่าลืมมาเพิ่มที่นี่ด้วย ไม่งั้นคลังใหม่จะไม่ถูกตรวจ
const fs = require("fs");
const path = require("path");
const os = require("os");

const ROOT = path.join(__dirname, "..");
const DATA_DIR = path.join(ROOT, "data");

// key          = ชื่อสั้นไว้เรียกจาก command line
// file         = ไฟล์ใน data/
// varName      = ชื่อตัวแปร array ในไฟล์นั้น
// page         = หน้า html ที่ใช้คลังนี้ (ไว้หา label หมวดในหน้าเว็บ)
// script       = ไฟล์ js ที่มีตารางแปลชื่อหมวด (ถ้ามี)
// required     = ฟิลด์ที่ทุกข้อต้องมีและห้ามว่าง
// optional     = ฟิลด์ที่มีก็ได้ไม่มีก็ได้ (ฟิลด์นอกเหนือจาก required+optional ถือว่าผิด)
// dupKey       = ฟิลด์ที่ใช้เช็กว่าซ้ำกับข้อเดิมไหม
// catField     = ฟิลด์หมวด (null = คลังนี้ไม่มีหมวด)
// closedCats   = true แปลว่าหมวดถูกล็อกด้วยปุ่มกรอง/ตารางแปลชื่อในหน้าเว็บ
//                ห้ามเพิ่มค่าใหม่โดยไม่แก้หน้าเว็บด้วย
const POOLS = [
  {
    key: "flashquiz", file: "flashquiz.js", varName: "FLASHQUIZ_LIST",
    page: "flashquiz.html", script: "js/flashquiz.js",
    label: "Flash Quiz — คำถามความรู้รอบตัว",
    required: ["question", "answer", "explain", "tag"], optional: [],
    dupKey: "question", answerField: "answer", catField: "tag", closedCats: true,
  },
  {
    key: "guessnumber", file: "guess-number.js", varName: "GUESS_NUMBER_LIST",
    page: "guess-number.html", script: "js/guess-number.js",
    label: "ใครแม่นสุด — โจทย์ตัวเลขให้ทายประมาณ",
    required: ["question", "answer", "explain", "tag", "unit"], optional: [],
    // คำถามที่ตอบเป็นปี ไม่ต้องมีหน่วยต่อท้าย ให้ใส่ unit: "" ไม่ใช่ตัดฟิลด์ทิ้ง
    allowEmpty: ["unit"],
    dupKey: "question", answerField: "answer", catField: "tag", closedCats: false,
    numericAnswer: true,
  },
  {
    key: "bluff", file: "bluff.js", varName: "BLUFF_LIST",
    page: "bluff.html", script: "js/bluff.js",
    label: "หลอกให้เชื่อ — คำถามคำตอบสั้นสำหรับเกมโกหก",
    required: ["question", "answer", "cat", "detail"], optional: [],
    dupKey: "question", answerField: "answer", catField: "cat", closedCats: false,
    maxAnswerLen: 45,
  },
  {
    key: "trivia", file: "world-trivia.js", varName: "WORLD_TRIVIA",
    page: "trivia.html", script: "js/trivia.js",
    label: "ทริเวียหลุดโลก โหมดจริงหรือมั่ว",
    required: ["statement", "answer", "explain", "tag"], optional: [],
    dupKey: "statement", catField: "tag", closedCats: true, booleanAnswer: true,
  },
  {
    key: "triviaqa", file: "world-trivia-qa.js", varName: "WORLD_TRIVIA_QA",
    page: "trivia.html", script: "js/trivia.js",
    label: "ทริเวียหลุดโลก โหมดชัวร์หรือไม่ (ถาม-ตอบ)",
    required: ["question", "answer", "tag"], optional: ["explain"],
    dupKey: "question", answerField: "answer", catField: "tag", closedCats: true,
  },
  {
    key: "charades", file: "charades.js", varName: "CHARADES_WORDS",
    page: "charades.html", script: "js/charades.js",
    label: "ใบ้คำ — คำสำหรับแสดงท่าทาง",
    required: ["word", "cat"], optional: [],
    dupKey: "word", catField: "cat", closedCats: true,
  },
  {
    key: "insider", file: "insider.js", varName: "INSIDER_WORDS",
    page: "insider.html", script: "js/insider.js",
    label: "Insider จอมบงการ — คำลับ",
    required: ["category", "word"], optional: [],
    dupKey: "word", catField: "category", closedCats: false,
  },
  {
    key: "fakeartist", file: "fake-artist.js", varName: "FAKE_ARTIST_WORDS",
    page: "fake-artist.html", script: "js/fake-artist.js",
    label: "ศิลปินตัวปลอม — คำลับสำหรับวาดรูป",
    required: ["word", "cat"], optional: [],
    dupKey: "word", catField: "cat", closedCats: false, minPerCat: 4,
    // ไฟล์นี้สร้าง array ด้วย reduce จากตารางหมวด ไม่ได้ลงท้ายด้วย ]; จึงต่อท้ายอัตโนมัติไม่ได้
    // ต้องไปเพิ่มคำในตารางหมวดของไฟล์เอง แล้วรัน check-content.js ตรวจ
    appendable: false,
  },
  {
    key: "psychology", file: "psychology.js", varName: "PSYCHOLOGY_LIST",
    page: "psychology.html", script: "js/psychology.js",
    label: "คำถามจิตวิทยา",
    required: ["question", "level", "theme"], optional: [],
    dupKey: "question", catField: "level", closedCats: true,
  },
  {
    key: "thisorthat", file: "thisorthat.js", varName: "THISORTHAT_LIST",
    page: "thisorthat.html", script: "js/thisorthat.js",
    label: "This or That — เลือกอย่างใดอย่างหนึ่ง",
    required: ["a", "b", "cat"], optional: [],
    dupKey: (x) => x.a + " / " + x.b, catField: "cat", closedCats: true,
  },
  {
    key: "whoismost", file: "who-is-most.js", varName: "WHO_IS_MOST",
    page: "who-is-most.html", script: "js/who-is-most.js",
    label: "ใครคือที่สุด — เกมชี้นิ้ว",
    required: ["prompt", "tag"], optional: [],
    dupKey: "prompt", catField: "tag", closedCats: false,
  },
  {
    key: "favorites", file: "favorites.js", varName: "FAVORITES_LIST",
    page: "favorites.html", script: "js/favorites.js",
    label: "ของโปรดของเธอ",
    required: ["q", "cat"], optional: [],
    dupKey: "q", catField: "cat", closedCats: true,
  },
  {
    key: "rapidfire", file: "rapidfire.js", varName: "RAPIDFIRE_LIST",
    page: "rapidfire.html", script: "js/rapidfire.js",
    label: "ถามไวตอบไว — บอกมา 3 อย่าง",
    required: ["q", "cat"], optional: [],
    dupKey: "q", catField: "cat", closedCats: true,
  },
  {
    key: "personalfacts", file: "personal-facts.js", varName: "PERSONAL_FACTS",
    page: "personal-facts.html", script: "js/personal-facts.js",
    label: "Fun Facts จัดแถวชีวิต — โจทย์ตัวเลขส่วนตัว",
    required: ["question", "unit", "tag"], optional: [],
    dupKey: "question", catField: "tag", closedCats: false,
  },
  {
    key: "tenbut", file: "shes-a-10-but.js", varName: "TEN_BUT_LIST",
    page: "tenbut.html", script: "js/tenbut.js",
    label: "10 เต็ม 10 แต่...",
    required: ["text", "tag"], optional: [],
    dupKey: "text", catField: "tag", closedCats: true,
  },
  {
    key: "matchup", file: "matchup.js", varName: "MATCHUP_LIST",
    page: "matchup.html", script: "js/matchup.js",
    label: "จับคู่ รู้จายยยย",
    required: ["q", "choices"], optional: [],
    dupKey: "q", catField: null, choicesRange: [2, 6],
  },
  {
    key: "flirt", file: "flirt.js", varName: "FLIRT_LIST",
    page: "flirt.html", script: "js/flirt.js",
    label: "จีบหรือแค่นิสัยดี",
    required: ["text", "cat"], optional: [],
    dupKey: "text", catField: "cat", closedCats: true,
  },
  {
    key: "taxi", file: "taxi.js", varName: "TAXI_PLACES",
    page: "taxi.html", script: "js/taxi.js",
    label: "แท็กซี่พาไป — สถานที่ให้ใบ้ทาง",
    required: ["name", "cat"], optional: [],
    dupKey: "name", catField: "cat", closedCats: true,
  },
  {
    key: "wavelength", file: "wavelength.js", varName: "WAVELENGTH_PAIRS",
    page: "wavelength.html", script: "js/wavelength.js",
    label: "Wavelength จูนคลื่นใจ — คู่คำสองขั้ว",
    isPairArray: true, dupKey: (x) => x[0] + " / " + x[1], catField: null,
  },
  {
    key: "category", file: "category-game.js", varName: "CATEGORIES",
    page: "category.html", script: "js/category.js",
    label: "เกมหมวดหมู่ — ชื่อหมวด",
    isStringArray: true, dupKey: (x) => x, catField: null,
  },
  {
    key: "tapple", file: "tapple-categories.js", varName: "TAPPLE_CATEGORIES",
    page: "tapple.html", script: "js/tapple.js",
    label: "Tapple — หมวดภาษาไทย",
    isStringArray: true, dupKey: (x) => x, catField: null,
  },
  {
    key: "tapple-en", file: "tapple-categories-en.js", varName: "TAPPLE_CATEGORIES_EN",
    page: "tapple.html", script: "js/tapple.js",
    label: "Tapple — หมวดภาษาอังกฤษ",
    isStringArray: true, dupKey: (x) => x, catField: null,
  },
];

// โหลด array ออกมาจากไฟล์ data/ ที่เขียนเป็น const ... = [...] (ไม่มี module.exports)
function loadPool(pool) {
  const src = fs.readFileSync(path.join(DATA_DIR, pool.file), "utf8");
  const tmp = path.join(os.tmpdir(), "pg-pool-" + pool.key + "-" + process.pid + ".js");
  fs.writeFileSync(tmp, src + "\nmodule.exports = " + pool.varName + ";\n");
  try {
    delete require.cache[require.resolve(tmp)];
    return require(tmp);
  } finally {
    fs.unlinkSync(tmp);
  }
}

function byKey(key) {
  return POOLS.find((p) => p.key === key);
}

function dupValue(pool, item) {
  return typeof pool.dupKey === "function" ? pool.dupKey(item) : String(item[pool.dupKey]);
}

// อ่านรายชื่อหมวดที่หน้าเว็บรองรับจริง จากปุ่มกรองใน html และตารางแปลชื่อใน js
// ใช้ตรวจว่าโจทย์ใหม่ไม่ได้ใส่หมวดที่หน้าเว็บยังไม่รู้จัก
function uiCats(pool) {
  const found = new Set();
  const htmlPath = path.join(ROOT, pool.page || "");
  if (pool.page && fs.existsSync(htmlPath)) {
    const html = fs.readFileSync(htmlPath, "utf8");
    const re = /data-(?:tag|cat|level)="([^"]+)"/g;
    let m;
    while ((m = re.exec(html))) if (m[1] !== "all") found.add(m[1]);
  }
  const jsPath = path.join(ROOT, pool.script || "");
  if (pool.script && fs.existsSync(jsPath)) {
    const js = fs.readFileSync(jsPath, "utf8");
    const block = js.match(/(?:TAG_LABEL|CAT_LABEL|CAT_LABELS|LEVEL_LABEL)\s*=\s*\{([\s\S]*?)\}/);
    if (block) {
      const re = /(?:^|[\s{,])([A-Za-z_][\w-]*)\s*:/g;
      let m;
      while ((m = re.exec(block[1]))) if (m[1] !== "all") found.add(m[1]);
    }
  }
  return found;
}

module.exports = { POOLS, DATA_DIR, ROOT, loadPool, byKey, dupValue, uiCats };
