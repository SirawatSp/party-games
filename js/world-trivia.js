document.addEventListener("DOMContentLoaded", () => {
  const cardHolder = document.getElementById("cardHolder");
  const nextBtn = document.getElementById("nextBtn");
  const modeSwitch = document.getElementById("modeSwitch");
  const rulesTF = document.getElementById("rulesTF");
  const rulesQA = document.getElementById("rulesQA");
  const filterTagsTF = document.getElementById("filterTagsTF");
  const filterTagsQA = document.getElementById("filterTagsQA");

  const TAG_LABEL_TF = { law: "กฎหมาย", culture: "วัฒนธรรม", nature: "ธรรมชาติ", history: "ประวัติศาสตร์", record: "สถิติโลก" };
  const TAG_LABEL_QA = { space: "โลก/อวกาศ", animal: "สัตว์โลก", body: "ร่างกาย", law: "กฎหมายแปลก", culture: "วัฒนธรรม", pop: "จิปาถะ", riddle: "ปริศนาคำทาย" };

  let mode = "tf";
  let activeTag = "all";
  let lastIndex = -1;
  let current = null;
  let revealed = false;

  function pool() {
    const list = mode === "tf" ? WORLD_TRIVIA : WORLD_TRIVIA_QA;
    return activeTag === "all" ? list : list.filter((q) => q.tag === activeTag);
  }

  function renderCard() {
    cardHolder.innerHTML = "";
    const card = document.createElement("div");
    card.className = "trivia-card";

    if (mode === "tf") {
      const tagLabel = TAG_LABEL_TF[current.tag];
      card.innerHTML =
        '<div class="cat">' + tagLabel + "</div>" +
        '<div class="statement">' + current.statement + "</div>" +
        (revealed
          ? '<div class="verdict ' + (current.answer ? "true" : "false") + '">' + (current.answer ? "จริง ✅" : "มั่วนิ่ม ❌") + "</div>" +
            '<div class="explain">' + current.explain + "</div>"
          : '<button class="btn reveal-btn" id="revealBtn">เฉลย!</button>');
    } else {
      const tagLabel = TAG_LABEL_QA[current.tag];
      card.innerHTML =
        '<div class="cat">' + tagLabel + "</div>" +
        '<div class="statement">' + current.question + "</div>" +
        (revealed
          ? '<div class="verdict qa">คำตอบ</div>' +
            '<div class="explain qa-answer">' + current.answer + "</div>"
          : '<button class="btn reveal-btn" id="revealBtn">เฉลย!</button>');
    }

    cardHolder.appendChild(card);

    if (!revealed) {
      document.getElementById("revealBtn").addEventListener("click", () => {
        revealed = true;
        renderCard();
      });
    }
  }

  function next() {
    const list = pool();
    if (!list.length) return;
    let idx;
    do {
      idx = Math.floor(Math.random() * list.length);
    } while (list.length > 1 && idx === lastIndex);
    lastIndex = idx;
    current = list[idx];
    revealed = false;
    renderCard();
  }

  function setActiveTagButtons(container) {
    container.querySelectorAll(".tag").forEach((tagEl) => {
      tagEl.addEventListener("click", () => {
        container.querySelectorAll(".tag").forEach((t) => t.classList.remove("active"));
        tagEl.classList.add("active");
        activeTag = tagEl.dataset.tag;
        lastIndex = -1;
        next();
      });
    });
  }

  nextBtn.addEventListener("click", next);
  setActiveTagButtons(filterTagsTF);
  setActiveTagButtons(filterTagsQA);

  modeSwitch.querySelectorAll(".mode-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      if (btn.dataset.mode === mode) return;
      mode = btn.dataset.mode;
      modeSwitch.querySelectorAll(".mode-btn").forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");

      const isTF = mode === "tf";
      rulesTF.style.display = isTF ? "" : "none";
      rulesQA.style.display = isTF ? "none" : "";
      filterTagsTF.style.display = isTF ? "" : "none";
      filterTagsQA.style.display = isTF ? "none" : "";

      [filterTagsTF, filterTagsQA].forEach((c) => {
        c.querySelectorAll(".tag").forEach((t) => t.classList.remove("active"));
        c.querySelector('.tag[data-tag="all"]').classList.add("active");
      });
      activeTag = "all";
      lastIndex = -1;
      next();
    });
  });

  next();
});
