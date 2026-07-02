document.addEventListener("DOMContentLoaded", () => {
  const cardHolder = document.getElementById("cardHolder");
  const nextBtn = document.getElementById("nextBtn");
  const filterTags = document.getElementById("filterTags");

  const TAG_LABEL = { law: "กฎหมาย", culture: "วัฒนธรรม", nature: "ธรรมชาติ", history: "ประวัติศาสตร์", record: "สถิติโลก" };
  let activeTag = "all";
  let lastIndex = -1;
  let current = null;
  let revealed = false;

  function pool() {
    return activeTag === "all"
      ? WORLD_TRIVIA
      : WORLD_TRIVIA.filter((q) => q.tag === activeTag);
  }

  function renderCard() {
    cardHolder.innerHTML = "";
    const card = document.createElement("div");
    card.className = "trivia-card";
    card.innerHTML =
      '<div class="cat">' + TAG_LABEL[current.tag] + "</div>" +
      '<div class="statement">' + current.statement + "</div>" +
      (revealed
        ? '<div class="verdict ' + (current.answer ? "true" : "false") + '">' + (current.answer ? "จริง ✅" : "มั่วนิ่ม ❌") + "</div>" +
          '<div class="explain">' + current.explain + "</div>"
        : '<button class="btn reveal-btn" id="revealBtn">เฉลย!</button>');
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

  nextBtn.addEventListener("click", next);

  filterTags.querySelectorAll(".tag").forEach((tagEl) => {
    tagEl.addEventListener("click", () => {
      filterTags.querySelectorAll(".tag").forEach((t) => t.classList.remove("active"));
      tagEl.classList.add("active");
      activeTag = tagEl.dataset.tag;
      lastIndex = -1;
      next();
    });
  });

  next();
});
