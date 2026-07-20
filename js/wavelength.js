document.addEventListener("DOMContentLoaded", () => {
  const leftLabel = document.getElementById("leftLabel");
  const rightLabel = document.getElementById("rightLabel");
  const targetGroup = document.getElementById("targetGroup");
  const coverGroup = document.getElementById("coverGroup");
  const needle = document.getElementById("needle");
  const slider = document.getElementById("dialSlider");
  const peekBtn = document.getElementById("peekBtn");
  const revealBtn = document.getElementById("revealBtn");
  const newRoundBtn = document.getElementById("newRoundBtn");
  const resultBox = document.getElementById("resultBox");
  const stageHint = document.getElementById("stageHint");

  const CX = 200, CY = 200, R = 172;
  // ครึ่งความกว้างของแต่ละโซนคะแนน (องศา): 4 แต้มตรงกลาง, 3 และ 2 ขนาบข้าง
  const BAND_4 = 4.5, BAND_3 = 13.5, BAND_2 = 22.5;
  const COLORS = { 4: "#d6ff3d", 3: "#2be6ff", 2: "#ffb703" };

  let target = 90;
  let lastTarget = -999;
  const drawPair = createPicker(WAVELENGTH_PAIRS);
  let peeking = false;
  let hasPeeked = false;
  let revealed = false;

  function pt(angle, radius) {
    const rad = (angle * Math.PI) / 180;
    return [CX - radius * Math.cos(rad), CY - radius * Math.sin(rad)];
  }

  function clampAngle(a) {
    return Math.max(0, Math.min(180, a));
  }

  function sectorPath(a1, a2) {
    a1 = clampAngle(a1); a2 = clampAngle(a2);
    const [x1, y1] = pt(a1, R);
    const [x2, y2] = pt(a2, R);
    return "M" + CX + "," + CY + " L" + x1.toFixed(1) + "," + y1.toFixed(1) +
      " A" + R + "," + R + " 0 0 1 " + x2.toFixed(1) + "," + y2.toFixed(1) + " Z";
  }

  function drawTarget() {
    // โซนคะแนนเรียงซ้ายไปขวา 2-3-4-3-2 เหมือนบอร์ดเกมจริง
    const zones = [
      [target - BAND_2, target - BAND_3, 2],
      [target - BAND_3, target - BAND_4, 3],
      [target - BAND_4, target + BAND_4, 4],
      [target + BAND_4, target + BAND_3, 3],
      [target + BAND_3, target + BAND_2, 2],
    ];
    targetGroup.innerHTML = "";
    zones.forEach(([a1, a2, score]) => {
      const c1 = clampAngle(a1), c2 = clampAngle(a2);
      if (c2 <= c1) return; // zone fully clipped off the edge of the dial — nothing to draw
      const p = document.createElementNS("http://www.w3.org/2000/svg", "path");
      p.setAttribute("d", sectorPath(a1, a2));
      p.setAttribute("fill", COLORS[score]);
      p.setAttribute("opacity", score === 4 ? "0.95" : score === 3 ? "0.8" : "0.65");
      p.setAttribute("stroke", "#190c21");
      p.setAttribute("stroke-width", "1.5");
      targetGroup.appendChild(p);
      // ตัวเลขคะแนนกลางโซน (จากมุมที่ถูก clamp แล้ว)
      const mid = (c1 + c2) / 2;
      const [tx, ty] = pt(mid, R * 0.86);
      const t = document.createElementNS("http://www.w3.org/2000/svg", "text");
      t.setAttribute("x", tx.toFixed(1));
      t.setAttribute("y", ty.toFixed(1));
      t.setAttribute("class", "wl-score-num");
      t.textContent = score;
      targetGroup.appendChild(t);
    });
  }

  function setNeedle(angle) {
    // ใช้ CSS transform เพื่อให้เข็มเคลื่อนแบบลื่น (มี transition ใน stylesheet)
    needle.style.transform = "rotate(" + (angle - 90) + "deg)";
  }

  function setTargetVisible(show) {
    targetGroup.style.display = show ? "" : "none";
    coverGroup.style.display = show ? "none" : "";
    if (show) {
      // เล่นอนิเมชันเด้งทุกครั้งที่โซนเป้าโผล่
      targetGroup.classList.remove("wl-pop");
      void targetGroup.getBoundingClientRect();
      targetGroup.classList.add("wl-pop");
    }
  }

  function updatePeekBtn() {
    peekBtn.textContent = peeking ? "ซ่อนเป้า 🙈" : "แอบดูเป้า 👁 (คนใบ้เท่านั้น)";
  }

  function newRound() {
    const [l, r] = drawPair();
    leftLabel.textContent = "← " + l;
    rightLabel.textContent = r + " →";

    // สุ่มตำแหน่งเป้าได้เต็มครึ่งวงกลม (0-180) — โซนที่เลยขอบจะถูกตัดออกตอนวาด
    // และบังคับให้ห่างจากเป้ารอบก่อนอย่างน้อย 25 องศา จะได้ไม่ออกจุดเดิมซ้ำ ๆ
    do {
      target = Math.random() * 180;
    } while (Math.abs(target - lastTarget) < 25);
    lastTarget = target;
    drawTarget();

    peeking = false;
    hasPeeked = false;
    revealed = false;
    setTargetVisible(false);
    slider.value = 90;
    setNeedle(90);
    slider.disabled = false;
    peekBtn.disabled = false;
    revealBtn.disabled = false;
    resultBox.style.display = "none";
    resultBox.innerHTML = "";
    stageHint.textContent = "คนใบ้กดแอบดูเป้า แล้วใบ้ 1 คำ/วลีให้ทีมหมุนเข็มตาม";
    updatePeekBtn();
  }

  function reveal() {
    if (revealed) return;
    revealed = true;
    peeking = false;
    setTargetVisible(true);
    slider.disabled = true;
    peekBtn.disabled = true;
    revealBtn.disabled = true;
    updatePeekBtn();

    const diff = Math.abs(parseFloat(slider.value) - target);
    let score, msg, cls;
    if (diff <= BAND_4) { score = 4; msg = "จูนตรงเป๊ะ! คลื่นเดียวกันสุด ๆ 🎯"; cls = "s4"; }
    else if (diff <= BAND_3) { score = 3; msg = "ใกล้มาก! เกือบอ่านใจกันได้แล้ว ✨"; cls = "s3"; }
    else if (diff <= BAND_2) { score = 2; msg = "พอได้อยู่ เฉียดโซนเป้าหมาย 👌"; cls = "s2"; }
    else { score = 0; msg = "หลุดคลื่น… ทีมตรงข้ามได้ลุ้น 1 แต้มจากการทายซ้าย/ขวา 😵"; cls = "s0"; }

    resultBox.style.display = "";
    resultBox.innerHTML =
      '<div class="wl-points ' + cls + '">' + score + " แต้ม</div>" +
      '<div class="wl-msg">' + msg + "</div>";
    stageHint.textContent = "กด \"รอบใหม่\" แล้วสลับคนใบ้คนต่อไป";
  }

  peekBtn.addEventListener("click", () => {
    if (revealed) return;
    peeking = !peeking;
    hasPeeked = hasPeeked || peeking;
    setTargetVisible(peeking);
    updatePeekBtn();
    stageHint.textContent = peeking
      ? "ให้คนอื่นละสายตาจากจอ! จำตำแหน่งแล้วกดซ่อน"
      : hasPeeked
        ? "ใบ้ได้เลย แล้วให้ทีมช่วยกันเลื่อนเข็ม"
        : "คนใบ้กดแอบดูเป้า แล้วใบ้ 1 คำ/วลีให้ทีมหมุนเข็มตาม";
  });

  slider.addEventListener("input", () => setNeedle(parseFloat(slider.value)));
  revealBtn.addEventListener("click", reveal);
  newRoundBtn.addEventListener("click", newRound);

  // ขีดสเกลบนวงล้อทุก 15 องศา
  const ticks = document.getElementById("ticks");
  for (let a = 0; a <= 180; a += 15) {
    const [x1, y1] = pt(a, R);
    const [x2, y2] = pt(a, R - (a % 45 === 0 ? 14 : 8));
    const l = document.createElementNS("http://www.w3.org/2000/svg", "line");
    l.setAttribute("x1", x1.toFixed(1)); l.setAttribute("y1", y1.toFixed(1));
    l.setAttribute("x2", x2.toFixed(1)); l.setAttribute("y2", y2.toFixed(1));
    l.setAttribute("stroke", "#5a3a6e");
    l.setAttribute("stroke-width", a % 45 === 0 ? "2.5" : "1.5");
    ticks.appendChild(l);
  }

  newRound();
});
