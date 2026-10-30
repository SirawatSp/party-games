#!/usr/bin/env node
// ตรวจเกมใหม่ด้วยเบราว์เซอร์จริง ใช้ไฟล์ตรง ๆ ได้ ไม่ต้องมีเซิร์ฟเวอร์หรือเพิ่ม dependency ของเว็บ
// ใช้ PLAYWRIGHT_MODULE หากเครื่องติดตั้งเครื่องมือทดสอบไว้ที่อื่น และ BASE หากต้องการตรวจเว็บจริง
const fs = require("fs");
const path = require("path");
const { pathToFileURL } = require("url");
const ROOT = path.join(__dirname, "..");

async function run(chromium, options = {}) {
  const base = (options.base || pathToFileURL(ROOT + path.sep).href).replace(/\/$/, "");
  const browser = await chromium.launch({ headless: true });
  const results = [];
  const check = (name, ok, detail) => results.push({ name, ok: !!ok, detail });
  try {
    const context = await browser.newContext({ viewport: { width: 390, height: 844 }, serviceWorkers: "block" });
    const page = await context.newPage();
    const errors = [];
    page.on("pageerror", (e) => errors.push(e.message));
    await page.goto(base + "/truth-or-dare.html", { waitUntil: "domcontentloaded" });
    check("เริ่มเกมยังไม่เปิดโจทย์และปุ่มจบตาปิดอยู่", await page.locator("#tdNext").isDisabled());

    const bags = await page.evaluate(() => {
      const checks = [];
      for (const level of ["light", "heavy"]) {
        document.querySelector('[data-intensity="' + level + '"]').click();
        for (const kind of ["truth", "dare", "random"]) {
          const count = kind === "random" ? 50 : 25;
          const seen = new Set();
          let valid = true;
          let last = "";
          for (let i = 0; i < count; i++) {
            document.querySelector('button[data-kind="' + kind + '"]').click();
            last = document.getElementById("tdPrompt").textContent;
            const item = TRUTH_OR_DARE_LIST.find((x) => x.prompt === last);
            valid = valid && !!item && item.cat.endsWith("_" + level)
              && (kind === "random" || item.cat.startsWith(kind + "_"));
            seen.add(last);
          }
          document.getElementById("tdSkip").click();
          checks.push({ level, kind, valid, unique: seen.size === count,
            changed: document.getElementById("tdPrompt").textContent !== last });
        }
      }
      return checks;
    });
    bags.forEach((x) => {
      check("กรองตรงหมวด " + x.level + " / " + x.kind, x.valid);
      check("ครบคลังก่อนซ้ำ " + x.level + " / " + x.kind, x.unique);
      check("ข้ามแล้วไม่ซ้ำข้อก่อน " + x.level + " / " + x.kind, x.changed);
    });

    await page.locator("#tdNext").click();
    check("จบตาแล้วเริ่มตาที่สอง", (await page.locator("#tdTurn").textContent()) === "ตาที่ 2");
    check("จบตาแล้วซ่อนโจทย์และปิดปุ่มข้าม", await page.locator("#tdSkip").isDisabled());
    check("ส่งโฟกัสกลับปุ่มเลือก Truth", await page.locator('button[data-kind="truth"]').evaluate((el) => el === document.activeElement));
    await page.keyboard.press("Enter");
    check("ใช้คีย์บอร์ดเปิดโจทย์ได้", !(await page.locator("#tdNext").isDisabled()));
    await page.locator('[data-intensity="light"]').click();
    check("เปลี่ยนระดับแล้วซ่อนโจทย์เก่า", await page.locator("#tdNext").isDisabled());
    check("ระดับที่เลือกแจ้งสถานะการเข้าถึงได้", await page.locator('[data-intensity="light"]').getAttribute("aria-pressed") === "true");
    await page.locator('button[data-kind="truth"]').click();
    const beforeReload = await page.locator("#tdPrompt").textContent();
    await page.reload({ waitUntil: "domcontentloaded" });
    await page.locator('button[data-kind="truth"]').click();
    check("จำข้อก่อนหน้าข้ามการโหลดใหม่", await page.locator("#tdPrompt").textContent() !== beforeReload);
    check("จอมือถือไม่ล้นแนวนอน", await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
    await page.setViewportSize({ width: 1280, height: 900 });
    check("จอคอมพิวเตอร์ไม่ล้นแนวนอน", await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
    if (options.shots) await page.screenshot({ path: path.join(options.shots, "truth-desktop.png"), fullPage: true });
    check("เล่นแล้วไม่มีข้อผิดพลาดสคริปต์", errors.length === 0, errors);

    await page.goto(base + "/flashquiz.html", { waitUntil: "domcontentloaded" });
    const filters = await page.evaluate(() => {
      const bad = [];
      document.querySelectorAll("#filterTags .tag").forEach((el) => {
        el.click();
        const key = el.dataset.tag || el.dataset.pack;
        const text = document.querySelector("#cardHolder .statement").textContent;
        const item = FLASHQUIZ_LIST.find((x) => x.question === text);
        if (!item || (key === "fresh" && !item.tag.startsWith("fresh_"))
          || (key === "legacy" && item.tag.startsWith("fresh_"))
          || (!["all", "fresh", "legacy"].includes(key) && item.tag !== key)) bad.push(key);
      });
      return { bad, fresh: FLASHQUIZ_LIST.filter((x) => x.tag.startsWith("fresh_")).length,
        total: FLASHQUIZ_LIST.length, filters: document.querySelectorAll("#filterTags .tag").length };
    });
    check("ตัวกรอง Flash Quiz ทุกปุ่มตรงกับคลัง", filters.bad.length === 0, filters);
    check("Flash Quiz ครบเป้าและแยกชุดใหม่", filters.total === 2500 && filters.fresh === 870);
    await page.locator('.mode-btn[data-mode="battle"]').click();
    await page.locator('#filterTags [data-tag="fresh_digital"]').click();
    await page.locator("#startBattleBtn").click();
    const battleOK = await page.evaluate(() => {
      const text = document.getElementById("battleQuestionText").textContent;
      return FLASHQUIZ_LIST.some((x) => x.question === text && x.tag === "fresh_digital");
    });
    check("โหมดดวลใช้หมวดใหม่ที่เลือก", battleOK);
    await page.locator('#filterTags [data-tag="fresh_sport"]').click();
    check("เปลี่ยนหมวดแล้วยุติรอบดวลเดิม", await page.locator("#battleIntroPanel").isVisible()
      && !(await page.locator("#battlePlayPanel").isVisible()));
    await page.goto(base + "/index.html", { waitUntil: "domcontentloaded" });
    check("หน้าแรกมีเกมใหม่และป้ายจำนวนจริง", /100/.test(await page.locator('.card[href="truth-or-dare.html"] .card-count').textContent()));

    const sw = fs.readFileSync(path.join(ROOT, "sw.js"), "utf8");
    const urls = sw.match(/const PRECACHE_URLS = \[([\s\S]*?)\];/)[1];
    const paths = [...urls.matchAll(/"([^"]+)"/g)].map((m) => m[1]);
    const missing = paths.filter((url) => !fs.existsSync(path.join(ROOT, url.split("?")[0])));
    check("ไฟล์ที่เตรียมเก็บออฟไลน์มีครบ", missing.length === 0, missing);
    check("เตรียมหน้า สไตล์ ตรรกะ และคลังเกมใหม่สำหรับออฟไลน์", ["truth-or-dare.html", "css/truth-or-dare.css", "js/truth-or-dare.js", "data/truth-or-dare.js"].every((p) => paths.includes(p)));
    await context.close();
  } finally {
    await browser.close();
  }
  return results;
}

module.exports = run;
if (require.main === module) {
  let chromium;
  try { chromium = require(process.env.PLAYWRIGHT_MODULE || "playwright").chromium; }
  catch (e) { console.error("ต้องมีเครื่องมือทดสอบ Playwright ในเครื่อง"); process.exitCode = 2; }
  if (chromium) run(chromium, { base: process.env.BASE, shots: process.env.SHOTS }).then((results) => {
    results.forEach((r) => console.log((r.ok ? "ผ่าน " : "ไม่ผ่าน ") + r.name));
    console.log(results.filter((r) => r.ok).length + "/" + results.length + " ผ่าน");
    process.exitCode = results.some((r) => !r.ok) ? 1 : 0;
  }).catch((e) => { console.error(e); process.exitCode = 1; });
}
