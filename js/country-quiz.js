// ทายธงชาติและรูปร่างประเทศ ใช้คำตอบในหน่วยความจำของรอบและไม่จำลงพื้นที่เก็บ
(() => {
  "use strict";

  function readRings(d) {
    if (typeof d !== "string" || !d.trim() || /[^MLZ0-9eE+.\-\s,]/.test(d)) throw new Error("ไม่มีรูปทรงประเทศ");
    const tokens = d.match(/[MLZ]|[-+]?(?:\d*\.?\d+)(?:e[-+]?\d+)?/gi) || [];
    const rings = [];
    let ring = null;
    let command = null;
    for (let i = 0; i < tokens.length;) {
      if (/^[MLZ]$/.test(tokens[i])) {
        command = tokens[i++];
        if (command === "Z") {
          if (!ring || ring.length < 3) throw new Error("เส้นรอบประเทศไม่ครบ");
          rings.push(ring);
          ring = null;
          command = null;
          continue;
        }
        if (command === "M") {
          if (ring) throw new Error("เส้นรอบประเทศไม่ปิด");
          ring = [];
        }
      }
      if (!ring || (command !== "M" && command !== "L") || i + 1 >= tokens.length) throw new Error("พิกัดประเทศไม่ครบ");
      const x = Number(tokens[i++]);
      const y = Number(tokens[i++]);
      if (!Number.isFinite(x) || !Number.isFinite(y)) throw new Error("พิกัดประเทศไม่ถูกต้อง");
      ring.push([x, y]);
      command = "L";
    }
    if (ring || !rings.length) throw new Error("เส้นรอบประเทศไม่ครบ");
    return rings;
  }

  function outlineOf(country, width, height) {
    if (!country || !Number.isFinite(country.lat) || !Number.isFinite(country.lon)
      || !Number.isFinite(width) || width <= 0 || !Number.isFinite(height) || height <= 0) {
      throw new Error("ข้อมูลรูปร่างยังไม่พร้อม");
    }
    let rings = readRings(country.d);
    const position = (point) => [(point[0] / width * 360) - 180, 90 - point[1] / height * 180];
    let note = "";
    if (country.code === "FRA" || country.code === "USA") {
      // ใช้ส่วนแผ่นดินที่ระบุในเฉลย แทนการย่อประเทศจนแผ่นดินหลักเล็กเพราะส่วนที่ห่างออกไป
      rings = rings.filter((ring) => {
        const center = ring.reduce((sum, point) => {
          const p = position(point);
          return [sum[0] + p[0] / ring.length, sum[1] + p[1] / ring.length];
        }, [0, 0]);
        return country.code === "FRA"
          ? center[0] >= -6 && center[0] <= 11 && center[1] >= 40 && center[1] <= 53
          : center[0] >= -130 && center[0] <= -60 && center[1] >= 23 && center[1] <= 52;
      });
      note = country.code === "FRA"
        ? "ภาพแสดงฝรั่งเศสแผ่นดินใหญ่และเกาะคอร์ซิกา"
        : "ภาพแสดง 48 รัฐที่ต่อเนื่องกัน ไม่รวมอะแลสกาและฮาวาย";
    }
    if (!rings.length) throw new Error("ไม่มีเส้นรอบประเทศ");
    const anchor = (country.lon + 180) / 360 * width;
    const correction = Math.max(0.12, Math.cos(country.lat * Math.PI / 180));
    // เลื่อนชิ้นส่วนที่ข้ามเส้นวันที่ให้อยู่ติดกันก่อนปรับสัดส่วนและย่อเข้ากรอบ
    const projected = rings.map((ring) => ring.map(([x, y]) => {
      while (x - anchor > width / 2) x -= width;
      while (x - anchor < -width / 2) x += width;
      return [x * correction, y * width / height / 2];
    }));
    const points = projected.flat();
    const xs = points.map((point) => point[0]);
    const ys = points.map((point) => point[1]);
    const minX = Math.min(...xs), maxX = Math.max(...xs), minY = Math.min(...ys), maxY = Math.max(...ys);
    const spanX = maxX - minX, spanY = maxY - minY;
    if (!(spanX > 0 && spanY > 0)) throw new Error("รูปร่างประเทศไม่มีพื้นที่");
    const scale = 280 / Math.max(spanX, spanY);
    const left = (320 - spanX * scale) / 2;
    const top = (320 - spanY * scale) / 2;
    const number = (value) => Number(value.toFixed(2));
    const d = projected.map((ring) => ring.map(([x, y], i) =>
      (i ? "L" : "M") + number((x - minX) * scale + left) + " " + number((y - minY) * scale + top)).join("") + "Z").join("");
    return { d, note };
  }

  function init() {
    const app = document.getElementById("cqApp");
    if (!app) return;
    const ids = ["cqRegions", "cqStatus", "cqStage", "cqFlag", "cqShape", "cqShapePath",
      "cqReveal", "cqNext", "cqRetry", "cqAnswer", "cqCountry", "cqEnglish",
      "cqShapeNote", "cqCounter", "cqTotal"];
    const ui = Object.fromEntries(ids.map((id) => [id, document.getElementById(id)]));
    if (ids.some((id) => !ui[id])) throw new Error("องค์ประกอบเกมทายประเทศไม่ครบ");
    const mode = app.dataset.mode;
    const countries = typeof COUNTRY_QUIZ_LIST !== "undefined" && Array.isArray(COUNTRY_QUIZ_LIST)
      ? COUNTRY_QUIZ_LIST : [];
    const map = typeof WORLD_MAP !== "undefined" && WORLD_MAP && Array.isArray(WORLD_MAP.countries)
      ? WORLD_MAP : null;
    const shapes = new Map(map ? map.countries.map((country) => [country.code, country]) : []);
    const buttons = [...ui.cqRegions.querySelectorAll("[data-region]")];
    const regions = new Set(["all", "asia", "europe", "africa", "north_america", "south_america", "oceania"]);
    let picker = null;
    let current = null;
    let count = 0;
    let ready = false;
    let revealed = false;
    let request = 0;
    let loader = null;
    let currentNote = "";

    function focus(element) {
      if (!element.matches("button, a[href], [tabindex]")) element.tabIndex = -1;
      element.focus({ preventScroll: true });
    }

    function clearQuestion() {
      ready = revealed = false;
      currentNote = "";
      ui.cqReveal.disabled = true;
      ui.cqRetry.hidden = true;
      ui.cqAnswer.hidden = true;
      ui.cqCountry.textContent = "";
      ui.cqEnglish.textContent = "";
      ui.cqShapeNote.textContent = "";
      ui.cqShapeNote.hidden = true;
      ui.cqStage.hidden = true;
      ui.cqFlag.hidden = true;
      ui.cqFlag.removeAttribute("src");
      ui.cqFlag.alt = "ธงชาติให้ทาย";
      ui.cqShape.setAttribute("hidden", "");
      ui.cqShapePath.removeAttribute("d");
      if (loader) {
        loader.onload = loader.onerror = null;
        loader.removeAttribute("src");
        loader = null;
      }
    }

    function failed(token, moveFocus) {
      if (token !== request) return;
      ready = false;
      ui.cqStage.hidden = true;
      ui.cqReveal.disabled = true;
      ui.cqRetry.hidden = false;
      ui.cqStatus.textContent = mode === "flag"
        ? "ภาพธงยังโหลดไม่ได้ ลองอีกครั้งหรือข้ามไปประเทศถัดไปได้"
        : "รูปร่างประเทศนี้ยังไม่พร้อม ลองอีกครั้งหรือข้ามไปประเทศถัดไปได้";
      if (moveFocus) focus(ui.cqStatus);
    }

    function completed(token, moveFocus) {
      if (token !== request) return;
      ready = true;
      ui.cqStage.hidden = false;
      ui.cqReveal.disabled = false;
      ui.cqRetry.hidden = true;
      ui.cqStatus.textContent = mode === "flag"
        ? "ธงชาตินี้เป็นของประเทศอะไร? ตอบออกเสียงแล้วกดเฉลย"
        : "รูปร่างนี้เป็นประเทศอะไร? ตอบออกเสียงแล้วกดเฉลย";
      if (moveFocus) focus(ui.cqStatus);
    }

    function renderCurrent(moveFocus) {
      const token = ++request;
      clearQuestion();
      if (!current) return;
      ui.cqStatus.textContent = mode === "flag" ? "กำลังเปิดธงชาติ…" : "กำลังเปิดรูปร่างประเทศ…";
      if (moveFocus) focus(ui.cqStatus);
      if (mode === "shape") {
        try {
          const shape = outlineOf(shapes.get(current.code), map && map.width, map && map.height);
          if (token !== request) return;
          currentNote = shape.note;
          ui.cqShape.setAttribute("viewBox", "0 0 320 320");
          ui.cqShapePath.setAttribute("d", shape.d);
          ui.cqShapePath.setAttribute("fill-rule", "evenodd");
          ui.cqShape.removeAttribute("hidden");
          completed(token, moveFocus);
        } catch (error) {
          failed(token, moveFocus);
        }
        return;
      }

      // แต่ละรอบใช้รูปคนละตัวและหมายเลขคำขอ เพื่อไม่ให้ภาพเก่าที่มาช้าเปิดทับคำถามใหม่
      const image = new Image();
      loader = image;
      image.id = "cqFlag";
      image.className = ui.cqFlag.className;
      image.alt = "ธงชาติให้ทาย";
      image.decoding = "async";
      image.onload = async () => {
        try {
          if (typeof image.decode === "function") await image.decode();
          if (token !== request) return;
          if (!image.naturalWidth || !image.naturalHeight) throw new Error("ภาพว่าง");
          image.onload = image.onerror = null;
          loader = null;
          ui.cqFlag.replaceWith(image);
          ui.cqFlag = image;
          image.hidden = false;
          completed(token, moveFocus);
        } catch (error) {
          failed(token, moveFocus);
        }
      };
      image.onerror = () => failed(token, moveFocus);
      image.src = current.flag;
    }

    function next(moveFocus = true) {
      if (!picker) return;
      current = picker();
      if (!current) return;
      count += 1;
      ui.cqCounter.textContent = "ข้อที่ " + count;
      renderCurrent(moveFocus);
    }

    function chooseRegion(region, moveFocus = true) {
      if (!regions.has(region)) return;
      const pool = countries.filter((country) => region === "all" || country.region === region);
      buttons.forEach((button) => {
        const active = button.dataset.region === region;
        button.classList.toggle("is-active", active);
        button.setAttribute("aria-pressed", String(active));
      });
      request += 1;
      current = null;
      picker = null;
      count = 0;
      clearQuestion();
      ui.cqCounter.textContent = "ข้อที่ 0";
      ui.cqTotal.textContent = pool.length + " ประเทศ";
      ui.cqNext.disabled = !pool.length;
      if (!pool.length || typeof createPicker !== "function" || !["flag", "shape"].includes(mode)) {
        ui.cqNext.disabled = true;
        ui.cqStatus.textContent = "คลังประเทศยังไม่พร้อม ลองโหลดหน้าใหม่อีกครั้ง";
        if (moveFocus) focus(ui.cqStatus);
        return;
      }
      // ไม่ส่งกุญแจพื้นที่เก็บ เพื่อให้ประวัติการสุ่มจบเมื่อออกจากหน้านี้
      picker = createPicker(pool);
      next(moveFocus);
    }

    ui.cqReveal.addEventListener("click", () => {
      if (!ready || revealed || !current) return;
      revealed = true;
      ui.cqCountry.textContent = current.name;
      ui.cqEnglish.textContent = typeof current.en === "string" ? current.en : "";
      ui.cqShapeNote.textContent = currentNote;
      ui.cqShapeNote.hidden = !currentNote;
      ui.cqAnswer.hidden = false;
      ui.cqReveal.disabled = true;
      ui.cqStatus.textContent = "กดประเทศถัดไป แล้วลองทายกันต่อ";
      focus(ui.cqCountry);
    });
    ui.cqNext.addEventListener("click", () => next());
    ui.cqRetry.addEventListener("click", () => {
      if (current && !ready) renderCurrent(true);
    });
    buttons.forEach((button) => button.addEventListener("click", () => chooseRegion(button.dataset.region)));
    chooseRegion("all", false);
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init, { once: true });
  else init();
})();
