// สร้าง data/game-counts.js จากคลังโจทย์จริงของแต่ละเกม รันสคริปต์นี้ใหม่ทุกครั้งหลังแก้ไขคลังโจทย์
// เพื่อให้ label จำนวนโจทย์บนหน้าแรกตรงกับของจริงเสมอ: node scripts/build-game-counts.js
const fs = require("fs");
const path = require("path");
const os = require("os");

const DATA_DIR = path.join(__dirname, "..", "data");
const OUT_FILE = path.join(DATA_DIR, "game-counts.js");

const PAGES = [
  { page: "category.html", unit: "หมวด", files: [["category-game.js", "CATEGORIES"]] },
  { page: "charades.html", unit: "คำ", files: [["charades.js", "CHARADES_WORDS"]] },
  { page: "drinking-games.html", unit: "เกม", files: [["drinking-games.js", "DRINKING_GAMES"]] },
  { page: "flashquiz.html", unit: "คำถาม", files: [["flashquiz.js", "FLASHQUIZ_LIST"]] },
  { page: "guess-number.html", unit: "โจทย์", files: [["guess-number.js", "GUESS_NUMBER_LIST"]] },
  { page: "insider.html", unit: "คำ", files: [["insider.js", "INSIDER_WORDS"]] },
  { page: "matchup.html", unit: "คำถาม", files: [["matchup.js", "MATCHUP_LIST"]] },
  { page: "personal-facts.html", unit: "หัวข้อ", files: [["personal-facts.js", "PERSONAL_FACTS"]] },
  { page: "psychology.html", unit: "คำถาม", files: [["psychology.js", "PSYCHOLOGY_LIST"]] },
  { page: "tapple.html", unit: "หมวด", files: [["tapple-categories.js", "TAPPLE_CATEGORIES"], ["tapple-categories-en.js", "TAPPLE_CATEGORIES_EN"]] },
  { page: "tenbut.html", unit: "มุก", files: [["shes-a-10-but.js", "TEN_BUT_LIST"]] },
  { page: "thisorthat.html", unit: "คู่", files: [["thisorthat.js", "THISORTHAT_LIST"]] },
  { page: "trivia.html", unit: "ข้อ", files: [["world-trivia.js", "WORLD_TRIVIA"], ["world-trivia-qa.js", "WORLD_TRIVIA_QA"]] },
  { page: "wavelength.html", unit: "คู่คำ", files: [["wavelength.js", "WAVELENGTH_PAIRS"]] },
  { page: "who-is-most.html", unit: "โจทย์", files: [["who-is-most.js", "WHO_IS_MOST"]] },
  { page: "taxi.html", unit: "สถานที่", files: [["taxi.js", "TAXI_PLACES"]] },
];

function arrayLength(fileName, varName) {
  const src = fs.readFileSync(path.join(DATA_DIR, fileName), "utf8");
  const tmp = path.join(os.tmpdir(), "gc-" + fileName + "-" + process.pid + ".js");
  fs.writeFileSync(tmp, src + "\nmodule.exports = " + varName + ";\n");
  try {
    delete require.cache[require.resolve(tmp)];
    const list = require(tmp);
    return list.length;
  } finally {
    fs.unlinkSync(tmp);
  }
}

const counts = {};
PAGES.forEach(({ page, unit, files }) => {
  const count = files.reduce((sum, [fileName, varName]) => sum + arrayLength(fileName, varName), 0);
  counts[page] = { count, unit };
});

const lines = Object.entries(counts)
  .map(([page, { count, unit }]) => `  "${page}": { count: ${count}, unit: "${unit}" },`)
  .join("\n");

const out = `// สร้างอัตโนมัติจาก scripts/build-game-counts.js — อย่าแก้ไขตรงนี้ตรง ๆ
// รันใหม่ทุกครั้งที่แก้ไขคลังโจทย์: node scripts/build-game-counts.js
const GAME_COUNTS = {
${lines}
};
`;

fs.writeFileSync(OUT_FILE, out);
console.log("wrote", OUT_FILE);
Object.entries(counts).forEach(([page, { count, unit }]) => console.log(page, count, unit));
