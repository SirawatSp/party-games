#!/usr/bin/env node
// เทสต์ควันของทั้งเว็บด้วยเบราว์เซอร์จริง — เปิดทุกหน้าดูว่าไม่มี JS error และเช็กจุดสำคัญของเกมหลัก
//
//   python3 -m http.server 8099 --bind 127.0.0.1      (รันจากรากโปรเจกต์ก่อน)
//   node scripts/smoke-test.js                         (BASE=http://... เปลี่ยน URL ได้)
//
// ต้องมี Playwright + Chromium ในเครื่อง ถ้าไม่มีสคริปต์จะบอกวิธีติดตั้ง ไม่ใช่ dependency ของเว็บ
const fs = require("fs");
const path = require("path");
const ROOT = path.join(__dirname, "..");
const BASE = process.env.BASE || "http://127.0.0.1:8099";
const SHOTS = process.env.SHOTS || "";           // โฟลเดอร์เก็บภาพหน้าจอ (เว้นว่าง = ไม่ถ่าย)

let chromium;
try {
  chromium = require("playwright").chromium;
} catch (e) {
  try { chromium = require("/opt/node22/lib/node_modules/playwright").chromium; }
  catch (e2) { console.error("ไม่พบ Playwright — ติดตั้งด้วย: npm i -g playwright && npx playwright install chromium"); process.exit(2); }
}
const exe = fs.existsSync("/opt/pw-browsers/chromium") ? "/opt/pw-browsers/chromium" : undefined;

const results = [];
const check = (name, ok, extra) => results.push({ name, ok: !!ok, extra: extra === undefined ? "" : String(extra) });

