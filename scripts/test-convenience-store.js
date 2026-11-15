#!/usr/bin/env node
// ทดสอบเกมร้านสะดวกซื้อผ่านหน้าจอจริง ทั้งการส่งเครื่อง ความลับ คะแนน และออฟไลน์
const fs = require("fs");
const path = require("path");
const http = require("http");
const vm = require("vm");
const ROOT = path.join(__dirname, "..");

function readList(file, variable) {
  return vm.runInNewContext(fs.readFileSync(path.join(ROOT, file), "utf8") + "; " + variable);
}

async function serve() {
  const server = http.createServer((req, res) => {
    let file;
    try {
      const url = new URL(req.url, "http://localhost");
      file = path.resolve(ROOT, "." + decodeURIComponent(url.pathname));
      if (file === ROOT) file = path.join(ROOT, "index.html");
    } catch (e) { res.writeHead(400).end(); return; }
    if (!file.startsWith(ROOT + path.sep)) { res.writeHead(403).end(); return; }
    fs.readFile(file, (err, data) => {
      if (err) { res.writeHead(404).end(); return; }
      const types = { ".html": "text/html", ".js": "text/javascript", ".css": "text/css", ".png": "image/png", ".jpg": "image/jpeg", ".svg": "image/svg+xml", ".json": "application/json" };
      res.writeHead(200, { "Content-Type": types[path.extname(file)] || "application/octet-stream" });
      res.end(data);
    });
  });
  await new Promise((resolve, reject) => {
    server.once("error", reject);
    server.listen(0, "127.0.0.1", resolve);
  });
  return { base: "http://127.0.0.1:" + server.address().port, close: () => new Promise((resolve) => server.close(resolve)) };
}

