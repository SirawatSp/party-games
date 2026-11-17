#!/usr/bin/env node
// ทดสอบเกมธงชาติและรูปร่างประเทศด้วยเบราว์เซอร์จริง รวมภาพเสีย การเปลี่ยนหมวด และออฟไลน์
const fs = require("fs");
const path = require("path");
const http = require("http");
const vm = require("vm");
const ROOT = path.resolve(__dirname, "..");
const REGIONS = ["asia", "europe", "africa", "north_america", "south_america", "oceania"];

function readData(file, variable) {
  return vm.runInNewContext(fs.readFileSync(path.join(ROOT, file), "utf8") + "; " + variable);
}

async function serve() {
  const server = http.createServer((req, res) => {
    let file;
    try {
      const url = new URL(req.url, "http://localhost");
      file = path.resolve(ROOT, "." + decodeURIComponent(url.pathname));
      if (file === ROOT) file = path.join(ROOT, "index.html");
    } catch (error) { res.writeHead(400).end(); return; }
    if (!file.startsWith(ROOT + path.sep)) { res.writeHead(403).end(); return; }
    fs.readFile(file, (error, data) => {
      if (error) { res.writeHead(404).end(); return; }
      const types = { ".html": "text/html", ".js": "text/javascript", ".css": "text/css",
        ".svg": "image/svg+xml", ".png": "image/png", ".jpg": "image/jpeg", ".json": "application/json" };
      res.writeHead(200, { "Content-Type": types[path.extname(file)] || "application/octet-stream" });
      res.end(data);
    });
  });
  await new Promise((resolve, reject) => {
    server.once("error", reject);
    server.listen(0, "127.0.0.1", resolve);
  });
  return { base: "http://127.0.0.1:" + server.address().port,
    close: () => new Promise((resolve) => server.close(resolve)) };
}

