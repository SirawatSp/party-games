#!/usr/bin/env node
// ทดสอบเปิดป้ายกับภาพจริง ทั้งการสุ่ม คะแนน และการกู้คืนเมื่อภาพโหลดไม่สำเร็จ
const path = require("path");
const fs = require("fs");
const http = require("http");
const vm = require("vm");
const ROOT = path.join(__dirname, "..");

async function run(chromium, options = {}) {
  const entries = vm.runInNewContext(fs.readFileSync(path.join(ROOT, "data/picture-reveal.js"), "utf8") + "; PICTURE_REVEAL_LIST");
  const expectedCounts = entries.reduce((s, x) => (s[x.cat] = (s[x.cat] || 0) + 1, s), {});
  const categories = ["movies", "cartoons", "thai_food"];
  const launchOptions = { headless: true, ...(options.executablePath ? { executablePath: options.executablePath } : {}) };
  // ใช้ HTTP ในเครื่องเพื่อทดสอบ service worker จริงได้ โดยไม่เพิ่ม dependency ของเว็บ
  let server = null;
  if (!options.base) {
    server = http.createServer((req, res) => {
      const file = path.resolve(ROOT, "." + decodeURIComponent(new URL(req.url, "http://localhost").pathname));
      const target = file === ROOT ? path.join(ROOT, "index.html") : file;
      if (!target.startsWith(ROOT + path.sep)) { res.writeHead(403).end(); return; }
      const types = { ".html": "text/html", ".js": "text/javascript", ".css": "text/css", ".jpg": "image/jpeg", ".png": "image/png", ".json": "application/json" };
      fs.readFile(target, (err, data) => {
        if (err) { res.writeHead(404).end(); return; }
        res.writeHead(200, { "Content-Type": types[path.extname(target)] || "application/octet-stream" });
        res.end(data);
      });
    });
    await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  }
  const base = (options.base || "http://127.0.0.1:" + server.address().port).replace(/\/$/, "");
  let browser;
  try {
    browser = await chromium.launch(launchOptions);
  } catch (e) {
    if (server) await new Promise((resolve) => server.close(resolve));
    throw e;
  }
  let faultBrowser = null;
  const results = [];
  const check = (name, ok, detail) => results.push({ name, ok: !!ok, detail });
  const ready = async (page) => {
    await page.waitForFunction(() => !document.getElementById("prBoard").hidden
      || !document.getElementById("prError").hidden, null, { timeout: 25000 });
    if (await page.locator("#prError").isVisible()) throw new Error("ภาพจริงโหลดไม่สำเร็จระหว่างทดสอบ");
  };
  try {
    const context = await browser.newContext({ viewport: { width: 390, height: 844 }, serviceWorkers: "block", reducedMotion: "reduce" });
    const page = await context.newPage();
    const errors = [];
    page.on("pageerror", (e) => errors.push(e.message));
    await page.goto(base + "/picture-reveal.html", { waitUntil: "domcontentloaded" });
    if (options.localOnly) await page.locator('[data-cat="thai_food"]').click();
    const counts = await page.evaluate(() => PICTURE_REVEAL_LIST.reduce((s, x) => (s[x.cat] = (s[x.cat] || 0) + 1, s), {}));
    check("สามหมวดและจำนวนภาพตรงกับไฟล์คลัง", Object.keys(counts).length === categories.length
      && categories.every((cat) => counts[cat] > 0 && counts[cat] === expectedCounts[cat]), counts);
    await ready(page);

    for (const category of (options.localOnly ? ["thai_food"] : categories)) {
      if (!options.localOnly) await page.locator('[data-cat="' + category + '"]').click();
      check("ป้ายจำนวนตรงกับหมวด " + category, await page.locator("#prPoolCount").textContent() === counts[category] + " รูปในหมวดนี้");
      const seen = new Set();
      let valid = true;
      let last = "";
      for (let i = 0; i < expectedCounts[category]; i++) {
        await ready(page);
        await page.locator("#prReveal").click();
        const item = await page.evaluate(() => {
          const name = document.getElementById("prAnswerText").textContent;
          const entry = PICTURE_REVEAL_LIST.find((x) => x.answer === name);
          const image = document.querySelector("#prImageHost img");
          return { name, cat: entry?.cat, imageMatches: !!entry && [entry.image, entry.fallback]
            .filter(Boolean).some((url) => new URL(url, location.href).href === image.src),
            loaded: image.naturalWidth > 0, sourceMatches: document.querySelector("#prCredit a").href === entry?.source };
        });
        valid = valid && item.cat === category && item.imageMatches && item.loaded && item.sourceMatches;
        seen.add(item.name);
        last = item.name;
        await page.locator("#prSkip").click();
      }
      check("ภาพจริงและเฉลยตรงกันครบหมวด " + category, valid);
      check("ภาพไม่ซ้ำก่อนครบรอบ " + category, seen.size === expectedCounts[category], { seen: seen.size, expected: expectedCounts[category] });
      await ready(page);
      await page.locator("#prReveal").click();
      check("เริ่มรอบใหม่ไม่ซ้ำรูปสุดท้าย " + category, await page.locator("#prAnswerText").textContent() !== last);
    }
    check("ข้ามหรือเฉลยอย่างเดียวไม่เพิ่มคะแนน", await page.locator("#prTotalScore").textContent() === "0");
    for (const category of categories) {
      await page.locator('[data-cat="' + category + '"]').click();
      check("เปลี่ยนหมวดแล้วปุ่มและจำนวนตรงกัน " + category,
        await page.locator('[data-cat="' + category + '"]').getAttribute("aria-pressed") === "true"
        && await page.locator("#prCategories [aria-pressed=true]").count() === 1
        && await page.locator("#prPoolCount").textContent() === expectedCounts[category] + " รูปในหมวดนี้");
    }

    await page.locator('[data-cat="thai_food"]').click();
    await ready(page);
    const roundState = () => page.evaluate(() => ({
      image: document.querySelector("#prImageHost img").src,
      tiles: Array.from(document.querySelectorAll(".pr-tile"), (el) => ({ open: el.classList.contains("is-open"), disabled: el.disabled })),
      opened: document.getElementById("prOpened").textContent,
      points: document.getElementById("prPoints").textContent,
      score: document.getElementById("prTotalScore").textContent,
      answerHidden: document.getElementById("prAnswer").hidden,
      correctDisabled: document.getElementById("prCorrect").disabled
    }));
    const initialRound = await roundState();
    await page.locator("#prHostPeek").click();
    check("คนดำเนินเกมเห็นเฉลยตรงกับรูปที่ปิดอยู่", await page.evaluate(() => {
      const image = document.querySelector("#prImageHost img").src;
      const entry = PICTURE_REVEAL_LIST.find((x) => [x.image, x.fallback].filter(Boolean).some((url) => new URL(url, location.href).href === image));
      return document.getElementById("prHostAnswer").textContent === entry?.answer
        && document.getElementById("prHostAliases").textContent === ((entry.aliases || []).filter((x) => x !== entry.answer).length
          ? "รับคำตอบได้ด้วย: " + entry.aliases.filter((x) => x !== entry.answer).join(" · ") : "");
    }));
    check("หน้าต่างเฉลยรับโฟกัสและกันการกดเกมด้านหลัง", await page.evaluate(() => document.getElementById("prHostDialog").matches(":modal") && document.activeElement.id === "prHostClose"));
    check("แอบดูคำตอบไม่เปิดป้ายหรือเปลี่ยนคะแนน", JSON.stringify(await roundState()) === JSON.stringify(initialRound));
    check("หน้าต่างเฉลยพอดีจอมือถือ", await page.locator("#prHostDialog").evaluate((el) => { const r = el.getBoundingClientRect(); return r.left >= 0 && r.right <= innerWidth && el.scrollWidth <= el.clientWidth; }));
    await page.keyboard.press("Escape");
    await page.waitForFunction(() => !document.getElementById("prHostDialog").open && !document.getElementById("prHostAnswer").textContent);
    check("กดหนีเพื่อปิดเฉลย ล้างคำตอบ และคืนโฟกัส", await page.evaluate(() => document.activeElement.id === "prHostPeek" && !document.getElementById("prHostAliases").textContent));
    await page.locator(".pr-tile").first().click();
    const partialRound = await roundState();
    await page.locator("#prHostPeek").click();
    await page.locator("#prHostClose").click();
    check("ปิดเฉลยแล้วเล่นต่อจากป้ายและแต้มเดิม", JSON.stringify(await roundState()) === JSON.stringify(partialRound));
    for (const action of ["skip", "category", "grid"]) {
      await page.locator("#prHostPeek").click();
      await page.evaluate((action) => {
        if (action === "skip") document.getElementById("prSkip").click();
        if (action === "category") document.querySelector('[data-cat="thai_food"]').click();
        if (action === "grid") {
          const select = document.getElementById("prGridSize");
          select.value = "3";
          select.dispatchEvent(new Event("change"));
        }
      }, action);
      await ready(page);
      check("เปลี่ยนรอบแล้วปิดและล้างเฉลยเดิม " + action, await page.evaluate(() => !document.getElementById("prHostDialog").open && !document.getElementById("prHostAnswer").textContent && !document.getElementById("prHostAliases").textContent));
    }
    let expectedScore = 0;
    for (const size of [3, 4, 5]) {
      await page.locator("#prGridSize").selectOption(String(size));
      await ready(page);
      const n = size * size;
      check("จำนวนแผ่นป้าย " + n + " ช่องตรงตัวเลือก", await page.locator(".pr-tile").count() === n);
      check("รูปใหม่เริ่มปิดครบและยังไม่แสดงคำตอบ " + n, await page.locator(".pr-tile.is-open").count() === 0 && await page.locator("#prAnswer").isHidden());
      check("ป้ายปิดทึบจริง " + n, await page.locator(".pr-tile").first().evaluate((el) => getComputedStyle(el).opacity === "1"));
      await page.locator(".pr-tile").first().click();
      await page.locator(".pr-tile").first().evaluate((el) => el.click());
      check("แตะป้ายเดิมไม่คิดซ้ำ " + n, await page.locator("#prOpened").textContent() === "เปิดแล้ว 1/" + n);
      await page.locator("#prRandom").click();
      await page.locator("#prRandom").click();
      check("สุ่มเปิดเฉพาะช่องที่ยังปิด " + n, await page.locator(".pr-tile.is-open").count() === 3);
      await page.locator("#prHostPeek").click();
      const peekedAnswer = await page.locator("#prHostAnswer").textContent();
      await page.locator("#prHostClose").click();
      await page.locator("#prReveal").click();
      check("เฉลยสาธารณะตรงกับที่คนดำเนินเกมเห็น " + n, await page.locator("#prAnswerText").textContent() === peekedAnswer && await page.locator("#prHostPeek").isDisabled());
      check("เฉลยแล้วเปิดภาพครบ " + n, await page.locator(".pr-tile").evaluateAll((els) => els.every((el) => el.disabled && getComputedStyle(el).opacity === "0")));
      check("แต้มยึดจากช่องก่อนเฉลย " + n, (await page.locator("#prCorrect").textContent()).includes(String(n - 3)));
      await page.locator("#prCorrect").evaluate((el) => { el.click(); el.click(); });
      await ready(page);
      expectedScore += n - 3;
      check("รับแต้มครั้งเดียวแม้กดติดกัน " + n, Number(await page.locator("#prTotalScore").textContent()) === expectedScore);
    }
    await page.evaluate(() => { for (let i = 0; i < 25; i++) document.getElementById("prRandom").click(); });
    check("เปิดครบแล้วปุ่มสุ่มหยุด", await page.locator("#prRandom").isDisabled());
    await page.locator("#prReveal").click();
    check("เปิดครบก่อนเฉลยเหลือศูนย์แต้ม", (await page.locator("#prCorrect").textContent()).includes("0 แต้ม"));
    await page.locator("#prResetScore").click();
    check("เริ่มนับคะแนนใหม่ได้", await page.locator("#prTotalScore").textContent() === "0");

    await page.evaluate(() => {
      document.querySelector('[data-cat="movies"]').click();
      document.querySelector('[data-cat="cartoons"]').click();
      document.querySelector('[data-cat="thai_food"]').click();
    });
    await ready(page);
    await page.waitForTimeout(350);
    check("คำขอภาพเก่าไม่ทับหมวดใหม่", await page.locator("#prImageHost img").evaluate((img) => img.src.includes("/assets/picture-reveal/food-")));
    await page.locator(".pr-tile").first().focus();
    await page.keyboard.press("Enter");
    check("เปิดป้ายด้วยคีย์บอร์ดได้", await page.locator(".pr-tile.is-open").count() === 1);
    check("จอมือถือไม่ล้นแนวนอน", await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
    if (options.shots) await page.screenshot({ path: path.join(options.shots, "picture-mobile.png"), fullPage: true });
    await page.setViewportSize({ width: 1280, height: 950 });
    check("จอคอมพิวเตอร์ไม่ล้นแนวนอน", await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
    await page.locator("#prReveal").click();
    if (options.shots) await page.screenshot({ path: path.join(options.shots, "picture-desktop.png"), fullPage: true });

    // ใช้เบราว์เซอร์ใหม่ เพื่อไม่ให้หน่วยความจำภาพที่โหลดก่อนหน้าข้ามการจำลองเครือข่ายล้มเหลว
    const fallbackEntry = await page.evaluate(() => PICTURE_REVEAL_LIST.find((x) => x.cat === "movies" && x.fallback));
    faultBrowser = await chromium.launch(launchOptions);
    const faultContext = await faultBrowser.newContext({ serviceWorkers: "block", reducedMotion: "reduce" });
    const faultPage = await faultContext.newPage();
    faultPage.on("pageerror", (e) => errors.push(e.message));
    let failedUrl = "";
    await faultPage.route("**/food-*.jpg", (route) => { failedUrl = route.request().url(); return route.abort(); });
    if (!options.localOnly) await faultPage.route(fallbackEntry.image, (route) => route.abort());
    await faultPage.goto(base + "/picture-reveal.html", { waitUntil: "domcontentloaded" });
    await faultPage.locator('[data-cat="thai_food"]').click();
    await faultPage.waitForSelector("#prError:not([hidden])", { timeout: 25000 });
    check("ภาพเสียแสดงทางเลือกแทนจอว่าง", await faultPage.locator("#prRetry").isVisible() && await faultPage.locator("#prBoard").isHidden());
    check("ภาพเสียรับแต้มไม่ได้", await faultPage.locator("#prReveal").isDisabled() && await faultPage.locator("#prCorrect").isDisabled());
    check("ภาพยังไม่พร้อมเปิดเฉลยคนดำเนินเกมไม่ได้", await faultPage.locator("#prHostPeek").isDisabled());
    await faultPage.unroute("**/food-*.jpg");
    await faultPage.locator("#prRetry").click();
    await ready(faultPage);
    check("ลองใหม่ได้รูปเดิมจริง", await faultPage.locator("#prImageHost img").getAttribute("src") === failedUrl
      || new URL(await faultPage.locator("#prImageHost img").getAttribute("src"), base + "/picture-reveal.html").href === failedUrl);
    await faultPage.route("**/food-*.jpg", (route) => { failedUrl = route.request().url(); return route.abort(); });
    await faultPage.locator("#prSkip").click();
    await faultPage.waitForSelector("#prError:not([hidden])", { timeout: 25000 });
    const skippedUrl = failedUrl;
    const scoreBeforeSkip = await faultPage.locator("#prTotalScore").textContent();
    await faultPage.unroute("**/food-*.jpg");
    await faultPage.locator("#prSkip").click();
    await ready(faultPage);
    check("ข้ามภาพเสียแล้วเล่นภาพถัดไปได้โดยไม่เพิ่มคะแนน", await faultPage.locator("#prImageHost img").evaluate((img, url) => img.naturalWidth > 0 && img.src !== url, skippedUrl)
      && await faultPage.locator("#prTotalScore").textContent() === scoreBeforeSkip);
    if (!options.localOnly) {
      await faultPage.locator('[data-cat="movies"]').click();
      let fallbackWorked = false;
      for (let i = 0; i < expectedCounts.movies; i++) {
        await ready(faultPage);
        if (await faultPage.locator("#prImageHost img").getAttribute("src") === fallbackEntry.fallback) {
          fallbackWorked = true;
          break;
        }
        await faultPage.locator("#prSkip").click();
      }
      check("ภาพสำรองทำงานเมื่อแหล่งหลักเสีย", fallbackWorked);
      await faultPage.locator("#prReveal").click();
      check("ภาพสำรองยังเฉลยตรงเรื่องเดิม", await faultPage.locator("#prAnswerText").textContent() === fallbackEntry.answer);
    }
    await faultContext.close();
    await faultBrowser.close();
    faultBrowser = null;
    await page.goto(base + "/index.html", { waitUntil: "domcontentloaded" });
    const cardCount = await page.locator('.card[href="picture-reveal.html"] .card-count').textContent();
    check("หน้าแรกแสดงจำนวนภาพตรงคลัง", Number(cardCount.replace(/[^0-9]/g, "")) === entries.length, cardCount);
    const sw = fs.readFileSync(path.join(ROOT, "sw.js"), "utf8");
    const localImages = fs.readdirSync(path.join(ROOT, "assets/picture-reveal")).filter((f) => f.endsWith(".jpg"));
    const foodEntries = entries.filter((entry) => entry.cat === "thai_food");
    check("ภาพอาหารมีไฟล์และเตรียมเก็บออฟไลน์ครบ", localImages.length === expectedCounts.thai_food
      && foodEntries.every((entry) => fs.existsSync(path.join(ROOT, entry.image)) && sw.includes('"' + entry.image + '"')));
    if (!/^https?:/.test(base)) throw new Error("การทดสอบออฟไลน์ต้องใช้ BASE แบบ HTTP หรือ HTTPS");
    const offlineContext = await browser.newContext({ serviceWorkers: "allow", reducedMotion: "reduce" });
    try {
      const offlinePage = await offlineContext.newPage();
      offlinePage.on("pageerror", (e) => errors.push(e.message));
      await offlinePage.goto(base + "/index.html", { waitUntil: "domcontentloaded" });
      await offlinePage.evaluate(async () => {
        await navigator.serviceWorker.register("sw.js");
        await navigator.serviceWorker.ready;
      });
      await offlinePage.waitForFunction(() => !!navigator.serviceWorker.controller, null, { timeout: 25000 });
      const cached = await offlinePage.evaluate(async (urls) => Promise.all(urls.map(async (url) => !!await caches.match(new URL(url, location.href).href))), foodEntries.map((entry) => entry.image));
      check("service worker เก็บภาพอาหารครบก่อนตัดเครือข่าย", cached.every(Boolean));
      const servedOffline = new Set();
      offlinePage.on("response", (response) => {
        if (response.fromServiceWorker() && response.url().includes("/assets/picture-reveal/food-")) servedOffline.add(response.url());
      });
      await offlineContext.setOffline(true);
      await offlinePage.goto(base + "/picture-reveal.html", { waitUntil: "domcontentloaded" });
      await offlinePage.locator('[data-cat="thai_food"]').click();
      const seenOffline = new Set();
      let offlineValid = true;
      for (let i = 0; i < expectedCounts.thai_food; i++) {
        await ready(offlinePage);
        await offlinePage.locator("#prReveal").click();
        const item = await offlinePage.evaluate(() => ({
          answer: document.getElementById("prAnswerText").textContent,
          loaded: document.querySelector("#prImageHost img").naturalWidth > 0
        }));
        offlineValid = offlineValid && item.loaded && foodEntries.some((entry) => entry.answer === item.answer);
        seenOffline.add(item.answer);
        if (i + 1 < expectedCounts.thai_food) await offlinePage.locator("#prSkip").click();
      }
      check("โหลดหน้าเกมและเล่นภาพอาหารครบขณะออฟไลน์", offlineValid && seenOffline.size === expectedCounts.thai_food
        && servedOffline.size === expectedCounts.thai_food, { seen: seenOffline.size, fromServiceWorker: servedOffline.size });
    } finally {
      await offlineContext.close();
    }
    check("เล่นแล้วไม่มีข้อผิดพลาดสคริปต์", errors.length === 0, errors);
    await context.close();
  } finally {
    if (faultBrowser) await faultBrowser.close();
    await browser.close();
    if (server) await new Promise((resolve) => server.close(resolve));
  }
  return results;
}

module.exports = run;
if (require.main === module) {
  try {
    const { chromium } = require(process.env.PLAYWRIGHT_MODULE || "playwright");
    if (process.env.PICTURE_LOCAL_ONLY === "1") console.log("ทดสอบเฉพาะภาพอาหารในเครื่องและการเล่นออฟไลน์ ยังไม่ตรวจภาพออนไลน์หรือภาพสำรอง");
    run(chromium, { base: process.env.BASE, shots: process.env.SHOTS, executablePath: process.env.CHROMIUM_PATH, localOnly: process.env.PICTURE_LOCAL_ONLY === "1" }).then((results) => {
      results.forEach((r) => console.log((r.ok ? "ผ่าน " : "ไม่ผ่าน ") + r.name + (!r.ok && r.detail ? " · " + JSON.stringify(r.detail) : "")));
      console.log(results.filter((r) => r.ok).length + "/" + results.length + " ผ่าน");
      process.exitCode = results.some((r) => !r.ok) ? 1 : 0;
    }).catch((e) => { console.error(e); process.exitCode = 1; });
  } catch (e) { console.error("ต้องมีเครื่องมือทดสอบ Playwright ในเครื่อง"); process.exitCode = 2; }
}