(async () => {
  const browser = await chromium.launch({ executablePath: exe, args: ["--no-sandbox"] });
  const ctx = await browser.newContext({ viewport: { width: 420, height: 950 }, deviceScaleFactor: 2 });
  await ctx.route("**://fonts.g*/**", (r) => r.abort());   // ไม่รอฟอนต์จากเน็ต

  // 1) ทุกหน้าเปิดได้ไม่มี JS error
  const pages = fs.readdirSync(ROOT).filter((f) => f.endsWith(".html")).sort();
  for (const file of pages) {
    const page = await ctx.newPage();
    const errs = [];
    page.on("pageerror", (e) => errs.push(String(e.message || e)));
    let status = 0;
    try {
      const res = await page.goto(BASE + "/" + file, { waitUntil: "domcontentloaded", timeout: 15000 });
      status = res ? res.status() : 0;
      await page.waitForTimeout(250);
    } catch (e) { errs.push("โหลดไม่ขึ้น: " + e.message.split("\n")[0]); }
    check(file + " เปิดได้ไม่มี JS error", status === 200 && !errs.length, errs[0] || status);
    await page.close();
  }

  // 2) หน้าแรก: Flash Quiz เป็นเกมหลัก และป้ายจำนวนตรงกับคลัง
  const home = await ctx.newPage();
  await home.goto(BASE + "/index.html", { waitUntil: "domcontentloaded" });
  await home.waitForFunction(() => document.querySelectorAll(".card-count").length > 0, null, { timeout: 5000 }).catch(() => {});
  const h = await home.evaluate(() => {
    const feat = document.querySelector(".feature-card");
    const fq = document.querySelector('.card[href="flashquiz.html"] .card-count');
    return {
      featHref: feat ? feat.getAttribute("href") : "",
      badge: feat ? feat.querySelector(".feature-badge").textContent : "",
      featColor: feat ? getComputedStyle(feat).borderColor : "",
      fqBadge: fq ? fq.textContent : "",
      count: typeof GAME_COUNTS !== "undefined" ? GAME_COUNTS["flashquiz.html"].count : -1,
    };
  });
  check("หน้าแรก: การ์ดเด่นชี้ไป Flash Quiz", h.featHref === "flashquiz.html", h.featHref);
  check("หน้าแรก: ป้ายบอกว่าเป็นเกมหลัก", /เกมหลัก/.test(h.badge), h.badge);
  check("หน้าแรก: การ์ดเด่นใช้สีของ Flash Quiz ไม่ใช่สีเหลืองเดิม", h.featColor === "rgb(255, 111, 97)", h.featColor);
  check("หน้าแรก: ป้ายจำนวน Flash Quiz ตรงกับ GAME_COUNTS", h.fqBadge.includes(String(h.count)), h.fqBadge + " / " + h.count);
  if (SHOTS) { await home.screenshot({ path: path.join(SHOTS, "home-feature.png"), clip: { x: 0, y: 0, width: 420, height: 950 } }); }
  await home.close();

  // 3) Flash Quiz: ทุกข้อมีเหตุผล และเฉลยแล้วเห็นกล่องเหตุผลทั้งสองโหมด
  const fq = await ctx.newPage();
  const fqErrs = [];
  fq.on("pageerror", (e) => fqErrs.push(String(e.message || e)));
  await fq.goto(BASE + "/flashquiz.html", { waitUntil: "domcontentloaded" });
  await fq.waitForFunction(() => typeof FLASHQUIZ_LIST !== "undefined");
  const d = await fq.evaluate(() => ({
    n: FLASHQUIZ_LIST.length,
    noWhy: FLASHQUIZ_LIST.filter((x) => !x.explain || String(x.explain).trim().length < 15).length,
    longAns: FLASHQUIZ_LIST.filter((x) => String(x.answer).length > 40).length,
    dup: FLASHQUIZ_LIST.length - new Set(FLASHQUIZ_LIST.map((x) => x.question)).size,
  }));
  check("Flash Quiz: คลังมีอย่างน้อย 800 ข้อ", d.n >= 800, d.n);
  check("Flash Quiz: ทุกข้อมีเหตุผลอธิบาย", d.noWhy === 0, "ขาด " + d.noWhy);
  check("Flash Quiz: คำตอบทุกข้อสั้นพอจะตอบไว (≤40)", d.longAns === 0, d.longAns);
  check("Flash Quiz: ไม่มีคำถามซ้ำ", d.dup === 0, d.dup);

  await fq.click("#revealBtn");
  const flip = await fq.evaluate(() => {
    const holder = document.getElementById("cardHolder");
    const q = holder.querySelector(".statement").textContent;
    const item = FLASHQUIZ_LIST.find((x) => x.question === q);
    const why = holder.querySelector(".fq-why");
    return { why: why ? why.textContent.trim() : "", want: item ? item.explain : "(หาโจทย์ไม่เจอ)" };
  });
  check("Flash Quiz: กดเฉลยแล้วเห็นเหตุผลของข้อนั้นจริง", flip.why && flip.why === flip.want, flip.why.slice(0, 50));
  if (SHOTS) await fq.screenshot({ path: path.join(SHOTS, "fq-reveal.png") });

  await fq.click('.mode-btn[data-mode="battle"]');
  await fq.waitForSelector("#battleIntroPanel", { state: "visible" });
  await fq.evaluate(() => document.querySelector("#battleIntroPanel button").click());
  await fq.waitForSelector("#battlePlayPanel", { state: "visible" });
  const battle = await fq.evaluate(() => {
    const q = document.getElementById("battleQuestionText").textContent.trim();
    const btn = [...document.querySelectorAll("#battlePlayPanel button")].find((b) => b.offsetParent && /เฉลย/.test(b.textContent));
    if (btn) btn.click();
    const why = document.querySelector("#battleAnswerBox .fq-why");
    const item = FLASHQUIZ_LIST.find((x) => x.question === q);
    return { why: why ? why.textContent.trim() : "", want: item ? item.explain : "(หาโจทย์ไม่เจอ)" };
  });
  check("Flash Quiz Battle: เฉลยแล้วเห็นเหตุผลของข้อนั้นจริง", battle.why && battle.why === battle.want, battle.why.slice(0, 50));
  check("Flash Quiz: ไม่มี JS error ระหว่างเล่น", !fqErrs.length, fqErrs[0] || "");
  await fq.close();

  await browser.close();
  const pass = results.filter((r) => r.ok).length;
  results.forEach((r) => console.log((r.ok ? "PASS  " : "FAIL  ") + r.name + (r.extra ? "   [" + r.extra + "]" : "")));
  console.log("\n" + pass + "/" + results.length + " ผ่าน");
  process.exit(pass === results.length ? 0 : 1);
})().catch((e) => { console.error("เทสต์พัง:", e); process.exit(1); });
