// เกมร้านสะดวกซื้อ: เก็บคำตอบลับไว้ในหน่วยความจำ และล้างหน้าจอก่อนส่งเครื่องให้คนทาย
(() => {
  "use strict";

  function init() {
    const app = document.getElementById("csApp");
    if (!app) return;

    const ids = [
      "csSetup", "csSetupForm", "csPlayerOne", "csPlayerTwo", "csRoundLimit",
      "csCategories", "csSetupError", "csHud", "csRoundText", "csScoreText",
      "csReset", "csPlay", "csTurnLabel", "csCategoryLabel", "csPrompt",
      "csShelf", "csSelectionHint", "csConfirm", "csReveal", "csRevealTitle",
      "csRevealText", "csRevealDetails", "csNext", "csPass", "csPassTitle",
      "csPassText", "csReady", "csSummary", "csSummaryTitle", "csSummaryText",
      "csPlayAgain"
    ];
    const ui = Object.fromEntries(ids.map((id) => [id, document.getElementById(id)]));
    if (ids.some((id) => !ui[id])) throw new Error("องค์ประกอบหน้าเกมร้านสะดวกซื้อไม่ครบ");

    const CAT_LABEL = {
      soda: "น้ำอัดลม", tea: "ชา", milk: "นม", snacks: "ขนมขบเคี้ยว",
      noodles: "บะหมี่กึ่งสำเร็จรูป", icecream: "ไอศกรีม"
    };
    const prompts = typeof CONVENIENCE_STORE_LIST !== "undefined" && Array.isArray(CONVENIENCE_STORE_LIST)
      ? CONVENIENCE_STORE_LIST : [];
    const products = typeof CONVENIENCE_PRODUCTS !== "undefined" && Array.isArray(CONVENIENCE_PRODUCTS)
      ? CONVENIENCE_PRODUCTS : [];
    const categoryButtons = [...ui.csCategories.querySelectorAll("[data-cat]")];

    // ไม่เขียนคำตอบ ชื่อผู้เล่น หรือสถานะรอบลง URL, storage หรือแอตทริบิวต์ลับในหน้าเว็บ
    let phase = "setup";
    let category = "all";
    let names = [];
    let roundLimit = 6;
    let round = 0;
    let completed = 0;
    let score = 0;
    let pickPrompt = null;
    let prompt = null;
    let roundProducts = [];
    let secretId = null;
    let selectedId = null;
    let guessId = null;

    const focus = (element) => {
      if (!element.matches("button, input, select, textarea, a[href], [tabindex]")) element.tabIndex = -1;
      element.focus();
    };
    const chooser = () => (round - 1) % 2;
    const productText = (product) => product.name + " (" + product.brand + ")";
    const findProduct = (id) => roundProducts.find((product) => product.id === id);

    function show(screen) {
      [ui.csSetup, ui.csPlay, ui.csPass, ui.csSummary].forEach((element) => {
        element.hidden = element !== screen;
      });
      ui.csHud.hidden = screen === ui.csSetup || screen === ui.csSummary;
    }

    function updateHud() {
      ui.csRoundText.textContent = "รอบที่ " + round + "/" + roundLimit;
      ui.csScoreText.textContent = "ทายตรงกัน " + score + "/" + completed + " รอบ";
    }

    function clearRoundView() {
      // ลบปุ่มทั้งชุด เพื่อไม่ให้คลาส โฟกัส aria หรือข้อความของตัวเลือกเดิมค้างในหน้าคนทาย
      ui.csShelf.replaceChildren();
      ui.csSelectionHint.textContent = "";
      ui.csTurnLabel.textContent = "";
      ui.csCategoryLabel.textContent = "";
      ui.csPrompt.textContent = "";
      ui.csConfirm.disabled = true;
      ui.csConfirm.hidden = false;
      ui.csReveal.hidden = true;
      ui.csRevealTitle.textContent = "";
      ui.csRevealText.textContent = "";
      ui.csRevealDetails.textContent = "";
      selectedId = null;
      guessId = null;
    }

    function picture(product) {
      const wrapper = document.createElement("span");
      wrapper.className = "cs-product-picture";
      const fallback = document.createElement("span");
      fallback.className = "cs-product-fallback";
      fallback.textContent = "ภาพไม่พร้อม";
      fallback.hidden = true;
      const image = document.createElement("img");
      image.alt = "";
      image.decoding = "async";
      const sprite = product.sprite;
      if (Array.isArray(sprite) && sprite.length === 2
        && sprite.every((n) => Number.isInteger(n) && n >= 0 && n < 6)) {
        image.className = "cs-product-sprite";
        image.style.width = "600%";
        image.style.height = "600%";
        image.style.maxWidth = "none";
        image.style.position = "absolute";
        image.style.left = "0";
        image.style.top = "0";
        image.style.transform = "translate(" + (-sprite[0] * 100 / 6) + "%, " + (-sprite[1] * 100 / 6) + "%)";
      }
      image.addEventListener("error", () => {
        image.remove();
        wrapper.classList.add("cs-image-missing");
        fallback.hidden = false;
      }, { once: true });
      wrapper.append(image, fallback);
      if (product.image) image.src = product.image;
      else {
        image.remove();
        wrapper.classList.add("cs-image-missing");
        fallback.hidden = false;
      }
      return wrapper;
    }

    function renderShelf(mode) {
      const fragment = document.createDocumentFragment();
      roundProducts.forEach((product) => {
        const button = document.createElement("button");
        button.type = "button";
        button.className = "cs-product";
        button.dataset.productId = product.id;
        button.setAttribute("aria-pressed", "false");
        button.disabled = mode === "reveal";
        const name = document.createElement("span");
        name.className = "cs-product-name";
        name.textContent = product.name;
        const brand = document.createElement("span");
        brand.className = "cs-product-brand";
        brand.textContent = product.brand;
        const badges = document.createElement("span");
        badges.className = "cs-product-badges";
        if (mode === "reveal") {
          const answer = product.id === secretId;
          const guessed = product.id === guessId;
          button.classList.toggle("is-answer", answer);
          button.classList.toggle("is-guess", guessed);
          button.classList.toggle("is-match", answer && guessed);
          if (answer && guessed) badges.textContent = "เลือกและทายตรงกัน";
          else if (answer) badges.textContent = "สิ่งที่เลือกไว้";
          else if (guessed) badges.textContent = "คำทาย";
        }
        button.append(picture(product), brand, name, badges);
        button.addEventListener("click", () => {
          // ปุ่มที่ถูกถอดจากหน้าจอหรือเป็นของขั้นก่อนหน้าไม่มีสิทธิ์เปลี่ยนรอบปัจจุบัน
          if ((mode !== "choose" && mode !== "guess") || phase !== mode || !button.isConnected) return;
          selectedId = product.id;
          ui.csShelf.querySelectorAll(".cs-product").forEach((card) => {
            const selected = card === button;
            card.classList.toggle("is-selected", selected);
            card.setAttribute("aria-pressed", String(selected));
          });
          ui.csSelectionHint.textContent = "เลือก " + productText(product) + " แล้ว กดยืนยันเมื่อพร้อม";
          ui.csConfirm.disabled = false;
        });
        fragment.append(button);
      });
      ui.csShelf.replaceChildren(fragment);
    }

    function showQuestion() {
      ui.csCategoryLabel.textContent = CAT_LABEL[prompt.cat];
      ui.csPrompt.textContent = prompt.q;
    }

    function beginRound() {
      secretId = null;
      clearRoundView();
      prompt = pickPrompt();
      roundProducts = products.filter((product) => product.cat === prompt.cat);
      round += 1;
      phase = "choose";
      show(ui.csPlay);
      updateHud();
      showQuestion();
      ui.csTurnLabel.textContent = names[chooser()] + " เลือกสินค้า";
      ui.csSelectionHint.textContent = "ให้อีกคนหลบหน้าจอก่อน แล้วเลือกสินค้าหนึ่งชิ้น";
      ui.csConfirm.textContent = "ยืนยันสิ่งที่เลือก";
      renderShelf("choose");
      focus(ui.csTurnLabel);
    }

    function setupError(message) {
      ui.csSetupError.textContent = message;
      ui.csSetupError.hidden = false;
    }

    function resetGame(moveFocus = true) {
      phase = "setup";
      names = [];
      round = completed = score = 0;
      secretId = selectedId = guessId = null;
      prompt = pickPrompt = null;
      roundProducts = [];
      clearRoundView();
      ui.csSetupError.textContent = "";
      ui.csSetupError.hidden = true;
      ui.csPassTitle.textContent = "";
      ui.csPassText.textContent = "";
      ui.csSummaryTitle.textContent = "";
      ui.csSummaryText.textContent = "";
      ui.csRoundText.textContent = "";
      ui.csScoreText.textContent = "";
      show(ui.csSetup);
      if (moveFocus) focus(ui.csPlayerOne);
    }

    categoryButtons.forEach((button) => {
      button.addEventListener("click", () => {
        if (phase !== "setup") return;
        const next = button.dataset.cat;
        if (next !== "all" && !Object.hasOwn(CAT_LABEL, next)) return;
        category = next;
        categoryButtons.forEach((item) => {
          const active = item === button;
          item.setAttribute("aria-pressed", String(active));
          item.classList.toggle("is-active", active);
        });
      });
    });

    [ui.csPlayerOne, ui.csPlayerTwo].forEach((input) => {
      input.addEventListener("input", () => {
        if (phase === "setup") {
          ui.csSetupError.textContent = "";
          ui.csSetupError.hidden = true;
        }
      });
    });

    ui.csSetupForm.addEventListener("submit", (event) => {
      event.preventDefault();
      if (phase !== "setup") return;
      const entered = [ui.csPlayerOne.value, ui.csPlayerTwo.value]
        .map((name, i) => name.trim().replace(/\s+/g, " ").slice(0, 18) || "คนที่" + (i + 1));
      if (entered[0].normalize("NFKC").toLowerCase() === entered[1].normalize("NFKC").toLowerCase()) {
        setupError("ใช้ชื่อคนละชื่อ เพื่อแยกคนเลือกกับคนทายได้ชัดเจน");
        focus(ui.csPlayerTwo);
        return;
      }
      const pool = prompts.filter((item) => category === "all" || item.cat === category);
      if (!pool.length || typeof createPicker !== "function"
        || pool.some((item) => !CAT_LABEL[item.cat] || products.filter((product) => product.cat === item.cat).length < 2)) {
        setupError("คลังโจทย์หรือสินค้ายังไม่พร้อม ลองโหลดหน้าใหม่อีกครั้ง");
        return;
      }
      names = entered;
      const limit = Number(ui.csRoundLimit.value);
      roundLimit = [6, 10, 12].includes(limit) ? limit : 6;
      round = completed = score = 0;
      // ไม่ส่ง storageKey เพื่อให้ทั้งเกมอยู่ในหน่วยความจำของหน้านี้เท่านั้น
      pickPrompt = createPicker(pool);
      ui.csSetupError.hidden = true;
      ui.csSetupError.textContent = "";
      beginRound();
    });

    ui.csConfirm.addEventListener("click", () => {
      if ((phase !== "choose" && phase !== "guess") || selectedId === null || !findProduct(selectedId)) return;
      if (phase === "choose") {
        secretId = selectedId;
        phase = "handoff";
        clearRoundView();
        ui.csPassTitle.textContent = "ส่งเครื่องให้ " + names[1 - chooser()];
        ui.csPassText.textContent = names[chooser()] + " เลือกเรียบร้อยแล้ว ให้คนทายรับเครื่องและกดพร้อมเมื่ออยู่หน้าจอคนเดียว";
        show(ui.csPass);
        focus(ui.csReady);
        return;
      }
      // เปลี่ยนขั้นก่อนคิดคะแนน เพื่อกันการกดยืนยันติดกันแล้วได้แต้มซ้ำ
      phase = "reveal";
      guessId = selectedId;
      selectedId = null;
      completed += 1;
      const matched = secretId === guessId;
      if (matched) score += 1;
      updateHud();
      ui.csSelectionHint.textContent = "";
      ui.csConfirm.disabled = true;
      ui.csConfirm.hidden = true;
      renderShelf("reveal");
      ui.csRevealTitle.textContent = matched ? "ทายตรงกัน!" : "ยังไม่ตรงกัน";
      ui.csRevealText.textContent = matched ? "คู่นี้รู้ใจ รับไป 1 แต้ม" : "รอบนี้ยังไม่ได้แต้ม ลองรู้ใจกันใหม่ในรอบถัดไป";
      ui.csRevealDetails.textContent = names[chooser()] + " เลือก " + productText(findProduct(secretId))
        + " · " + names[1 - chooser()] + " ทาย " + productText(findProduct(guessId));
      ui.csNext.textContent = completed < roundLimit ? "รอบถัดไป" : "ดูสรุปเกม";
      ui.csReveal.hidden = false;
      focus(ui.csRevealTitle);
    });

    ui.csReady.addEventListener("click", () => {
      if (phase !== "handoff") return;
      phase = "guess";
      clearRoundView();
      show(ui.csPlay);
      showQuestion();
      ui.csTurnLabel.textContent = names[1 - chooser()] + " ทายใจเพื่อน";
      ui.csSelectionHint.textContent = "เลือกสินค้าที่คิดว่าเพื่อนเลือก แล้วกดยืนยันคำทาย";
      ui.csConfirm.textContent = "ยืนยันคำทาย";
      renderShelf("guess");
      focus(ui.csTurnLabel);
    });

    ui.csNext.addEventListener("click", () => {
      if (phase !== "reveal") return;
      if (completed < roundLimit) {
        beginRound();
        return;
      }
      phase = "summary";
      secretId = selectedId = guessId = null;
      prompt = pickPrompt = null;
      roundProducts = [];
      clearRoundView();
      ui.csPassTitle.textContent = "";
      ui.csPassText.textContent = "";
      ui.csSummaryTitle.textContent = "รู้ใจตรงกัน " + score + " จาก " + roundLimit + " รอบ";
      ui.csSummaryText.textContent = names[0] + " และ " + names[1]
        + " ทายตรงกัน " + score + " รอบ จากทั้งหมด " + roundLimit + " รอบ ขอบคุณที่มาเดินร้านด้วยกัน";
      show(ui.csSummary);
      focus(ui.csSummaryTitle);
    });

    ui.csReset.addEventListener("click", () => resetGame());
    ui.csPlayAgain.addEventListener("click", () => resetGame());
    resetGame(false);
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init, { once: true });
  else init();
})();
