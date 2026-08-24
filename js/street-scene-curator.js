// เครื่องมือคัดฉากสำหรับเกม "ทายถนน" — ใช้ตอนพัฒนาเท่านั้น ไม่ได้ลิงก์จากหน้าแรก
//
// หน้านี้ยิงถาม API ของ Panoramax สด ๆ กรองด้วยเกณฑ์ชุดเดียวกับที่เกมใช้ (js/street-scene-api.js)
// ให้เราดูภาพจริงทีละฉากก่อนตัดสินใจ แล้วคายโค้ดออกมาให้ก๊อปไปแปะใน data/street-scenes.js
//
// เหตุผลที่ต้องคัดมือ: ความยากของฉากกับความน่าสนใจของภาพ ตรวจอัตโนมัติไม่ได้
// และคลังที่คัดไว้ทำให้ความยากคงที่ ไม่ต้องพึ่งว่า API จะว่างหรือไม่ตอนคนกำลังเล่น

document.addEventListener("DOMContentLoaded", () => {
  const $ = (id) => document.getElementById(id);
  const picked = {}; // pictureId -> scene

  // เติมรายชื่อโซนจากไฟล์เดียวกับที่เกมใช้
  STREET_SCENE_AREAS.forEach((a, i) => {
    const o = document.createElement("option");
    o.value = String(i);
    o.textContent = a.th + "  [" + a.bbox.join(", ") + "]";
    $("cuArea").appendChild(o);
  });

  $("cuSearch").addEventListener("click", runSearch);
  $("cuCopy").addEventListener("click", copyOutput);
  $("cuClear").addEventListener("click", () => {
    Object.keys(picked).forEach((k) => delete picked[k]);
    renderOutput();
    document.querySelectorAll(".cu-take").forEach((b) => (b.textContent = "เก็บฉากนี้ +"));
  });
  $("cuVerify").addEventListener("click", verifyManifest);

  function bboxFromForm() {
    const custom = $("cuBbox").value.trim();
    if (custom) {
      const parts = custom.split(",").map((s) => Number(s.trim()));
      if (parts.length === 4 && parts.every((n) => isFinite(n))) return parts;
      throw new Error("กรอบพิกัดต้องเป็นตัวเลข 4 ตัวคั่นด้วยจุลภาค: minLon,minLat,maxLon,maxLat");
    }
    const a = STREET_SCENE_AREAS[Number($("cuArea").value)];
    return a ? a.bbox : null;
  }

  function status(msg, bad) {
    $("cuStatus").textContent = msg;
    $("cuStatus").className = bad ? "cu-status cu-bad" : "cu-status";
  }

  function runSearch() {
    let bbox;
    try {
      bbox = bboxFromForm();
    } catch (e) {
      status(e.message, true);
      return;
    }
    const limit = Math.max(1, Math.min(100, Number($("cuLimit").value) || 20));
    status("กำลังค้น...");
    $("cuRows").innerHTML = "";
    ssSearch(bbox, limit)
      .then((items) => {
        if (!items.length) {
          status("โซนนี้ไม่มีภาพ 360° เลย ลองโซนอื่นหรือขยายกรอบพิกัด", true);
          return;
        }
        let pass = 0;
        items.forEach((item) => {
          const v = ssValidate(item);
          if (v.ok) pass++;
          addRow(item, v);
        });
        status("เจอ " + items.length + " ภาพ · ผ่านเกณฑ์ " + pass + " ภาพ");
        queueSeqChecks();
      })
      .catch((err) => status("ค้นไม่สำเร็จ: " + err.message, true));
  }

  const seqQueue = [];
  let seqRunning = false;
  function queueSeqChecks() {
    if (seqRunning) return;
    seqRunning = true;
    const step = () => {
      const job = seqQueue.shift();
      if (!job) {
        seqRunning = false;
        return;
      }
      ssSequenceSize(job.collection).then((n) => {
        if (n < 0) {
          job.el.textContent = "เช็ก sequence ไม่ได้";
          job.el.className = "cu-seq cu-warn";
        } else if (n < SS_MIN_SEQ_PICTURES) {
          job.el.textContent = "sequence สั้นไป (" + n + " ภาพ) เดินดูไม่ได้";
          job.el.className = "cu-seq cu-bad";
          job.row.classList.add("cu-row-short");
        } else {
          job.el.textContent = "sequence " + n + "+ ภาพ เดินได้";
          job.el.className = "cu-seq cu-ok";
        }
        step();
      });
    };
    step();
  }

  function esc(s) {
    return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  }

  function addRow(item, v) {
    const row = document.createElement("div");
    row.className = "cu-row " + (v.ok ? "cu-row-ok" : "cu-row-no");
    const thumb = ssFirst(item, ["assets.thumb.href", "assets.sd.href"]) || "";
    const coords = ssDig(item, "geometry.coordinates") || [];

    if (!v.ok) {
      row.innerHTML =
        '<div class="cu-thumb"></div><div class="cu-info"><b>ไม่ผ่าน</b> — ' +
        esc(v.why) +
        '<div class="cu-id">' +
        esc(item.id) +
        "</div></div>";
      $("cuRows").appendChild(row);
      return;
    }

    const sc = v.scene;
    const country = wmByCode(sc.country);
    row.innerHTML =
      (thumb ? '<img class="cu-thumb" src="' + esc(thumb) + '" alt="" loading="lazy">' : '<div class="cu-thumb"></div>') +
      '<div class="cu-info">' +
      "<b>" +
      esc(country ? country.th : sc.country) +
      "</b> · " +
      esc(sc.answer.lat.toFixed(4)) +
      ", " +
      esc(sc.answer.lon.toFixed(4)) +
      '<div class="cu-meta">' +
      esc(sc.author) +
      " · " +
      esc(sc.license) +
      " · " +
      esc(String(sc.capturedAt).slice(0, 10)) +
      "</div>" +
      '<div class="cu-seq">กำลังเช็ก sequence...</div>' +
      '<div class="cu-id">' +
      esc(sc.pictureId) +
      "</div>" +
      '<div class="cu-btns">' +
      '<button class="cu-look" type="button">ดูภาพจริง 👁</button>' +
      '<button class="cu-take" type="button">เก็บฉากนี้ +</button>' +
      "</div>" +
      "</div>";

    const takeBtn = row.querySelector(".cu-take");
    takeBtn.addEventListener("click", () => {
      if (picked[sc.pictureId]) {
        delete picked[sc.pictureId];
        takeBtn.textContent = "เก็บฉากนี้ +";
      } else {
        picked[sc.pictureId] = sc;
        takeBtn.textContent = "เก็บแล้ว ✓";
      }
      renderOutput();
    });
    row.querySelector(".cu-look").addEventListener("click", () => preview(sc));

    if (coords.length) row.setAttribute("data-lonlat", coords[0] + "," + coords[1]);
    seqQueue.push({ collection: sc.sequenceId, el: row.querySelector(".cu-seq"), row: row });
    $("cuRows").appendChild(row);
  }

  // ดูภาพจริงก่อนตัดสินใจ — ข้อ 5 ของเกณฑ์คัด (ภาพปลอดภัย น่าสนใจ ไม่มีป้ายบอกเมืองเด่น ๆ)
  function preview(sc) {
    const box = $("cuPreview");
    box.classList.remove("cu-hidden");
    $("cuPreviewTitle").textContent = sc.pictureId;
    const mount = () => {
      const host = $("cuViewer");
      host.innerHTML = "";
      const el = document.createElement("pnx-photo-viewer");
      el.setAttribute("endpoint", STREET_SCENE_CONFIG.endpoint);
      el.setAttribute("sequence", sc.sequenceId);
      el.setAttribute("picture", sc.pictureId);
      el.setAttribute("url-parameters", "false");
      el.setAttribute("psv-options", '{"picturesNavigation":"seq"}');
      host.appendChild(el);
    };
    ssLoadViewer()
      .then(mount)
      .catch(() => ($("cuViewer").textContent = "โหลดตัวแสดงภาพไม่สำเร็จ"));
  }

  $("cuClosePreview").addEventListener("click", () => {
    $("cuViewer").innerHTML = "";
    $("cuPreview").classList.add("cu-hidden");
  });

  function renderOutput() {
    const list = Object.keys(picked).map((k) => picked[k]);
    $("cuCount").textContent = list.length + " ฉาก";
    if (!list.length) {
      $("cuOut").value = "";
      return;
    }
    $("cuOut").value = list
      .map(
        (s) =>
          "  {\n" +
          '    id: "' + s.id + '",\n' +
          '    pictureId: "' + s.pictureId + '",\n' +
          '    sequenceId: "' + s.sequenceId + '",\n' +
          "    answer: { lat: " + s.answer.lat + ", lon: " + s.answer.lon + " },\n" +
          '    country: "' + s.country + '",\n' +
          '    provider: "' + s.provider + '",\n' +
          '    author: ' + JSON.stringify(s.author) + ",\n" +
          '    license: ' + JSON.stringify(s.license) + ",\n" +
          '    licenseUrl: ' + JSON.stringify(s.licenseUrl) + ",\n" +
          '    sourceUrl: ' + JSON.stringify(s.sourceUrl) + ",\n" +
          '    capturedAt: ' + JSON.stringify(s.capturedAt) + ",\n" +
          "  },"
      )
      .join("\n");
  }

  function copyOutput() {
    const ta = $("cuOut");
    if (!ta.value) return;
    ta.select();
    try {
      document.execCommand("copy");
      status("ก๊อปแล้ว เอาไปแปะในอาร์เรย์ STREET_SCENES ของ data/street-scenes.js ได้เลย");
    } catch (e) {
      status("ก๊อปอัตโนมัติไม่ได้ เลือกข้อความในกล่องแล้วก๊อปเองนะ", true);
    }
  }

  // ตรวจว่าฉากในคลังยังโหลดได้อยู่ไหม — ควรรันก่อน deploy ทุกครั้ง (เกณฑ์ข้อ 7)
  function verifyManifest() {
    const list = typeof STREET_SCENES !== "undefined" ? STREET_SCENES : [];
    $("cuVerifyOut").innerHTML = "";
    if (!list.length) {
      $("cuVerifyOut").textContent = "คลังฉากยังว่างอยู่ ยังไม่มีอะไรให้ตรวจ";
      return;
    }
    let bad = 0;
    let done = 0;
    list.forEach((s) => {
      const url = ssEndpoint() + "/collections/" + encodeURIComponent(s.sequenceId) + "/items/" + encodeURIComponent(s.pictureId);
      ssFetchJson(url)
        .then((item) => {
          const v = ssValidate(item);
          line(s, v.ok, v.ok ? "ยังใช้ได้" : v.why);
          if (!v.ok) bad++;
        })
        .catch((err) => {
          line(s, false, "โหลดไม่ได้: " + err.message);
          bad++;
        })
        .then(() => {
          done++;
          if (done === list.length) status("ตรวจครบ " + list.length + " ฉาก · มีปัญหา " + bad + " ฉาก", bad > 0);
        });
    });
    function line(s, ok, why) {
      const d = document.createElement("div");
      d.className = ok ? "cu-ok" : "cu-bad";
      d.textContent = (ok ? "✓ " : "✕ ") + s.id + " — " + why;
      $("cuVerifyOut").appendChild(d);
    }
  }
});