async function run(chromium, options = {}) {
  const prompts = readList("data/convenience-store.js", "CONVENIENCE_STORE_LIST");
  const products = readList("data/convenience-products.js", "CONVENIENCE_PRODUCTS");
  const categories = [...new Set(prompts.map((item) => item.cat))];
  const local = options.base ? null : await serve();
  const base = (options.base || local.base).replace(/\/$/, "");
  const executablePath = options.executablePath || process.env.CHROMIUM_PATH
    || (fs.existsSync("/usr/bin/chromium") ? "/usr/bin/chromium" : undefined);
  const results = [];
  const errors = [];
  const check = (name, ok, detail) => results.push({ name, ok: !!ok, detail });
  let browser;
  const shots = options.shots;
  if (shots) fs.mkdirSync(shots, { recursive: true });
  const shot = async (page, name) => {
    if (shots) await page.screenshot({ path: path.join(shots, "convenience-store-" + name + ".png"), fullPage: true, animations: "disabled" });
  };
  const productButton = (page, id) => page.locator("#csShelf .cs-product[data-product-id=" + JSON.stringify(id) + "]");
  const hud = (page) => page.evaluate(() => {
    const numbers = (id) => (document.getElementById(id).textContent.match(/\d+/g) || []).map(Number);
    return { round: numbers("csRoundText"), score: numbers("csScoreText") };
  });
  const snapshot = (page) => page.evaluate(() => {
    const read = (storage) => Object.keys(storage).sort().map((key) => [key, storage.getItem(key)]);
    return { local: read(localStorage), session: read(sessionStorage), href: location.href, name: window.name, keys: Object.keys(window).sort() };
  });
  const samePrivacy = (before, after) => JSON.stringify(before.local) === JSON.stringify(after.local)
    && JSON.stringify(before.session) === JSON.stringify(after.session)
    && before.href === after.href && before.name === after.name
    && after.keys.every((key) => before.keys.includes(key));
  const setupVisible = async (page) => page.locator("#csSetupForm").waitFor({ state: "visible" });
  const emptyPrivateDom = (page) => page.evaluate(() => {
    const play = document.getElementById("csPlay");
    return document.querySelectorAll("#csShelf .cs-product").length === 0
      && !play.querySelector(".is-selected, .is-answer, .is-guess")
      && !document.getElementById("csRevealDetails").textContent.trim();
  });
  const focusIs = (page, id) => page.evaluate((target) => document.activeElement.id === target, id);
  const doubleClick = (page, id) => page.locator("#" + id).evaluate((button) => { button.click(); button.click(); });
  async function newPage(context) {
    const page = await context.newPage();
    page.on("pageerror", (error) => errors.push(error.message));
    await page.goto(base + "/convenience-store.html", { waitUntil: "domcontentloaded" });
    await setupVisible(page);
    return page;
  }
  async function newContext(settings = {}) {
    const context = await browser.newContext({ viewport: { width: 390, height: 844 }, serviceWorkers: "block", reducedMotion: "reduce", ...settings });
    await context.route("**://fonts.g*/**", (route) => route.abort());
    return context;
  }
  async function start(page, cat = "all", limit = "6") {
    await setupVisible(page);
    await page.locator("#csRoundLimit").selectOption(limit);
    await page.locator('#csCategories [data-cat="' + cat + '"]').click();
    await page.locator("#csStart").click();
    await page.locator("#csShelf .cs-product").first().waitFor({ state: "visible" });
  }
  async function reset(page) {
    await page.locator("#csReset").click();
    await setupVisible(page);
  }
  async function grid(page, withImages = true) {
    const item = await page.evaluate(() => ({
      q: document.getElementById("csPrompt").textContent.trim(),
      label: document.getElementById("csCategoryLabel").textContent.trim(),
      ids: Array.from(document.querySelectorAll("#csShelf .cs-product"), (el) => el.dataset.productId),
      labels: Array.from(document.querySelectorAll("#csShelf .cs-product"), (el) => el.textContent),
      nativeButtons: Array.from(document.querySelectorAll("#csShelf .cs-product"), (el) => el.tagName === "BUTTON" && el.type === "button")
    }));
    const prompt = prompts.find((entry) => entry.q === item.q);
    const expected = products.filter((entry) => entry.cat === prompt?.cat);
    const correctProducts = !!prompt && item.ids.length === 6 && expected.length === 6
      && JSON.stringify(item.ids.slice().sort()) === JSON.stringify(expected.map((entry) => entry.id).sort());
    const readable = item.ids.every((id, index) => {
      const product = products.find((entry) => entry.id === id);
      return product && item.labels[index].includes(product.name) && item.labels[index].includes(product.brand);
    });
    let loaded = true;
    if (withImages) {
      await page.waitForFunction(() => {
        const images = Array.from(document.querySelectorAll("#csShelf .cs-product img"));
        return images.length === 6 && images.every((img) => img.complete && img.naturalWidth > 0);
      }, null, { timeout: 15000 });
      const images = await page.locator("#csShelf .cs-product").evaluateAll((cards) =>
        cards.map((card) => ({ id: card.dataset.productId, src: card.querySelector("img")?.src })));
      loaded = images.length === expected.length && images.every((image) => {
        const product = expected.find((entry) => entry.id === image.id);
        return product && image.src === new URL(product.image, base + "/").href;
      });
    }
    return { ...item, prompt, correctProducts, readable, loaded };
  }
  let lastOverflow = null;
  async function noOverflow(page) {
    lastOverflow = await page.evaluate(() => {
      const visible = (el) => el.getClientRects().length && !el.closest("[hidden]");
      const failures = [];
      const cards = Array.from(document.querySelectorAll("#csCategories button, #csShelf .cs-product")).filter(visible);
      cards.forEach((el) => {
        const rect = el.getBoundingClientRect();
        if (rect.left < -1 || rect.right > innerWidth + 1) failures.push({ kind: "ขอบปุ่ม", text: el.textContent, left: rect.left, right: rect.right });
        // แถบชั้นตกแต่ง ::after ยื่นจากปุ่มสินค้าได้ แต่ข้อความจริงต้องอยู่ในปุ่มและอ่านครบ
        const labels = el.matches(".cs-product")
          ? el.querySelectorAll(".cs-product-name, .cs-product-brand, .cs-product-badges") : [el];
        Array.from(labels).filter(visible).forEach((label) => {
          const textRect = label.getBoundingClientRect();
          if (label.scrollWidth > label.clientWidth + 1 || textRect.left < rect.left - 1 || textRect.right > rect.right + 1) {
            failures.push({ kind: "ข้อความ", text: label.textContent, scroll: label.scrollWidth, client: label.clientWidth, left: textRect.left, right: textRect.right });
          }
        });
      });
      return { ok: document.documentElement.scrollWidth <= innerWidth && failures.length === 0,
        width: innerWidth, pageWidth: document.documentElement.scrollWidth, failures,
        cards: cards.filter((el) => el.matches(".cs-product")).map((el) => ({ client: el.clientWidth, scrollWithShelf: el.scrollWidth })) };
    });
    return lastOverflow.ok;
  }
  async function playRound(page, correct, capture = false) {
    const before = await snapshot(page);
    const beforeHud = await hud(page);
    const initialGrid = await grid(page, false);
    const chooser = await page.locator("#csTurnLabel").textContent();
    const chosenId = initialGrid.ids[0];
    const chosen = products.find((entry) => entry.id === chosenId);
    const oldNode = await productButton(page, chosenId).elementHandle();
    await productButton(page, chosenId).click();
    const selection = await productButton(page, chosenId).getAttribute("aria-pressed") === "true"
      && await productButton(page, chosenId).evaluate((el) => el.classList.contains("is-selected"))
      && await page.locator("#csConfirm").isEnabled();
    if (capture) await shot(page, "choose");
    await doubleClick(page, "csConfirm");
    await page.locator("#csPass").waitFor({ state: "visible" });
    const passHud = await hud(page);
    const pass = await page.evaluate(({ id, name }) => {
      const play = document.getElementById("csPlay");
      const privateText = play.outerHTML + document.getElementById("csPass").textContent;
      return document.getElementById("csPlay").hidden
        && !document.querySelector("#csShelf .cs-product")
        && !play.querySelector(".is-selected, .is-answer, .is-guess")
        && !document.getElementById("csRevealDetails").textContent.trim()
        && !privateText.includes(id) && !privateText.includes(name);
    }, { id: chosen.id, name: chosen.name });
    const disconnected = await oldNode.evaluate((node) => !node.isConnected);
    await oldNode.dispose();
    const privateState = samePrivacy(before, await snapshot(page));
    const passFocus = await focusIs(page, "csReady");
    if (capture) await shot(page, "pass");
    await doubleClick(page, "csReady");
    await page.locator("#csShelf .cs-product").first().waitFor({ state: "visible" });
    const guesser = await page.locator("#csTurnLabel").textContent();
    const guessFocus = await focusIs(page, "csTurnLabel");
    const fresh = await page.evaluate(() => {
      const cards = Array.from(document.querySelectorAll("#csShelf .cs-product"));
      return cards.length === 6 && cards.every((el) => el.getAttribute("aria-pressed") === "false"
        && !el.classList.contains("is-selected") && !el.classList.contains("is-answer") && !el.classList.contains("is-guess"))
        && document.getElementById("csConfirm").disabled;
    });
    const guessingGrid = await grid(page, false);
    if (capture) await shot(page, "guess");
    const guessId = correct ? chosenId : initialGrid.ids.find((id) => id !== chosenId);
    const guessed = products.find((entry) => entry.id === guessId);
    await productButton(page, guessId).click();
    await doubleClick(page, "csConfirm");
    await page.locator("#csReveal").waitFor({ state: "visible" });
    const afterHud = await hud(page);
    const revealText = await page.locator("#csRevealDetails").textContent();
    const title = await page.locator("#csRevealTitle").textContent();
    const revealFocus = await focusIs(page, "csRevealTitle");
    if (capture) await shot(page, "reveal");
    return {
      q: initialGrid.q, chooser, guesser, selection, pass, disconnected, privateState, passFocus, guessFocus, fresh,
      gridMatches: guessingGrid.correctProducts && guessingGrid.prompt?.cat === initialGrid.prompt?.cat,
      noEarlyScore: JSON.stringify(passHud.score) === JSON.stringify(beforeHud.score),
      scoreOnce: afterHud.score[0] === beforeHud.score[0] + Number(correct) && afterHud.score[1] === beforeHud.score[1] + 1,
      revealNames: revealText.includes(chosen.name) && revealText.includes(guessed.name), title, revealFocus, score: afterHud.score
    };
  }

  try {
    browser = await chromium.launch({ headless: true, ...(executablePath ? { executablePath } : {}) });
    const context = await newContext();
    const page = await newPage(context);
    check("เริ่มที่หน้าตั้งค่าและเลือกหกรอบเป็นค่าเริ่มต้น", await page.locator("#csRoundLimit").inputValue() === "6"
      && await page.locator("#csPass").isHidden() && await page.locator("#csSummary").isHidden());
    check("เริ่มเกมได้โดยไม่มีช่องกรอกชื่อผู้เล่น", await page.locator("#csSetupForm input").count() === 0
      && await page.locator("#csStart").isEnabled() && await page.locator("#csPlay").isHidden());
    await shot(page, "setup");

    await start(page, "soda");
    check("คนที่ 1 เป็นผู้เลือกในรอบแรก", (await page.locator("#csTurnLabel").textContent()).startsWith("คนที่ 1 "));
    const defaultId = (await grid(page)).ids[0];
    await productButton(page, defaultId).click();
    await page.locator("#csConfirm").click();
    check("ส่งเครื่องให้คนที่ 2 ทายในรอบแรก", (await page.locator("#csPassTitle").textContent()).includes("คนที่ 2"));
    await reset(page);
    check("รีเซ็ตกลับปุ่มเริ่มและล้างหน้าที่เก็บตัวเลือก", await focusIs(page, "csStart") && await emptyPrivateDom(page));

    const gridChecks = [];
    for (const cat of ["all", ...categories]) {
      await start(page, cat);
      const current = await grid(page);
      gridChecks.push({ cat, promptCat: current.prompt?.cat, valid: current.correctProducts && current.readable && current.loaded
        && current.nativeButtons.every(Boolean) && (cat === "all" || current.prompt?.cat === cat) && !!current.label });
      if (cat === "icecream") await shot(page, "icecream-shelf");
      await reset(page);
    }
    check("ทุกหมวดและทั้งหมดใช้โจทย์จริงกับสินค้าหกชิ้นในหมวดเดียวกัน", gridChecks.every((item) => item.valid), gridChecks);

    for (const cat of ["mama", "lays", "music"]) {
      await start(page, cat);
      const current = await grid(page);
      const choices = products.filter((item) => item.cat === cat);
      const brands = new Set(choices.map((item) => item.brand));
      const choiceNames = new Set(choices.map((item) => item.name));
      const expectedBrand = cat === "mama" ? "มาม่า" : "เลย์";
      check("หมวด " + cat + " แสดงชื่อรสหรือเพลงพร้อมแบรนด์หรือศิลปินครบ", current.correctProducts
        && current.readable && current.loaded && choiceNames.size === choices.length
        && (cat === "music" ? brands.size >= 2 : brands.size === 1 && brands.has(expectedBrand)));
      await shot(page, cat + "-shelf");
      const round = await playRound(page, true);
      check("เลือก ส่งเครื่อง ทาย และเฉลยหมวด " + cat + " ได้โดยไม่เผยคำตอบ", round.selection
        && round.pass && round.disconnected && round.privateState && round.fresh && round.gridMatches
        && round.noEarlyScore && round.scoreOnce && round.revealNames
        && JSON.stringify(round.score) === JSON.stringify([1, 1]), round);
      const noun = cat === "music" ? "เพลง" : "รสชาติ";
      check("ข้อความคนเลือกและคนทายตรงกับหมวด " + cat, round.chooser.includes("เลือก" + noun)
        && round.guesser.includes("ทาย" + noun), { chooser: round.chooser, guesser: round.guesser });
      if (cat === "music") await shot(page, "music-reveal");
      for (const width of [320, 390, 1280]) {
        await page.setViewportSize({ width, height: 900 });
        check("ชั้นรสหรือเพลง " + cat + " อ่านครบและไม่ล้นจอ " + width, await noOverflow(page), lastOverflow);
      }
      await page.setViewportSize({ width: 390, height: 844 });
      await reset(page);
    }

    for (const limit of ["10", "12"]) {
      await start(page, "snacks", limit);
      check("ตั้งจำนวนรอบเป็น " + limit + " ได้", (await hud(page)).round[1] === Number(limit));
      await reset(page);
    }

    for (const width of [320, 390, 1280]) {
      await page.setViewportSize({ width, height: 900 });
      check("หน้าตั้งค่าและปุ่มหมวดไม่ล้นจอ " + width, await noOverflow(page), lastOverflow);
    }
    await page.setViewportSize({ width: 390, height: 844 });
    await page.locator('#csCategories [data-cat="tea"]').focus();
    await page.keyboard.press("Space");
    check("เลือกหมวดด้วยคีย์บอร์ดได้", await page.locator('#csCategories [data-cat="tea"]').getAttribute("aria-pressed") === "true");
    await page.locator("#csRoundLimit").selectOption("6");
    await page.locator("#csStart").focus();
    await page.keyboard.press("Enter");
    await page.locator("#csShelf .cs-product").first().waitFor({ state: "visible" });
    check("เริ่มเกมด้วยคีย์บอร์ดและโฟกัสหัวข้อผู้เลือก", await focusIs(page, "csTurnLabel") && (await grid(page)).prompt?.cat === "tea");
    await page.keyboard.press("Tab");
    check("กดแท็บจากหัวข้อถึงสินค้าที่เลือกได้", await page.evaluate(() => document.activeElement.matches("#csShelf .cs-product")));
    await page.keyboard.press("Enter");
    await page.locator("#csConfirm").focus();
    await page.keyboard.press("Enter");
    check("ยืนยันด้วยคีย์บอร์ดแล้วโฟกัสปุ่มส่งต่อ", await page.locator("#csPass").isVisible() && await focusIs(page, "csReady"));
    await page.keyboard.press("Enter");
    check("พร้อมทายแล้วโฟกัสหัวข้อคนทาย", await focusIs(page, "csTurnLabel"));
    await page.keyboard.press("Tab");
    await page.keyboard.press("Space");
    await page.locator("#csConfirm").focus();
    await page.keyboard.press("Enter");
    check("เฉลยด้วยคีย์บอร์ดแล้วโฟกัสหัวข้อผลลัพธ์", await page.locator("#csReveal").isVisible() && await focusIs(page, "csRevealTitle"));
    await reset(page);

    await start(page, "tea");
    const rounds = [];
    const correctness = [true, false, true, false, true, true];
    for (let i = 0; i < correctness.length; i++) {
      const round = await playRound(page, correctness[i], i === 0);
      rounds.push(round);
      check("คิดคะแนนครั้งเดียวในรอบที่ " + (i + 1), round.scoreOnce && round.noEarlyScore, round.score);
      for (const width of (i === 0 ? [320, 390, 1280] : [])) {
        await page.setViewportSize({ width, height: 900 });
        check("ชั้นสินค้าและหน้าผลลัพธ์ไม่ล้นจอ " + width, await noOverflow(page), lastOverflow);
      }
      if (i === 0) { await shot(page, "desktop"); await page.setViewportSize({ width: 390, height: 844 }); }
      await doubleClick(page, "csNext");
      if (i < correctness.length - 1) {
        await page.locator("#csShelf .cs-product").first().waitFor({ state: "visible" });
        check("กดรอบถัดไปติดกันไม่ข้ามรอบ " + (i + 2), (await hud(page)).round[0] === i + 2
          && await page.locator("#csReveal").isHidden() && !(await page.locator("#csRevealDetails").textContent()).trim());
      }
    }
    check("ส่งเครื่องแล้วไม่เหลือสินค้า เครื่องหมาย หรือคำตอบในหน้าที่ซ่อน", rounds.every((r) => r.pass && r.disconnected));
    check("การส่งเครื่องไม่เขียนข้อมูลลงพื้นที่เก็บ URL ชื่อหน้าต่าง หรือตัวแปรใหม่", rounds.every((r) => r.privateState));
    check("คนทายได้ชั้นสินค้าใหม่ที่ยังไม่มีคำตอบถูกเลือก", rounds.every((r) => r.fresh && r.gridMatches));
    check("ผู้เลือกและคนทายสลับบทบาทครบหกรอบ", rounds.every((r, i) =>
      r.chooser.startsWith(i % 2 === 0 ? "คนที่ 1 " : "คนที่ 2 ")
      && r.guesser.startsWith(i % 2 === 0 ? "คนที่ 2 " : "คนที่ 1 ")));
    check("การเลือกและเฉลยแสดงชื่อสินค้าตามที่ทั้งคู่กด", rounds.every((r) => r.selection && r.revealNames));
    check("ทุกช่วงย้ายโฟกัสไปยังส่วนที่เปิดใหม่", rounds.every((r) => r.passFocus && r.guessFocus && r.revealFocus));
    check("ผลตอบตรงและไม่ตรงใช้ข้อความต่างกัน", !!rounds[0].title.trim() && rounds[0].title !== rounds[1].title);
    check("โจทย์หมวดเดิมไม่ซ้ำก่อนครบถุงและไม่ซ้ำท้ายรอบ", new Set(rounds.slice(0, 5).map((r) => r.q)).size === 5 && rounds[5].q !== rounds[4].q);
    check("ครบหกรอบจบที่หน้าสรุปพร้อมคะแนนสี่จากหก", await page.locator("#csSummary").isVisible()
      && JSON.stringify((await hud(page)).score) === JSON.stringify([4, 6]) && await focusIs(page, "csSummaryTitle")
      && (await page.locator("#csSummaryText").textContent()).includes("4") && (await page.locator("#csSummaryText").textContent()).includes("6")
      && (await page.locator("#csSummaryText").textContent()).includes("คนที่ 1")
      && (await page.locator("#csSummaryText").textContent()).includes("คนที่ 2"));
    await shot(page, "summary");
    await doubleClick(page, "csConfirm");
    check("กดปุ่มยืนยันเก่าหลังจบเกมไม่เพิ่มคะแนน", JSON.stringify((await hud(page)).score) === JSON.stringify([4, 6]));
    await page.locator("#csPlayAgain").click();
    await setupVisible(page);
    check("เล่นอีกรอบกลับตั้งค่าและล้างคำตอบ", await focusIs(page, "csStart") && await emptyPrivateDom(page));

    await start(page, "soda");
    const staleId = (await grid(page)).ids[0];
    await productButton(page, staleId).click();
    await page.locator("#csConfirm").click();
    await reset(page);
    await start(page, "milk");
    const afterReset = await playRound(page, true);
    check("เปลี่ยนหมวดหลังรีเซ็ตใช้คำตอบของเกมใหม่และคะแนนเริ่มใหม่", afterReset.scoreOnce && afterReset.fresh
      && JSON.stringify(afterReset.score) === JSON.stringify([1, 1]));
    await reset(page);

    for (const phase of ["pass", "guess"]) {
      await start(page, "snacks");
      const id = (await grid(page)).ids[0];
      await productButton(page, id).click();
      await page.locator("#csConfirm").click();
      if (phase === "guess") await page.locator("#csReady").click();
      await page.reload({ waitUntil: "domcontentloaded" });
      await setupVisible(page);
      check("โหลดหน้าใหม่ระหว่าง " + phase + " ไม่คืนตัวเลือกเดิม", await emptyPrivateDom(page)
        && await page.locator("#csPass").isHidden() && await page.locator("#csPlay").isHidden());
    }
    await context.close();

    const faultContext = await newContext();
    let imageFailures = 0;
    await faultContext.route("**/assets/convenience-store/products.png*", (route) => { imageFailures++; return route.abort(); });
    const faultPage = await newPage(faultContext);
    await start(faultPage, "icecream");
    await faultPage.waitForFunction(() => !!document.querySelector("#csShelf .cs-image-missing"), null, { timeout: 10000 });
    const failedGrid = await grid(faultPage, false);
    const failedRound = await playRound(faultPage, true);
    check("ภาพเสียยังอ่านชื่อแบรนด์ เลือก ทาย และคิดคะแนนได้", imageFailures > 0 && failedGrid.readable
      && failedGrid.correctProducts && failedRound.scoreOnce && failedRound.pass && failedRound.fresh);
    await shot(faultPage, "image-failure");
    await reset(faultPage);
    let svgFailures = 0;
    await faultContext.route("**/assets/convenience-store/*.svg", (route) => { svgFailures++; return route.abort(); });
    await start(faultPage, "lays");
    await faultPage.waitForFunction(() => !!document.querySelector("#csShelf .cs-image-missing"), null, { timeout: 10000 });
    const failedSvgGrid = await grid(faultPage, false);
    const failedSvgRound = await playRound(faultPage, true);
    check("ภาพรสชาติแบบ SVG เสียยังเลือกและทายด้วยชื่อรสได้", svgFailures > 0 && failedSvgGrid.readable
      && failedSvgGrid.correctProducts && failedSvgRound.scoreOnce && failedSvgRound.pass && failedSvgRound.fresh);
    await shot(faultPage, "svg-image-failure");
    await faultContext.close();

    const offlineContext = await newContext({ serviceWorkers: "allow" });
    const offlinePage = await offlineContext.newPage();
    offlinePage.on("pageerror", (error) => errors.push(error.message));
    await offlinePage.goto(base + "/index.html", { waitUntil: "domcontentloaded" });
    await offlinePage.evaluate(async () => {
      await navigator.serviceWorker.register("sw.js");
      await Promise.race([navigator.serviceWorker.ready, new Promise((_, reject) => setTimeout(() => reject(new Error("service worker ยังไม่พร้อม")), 30000))]);
    });
    await offlinePage.waitForFunction(() => !!navigator.serviceWorker.controller, null, { timeout: 30000 });
    const cachedPaths = ["convenience-store.html", "css/convenience-store.css", "js/convenience-store.js",
      "data/convenience-store.js", "data/convenience-products.js", ...new Set(products.map((item) => item.image))];
    const cached = await offlinePage.evaluate(async (paths) => Promise.all(paths.map(async (file) => !!await caches.match(new URL(file, location.href).href))), cachedPaths);
    check("service worker เก็บหน้าเกม สคริปต์ คลัง และภาพครบ", cached.every(Boolean), cachedPaths.filter((_, i) => !cached[i]));
    const swResponses = new Set();
    offlinePage.on("response", (response) => { if (response.fromServiceWorker()) swResponses.add(new URL(response.url()).pathname); });
    await offlineContext.setOffline(true);
    const offlineResponse = await offlinePage.goto(base + "/convenience-store.html", { waitUntil: "domcontentloaded" });
    await start(offlinePage, "noodles");
    const offlineGrid = await grid(offlinePage);
    const offlineRound = await playRound(offlinePage, true);
    check("เปิดหน้า โหลดภาพ และเล่นครบหนึ่งรอบขณะออฟไลน์จริง", offlineResponse.fromServiceWorker()
      && offlineGrid.loaded && offlineRound.scoreOnce && offlineRound.pass && offlineRound.fresh
      && Array.from(swResponses).some((file) => file.endsWith("/assets/convenience-store/products.png")));
    await shot(offlinePage, "offline");
    await offlinePage.reload({ waitUntil: "domcontentloaded" });
    await setupVisible(offlinePage);
    check("โหลดหน้าออฟไลน์ใหม่ยังล้างเกมเดิม", await emptyPrivateDom(offlinePage) && await offlinePage.locator("#csPlay").isHidden());
    for (const cat of ["mama", "lays", "music"]) {
      await start(offlinePage, cat);
      const current = await grid(offlinePage);
      const round = await playRound(offlinePage, true);
      const images = new Set(products.filter((item) => item.cat === cat)
        .map((item) => new URL(item.image, base + "/").pathname));
      check("รูปและรอบเล่นหมวด " + cat + " ทำงานขณะออฟไลน์จริง", current.correctProducts
        && current.readable && current.loaded && round.scoreOnce && round.pass && round.fresh
        && round.privateState && [...images].every((image) => swResponses.has(image)),
        { images: [...images], servedByWorker: [...images].filter((image) => swResponses.has(image)) });
      await shot(offlinePage, "offline-" + cat);
      await reset(offlinePage);
    }
    await offlineContext.close();
    check("ไม่มีข้อผิดพลาดสคริปต์ตลอดการเล่น", errors.length === 0, errors);
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
    try { chromium = require(location).chromium; break; } catch (e) {}
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
