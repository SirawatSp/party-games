document.addEventListener("DOMContentLoaded", () => {
  const $ = (id) => document.getElementById(id);

  const SUITS = [
    { s: "♠", cls: "rh-black" },
    { s: "♥", cls: "rh-red" },
    { s: "♦", cls: "rh-red" },
    { s: "♣", cls: "rh-black" },
  ];

  const MODE_HINT = {
    drink: "ไพ่ทุกใบจะสั่งให้ดื่มตามกติกาวงเหล้าปกติ",
    soft: "ไพ่ทุกใบเปลี่ยนจาก 'ดื่ม' เป็นบทลงโทษสนุก ๆ แทน คนไม่ดื่มก็เล่นได้ทั้งวง",
  };

  const S = {
    mode: "drink",
    strict: false,
    setId: ROUNDHAND_SETS[0].id,
    randomSet: false,
    deck: [],
    drawn: null,
    kings: 0,
    houseRules: [],
    over: false,
    kingPenalty: null,
  };

  function activeSet() {
    return ROUNDHAND_SETS.find((s) => s.id === S.setId) || ROUNDHAND_SETS[0];
  }

  function cardByRank(rank) {
    return activeSet().cards.find((c) => c.rank === rank);
  }

  function esc(str) {
    return String(str).replace(/[&<>"']/g, (ch) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[ch]));
  }

  // ---------- ตัวเลือกชุดกติกา ----------
  function renderSetPicker() {
    $("rhSetPicker").innerHTML =
      ROUNDHAND_SETS.map(
        (s) =>
          '<button class="rh-set-btn' + (s.id === S.setId && !S.randomSet ? " active" : "") + '" data-set="' + s.id + '" type="button">' +
          '<span class="rh-set-icon">' + s.icon + "</span>" +
          '<span class="rh-set-name">' + s.name + "</span>" +
          "</button>"
      ).join("") +
      '<button class="rh-set-btn' + (S.randomSet ? " active" : "") + '" data-set="__random" type="button">' +
      '<span class="rh-set-icon">🎲</span><span class="rh-set-name">สุ่มชุด</span></button>';

    $("rhSetPicker").querySelectorAll("[data-set]").forEach((btn) => {
      btn.addEventListener("click", () => {
        if (btn.dataset.set === "__random") {
          S.randomSet = true;
        } else {
          S.randomSet = false;
          S.setId = btn.dataset.set;
        }
        renderSetPicker();
        renderSetDesc();
        renderCardTable();
      });
    });
  }

  function renderSetDesc() {
    if (S.randomSet) {
      $("rhSetDesc").textContent = "ทุกครั้งที่เริ่มเกมใหม่ ระบบจะสุ่มชุดกติกาให้เอง จากทั้งหมด " + ROUNDHAND_SETS.length + " ชุด";
      return;
    }
    $("rhSetDesc").textContent = activeSet().desc;
  }

  // ---------- กฎประจำเกมที่โชว์ค้างไว้ด้านบน ----------
  function renderStanding() {
    $("rhStanding").innerHTML = ROUNDHAND_STANDING_RULES.filter((r) => !r.optional || S.strict)
      .map(
        (r) =>
          '<div class="rh-standing-item">' +
          '<span class="rh-standing-icon">' + r.icon + "</span>" +
          "<div><b>" + r.title + "</b><span>" + r.detail + "</span></div>" +
          "</div>"
      )
      .join("");
  }

  // ---------- ตารางกติกาไพ่ 13 ใบของชุดที่เลือก ----------
  function renderCardTable() {
    const set = activeSet();
    $("rhTableHead").textContent = S.randomSet
      ? "📖 กติกาไพ่ (ตัวอย่างชุด " + set.name + ")"
      : "📖 กติกาไพ่ชุด " + set.icon + " " + set.name;
    $("rhCardTable").innerHTML = set.cards
      .map(
        (c) =>
          '<div class="rh-table-row">' +
          '<span class="rh-table-rank">' + c.rank + "</span>" +
          '<div class="rh-table-body">' +
          "<b>" + c.icon + " " + c.title + "</b>" +
          "<span>" + c[S.mode] + "</span>" +
          "</div>" +
          "</div>"
      )
      .join("");
  }

  // ---------- กองไพ่ ----------
  function buildDeck() {
    const deck = [];
    activeSet().cards.forEach((c) => {
      SUITS.forEach((su) => deck.push({ rank: c.rank, suit: su.s, cls: su.cls }));
    });
    // สับไพ่แบบ Fisher-Yates
    for (let i = deck.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      const t = deck[i];
      deck[i] = deck[j];
      deck[j] = t;
    }
    return deck;
  }

  function renderMeta() {
    $("rhLeft").textContent = S.deck.length;
    $("rhKings").textContent = S.kings + "/4";
    $("rhKings").classList.toggle("rh-danger", S.kings === 3);
    const set = activeSet();
    $("rhSetTag").textContent = set.icon + " " + set.name;
  }

  function renderHouseRules(target) {
    const box = $(target);
    if (!S.houseRules.length) {
      box.innerHTML = "";
      return;
    }
    box.innerHTML =
      '<div class="rh-rules-head-sm">📜 กฎที่ตั้งไว้ในเกมนี้</div>' +
      S.houseRules.map((r, i) => '<div class="rh-rule-chip"><b>' + (i + 1) + ".</b> " + esc(r) + "</div>").join("");
  }

  function showCard(card) {
    const info = cardByRank(card.rank);
    const cardEl = $("rhCard");

    $("rhCorner").textContent = card.rank + " " + card.suit;
    $("rhCorner").className = "rh-card-corner " + card.cls;
    $("rhCardIcon").textContent = info.icon;
    $("rhCardTitle").textContent = info.title;
    $("rhCardText").textContent = info[S.mode];
    $("rhCardNote").textContent = info.note;

    $("rhDeck").classList.add("rh-hidden");
    cardEl.classList.remove("rh-hidden");
    // เล่นอนิเมชันพลิกไพ่ใหม่ทุกครั้ง ต้องถอดคลาสแล้วบังคับ reflow ก่อนใส่กลับ
    cardEl.classList.remove("rh-flip");
    void cardEl.offsetWidth;
    cardEl.classList.add("rh-flip");

    $("rhRuleForm").classList.toggle("rh-hidden", !info.ruleInput);
    if (info.ruleInput) $("rhRuleInput").value = "";

    if (navigator.vibrate) navigator.vibrate(40);
  }

  function draw() {
    // K ใบที่ 4 ออกแล้ว = จบเกมทันที ห้ามจั่วต่อระหว่างที่ยังโชว์ไพ่ใบสุดท้ายค้างอยู่
    if (S.over) return;
    if (!S.deck.length) return endGame("deck");
    const card = S.deck.pop();
    S.drawn = card;

    if (cardByRank(card.rank).isKing) S.kings++;
    renderMeta();
    showCard(card);

    if (S.kings >= 4) {
      S.over = true; // ล็อกไม่ให้จั่วต่อทันที
      // ให้เห็นหน้าไพ่ K ใบสุดท้ายก่อนสักครู่ค่อยตัดไปหน้าจบ
      setTimeout(() => endGame("king"), 2600);
    }
  }

  function endGame(reason) {
    S.over = true;
    const king = reason === "king";
    $("rhEndIcon").textContent = king ? S.kingPenalty.icon : "🃏";
    $("rhEndTitle").textContent = king ? "K ใบที่ 4 ออกแล้ว!" : "ไพ่หมดกอง";

    if (king) {
      $("rhEndPenalty").classList.remove("rh-hidden");
      $("rhPenaltyName").textContent = S.kingPenalty.title;
      $("rhPenaltyText").textContent = S.kingPenalty[S.mode];
      $("rhEndText").textContent = "บทลงโทษของคนที่จั่ว K ใบสุดท้ายคืนนี้คือ";
    } else {
      $("rhEndPenalty").classList.add("rh-hidden");
      $("rhEndText").textContent = "จั่วครบ 52 ใบโดยไม่มีใครเจอ K ใบที่ 4 เลย ถือว่าวงนี้ดวงแข็งมาก";
    }

    renderHouseRules("rhEndRules");
    $("rhTable").classList.add("rh-hidden");
    $("rhEnd").classList.remove("rh-hidden");
    if (navigator.vibrate) navigator.vibrate([120, 60, 120]);
  }

  function startGame() {
    if (S.randomSet) {
      S.setId = ROUNDHAND_SETS[Math.floor(Math.random() * ROUNDHAND_SETS.length)].id;
      renderCardTable();
    }
    // สุ่มบทลงโทษ K ตั้งแต่ต้นเกม แต่ยังไม่เปิดเผยจนกว่า K ใบที่ 4 จะออก
    S.kingPenalty = ROUNDHAND_KING_PENALTIES[Math.floor(Math.random() * ROUNDHAND_KING_PENALTIES.length)];
    S.deck = buildDeck();
    S.kings = 0;
    S.houseRules = [];
    S.over = false;
    S.drawn = null;
    renderMeta();
    renderHouseRules("rhRulesLive");
    $("rhCard").classList.add("rh-hidden");
    $("rhRuleForm").classList.add("rh-hidden");
    $("rhDeck").classList.remove("rh-hidden");
    $("rhSetup").classList.add("rh-hidden");
    $("rhEnd").classList.add("rh-hidden");
    $("rhTable").classList.remove("rh-hidden");
  }

  function backToSetup() {
    $("rhTable").classList.add("rh-hidden");
    $("rhEnd").classList.add("rh-hidden");
    $("rhSetup").classList.remove("rh-hidden");
  }

  // ---------- ปุ่มต่าง ๆ ----------
  $("rhModeSwitch").querySelectorAll("[data-mode]").forEach((btn) => {
    btn.addEventListener("click", () => {
      $("rhModeSwitch").querySelectorAll("[data-mode]").forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");
      S.mode = btn.dataset.mode;
      $("rhModeHint").textContent = MODE_HINT[S.mode];
      renderCardTable();
    });
  });

  $("rhStrictSwitch").querySelectorAll("[data-strict]").forEach((btn) => {
    btn.addEventListener("click", () => {
      $("rhStrictSwitch").querySelectorAll("[data-strict]").forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");
      S.strict = btn.dataset.strict === "on";
      renderStanding();
    });
  });

  $("rhStartBtn").addEventListener("click", startGame);
  $("rhDeck").addEventListener("click", draw);
  $("rhNextBtn").addEventListener("click", draw);
  $("rhAgainBtn").addEventListener("click", startGame);
  $("rhChangeSetBtn").addEventListener("click", backToSetup);
  $("rhResetBtn").addEventListener("click", () => {
    if (S.deck.length < 52 && !confirm("สับไพ่ใหม่ทั้งกอง? กฎที่ตั้งไว้จะหายไปด้วย")) return;
    startGame();
  });

  function addRule() {
    const val = $("rhRuleInput").value.trim();
    if (!val) return;
    S.houseRules.push(val);
    renderHouseRules("rhRulesLive");
    $("rhRuleInput").value = "";
    $("rhRuleForm").classList.add("rh-hidden");
  }
  $("rhRuleAdd").addEventListener("click", addRule);
  $("rhRuleInput").addEventListener("keydown", (e) => {
    if (e.key === "Enter") addRule();
  });

  $("rhModeHint").textContent = MODE_HINT[S.mode];
  renderSetPicker();
  renderSetDesc();
  renderStanding();
  renderCardTable();
});