// ---- ตรวจรูปของโหมดสถานที่สำคัญ ----
// รูปหลักของบทความวิกิพีเดียบางอันไม่ใช่ตัวสถานที่ หรือมีชื่อเขียนอยู่ในรูป (= เฉลย)
// ตรวจอัตโนมัติแทนตาคนไม่ได้ หน้านี้จึงโหลดมาเรียงให้ดูทีเดียวครบ
document.addEventListener("DOMContentLoaded", () => {
  const btn = document.getElementById("cuLmCheck");
  if (!btn || typeof LANDMARKS === "undefined") return;
  const grid = document.getElementById("cuLmGrid");
  const status = document.getElementById("cuLmStatus");

  btn.addEventListener("click", () => {
    btn.disabled = true;
    grid.innerHTML = "";
    let done = 0;
    let missing = 0;
    status.textContent = "กำลังโหลด... 0/" + LANDMARKS.length;

    // ยิงทีละไม่กี่ตัว ไม่งั้นโดนจำกัดอัตราการเรียก
    const queue = LANDMARKS.slice();
    const worker = () => {
      const lm = queue.shift();
      if (!lm) return Promise.resolve();
      return lmLoadPhoto(lm).then((photo) => {
        done++;
        if (!photo) missing++;
        const cell = document.createElement("div");
        cell.style.cssText = "font-size:11px; line-height:1.4;";
        cell.innerHTML =
          (photo
            ? '<img src="' + photo.src + '" style="width:100%; height:100px; object-fit:cover; border-radius:8px;" loading="lazy">'
            : '<div style="width:100%; height:100px; border-radius:8px; background:#2a1020; display:flex; align-items:center; justify-content:center; color:#fb7185;">ไม่มีรูป</div>') +
          "<div><b>" + lm.th + "</b></div>" +
          '<div style="color:var(--text-dim)">' + (lm.wiki || lm.en) + "</div>" +
          (photo && photo.credit ? '<div style="color:var(--text-dim)">' + photo.credit.license + "</div>" : "");
        grid.appendChild(cell);
        status.textContent = "กำลังโหลด... " + done + "/" + LANDMARKS.length + " · ไม่มีรูป " + missing + " แห่ง";
        return worker();
      });
    };
    Promise.all([worker(), worker(), worker(), worker()]).then(() => {
      status.textContent =
        "เสร็จแล้ว " + done + " แห่ง · ไม่มีรูป " + missing + " แห่ง — ไล่ดูว่ามีรูปไหนไม่ใช่ตัวสถานที่ หรือมีชื่อเขียนอยู่ในรูปบ้าง";
      btn.disabled = false;
    });
  });
});
