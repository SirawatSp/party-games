document.addEventListener("DOMContentLoaded", () => {
  const cardHolder = document.getElementById("cardHolder");
  const nextBtn = document.getElementById("nextBtn");
  const filterTags = document.getElementById("filterTags");

  const TAG_LABEL = { funny: "ฮา", dealbreaker: "จุดพัง", wholesome: "น่ารักกด+" };
  let activeTag = "all";
  let drawNext = null;

  function pool() {
    return activeTag === "all"
      ? TEN_BUT_LIST
      : TEN_BUT_LIST.filter((q) => q.tag === activeTag);
  }

  function refreshPicker() {
    drawNext = createPicker(pool(), "pg_tenbut_" + activeTag);
  }

  function renderCard(item) {
    cardHolder.innerHTML = "";
    const card = document.createElement("div");
    card.className = "tenbut-card";
    card.innerHTML =
      '<div class="score">10 เต็ม 10</div>' +
      '<div class="txt">' + item.text + "</div>" +
      '<span class="tagpill ' + item.tag + '">' + TAG_LABEL[item.tag] + "</span>";
    cardHolder.appendChild(card);
  }

  function next() {
    if (!drawNext) return;
    const item = drawNext();
    if (!item) return;
    renderCard(item);
  }

  nextBtn.addEventListener("click", next);

  filterTags.querySelectorAll(".tag").forEach((tagEl) => {
    tagEl.addEventListener("click", () => {
      filterTags.querySelectorAll(".tag").forEach((t) => t.classList.remove("active"));
      tagEl.classList.add("active");
      activeTag = tagEl.dataset.tag;
      refreshPicker();
      next();
    });
  });

  refreshPicker();
  next();
});