async function run(chromium, options = {}) {
  const countries = readData("data/country-quiz.js", "COUNTRY_QUIZ_LIST");
  const world = readData("data/worldmap.js", "WORLD_MAP");
  const byName = new Map(countries.map((item) => [item.name, item]));
  const byCode = new Map(countries.map((item) => [item.code, item]));
  const shapes = new Map(world.countries.map((item) => [item.code, item]));
  const fileFor = { flag: "flag-quiz.html", shape: "country-shape.html" };
  const local = options.base ? null : await serve();
  const base = (options.base || local.base).replace(/\/$/, "");
  const executablePath = options.executablePath || process.env.CHROMIUM_PATH
    || (fs.existsSync("/usr/bin/chromium") ? "/usr/bin/chromium" : undefined);
  const results = [];
  const errors = [];
  const check = (name, ok, detail) => results.push({ name, ok: !!ok, detail });
  let browser;
  if (options.shots) fs.mkdirSync(options.shots, { recursive: true });
  const shot = async (page, name) => {
    if (options.shots) await page.screenshot({ path: path.join(options.shots, "country-quiz-" + name + ".png"),
      fullPage: true, animations: "disabled" });
  };
  async function context(settings = {}) {
    const ctx = await browser.newContext({ viewport: { width: 390, height: 844 },
      serviceWorkers: "block", reducedMotion: "reduce", ...settings });
    ctx.setDefaultTimeout(15000);
    await ctx.route("**://fonts.g*/**", (route) => route.abort());
    return ctx;
  }
  const track = (page) => page.on("pageerror", (error) => errors.push(error.message));
  async function ready(page, mode) {
    await page.waitForFunction(() => {
      const button = document.getElementById("cqReveal");
      return !!button && !button.disabled;
    }, null, { timeout: 15000 });
    if (mode === "flag") {
      await page.waitForFunction(() => {
        const image = document.getElementById("cqFlag");
        return image && !image.hidden && image.complete && image.naturalWidth > 0;
      }, null, { timeout: 15000 });
    } else {
      await page.waitForFunction(() => {
        const image = document.getElementById("cqShape");
        const outline = document.getElementById("cqShapePath");
        return image && !image.hasAttribute("hidden") && image.getClientRects().length > 0
          && image.getBoundingClientRect().width > 0 && image.getBoundingClientRect().height > 0
          && getComputedStyle(image).display !== "none" && outline && !!outline.getAttribute("d");
      }, null, { timeout: 15000 });
    }
  }
  async function open(ctx, mode) {
    const page = await ctx.newPage();
    track(page);
    await page.goto(base + "/" + fileFor[mode], { waitUntil: "domcontentloaded" });
    await ready(page, mode);
    return page;
  }
  async function select(page, mode, region) {
    await page.locator('#cqRegions [data-region="' + region + '"]').click();
    await ready(page, mode);
  }
  async function blankAnswer(page) {
    return page.evaluate(() => document.getElementById("cqAnswer").hidden
      && !document.getElementById("cqCountry").textContent.trim()
      && !document.getElementById("cqEnglish").textContent.trim()
      && !document.getElementById("cqShapeNote").textContent.trim());
  }
  async function reveal(page) {
    await page.locator("#cqReveal").click();
    await page.locator("#cqAnswer").waitFor({ state: "visible" });
    const name = (await page.locator("#cqCountry").textContent()).trim();
    return byName.get(name);
  }
  async function next(page, mode) {
    await page.locator("#cqNext").click();
    await ready(page, mode);
  }
  async function bounds(page) {
    return page.evaluate(() => {
      const svg = document.getElementById("cqShape");
      const outline = document.getElementById("cqShapePath");
      const box = outline.getBBox();
      const view = svg.viewBox.baseVal;
      const d = outline.getAttribute("d") || "";
      return { x: box.x, y: box.y, width: box.width, height: box.height,
        view: [view.x, view.y, view.width, view.height], d,
        texts: svg.querySelectorAll("text, title, desc").length,
        ok: [box.x, box.y, box.width, box.height].every(Number.isFinite)
          && box.width > 0 && box.height > 0 && box.x >= -0.01 && box.y >= -0.01
          && box.x + box.width <= view.width + 0.01 && box.y + box.height <= view.height + 0.01
          && view.x === 0 && view.y === 0 && view.width === 320 && view.height === 320
          && !/NaN|Infinity/.test(d) };
    });
  }
  async function overflow(page) {
    return page.evaluate(() => {
      const visible = (el) => el.getClientRects().length && !el.closest("[hidden]");
      const failed = Array.from(document.querySelectorAll("#cqRegions button, #cqReveal, #cqNext, #cqRetry, #cqStage, #cqAnswer"))
        .filter(visible).filter((el) => {
          const box = el.getBoundingClientRect();
          return box.left < -1 || box.right > innerWidth + 1 || el.scrollWidth > el.clientWidth + 1;
        }).map((el) => ({ id: el.id, text: el.textContent.trim(), width: el.clientWidth, scroll: el.scrollWidth }));
      return { ok: document.documentElement.scrollWidth <= innerWidth && failed.length === 0,
        page: document.documentElement.scrollWidth, width: innerWidth, failed };
    });
  }
  async function privacy(page) {
    return page.evaluate(() => {
      const read = (storage) => Object.keys(storage).sort().map((key) => [key, storage.getItem(key)]);
      return { local: read(localStorage), session: read(sessionStorage), url: location.href, name: window.name };
    });
  }
  const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);
  async function fixture(ctx, list) {
    await ctx.route("**/data/country-quiz.js", (route) => route.fulfill({
      status: 200, contentType: "text/javascript",
      body: "const COUNTRY_QUIZ_LIST = " + JSON.stringify(list) + ";\n"
    }));
  }

  try {
    browser = await chromium.launch({ headless: true, ...(executablePath ? { executablePath } : {}) });
    check("คลังประเทศใช้รหัสไม่ซ้ำ มีธงจริงและรูปร่างครบทุกประเทศ", countries.length > 0
      && new Set(countries.map((item) => item.code)).size === countries.length
      && new Set(countries.map((item) => item.iso2)).size === countries.length
      && countries.every((item) => item.flag === "assets/country-quiz/flags/" + item.iso2 + ".svg"
        && shapes.has(item.code) && !!shapes.get(item.code).d && fs.statSync(path.join(ROOT, item.flag)).size > 0));

    const normal = await context();
    const pages = {};
    for (const mode of ["flag", "shape"]) {
      const page = await open(normal, mode);
      pages[mode] = page;
      check("หน้า " + mode + " เริ่มพร้อมทายโดยยังไม่มีเฉลย", await blankAnswer(page)
        && await page.locator("#cqNext").isEnabled() && await page.locator("#cqReveal").isEnabled());
      const before = await privacy(page);
      const beforeStage = await page.locator("#cqStage").textContent();
      const first = await reveal(page);
      const flagSrc = mode === "flag" ? await page.locator("#cqFlag").getAttribute("src") : "";
      check("เฉลยหน้า " + mode + " ตรงคลังและภาพที่แสดง", !!first
        && (mode !== "flag" || new URL(flagSrc, base + "/").pathname === new URL(first.flag, base + "/").pathname)
        && !beforeStage.includes(first.name)
        && await page.locator("#cqCountry").evaluate((el) => document.activeElement === el));
      await shot(page, mode + "-reveal");
      const counter = await page.locator("#cqCounter").textContent();
      await next(page, mode);
      check("ข้อถัดไปหน้า " + mode + " ล้างเฉลยและเปลี่ยนตัวนับ", await blankAnswer(page)
        && counter !== await page.locator("#cqCounter").textContent());
      const regionChecks = [];
      for (const region of REGIONS) {
        await select(page, mode, region);
        const hidden = await blankAnswer(page);
        const current = await reveal(page);
        regionChecks.push({ region, code: current?.code, ok: hidden && current?.region === region
          && await page.locator('#cqRegions [data-region="' + region + '"]').getAttribute("aria-pressed") === "true" });
      }
      check("เปลี่ยนทวีปหน้า " + mode + " แล้วสุ่มเฉพาะประเทศในทวีปนั้น", regionChecks.every((item) => item.ok), regionChecks);
      check("การเล่นหน้า " + mode + " ไม่เขียนคำตอบลง URL หรือพื้นที่เก็บ", same(before, await privacy(page)));
      for (const width of [320, 390, 1280]) {
        await page.setViewportSize({ width, height: 900 });
        const report = await overflow(page);
        check("หน้า " + mode + " อ่านครบและไม่ล้นจอ " + width, report.ok, report);
      }
      await page.setViewportSize({ width: 390, height: 844 });
      await select(page, mode, "asia");
      await page.locator("#cqReveal").focus();
      await page.keyboard.press("Enter");
      const focused = await page.locator("#cqCountry").evaluate((el) => document.activeElement === el);
      await page.locator("#cqNext").focus();
      await page.keyboard.press("Space");
      await ready(page, mode);
      check("เล่นหน้า " + mode + " ด้วยคีย์บอร์ดและย้ายโฟกัสหลังเฉลยได้", focused && await blankAnswer(page));
    }

    const assetPage = pages.flag;
    const decoded = await assetPage.evaluate(async (paths) => {
      const results = [];
      let cursor = 0;
      await Promise.all(Array.from({ length: Math.min(6, paths.length) }, async () => {
        while (cursor < paths.length) {
          const file = paths[cursor++];
          const image = new Image();
          image.src = file;
          try {
            await image.decode();
            results.push({ file, ok: image.naturalWidth > 0 && image.naturalHeight > 0 });
          } catch (error) { results.push({ file, ok: false, error: error.message }); }
        }
      }));
      return results;
    }, countries.map((item) => item.flag));
    check("Chromium โหลดและถอดภาพธงที่เก็บในเว็บได้ครบทุกไฟล์", decoded.length === countries.length
      && decoded.every((item) => item.ok), decoded.filter((item) => !item.ok));

    const bagRegion = REGIONS.filter((region) => countries.filter((item) => item.region === region).length > 1)
      .sort((a, b) => countries.filter((item) => item.region === a).length - countries.filter((item) => item.region === b).length)[0];
    const bagExpected = countries.filter((item) => item.region === bagRegion);
    await select(pages.flag, "flag", bagRegion);
    const bagNames = [];
    for (let i = 0; i < bagExpected.length + 1; i++) {
      const country = await reveal(pages.flag);
      bagNames.push(country?.code);
      if (i < bagExpected.length) await next(pages.flag, "flag");
    }
    check("ธงชาติไม่ซ้ำก่อนครบถุงและไม่ซ้ำรอยต่อรอบใหม่", new Set(bagNames.slice(0, bagExpected.length)).size === bagExpected.length
      && bagNames.slice(0, bagExpected.length).every((code) => bagExpected.some((item) => item.code === code))
      && bagNames[bagExpected.length] !== bagNames[bagExpected.length - 1], { region: bagRegion, codes: bagNames });

    await select(pages.shape, "shape", "all");
    const shapeChecks = [];
    for (let i = 0; i < countries.length + 1; i++) {
      const outline = await bounds(pages.shape);
      const country = await reveal(pages.shape);
      const note = (await pages.shape.locator("#cqShapeNote").textContent()).trim();
      shapeChecks.push({ code: country?.code, ok: outline.ok && outline.texts === 0,
        x: outline.x, y: outline.y, width: outline.width, height: outline.height, note });
      if (i < countries.length) await next(pages.shape, "shape");
    }
    check("รูปร่างทุกประเทศมีพื้นที่จริง พอดีกรอบ และไม่มีป้ายชื่อในรูป", shapeChecks.length === countries.length + 1
      && shapeChecks.every((item) => item.ok), shapeChecks.filter((item) => !item.ok));
    check("รูปร่างประเทศสุ่มครบถุงโดยไม่ซ้ำและไม่ซ้ำรอยต่อ", new Set(shapeChecks.slice(0, countries.length).map((item) => item.code)).size === countries.length
      && shapeChecks[countries.length].code !== shapeChecks[countries.length - 1].code);
    const mainland = shapeChecks.filter((item) => item.code === "FRA" || item.code === "USA");
    check("เฉลยฝรั่งเศสและสหรัฐบอกส่วนแผ่นดินที่แสดงตามจริง", mainland.length >= 2 && mainland.every((item) => !!item.note), mainland);

    const thai = byCode.get("THA");
    if (!thai) throw new Error("คลังต้องมีประเทศไทยสำหรับตรวจรูปทรงด้ามขวาน");
    const thaiContext = await context();
    await fixture(thaiContext, [thai]);
    const thaiPage = await open(thaiContext, "shape");
    const thaiBounds = await bounds(thaiPage);
    const hiddenThai = await blankAnswer(thaiPage);
    const thaiCountry = await reveal(thaiPage);
    check("ประเทศไทยแสดงรูปทรงแนวตั้งจริงแทนกรอบสี่เหลี่ยมหรือแผนที่โลก", hiddenThai && thaiCountry?.code === "THA"
      && thaiBounds.ok && thaiBounds.height > thaiBounds.width * 1.2
      && (thaiBounds.d.match(/[Ll]/g) || []).length > 20);
    await shot(thaiPage, "shape-thailand");
    await thaiPage.setViewportSize({ width: 1280, height: 900 });
    await shot(thaiPage, "desktop-shape");
    await thaiContext.close();
    await normal.close();

    const failContext = await context();
    const pair = [byCode.get("THA"), byCode.get("FRA")].filter(Boolean);
    await fixture(failContext, pair);
    let failNext = true;
    const failures = [];
    const requests = [];
    await failContext.route("**/assets/country-quiz/flags/*.svg", (route) => {
      requests.push(route.request().url());
      if (failNext) { failNext = false; failures.push(route.request().url()); return route.abort(); }
      return route.continue();
    });
    const failPage = await failContext.newPage();
    track(failPage);
    await failPage.goto(base + "/flag-quiz.html", { waitUntil: "domcontentloaded" });
    await failPage.locator("#cqRetry").waitFor({ state: "visible" });
    check("ธงเสียแจ้งให้ลองใหม่และข้ามได้โดยยังเปิดเฉลยไม่ได้", await failPage.locator("#cqReveal").isDisabled()
      && await failPage.locator("#cqNext").isEnabled() && await blankAnswer(failPage));
    await shot(failPage, "flag-image-failure");
    await failPage.locator("#cqRetry").click();
    await ready(failPage, "flag");
    check("ปุ่มลองใหม่โหลดธงประเทศเดิมจนเล่นต่อได้", requests.length >= 2 && requests[0] === requests[1]
      && new URL(await failPage.locator("#cqFlag").getAttribute("src"), base + "/").href === requests[0]);
    failNext = true;
    await failPage.locator("#cqNext").click();
    await failPage.locator("#cqRetry").waitFor({ state: "visible" });
    const skipped = failures[failures.length - 1];
    await failPage.locator("#cqNext").click();
    await ready(failPage, "flag");
    check("ข้ามธงเสียแล้วประเทศถัดไปโหลดได้และไม่เหลือเฉลยเก่า", new URL(await failPage.locator("#cqFlag").getAttribute("src"), base + "/").href !== skipped
      && await blankAnswer(failPage));
    await failContext.close();

    const raceContext = await context();
    await fixture(raceContext, pair);
    // หน่วงคำตอบของ decode หลังภาพเก่าถอดสำเร็จแล้ว เพื่อทดสอบ callback ที่ค้างข้ามการเปลี่ยนทวีปจริง
    await raceContext.addInitScript(() => {
      const original = HTMLImageElement.prototype.decode;
      window.__countryDecodeTest = { started: false, src: "", release: null };
      HTMLImageElement.prototype.decode = function (...args) {
        const decoded = original.apply(this, args);
        const state = window.__countryDecodeTest;
        if (!state.started && this.src.includes("/assets/country-quiz/flags/")) {
          state.started = true;
          state.src = this.src;
          return decoded.then(() => new Promise((resolve) => { state.release = resolve; }));
        }
        return decoded;
      };
    });
    const racePage = await raceContext.newPage();
    track(racePage);
    await racePage.goto(base + "/flag-quiz.html", { waitUntil: "domcontentloaded" });
    await racePage.waitForFunction(() => !!window.__countryDecodeTest.release);
    const oldUrl = await racePage.evaluate(() => window.__countryDecodeTest.src);
    const oldCountry = pair.find((item) => new URL(item.flag, base + "/").href === oldUrl);
    const target = pair.find((item) => item.code !== oldCountry?.code);
    if (!oldCountry || !target) throw new Error("เตรียมธงทดสอบการโหลดสลับกันไม่สำเร็จ");
    await select(racePage, "flag", target.region);
    const counterBefore = await racePage.locator("#cqCounter").textContent();
    await racePage.evaluate(() => window.__countryDecodeTest.release());
    await racePage.evaluate(() => new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve))));
    const currentRace = await reveal(racePage);
    check("ธงเก่าที่ถอดภาพช้าไม่ย้อนมาทับประเทศหลังเปลี่ยนทวีป", currentRace?.code === target.code
      && new URL(await racePage.locator("#cqFlag").getAttribute("src"), base + "/").href === new URL(target.flag, base + "/").href
      && counterBefore === await racePage.locator("#cqCounter").textContent());
    await raceContext.close();

    const offlineContext = await context({ serviceWorkers: "allow" });
    const offlinePage = await offlineContext.newPage();
    track(offlinePage);
    await offlinePage.goto(base + "/index.html", { waitUntil: "domcontentloaded" });
    await offlinePage.evaluate(async () => {
      await navigator.serviceWorker.register("sw.js");
      await Promise.race([navigator.serviceWorker.ready,
        new Promise((_, reject) => setTimeout(() => reject(new Error("service worker ยังไม่พร้อม")), 30000))]);
    });
    await offlinePage.waitForFunction(() => !!navigator.serviceWorker.controller, null, { timeout: 30000 });
    const required = ["flag-quiz.html", "country-shape.html", "css/country-quiz.css", "js/country-quiz.js",
      "data/country-quiz.js", "data/worldmap.js", ...countries.map((item) => item.flag)];
    const cached = await offlinePage.evaluate(async (paths) => Promise.all(paths.map(async (file) =>
      !!await caches.match(new URL(file, location.href).href))), required);
    check("service worker เก็บสองเกม คลัง รูปร่าง และธงทุกไฟล์ครบ", cached.every(Boolean), required.filter((_, index) => !cached[index]));
    const swResponses = new Set();
    offlinePage.on("response", (response) => {
      if (response.fromServiceWorker()) swResponses.add(new URL(response.url()).pathname);
    });
    await offlineContext.setOffline(true);
    for (const mode of ["flag", "shape"]) {
      const response = await offlinePage.goto(base + "/" + fileFor[mode], { waitUntil: "domcontentloaded" });
      await ready(offlinePage, mode);
      const hidden = await blankAnswer(offlinePage);
      const country = await reveal(offlinePage);
      const flagServed = mode !== "flag" || swResponses.has(new URL(country.flag, base + "/").pathname);
      check("เปิดภาพและเฉลยหน้า " + mode + " ขณะออฟไลน์จริงได้", response.fromServiceWorker()
        && hidden && !!country && flagServed && (mode !== "shape" || (await bounds(offlinePage)).ok));
      await shot(offlinePage, "offline-" + mode);
      await offlinePage.reload({ waitUntil: "domcontentloaded" });
      await ready(offlinePage, mode);
      check("โหลดหน้า " + mode + " ออฟไลน์ใหม่ไม่คืนเฉลยเก่า", await blankAnswer(offlinePage));
    }
    await offlineContext.close();
    check("ไม่มีข้อผิดพลาดสคริปต์ตลอดสองเกม", errors.length === 0, errors);
  } catch (error) {
    check("ทดสอบหยุดก่อนจบขั้นตอน", false, error.stack || error.message);
  } finally {
    if (browser) await browser.close();
    if (local) await local.close();
  }
  return results;
}

module.exports = run;
if (require.main === module) {
  let chromium;
  for (const location of [process.env.PLAYWRIGHT_MODULE || "playwright",
    "/opt/codex/runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright", "/opt/node22/lib/node_modules/playwright"]) {
    try { chromium = require(location).chromium; break; } catch (error) {}
  }
  if (!chromium) {
    console.error("ต้องมี Playwright สำหรับทดสอบ ตั้ง PLAYWRIGHT_MODULE เป็นที่อยู่เครื่องมือที่ติดตั้งไว้ได้");
    process.exitCode = 2;
  } else {
    run(chromium, { base: process.env.BASE, shots: process.env.SHOTS }).then((results) => {
      results.forEach((result) => console.log((result.ok ? "ผ่าน " : "ไม่ผ่าน ") + result.name
        + (!result.ok && result.detail !== undefined ? " · " + JSON.stringify(result.detail) : "")));
      console.log(results.filter((result) => result.ok).length + "/" + results.length + " ผ่าน");
      process.exitCode = results.some((result) => !result.ok) ? 1 : 0;
    }).catch((error) => { console.error(error); process.exitCode = 1; });
  }
}
