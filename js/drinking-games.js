document.addEventListener("DOMContentLoaded", () => {
  const dgList = document.getElementById("dgList");
  const equipFilters = document.getElementById("equipFilters");

  const EQUIP_LABEL = {
    none: "ไม่ใช้อุปกรณ์", cards: "ไพ่", bottle: "ขวด",
    dice: "ลูกเต๋า", paper: "กระดาษปากกา", cup: "แก้ว", headphone: "หูฟัง"
  };

  let activeEq = "all";

  function render() {
    dgList.innerHTML = "";
    const list = DRINKING_GAMES.filter(
      (g) => activeEq === "all" || g.equipment.includes(activeEq)
    );
    list.forEach((g) => {
      const item = document.createElement("div");
      item.className = "dg-item";
      const equipText = g.equipment.map((e) => EQUIP_LABEL[e] || e).join(" · ");
      item.innerHTML =
        '<div class="row">' +
          '<div>' +
            '<h3>' + g.name + '</h3>' +
            '<div class="tagline">' + g.tagline + '</div>' +
          '</div>' +
          '<div style="text-align:right; display:flex; align-items:center; gap:12px;">' +
            '<div class="meta">' + g.players + '<br>' + equipText + '</div>' +
            '<span class="caret">⌄</span>' +
          '</div>' +
        '</div>' +
        '<div class="body">' +
          '<ol>' + g.rules.map((r) => "<li>" + r + "</li>").join("") + '</ol>' +
          '<div class="penalty">🍺 บทลงโทษ: ' + g.penalty + '</div>' +
        '</div>';
      item.addEventListener("click", () => item.classList.toggle("open"));
      dgList.appendChild(item);
    });
  }

  equipFilters.querySelectorAll(".tag").forEach((tagEl) => {
    tagEl.addEventListener("click", () => {
      equipFilters.querySelectorAll(".tag").forEach((t) => t.classList.remove("active"));
      tagEl.classList.add("active");
      activeEq = tagEl.dataset.eq;
      render();
    });
  });

  render();
});
