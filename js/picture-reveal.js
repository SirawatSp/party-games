document.addEventListener("DOMContentLoaded", () => {
  const CAT_LABEL = { movies: "🎬 หนังดัง", cartoons: "🧸 การ์ตูนดัง", thai_food: "🍜 อาหารไทย" };
  const categories = document.querySelectorAll("#prCategories [data-cat]");
  const sizeSelect = document.getElementById("prGridSize");
  const board = document.getElementById("prBoard");
  const host = document.getElementById("prImageHost");
  const tiles = document.getElementById("prTiles");
  const loading = document.getElementById("prLoading");
  const error = document.getElementById("prError");
  const answer = document.getElementById("prAnswer");
  const randomButton = document.getElementById("prRandom");
  const revealButton = document.getElementById("prReveal");
  const peekButton = document.getElementById("prHostPeek");
  const peekDialog = document.getElementById("prHostDialog");
  const peekAnswer = document.getElementById("prHostAnswer");
  const peekAliases = document.getElementById("prHostAliases");
  const correctButton = document.getElementById("prCorrect");
  const openedText = document.getElementById("prOpened");
  const pointsText = document.getElementById("prPoints");
  let cat = "all";
  let size = 4;
  let picker;
  let current;
  let phase = "loading";
  let opened = new Set();
  let totalScore = 0;
  let roundPoints = 0;
  let serial = 0;
  let cancelImage = null;

  function currentPool() {
    return cat === "all" ? PICTURE_REVEAL_LIST : PICTURE_REVEAL_LIST.filter((item) => item.cat === cat);
  }

  function refreshPicker() {
    picker = createPicker(currentPool(), "pg_picture_reveal_" + cat);
    document.getElementById("prPoolCount").textContent = currentPool().length + " รูปในหมวดนี้";
  }

  function updateHud() {
    openedText.textContent = "เปิดแล้ว " + opened.size + "/" + size * size;
    pointsText.textContent = "ตอบถูกได้ " + (size * size - opened.size) + " แต้ม";
    randomButton.disabled = phase !== "playing" || opened.size === size * size;
    revealButton.disabled = phase !== "playing";
    peekButton.disabled = phase !== "playing";
  }

  function closeHostAnswer() {
    if (peekDialog.open) peekDialog.close();
    peekAnswer.textContent = "";
    peekAliases.textContent = "";
  }

  peekButton.addEventListener("click", () => {
    if (phase !== "playing" || peekDialog.open) return;
    peekAnswer.textContent = current.answer;
    const aliases = (current.aliases || []).filter((value) => value !== current.answer);
    peekAliases.textContent = aliases.length ? "รับคำตอบได้ด้วย: " + aliases.join(" · ") : "";
    peekDialog.showModal();
  });
  document.getElementById("prHostClose").addEventListener("click", closeHostAnswer);
  peekDialog.addEventListener("close", () => {
    if (!peekDialog.open) closeHostAnswer();
  });

  function openTile(index) {
    if (phase !== "playing" || opened.has(index)) return;
    opened.add(index);
    const tile = tiles.children[index];
    tile.classList.add("is-open");
    tile.disabled = true;
    tile.setAttribute("aria-label", "ช่องที่ " + (index + 1) + " เปิดแล้ว");
    updateHud();
  }

  function buildTiles() {
    tiles.replaceChildren();
    board.style.setProperty("--grid-size", size);
    for (let i = 0; i < size * size; i++) {
      const tile = document.createElement("button");
      tile.type = "button";
      tile.className = "pr-tile";
      tile.textContent = i + 1;
      tile.setAttribute("aria-label", "เปิดช่องที่ " + (i + 1));
      tile.addEventListener("click", () => openTile(i));
      tiles.appendChild(tile);
    }
  }

  function fetchImage(url) {
    return new Promise((resolve, reject) => {
      const image = new Image();
      image.alt = "ภาพปริศนา · " + CAT_LABEL[current.cat];
      image.draggable = false;
      image.referrerPolicy = "no-referrer";
      const clean = () => {
        clearTimeout(timer);
        image.onload = null;
        image.onerror = null;
        if (cancelImage === cancel) cancelImage = null;
      };
      const cancel = () => { clean(); reject(new Error("ยกเลิกภาพเดิม")); };
      const timer = setTimeout(() => { clean(); reject(new Error("รอภาพนานเกินไป")); }, 10000);
      cancelImage = cancel;
      image.onload = () => { clean(); resolve(image); };
      image.onerror = () => { clean(); reject(new Error("โหลดภาพไม่สำเร็จ")); };
      image.src = url;
    });
  }

  async function loadCurrent() {
    closeHostAnswer();
    const request = ++serial;
    if (cancelImage) cancelImage();
    phase = "loading";
    opened = new Set();
    answer.hidden = true;
    correctButton.disabled = true;
    board.hidden = true;
    host.replaceChildren();
    tiles.replaceChildren();
    loading.hidden = false;
    loading.textContent = "กำลังโหลดภาพปริศนา…";
    error.hidden = true;
    document.getElementById("prCategoryName").textContent = CAT_LABEL[current.cat];
    updateHud();
    // ภาพสำรองใช้เมื่อแหล่งภาพหลักไม่ตอบกลับ และคำขอเก่าจะเปลี่ยนภาพของรอบใหม่ไม่ได้
    const urls = [...new Set([current.image, current.fallback].filter(Boolean))];
    for (const url of urls) {
      try {
        const image = await fetchImage(url);
        if (request !== serial) return;
        if (!image.naturalWidth || !image.naturalHeight) throw new Error("ภาพว่าง");
        buildTiles();
        board.style.setProperty("--picture-ratio", image.naturalWidth / image.naturalHeight);
        host.appendChild(image);
        phase = "playing";
        loading.hidden = true;
        board.hidden = false;
        updateHud();
        return;
      } catch (e) {
        if (request !== serial) return;
      }
    }
    phase = "error";
    loading.hidden = true;
    error.hidden = false;
    updateHud();
  }

  function next() {
    current = picker();
    if (current) loadCurrent();
  }

  function link(text, url) {
    const a = document.createElement("a");
    a.textContent = text;
    a.href = url;
    a.target = "_blank";
    a.rel = "noopener noreferrer";
    return a;
  }

  function reveal() {
    if (phase !== "playing") return;
    closeHostAnswer();
    phase = "revealed";
    roundPoints = size * size - opened.size;
    tiles.querySelectorAll("button").forEach((tile) => { tile.classList.add("is-open"); tile.disabled = true; });
    document.getElementById("prAnswerText").textContent = current.answer;
    const aliases = (current.aliases || []).filter((value) => value !== current.answer);
    document.getElementById("prAliases").textContent = aliases.length ? "รับคำตอบได้ด้วย: " + aliases.join(" · ") : "";
    const credit = document.getElementById("prCredit");
    credit.replaceChildren(document.createTextNode(current.kind + " · " + current.author + " · "),
      link("ที่มาภาพ", current.source), document.createTextNode(" · "), link(current.rights, current.rightsUrl));
    correctButton.textContent = "ตอบถูก ✓ รับ " + roundPoints + " แต้ม แล้วไปต่อ →";
    correctButton.disabled = false;
    answer.hidden = false;
    randomButton.disabled = true;
    revealButton.disabled = true;
    peekButton.disabled = true;
    pointsText.textContent = "ตอบก่อนเฉลย รับได้ " + roundPoints + " แต้ม";
  }

  randomButton.addEventListener("click", () => {
    if (phase !== "playing") return;
    const remaining = Array.from({ length: size * size }, (_, i) => i).filter((i) => !opened.has(i));
    if (remaining.length) openTile(remaining[Math.floor(Math.random() * remaining.length)]);
  });
  revealButton.addEventListener("click", reveal);
  correctButton.addEventListener("click", () => {
    if (phase !== "revealed") return;
    phase = "scored";
    correctButton.disabled = true;
    totalScore += roundPoints;
    document.getElementById("prTotalScore").textContent = totalScore;
    next();
  });
  document.getElementById("prSkip").addEventListener("click", next);
  document.getElementById("prRetry").addEventListener("click", loadCurrent);
  document.getElementById("prResetScore").addEventListener("click", () => {
    totalScore = 0;
    document.getElementById("prTotalScore").textContent = 0;
  });
  categories.forEach((button) => button.addEventListener("click", () => {
    cat = button.dataset.cat;
    categories.forEach((item) => {
      item.classList.toggle("active", item === button);
      item.setAttribute("aria-pressed", String(item === button));
    });
    refreshPicker();
    next();
  }));
  sizeSelect.addEventListener("change", () => {
    size = [3, 4, 5].includes(Number(sizeSelect.value)) ? Number(sizeSelect.value) : 4;
    next();
  });
  refreshPicker();
  next();
});
