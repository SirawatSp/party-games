document.addEventListener("DOMContentLoaded", () => {
  const $ = (id) => document.getElementById(id);

  const CAT_LABEL = {
    all: "ทั้งหมด",
    chat: "ในแชท",
    irl: "ต่อหน้า",
    work: "ที่ทำงาน/ที่เรียน",
    social: "โซเชียล",
    friend: "เพื่อน/คนรู้จัก",
    hard: "ก้ำกึ่งสุด ๆ",
  };
  const SCORE_KEY = "pg_flirt_score";

  const S = { cat: "all", draw: null, current: null, voted: false, flirt: 0, friendly: 0 };

  // ---------- สถิติของวง ----------
  function readScore() {
    try {
      const raw = JSON.parse(localStorage.getItem(SCORE_KEY) || "{}");
      return { flirt: Number(raw.flirt) || 0, friendly: Number(raw.friendly) || 0 };
    } catch (e) {
      return { flirt: 0, friendly: 0 };
    }
  }
  function writeScore() {
    try {
      localStorage.setItem(SCORE_KEY, JSON.stringify({ flirt: S.flirt, friendly: S.friendly }));
    } catch (e) {}
  }
  function renderScore() {
    const total = S.flirt + S.friendly;
    if (!total) {
      $("flScore").textContent = "ยังไม่ได้โหวตสักข้อ";
      $("flResetBtn").classList.add("fl-hidden");
      return;
    }
    $("flResetBtn").classList.remove("fl-hidden");
    const pct = Math.round((S.flirt / total) * 100);
    let mood;
    if (pct >= 75) mood = "วงนี้มองว่าอะไร ๆ ก็จีบไปหมด 😏";
    else if (pct >= 55) mood = "วงนี้ค่อนไปทางคิดมาก";
    else if (pct > 45) mood = "วงนี้เถียงกันสูสีมาก";
    else if (pct > 25) mood = "วงนี้ค่อนไปทางใจเย็น";
    else mood = "วงนี้ใจแข็งมาก อะไรก็แค่นิสัยดี 🙂";
    $("flScore").innerHTML =
      "โหวตไปแล้ว <b>" + total + "</b> ข้อ · จีบ <b>" + S.flirt + "</b> · นิสัยดี <b>" + S.friendly + "</b><br>" +
      '<span class="fl-mood">' + mood + " (จีบ " + pct + "%)</span>";
  }

  // ---------- คลังสถานการณ์ ----------
  function pool() {
    return S.cat === "all" ? FLIRT_LIST : FLIRT_LIST.filter((x) => x.cat === S.cat);
  }
  function refreshPicker() {
    // createPicker สับไพ่ทั้งกองแล้วแจกจนหมดก่อนสับใหม่ จะได้ไม่เจอข้อเดิมซ้ำ ๆ
    S.draw = createPicker(pool(), "pg_flirt_" + S.cat);
  }

  function renderCats() {
    const cats = ["all"].concat(Object.keys(CAT_LABEL).filter((c) => c !== "all"));
    $("flCats").innerHTML = cats
      .map((c) => {
        const n = c === "all" ? FLIRT_LIST.length : FLIRT_LIST.filter((x) => x.cat === c).length;
        return (
          '<button class="fl-cat' + (c === S.cat ? " active" : "") + '" data-cat="' + c + '" type="button">' +
          CAT_LABEL[c] + ' <span class="fl-cat-n">' + n + "</span></button>"
        );
      })
      .join("");
  }

  $("flCats").addEventListener("click", (e) => {
    const btn = e.target.closest("[data-cat]");
    if (!btn) return;
    S.cat = btn.getAttribute("data-cat");
    renderCats();
    refreshPicker();
    next();
  });

  // ---------- เล่น ----------
  function next() {
    if (!S.draw) refreshPicker();
    const item = S.draw();
    if (!item) return;
    S.current = item;
    S.voted = false;
    $("flCatTag").textContent = CAT_LABEL[item.cat] || "";
    $("flText").textContent = item.text;
    $("flTwist").classList.add("fl-hidden");
    $("flTwist").textContent = "";
    $("flVerdict").textContent = "";
    $("flFlirtBtn").classList.remove("chosen");
    $("flFriendBtn").classList.remove("chosen");
    $("flCard").classList.remove("fl-pop");
    // เรียก reflow ก่อนใส่คลาสอีกที ไม่งั้นอนิเมชันไม่เล่นซ้ำ
    void $("flCard").offsetWidth;
    $("flCard").classList.add("fl-pop");
  }

  function vote(side) {
    if (!S.current) return next();
    if (S.voted) return; // โหวตได้ครั้งเดียวต่อหนึ่งสถานการณ์ ไม่งั้นสถิติเพี้ยน
    S.voted = true;
    if (side === "flirt") {
      S.flirt++;
      $("flFlirtBtn").classList.add("chosen");
      $("flVerdict").textContent = "วงนี้ตัดสินว่า… จีบ 😏 — ใครตอบไม่เหมือนคนอื่น อธิบายมาซิ";
    } else {
      S.friendly++;
      $("flFriendBtn").classList.add("chosen");
      $("flVerdict").textContent = "วงนี้ตัดสินว่า… แค่นิสัยดี 🙂 — แน่ใจนะ";
    }
    writeScore();
    renderScore();
    if (navigator.vibrate) navigator.vibrate(30);
  }

  function twist() {
    if (!S.current) return;
    const t = FLIRT_TWISTS[Math.floor(Math.random() * FLIRT_TWISTS.length)];
    $("flTwist").textContent = t;
    $("flTwist").classList.remove("fl-hidden");
    if (navigator.vibrate) navigator.vibrate(20);
  }

  $("flFlirtBtn").addEventListener("click", () => vote("flirt"));
  $("flFriendBtn").addEventListener("click", () => vote("friendly"));
  $("flNextBtn").addEventListener("click", next);
  $("flTwistBtn").addEventListener("click", twist);
  $("flResetBtn").addEventListener("click", () => {
    S.flirt = 0;
    S.friendly = 0;
    writeScore();
    renderScore();
  });

  const saved = readScore();
  S.flirt = saved.flirt;
  S.friendly = saved.friendly;
  renderCats();
  refreshPicker();
  renderScore();
  next();
});
