document.addEventListener("DOMContentLoaded", () => {
  const totTags = document.getElementById("totTags");
  const catLabel = document.getElementById("totCatLabel");
  const optionA = document.getElementById("totOptionA");
  const optionB = document.getElementById("totOptionB");
  const pickedLabel = document.getElementById("totPickedLabel");
  const nextBtn = document.getElementById("totNextBtn");

  const CAT_LABEL = {
    food: "อาหาร", lifestyle: "ไลฟ์สไตล์", entertain: "บันเทิง", travel: "ท่องเที่ยว",
    tech: "เทคโนโลยี", fantasy: "แฟนตาซี", love: "ความรัก", party: "ปาร์ตี้",
    sport: "กีฬา", animal: "สัตว์/ธรรมชาติ", work: "งาน/เรียน", weird: "มันส์ๆ"
  };

  let activeCat = "all";
  let drawNext = null;
  let current = null;

  function pool() {
    return activeCat === "all" ? THISORTHAT_LIST : THISORTHAT_LIST.filter((p) => p.cat === activeCat);
  }

  function refreshPicker() {
    drawNext = createPicker(pool());
  }

  function renderPair() {
    catLabel.textContent = CAT_LABEL[current.cat];
    optionA.textContent = current.a;
    optionB.textContent = current.b;
    optionA.classList.remove("chosen");
    optionB.classList.remove("chosen");
    pickedLabel.textContent = "";
  }

  function next() {
    if (!drawNext) return;
    const item = drawNext();
    if (!item) return;
    current = item;
    renderPair();
  }

  function pick(side) {
    optionA.classList.toggle("chosen", side === "a");
    optionB.classList.toggle("chosen", side === "b");
    pickedLabel.textContent = "ใครเลือกเหมือนกันบ้าง? 👀";
  }

  optionA.addEventListener("click", () => pick("a"));
  optionB.addEventListener("click", () => pick("b"));
  nextBtn.addEventListener("click", next);

  totTags.querySelectorAll(".tag").forEach((tagEl) => {
    tagEl.addEventListener("click", () => {
      totTags.querySelectorAll(".tag").forEach((t) => t.classList.remove("active"));
      tagEl.classList.add("active");
      activeCat = tagEl.dataset.cat;
      refreshPicker();
      next();
    });
  });

  refreshPicker();
  next();
});
