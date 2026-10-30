#!/usr/bin/env node
// ทดสอบเปิดป้ายกับภาพจริง ทั้งการสุ่ม คะแนน และการกู้คืนเมื่อภาพโหลดไม่สำเร็จ
const path = require("path");
const fs = require("fs");
const { pathToFileURL } = require("url");
const ROOT = path.join(__dirname, "..");

async function run(chromium, options = {}) {
  const base = (options.base || pathToFileURL(ROOT + path.sep).href).replace(/\/$/, "");
  const browser = await chromium.launch({ headless: true });
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
    await ready(page);
    const counts = await page.evaluate(() => PICTURE_REVEAL_LIST.reduce((s, x) => (s[x.cat] = (s[x.cat] || 0) + 1, s), {}));
    check("สามหมวดมีภาพหมวดละสิบรูป", Object.keys(counts).length === 3 && Object.values(counts).every((n) => n === 10), counts);

    for (const category of ["movies", "cartoons", "thai_food"]) {
      await page.locator('[data-cat="' + category + '"]').click();
      const seen = new Set();
      let valid = true;
      let last = "";
      for (let i = 0; i < 10; i++) {
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
      check("สิบรูปไม่ซ้ำก่อนครบรอบ " + category, seen.size === 10);
      await ready(page);
      await page.locator("#prReveal").click();
      check("เริ่มรอบใหม่ไม่ซ้ำรูปสุดท้าย " + category, await page.locator("#prAnswerText").textContent() !== last);
    }
    check("ข้ามหรือเฉลยอย่างเดียวไม่เพิ่มคะแนน", await page.locator("#prTotalScore").textContent() === "0");

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
    faultBrowser = await chromium.launch({ headless: true });
    const faultContext = await faultBrowser.newContext({ serviceWorkers: "block", reducedMotion: "reduce" });
    const faultPage = await faultContext.newPage();
    faultPage.on("pageerror", (e) => errors.push(e.message));
    let failedUrl = "";
    await faultPage.route("**/food-*.jpg", (route) => { failedUrl = route.request().url(); return route.abort(); });
    await faultPage.route(fallbackEntry.image, (route) => route.abort());
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
    await faultPage.locator('[data-cat="movies"]').click();
    let fallbackWorked = false;
    for (let i = 0; i < 10; i++) {
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
    await faultContext.close();
    await faultBrowser.close();
    faultBrowser = null;
    check("เล่นแล้วไม่มีข้อผิดพลาดสคริปต์", errors.length === 0, errors);
    await page.goto(base + "/index.html", { waitUntil: "domcontentloaded" });
    check("หน้าแรกมีเกมใหม่พร้อมจำนวนสามสิบรูป", /30/.test(await page.locator('.card[href="picture-reveal.html"] .card-count').textContent()));
    const sw = fs.readFileSync(path.join(ROOT, "sw.js"), "utf8");
    const localImages = fs.readdirSync(path.join(ROOT, "assets/picture-reveal")).filter((f) => f.endsWith(".jpg"));
    check("อาหารสิบรูปมีไฟล์และเตรียมเก็บออฟไลน์ครบ", localImages.length === 10 && localImages.every((f) => sw.includes('"assets/picture-reveal/' + f + '"')));
    await context.close();
  } finally {
    if (faultBrowser) await faultBrowser.close();
    await browser.close();
  }
  return results;
}

module.exports = run;
if (require.main === module) {
  try {
    const { chromium } = require(process.env.PLAYWRIGHT_MODULE || "playwright");
    run(chromium, { base: process.env.BASE, shots: process.env.SHOTS }).then((results) => {
      results.forEach((r) => console.log((r.ok ? "ผ่าน " : "ไม่ผ่าน ") + r.name));
      console.log(results.filter((r) => r.ok).length + "/" + results.length + " ผ่าน");
      process.exitCode = results.some((r) => !r.ok) ? 1 : 0;
    }).catch((e) => { console.error(e); process.exitCode = 1; });
  } catch (e) { console.error("ต้องมีเครื่องมือทดสอบ Playwright ในเครื่อง"); process.exitCode = 2; }
}
