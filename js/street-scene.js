document.addEventListener("DOMContentLoaded", () => {
  const $ = (id) => document.getElementById(id);

  // ---------- ค่าคงที่ของกติกา ----------
  // คิดคะแนนแบบเปิดเผยสูตรให้ผู้เล่นรู้ตั้งแต่ต้น จะได้ไม่ต้องเดาว่าทำไมได้เท่านี้
  const MAX_DIST_POINTS = 5000;
  const DIST_FALLOFF_KM = 2000;
  const MAX_TIME_BONUS = 1000;
  const LOAD_TIMEOUT_MS = 20000; // ภาพไม่มาเลยภายในเวลานี้ถือว่าฉากเสีย
  const MAX_SCENE_TRIES = 4;

  const MODE_HINT = {
    landmark: "โชว์รูปสถานที่มาให้แบบไม่บอกชื่อ แล้วปักหมุดว่าอยู่ตรงไหนของโลก · โหลดรูปไม่ได้จะให้เบาะแสข้อความแทน",
    street: "โผล่ไปยืนกลางถนนจริง หมุนดูรอบตัวหาเบาะแสเอง ยากกว่าเยอะ · ต้องต่อเน็ต",
  };
  const CAT_LABEL = {
    wonder: "7 สิ่งมหัศจรรย์ยุคใหม่",
    ancient: "7 สิ่งมหัศจรรย์ยุคโบราณ",
    landmark: "สิ่งก่อสร้างสำคัญ",
    nature: "ธรรมชาติ",
    thai: "ในไทย",
  };
  // ตัวเลือกหมวดบนหน้าจอ -> รายการ cat ที่นับรวม
  const CAT_GROUP = {
    all: null,
    wonder7: ["wonder", "ancient"],
    landmark: ["landmark"],
    nature: ["nature"],
    thai: ["thai"],
  };

  const S = {
    mode: "landmark",
    cat: "all",
    rounds: 5,
    seconds: 90,
    scenes: [],
    used: {},
    round: 0,
    score: 0,
    history: [],
    scene: null,
    guess: null,
    left: 0,
    timer: null,
    ticking: false,
    liveMode: false,
    loadToken: 0,
    viewerReady: false,
    watchdog: null,
    map: null,
    busy: false,
  };

  // ถ้าเปิดหน้านี้ตอนออฟไลน์ครั้งแรก ไฟล์แผนที่อาจยังไม่ถูก cache ไว้
  // อย่าให้หน้าพังเงียบ ๆ บอกไปตรง ๆ ว่าต้องต่อเน็ตแล้วรีเฟรช
  if (typeof WORLD_MAP === "undefined") {
    $("ssOffline").textContent =
      "หน้านี้ยังโหลดข้อมูลแผนที่โลกไม่ครบ ต่อเน็ตแล้วรีเฟรชหน้านี้อีกครั้งนะ — เกมอื่นในเว็บยังเล่นได้ตามปกติ";
    $("ssOffline").classList.remove("ss-hidden");
    $("ssStartBtn").disabled = true;
    return;
  }

  // ---------- แผนที่ ----------
  // ตอนเห็นทั้งโลกพอดีจอ ประเทศเล็ก ๆ กว้างแค่ไม่กี่พิกเซล แตะให้ตรงแทบเป็นไปไม่ได้
  // พอแตะครั้งแรกจากมุมกว้าง เลยซูมเข้าไปรอบจุดที่แตะให้เลย แล้วค่อยแตะซ้ำปรับให้ตรงขึ้น
  // (แตะตอนซูมอยู่แล้วจะไม่ซูมซ้ำ ไม่งั้นจะเด้งจนปรับตำแหน่งไม่ได้)
  const ZOOM_ON_PICK_ABOVE = 700;
  const ZOOM_ON_PICK_TO = 420;

  S.map = wmCreateMap($("ssMapSvg"), {
    onPick: (lat, lon) => {
      if (S.busy) return;
      S.guess = { lat, lon };
      const zoomedIn = S.map.width() <= ZOOM_ON_PICK_ABOVE;
      if (!zoomedIn) S.map.centerOn(lat, lon, ZOOM_ON_PICK_TO);
      S.map.guess(lat, lon);
      const c = ssCountryAt(lat, lon);
      S.map.highlight(c ? c.code : null);
      $("ssPickLabel").textContent =
        (c ? "ปักไว้ที่ " + c.th : "ปักไว้กลางน้ำ") + (zoomedIn ? "" : " · แตะอีกทีเพื่อปรับให้ตรงขึ้น");
      $("ssConfirmBtn").disabled = false;
    },
  });

  $("ssZoomIn").addEventListener("click", () => S.map.zoomBy(1 / 1.5));
  $("ssZoomOut").addEventListener("click", () => S.map.zoomBy(1.5));
  $("ssZoomReset").addEventListener("click", () => S.map.reset());

  // ---------- ตั้งค่า ----------
  function bindSwitch(wrapId, attr, onPick) {
    const wrap = $(wrapId);
    wrap.addEventListener("click", (e) => {
      const btn = e.target.closest("[" + attr + "]");
      if (!btn) return;
      wrap.querySelectorAll(".ss-opt-btn").forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");
      onPick(Number(btn.getAttribute(attr)));
    });
  }
  const modeWrap = $("ssModeSwitch");
  modeWrap.addEventListener("click", (e) => {
    const btn = e.target.closest("[data-mode]");
    if (!btn) return;
    modeWrap.querySelectorAll(".ss-opt-btn").forEach((b) => b.classList.remove("active"));
    btn.classList.add("active");
    S.mode = btn.getAttribute("data-mode");
    reflectMode();
  });

  const catWrap = $("ssCatSwitch");
  catWrap.addEventListener("click", (e) => {
    const btn = e.target.closest("[data-cat]");
    if (!btn) return;
    catWrap.querySelectorAll(".ss-opt-btn").forEach((b) => b.classList.remove("active"));
    btn.classList.add("active");
    S.cat = btn.getAttribute("data-cat");
    reflectMode();
  });

  function landmarkPool() {
    const group = CAT_GROUP[S.cat];
    return LANDMARKS.filter((l) => !group || group.indexOf(l.cat) >= 0);
  }

  function reflectMode() {
    $("ssModeHint").textContent = MODE_HINT[S.mode];
    $("ssCatOpt").classList.toggle("ss-hidden", S.mode !== "landmark");
    $("ssNetNote").classList.toggle("ss-hidden", S.mode !== "street");
    if (S.mode === "landmark") {
      const n = landmarkPool().length;
      $("ssCatHint").textContent = "หมวดนี้มี " + n + " แห่ง";
    }
    reflectOnline();
    updateMaxNote();
  }

  bindSwitch("ssRoundSwitch", "data-rounds", (v) => {
    S.rounds = v;
    updateMaxNote();
  });
  bindSwitch("ssTimeSwitch", "data-sec", (v) => {
    S.seconds = v;
    updateMaxNote();
  });

  function perRoundMax() {
    return MAX_DIST_POINTS + (S.seconds > 0 ? MAX_TIME_BONUS : 0);
  }
  // จำนวนฉากจริงที่เล่นได้ อาจน้อยกว่าที่เลือกถ้าหมวดนั้นมีสถานที่ไม่พอ
  function effectiveRounds() {
    if (S.mode !== "landmark") return S.rounds;
    return Math.min(S.rounds, landmarkPool().length);
  }

  function updateMaxNote() {
    const n = effectiveRounds();
    $("ssMaxNote").textContent =
      "เต็ม " +
      (perRoundMax() * n).toLocaleString("th-TH") +
      " คะแนน (รอบละ " +
      perRoundMax().toLocaleString("th-TH") +
      ")" +
      (n < S.rounds ? " · หมวดนี้มีไม่พอ เล่นได้ " + n + " ฉาก" : "") +
      (S.seconds > 0 ? "" : " · ไม่จับเวลาก็ไม่มีโบนัสเวลา");
  }
  updateMaxNote();

  $("ssStartBtn").addEventListener("click", startGame);
  $("ssAgainBtn").addEventListener("click", startGame);
  $("ssBackBtn").addEventListener("click", () => showStage("ssSetup"));
  $("ssGuessBtn").addEventListener("click", openMap);
  $("ssCloseMapBtn").addEventListener("click", closeMap);
  $("ssConfirmBtn").addEventListener("click", () => submitGuess(false));
  $("ssNextBtn").addEventListener("click", nextRound);
  $("ssSkipBtn").addEventListener("click", () => {
    if (S.busy) return;
    // ฉากไม่ถูกใจหรือโหลดช้า เปลี่ยนฉากได้โดยไม่เสียรอบ
    loadScene("เปลี่ยนฉากให้ใหม่แล้ว");
  });

  function showStage(id) {
    ["ssSetup", "ssPlay", "ssReveal", "ssEnd"].forEach((s) => $(s).classList.toggle("ss-hidden", s !== id));
  }

  // ---------- เริ่มเกม ----------
  function startGame() {
    if (S.mode === "street" && !navigator.onLine) {
      warn("โหมดภาพถนนต้องเชื่อมต่ออินเทอร์เน็ต ตอนนี้เครื่องออฟไลน์อยู่ — ลองโหมดสถานที่สำคัญแทนได้ เล่นได้เลยไม่ต้องมีเน็ต");
      showStage("ssSetup");
      return;
    }
    warn("");
    S.round = 0;
    S.score = 0;
    S.history = [];
    S.used = {};
    S.playRounds = effectiveRounds();

    if (S.mode === "landmark") {
      // สับคลังทีเดียวตอนเริ่ม แล้วหยิบตามลำดับ จะได้ไม่ซ้ำกันแน่นอนในเกมเดียว
      S.deck = landmarkPool()
        .slice()
        .sort(() => Math.random() - 0.5);
      S.liveMode = false;
    } else {
      S.scenes = (typeof STREET_SCENES !== "undefined" ? STREET_SCENES : []).slice();
      S.liveMode = S.scenes.length < S.playRounds;
    }
    $("ssLiveNote").classList.toggle("ss-hidden", !S.liveMode);
    showStage("ssPlay");
    nextRound();
  }

  function warn(msg) {
    $("ssWarn").textContent = msg;
    $("ssWarn").classList.toggle("ss-hidden", !msg);
  }

  function nextRound() {
    if (S.round >= S.playRounds) return endGame();
    S.round++;
    S.guess = null;
    showStage("ssPlay");
    loadScene("");
  }

  // ---------- หาฉากมาเล่น ----------
  function pickFromManifest() {
    const pool = S.scenes.filter((s) => !S.used[s.pictureId]);
    if (!pool.length) return null;
    return pool[Math.floor(Math.random() * pool.length)];
  }

  // สุ่มสดจาก API — ใช้เฉพาะตอนคลังฉากไม่พอ ผ่านเกณฑ์ตรวจชุดเดียวกับ curator
  function pickLive(triesLeft) {
    const areas = STREET_SCENE_AREAS.slice().sort(() => Math.random() - 0.5);
    const area = areas[0];
    return ssSearch(area.bbox, 30)
      .then((items) => {
        const shuffled = items.slice().sort(() => Math.random() - 0.5);
        for (let i = 0; i < shuffled.length; i++) {
          if (S.used[shuffled[i].id]) continue;
          const v = ssValidate(shuffled[i]);
          if (v.ok) return v.scene;
        }
        if (triesLeft > 1) return pickLive(triesLeft - 1);
        return null;
      })
      .catch(() => (triesLeft > 1 ? pickLive(triesLeft - 1) : null));
  }

  function loadScene(note) {
    clearTimer();
    S.busy = true;
    S.viewerReady = false;
    S.guess = null;
    closeMap();
    // แผนที่ตัวเดียวใช้ทั้งตอนทายและตอนเฉลย ย้ายกลับเข้าแผงทายก่อนเริ่มรอบใหม่
    $("ssMapHolder").appendChild($("ssMapSvg"));
    S.map.lock(false);
    S.map.clear();
    S.map.reset();
    $("ssPickLabel").textContent = "แตะบนแผนที่เพื่อปักหมุด";
    $("ssConfirmBtn").disabled = true;
    $("ssRoundTag").textContent = "ฉากที่ " + S.round + " / " + S.playRounds;
    $("ssScoreTag").textContent = S.score.toLocaleString("th-TH") + " คะแนน";
    $("ssClock").textContent = S.seconds > 0 ? S.seconds : "—";
    $("ssStatus").textContent = note || "กำลังหาฉาก...";
    $("ssStatus").classList.remove("ss-hidden");
    $("ssGuessBtn").disabled = true;
    $("ssCredit").textContent = "";
    $("ssLandmark").classList.toggle("ss-hidden", S.mode !== "landmark");
    $("ssViewerBox").classList.toggle("ss-hidden", S.mode === "landmark");
    $("ssSkipBtn").classList.toggle("ss-hidden", S.mode === "landmark");
    $("ssPlayHint").textContent =
      S.mode === "landmark"
        ? "นึกออกคร่าว ๆ ก็กดทายได้เลย แตะแผนที่ครั้งแรกจะซูมเข้าให้ แล้วแตะซ้ำปรับตำแหน่งได้"
        : "ลากนิ้วบนภาพเพื่อหมุนดูรอบตัว · แตะลูกศรบนพื้นถนนเพื่อเดินไปข้างหน้า";

    if (S.mode === "landmark") return loadLandmark();

    const got = S.liveMode ? pickLive(MAX_SCENE_TRIES) : Promise.resolve(pickFromManifest());
    Promise.resolve(got).then((scene) => {
      if (!scene) {
        S.busy = false;
        warn(
          S.liveMode
            ? "หาฉากที่ใช้ได้ไม่เจอเลยตอนนี้ อาจเป็นเพราะเน็ตมีปัญหาหรือเซิร์ฟเวอร์ Panoramax ไม่ว่าง ลองใหม่อีกทีนะ"
            : "ฉากในคลังหมดแล้ว ลดจำนวนรอบลงหรือเติมฉากเพิ่มก่อน"
        );
        showStage("ssSetup");
        return;
      }
      S.scene = scene;
      S.used[scene.pictureId] = true;
      mountViewer(scene);
    });
  }

  // ---------- โหมดสถานที่สำคัญ ----------
  // ไม่ต้องโหลดอะไรจากเน็ตเลย หยิบจากคลังที่สับไว้แล้วขึ้นการ์ดได้ทันที
  function loadLandmark() {
    const lm = S.deck[S.round - 1];
    if (!lm) {
      S.busy = false;
      warn("สถานที่ในหมวดนี้หมดแล้ว ลองลดจำนวนฉากหรือเปลี่ยนหมวดดู");
      showStage("ssSetup");
      return;
    }
    S.scene = {
      kind: "landmark",
      answer: { lat: lm.lat, lon: lm.lon },
      country: lm.country,
      landmark: lm,
      photo: null,
    };
    $("ssLmCat").textContent = CAT_LABEL[lm.cat] || "";
    // ห้ามโชว์ชื่อสถานที่ตอนกำลังเล่นเด็ดขาด ชื่อหลายอันมีคำตอบอยู่ในตัวเอง
    // (เช่น "กำแพงเมืองจีน") เก็บไว้เฉลยตอนจบรอบ
    $("ssLmPhotoBox").classList.add("ss-hidden");
    $("ssLmPhoto").removeAttribute("src");
    $("ssLmCredit").textContent = "";
    $("ssLmClue").classList.add("ss-hidden");
    $("ssStatus").textContent = "กำลังโหลดรูป...";
    $("ssStatus").classList.remove("ss-hidden");
    $("ssGuessBtn").disabled = true;
    $("ssCredit").textContent = "";

    const token = ++S.loadToken;
    lmLoadPhoto(lm).then((photo) => {
      // ผู้เล่นอาจกดเปลี่ยนรอบหรือออกจากเกมไปแล้วระหว่างรอโหลด อย่าเขียนทับของใหม่
      if (token !== S.loadToken) return;
      S.scene.photo = photo;

      // โหลดรูปไม่ได้ก็ยังเล่นต่อได้ด้วยเบาะแสข้อความ โหมดนี้ต้องเล่นได้ตอนไม่มีเน็ต
      const useClue = () => {
        S.scene.photo = null;
        $("ssLmPhotoBox").classList.add("ss-hidden");
        $("ssLmCredit").textContent = "";
        $("ssLmClue").textContent = "💡 " + lm.clue;
        $("ssLmClue").classList.remove("ss-hidden");
        ready();
      };

      const ready = () => {
        $("ssStatus").classList.add("ss-hidden");
        $("ssGuessBtn").disabled = false;
        S.busy = false;
        S.viewerReady = true;
        startTimer();
      };

      if (!photo) return useClue();

      // รอให้รูปขึ้นจอจริง ๆ ก่อนค่อยเริ่มจับเวลา เวลารอโหลดต้องไม่กินเวลาผู้เล่น
      const img = $("ssLmPhoto");
      let settled = false;
      const shown = () => {
        if (settled) return;
        settled = true;
        img.onload = img.onerror = null;
        $("ssLmPhotoBox").classList.remove("ss-hidden");
        // เครดิตตอนเล่นบอกแค่คนถ่ายกับสัญญาอนุญาต ไม่ใส่ลิงก์ต้นทางเพราะลิงก์มีชื่อสถานที่
        if (photo.credit) {
          $("ssLmCredit").textContent = "รูปโดย " + photo.credit.author + " · " + photo.credit.license;
        }
        ready();
      };
      img.onload = shown;
      img.onerror = () => {
        if (settled) return;
        settled = true;
        img.onload = img.onerror = null;
        useClue();
      };
      img.src = photo.src;
      // มาจากแคชแล้วบางทีไม่ยิง event ให้ เช็กซ้ำเอง
      if (img.complete && img.naturalWidth > 0) shown();
    });
  }

  // ---------- ตัว viewer ----------
  function mountViewer(scene) {
    const host = $("ssViewer");
    host.innerHTML = "";
    ssLoadViewer()
      .then(() => {
        const el = document.createElement("pnx-photo-viewer");
        el.id = "ssPano";
        el.setAttribute("endpoint", STREET_SCENE_CONFIG.endpoint);
        el.setAttribute("sequence", scene.sequenceId);
        el.setAttribute("picture", scene.pictureId);
        // ปิด widget ของ viewer ไว้ เพราะแถบนั้นโชว์พิกัดกับชื่อสถานที่ = เฉลยหมด
        el.setAttribute("widgets", "false");
        // กันไม่ให้ viewer ไปเขียน id ของภาพลง URL ของเกม
        el.setAttribute("url-parameters", "false");
        // เดินได้เฉพาะใน sequence เดิม จะได้ไม่วาร์ปไปโผล่ที่อื่น
        el.setAttribute("psv-options", '{"picturesNavigation":"seq"}');

        let started = false;
        const begin = () => {
          if (started) return;
          started = true;
          clearWatchdog();
          onSceneReady();
        };
        // ชื่อ event ต่างกันได้ตามเวอร์ชันของ viewer ดักไว้ทุกแบบที่รู้จัก
        ["ready", "picture-loaded", "psv:picture-loaded"].forEach((evt) => el.addEventListener(evt, begin));
        el.addEventListener("broken", (e) => {
          const detail = (e && e.detail && (e.detail.error || e.detail.message)) || "";
          sceneFailed("ฉากนี้โหลดไม่ขึ้น" + (detail ? " (" + detail + ")" : ""));
        });

        host.appendChild(el);
        S.watchdog = setTimeout(() => sceneFailed("ฉากนี้โหลดนานผิดปกติ"), LOAD_TIMEOUT_MS);
      })
      .catch(() => {
        S.busy = false;
        warn("โหลดตัวแสดงภาพ 360° ไม่สำเร็จ ลองรีเฟรชหน้าอีกครั้ง");
        showStage("ssSetup");
      });
  }

  function clearWatchdog() {
    if (S.watchdog) clearTimeout(S.watchdog);
    S.watchdog = null;
  }

  // ฉากเสียไม่ควรกินรอบของผู้เล่น เปลี่ยนฉากใหม่ในรอบเดิม
  let failStreak = 0;
  function sceneFailed(msg) {
    clearWatchdog();
    if (S.viewerReady) return;
    failStreak++;
    if (failStreak > MAX_SCENE_TRIES) {
      failStreak = 0;
      S.busy = false;
      warn(msg + " และลองเปลี่ยนฉากหลายรอบแล้วก็ยังไม่ได้ เน็ตอาจมีปัญหา");
      showStage("ssSetup");
      return;
    }
    loadScene(msg + " — เปลี่ยนฉากให้ใหม่");
  }

  function onSceneReady() {
    failStreak = 0;
    S.busy = false;
    S.viewerReady = true;
    $("ssStatus").classList.add("ss-hidden");
    $("ssGuessBtn").disabled = false;
    // เครดิตตอนเล่นบอกแค่คนถ่ายกับสัญญาอนุญาต ยังไม่บอกลิงก์ต้นทางเพราะจะเห็นเฉลย
    $("ssCredit").textContent = "ภาพ 360° จาก " + S.scene.provider + " · " + S.scene.author + " · " + S.scene.license;
    startTimer();
  }

  // ---------- นาฬิกา ----------
  // เริ่มจับเวลาก็ต่อเมื่อภาพขึ้นแล้วเท่านั้น เวลารอโหลดจะได้ไม่กินเวลาผู้เล่น
  function startTimer() {
    clearTimer();
    if (S.seconds <= 0) {
      $("ssClock").textContent = "—";
      return;
    }
    S.left = S.seconds;
    $("ssClock").textContent = S.left;
    S.ticking = true;
    S.timer = setInterval(() => {
      S.left--;
      $("ssClock").textContent = Math.max(0, S.left);
      $("ssClock").classList.toggle("ss-hot", S.left <= 10);
      if (S.left <= 0) {
        clearTimer();
        pgTimeUp();
        submitGuess(true);
      }
    }, 1000);
  }

  function clearTimer() {
    if (S.timer) clearInterval(S.timer);
    S.timer = null;
    S.ticking = false;
    $("ssClock").classList.remove("ss-hot");
  }

  // ---------- แผนที่ทาย ----------
  function openMap() {
    if (S.busy || !S.viewerReady) return;
    $("ssMapSheet").classList.remove("ss-hidden");
    $("ssConfirmBtn").disabled = !S.guess;
    $("ssPickLabel").textContent = S.guess ? $("ssPickLabel").textContent : "แตะบนแผนที่เพื่อปักหมุด";
  }
  function closeMap() {
    $("ssMapSheet").classList.add("ss-hidden");
  }

  // ---------- ตัดสิน ----------
  function submitGuess(byTimeout) {
    if (S.busy || !S.scene) return;
    S.busy = true;
    clearTimer();
    closeMap();

    const secondsLeft = S.seconds > 0 ? Math.max(0, S.left) : 0;
    const ans = S.scene.answer;
    let km = null;
    let distPoints = 0;
    if (S.guess) {
      km = wmHaversine(S.guess.lat, S.guess.lon, ans.lat, ans.lon);
      distPoints = Math.round(MAX_DIST_POINTS * Math.exp(-km / DIST_FALLOFF_KM));
    }
    const bonus = S.guess && S.seconds > 0 ? Math.round((MAX_TIME_BONUS * secondsLeft) / S.seconds) : 0;
    const total = distPoints + bonus;
    S.score += total;
    S.history.push({ scene: S.scene, km, total, guess: S.guess });

    renderReveal({ km, distPoints, bonus, total, byTimeout });
  }

  function fmtKm(km) {
    if (km === null) return "ไม่ได้ทาย";
    if (km < 1) return "ห่างไม่ถึง 1 กม.";
    if (km < 100) return "ห่าง " + km.toFixed(1) + " กม.";
    return "ห่าง " + Math.round(km).toLocaleString("th-TH") + " กม.";
  }

  function renderReveal(r) {
    const scene = S.scene;
    const ans = scene.answer;
    const country = wmByCode(scene.country);

    showStage("ssReveal");
    S.map.lock(true);
    $("ssRevealMapWrap").appendChild($("ssMapSvg"));
    S.map.answer(ans.lat, ans.lon);
    S.map.highlight(scene.country);
    if (S.guess) {
      S.map.guess(S.guess.lat, S.guess.lon);
      S.map.connect(S.guess.lat, S.guess.lon, ans.lat, ans.lon);
      S.map.fit([S.guess, ans]);
    } else {
      S.map.fit([ans], 400);
    }

    $("ssRevealIcon").textContent = r.km === null ? "⌛" : r.km < 50 ? "🎯" : r.km < 800 ? "👍" : "🌍";
    $("ssRevealTitle").textContent = r.byTimeout && !S.guess ? "หมดเวลาแบบยังไม่ได้ปักหมุด" : fmtKm(r.km);
    $("ssRevealWhere").textContent =
      (scene.kind === "landmark" ? scene.landmark.th + " · " : "") +
      (country ? country.th + " (" + country.en + ")" : "ไม่รู้ประเทศ");

    $("ssPtDist").textContent = r.distPoints.toLocaleString("th-TH");
    $("ssPtBonus").textContent = r.bonus.toLocaleString("th-TH");
    $("ssPtTotal").textContent = r.total.toLocaleString("th-TH");
    $("ssRunning").textContent = "รวมสะสม " + S.score.toLocaleString("th-TH") + " คะแนน";

    if (scene.kind === "landmark") {
      const lm = scene.landmark;
      $("ssFact").textContent = "📖 " + lm.fact;
      $("ssFact").classList.remove("ss-hidden");
      // เฉลยแล้วจึงโชว์เครดิตเต็มพร้อมลิงก์ต้นทางได้ (ลิงก์มีชื่อสถานที่อยู่)
      if (scene.photo && scene.photo.credit) {
        const c = scene.photo.credit;
        const bits = ["รูปจาก <b>Wikimedia Commons</b>", "โดย <b>" + esc(c.author) + "</b>"];
        bits.push(
          c.licenseUrl
            ? 'สัญญาอนุญาต <a href="' + esc(c.licenseUrl) + '" target="_blank" rel="noopener noreferrer">' + esc(c.license) + "</a>"
            : "สัญญาอนุญาต " + esc(c.license)
        );
        if (c.sourceUrl)
          bits.push('<a href="' + esc(c.sourceUrl) + '" target="_blank" rel="noopener noreferrer">ดูรูปต้นทาง ↗</a>');
        $("ssAttrib").innerHTML = bits.join(" · ");
      } else {
        $("ssAttrib").innerHTML = "";
      }
      $("ssNextBtn").textContent = S.round >= S.playRounds ? "ดูสรุปคะแนน 🏁" : "ฉากต่อไป →";
      S.busy = false;
      return;
    }
    $("ssFact").classList.add("ss-hidden");

    // เครดิตเต็มรูปแบบ พร้อมลิงก์ต้นทาง — ตอนนี้เฉลยแล้วจึงโชว์ได้
    const bits = [];
    bits.push("ภาพจาก <b>" + esc(scene.provider) + "</b>");
    bits.push("ถ่ายโดย <b>" + esc(scene.author) + "</b>");
    if (scene.capturedAt) bits.push("เมื่อ " + esc(thaiDate(scene.capturedAt)));
    const lic = scene.licenseUrl
      ? '<a href="' + esc(scene.licenseUrl) + '" target="_blank" rel="noopener noreferrer">' + esc(scene.license) + "</a>"
      : esc(scene.license);
    bits.push("สัญญาอนุญาต " + lic);
    if (scene.sourceUrl)
      bits.push('<a href="' + esc(scene.sourceUrl) + '" target="_blank" rel="noopener noreferrer">ดูภาพต้นทาง ↗</a>');
    $("ssAttrib").innerHTML = bits.join(" · ");

    $("ssNextBtn").textContent = S.round >= S.playRounds ? "ดูสรุปคะแนน 🏁" : "ฉากต่อไป →";
    S.busy = false;
  }

  function thaiDate(iso) {
    const t = Date.parse(iso);
    if (isNaN(t)) return iso;
    const d = new Date(t);
    return d.toLocaleDateString("th-TH", { year: "numeric", month: "long" });
  }

  function esc(s) {
    return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  }

  // ---------- จบเกม ----------
  function endGame() {
    clearTimer();
    $("ssViewer").innerHTML = "";
    $("ssFact").classList.add("ss-hidden");
    showStage("ssEnd");
    const max = perRoundMax() * S.playRounds;
    $("ssEndScore").textContent = S.score.toLocaleString("th-TH");
    $("ssEndMax").textContent = "จากเต็ม " + max.toLocaleString("th-TH");
    const pct = max ? S.score / max : 0;
    $("ssEndTitle").textContent =
      pct > 0.8 ? "นี่มันนักเดินทางตัวจริง" : pct > 0.55 ? "แม่นใช้ได้เลย" : pct > 0.3 ? "พอไปวัดไปวาได้" : "โลกกว้างกว่าที่คิดเนอะ";
    $("ssEndIcon").textContent = pct > 0.8 ? "🏆" : pct > 0.55 ? "🧭" : pct > 0.3 ? "🗺" : "🙃";

    const rows = S.history.map((h, i) => {
      const c = wmByCode(h.scene.country);
      const label = h.scene.kind === "landmark" ? h.scene.landmark.th : c ? c.th : "—";
      return (
        '<div class="ss-row"><span class="ss-row-n">' +
        (i + 1) +
        '</span><span class="ss-row-name">' +
        esc(label) +
        '</span><span class="ss-row-km">' +
        esc(fmtKm(h.km)) +
        '</span><span class="ss-row-pt">' +
        h.total.toLocaleString("th-TH") +
        "</span></div>"
      );
    });
    $("ssEndRows").innerHTML = rows.join("");

    const best = readBest();
    if (S.score > best) {
      writeBest(S.score);
      $("ssEndBest").textContent = "สถิติใหม่ของเครื่องนี้ 🎉";
    } else {
      $("ssEndBest").textContent = "สถิติสูงสุดของเครื่องนี้ " + best.toLocaleString("th-TH") + " คะแนน";
    }
  }

  const BEST_KEY = "pg_streetscene_best";
  function readBest() {
    try {
      return Number(localStorage.getItem(BEST_KEY)) || 0;
    } catch (e) {
      return 0;
    }
  }
  function writeBest(v) {
    try {
      localStorage.setItem(BEST_KEY, String(v));
    } catch (e) {}
  }

  // ---------- ออฟไลน์ ----------
  function reflectOnline() {
    // โหมดสถานที่สำคัญเล่นได้ปกติตอนออฟไลน์ บล็อกเฉพาะโหมดที่ต้องโหลดภาพจริง
    const blocked = !navigator.onLine && S.mode === "street";
    $("ssOffline").classList.toggle("ss-hidden", !blocked);
    $("ssStartBtn").disabled = blocked;
  }
  window.addEventListener("online", reflectOnline);
  window.addEventListener("offline", reflectOnline);
  reflectMode();
});
