// เครื่องมือใช้แผนที่โลกจาก data/worldmap.js — ฉายพิกัด วาด SVG เลื่อน/ซูม และหาว่าพิกัดอยู่ประเทศไหน
// ใช้ร่วมกันระหว่างเกม "ทายถนน" กับหน้า street-scene-curator.html

// ---- ฉายพิกัด (equirectangular) ----------------------------------------

function wmProject(lat, lon) {
  return {
    x: ((lon + 180) / 360) * WORLD_MAP.width,
    y: ((90 - lat) / 180) * WORLD_MAP.height,
  };
}

function wmUnproject(x, y) {
  return {
    lon: (x / WORLD_MAP.width) * 360 - 180,
    lat: 90 - (y / WORLD_MAP.height) * 180,
  };
}

// ระยะทางวงกลมใหญ่เป็นกิโลเมตร
function wmHaversine(lat1, lon1, lat2, lon2) {
  var R = 6371;
  var toRad = Math.PI / 180;
  var dLat = (lat2 - lat1) * toRad;
  var dLon = (lon2 - lon1) * toRad;
  var a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * toRad) * Math.cos(lat2 * toRad) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  return 2 * R * Math.asin(Math.min(1, Math.sqrt(a)));
}

function wmByCode(code) {
  for (var i = 0; i < WORLD_MAP.countries.length; i++) {
    if (WORLD_MAP.countries[i].code === code) return WORLD_MAP.countries[i];
  }
  return null;
}

// ---- หาว่าพิกัดตกอยู่ในประเทศไหน ---------------------------------------
// ใช้ Path2D + isPointInPath ของเบราว์เซอร์ ไม่ต้องแกะเส้น path เอง
// ใช้กฎ evenodd เพื่อให้ประเทศที่มีรู (enclave) คิดถูก ไม่ต้องสนทิศการวนของเส้น

var wmCtx = null;
var wmPaths = null;

function wmEnsurePaths() {
  if (wmPaths) return true;
  if (typeof document === "undefined" || typeof Path2D === "undefined") return false;
  var cv = document.createElement("canvas");
  cv.width = 1;
  cv.height = 1;
  wmCtx = cv.getContext("2d");
  if (!wmCtx) return false;
  wmPaths = WORLD_MAP.countries.map(function (c) {
    return { country: c, path: new Path2D(c.d) };
  });
  return true;
}

function wmHitExact(x, y) {
  if (!wmEnsurePaths()) return null;
  for (var i = 0; i < wmPaths.length; i++) {
    if (wmCtx.isPointInPath(wmPaths[i].path, x, y, "evenodd")) return wmPaths[i].country;
  }
  return null;
}

// พิกัดริมทะเลอาจหลุดออกนอกรูปร่างประเทศได้ เพราะแผนที่ 1:110m ตัดรายละเอียดชายฝั่งทิ้ง
// ถ้าจุดตรง ๆ ไม่โดนใคร ให้ลองขยับออกไปรอบ ๆ ทีละนิดก่อนจะยอมแพ้
function ssCountryAt(lat, lon) {
  var p = wmProject(lat, lon);
  var hit = wmHitExact(p.x, p.y);
  if (hit) return hit;
  var steps = [2, 5, 9]; // หน่วยบนผืนผ้าใบ 2000 หน่วย ≈ 22 / 55 / 100 กม.
  for (var s = 0; s < steps.length; s++) {
    var r = steps[s];
    for (var a = 0; a < 8; a++) {
      var ang = (a * Math.PI) / 4;
      var near = wmHitExact(p.x + Math.cos(ang) * r, p.y + Math.sin(ang) * r);
      if (near) return near;
    }
  }
  return null;
}

// ---- วาดแผนที่ ----------------------------------------------------------

function wmEscape(s) {
  return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

// คืนสตริง SVG ทั้งก้อน (วาดครั้งเดียวแล้วเก็บไว้ ไม่ต้องสร้างใหม่ทุกรอบ)
function wmSvgMarkup() {
  var parts = [];
  parts.push('<g class="wm-filler">');
  WORLD_MAP.filler.forEach(function (d) {
    parts.push('<path d="' + d + '"/>');
  });
  parts.push("</g>");
  parts.push('<g class="wm-countries">');
  WORLD_MAP.countries.forEach(function (c) {
    parts.push('<path data-code="' + c.code + '" d="' + c.d + '"><title>' + wmEscape(c.th) + "</title></path>");
  });
  parts.push("</g>");
  return parts.join("");
}

// ---- แผนที่แบบกดปักหมุด เลื่อนและซูมได้ ---------------------------------
//
// ค่าเริ่มต้นตัดขอบขั้วโลกที่ว่างเปล่าออก (ละติจูด 83 ถึง -58) แผนที่จะได้ไม่แบนจนกดยาก
// การกดปักหมุดแยกจากการลากด้วยระยะนิ้วที่ขยับ ถ้าขยับเกิน 6 พิกเซลถือว่าตั้งใจลาก ไม่ใช่กด

var WM_VIEW_TOP = 38.9; // (90 - 83) / 180 * 1000
var WM_VIEW_BOTTOM = 822.2; // (90 + 58) / 180 * 1000
var WM_MIN_W = 60; // ซูมเข้าได้ลึกสุด

function wmCreateMap(svg, opts) {
  opts = opts || {};
  var view = { x: 0, y: WM_VIEW_TOP, w: WORLD_MAP.width, h: WM_VIEW_BOTTOM - WM_VIEW_TOP };
  var home = { x: view.x, y: view.y, w: view.w, h: view.h };

  svg.setAttribute("viewBox", "0 0 " + WORLD_MAP.width + " " + WORLD_MAP.height);
  svg.innerHTML =
    wmSvgMarkup() +
    '<g class="wm-marks">' +
    '<path class="wm-line wm-off" d=""/>' +
    '<g class="wm-pin wm-pin-guess wm-off"><circle r="9"/><circle class="wm-pin-dot" r="3.4"/></g>' +
    '<g class="wm-pin wm-pin-answer wm-off"><circle r="9"/><circle class="wm-pin-dot" r="3.4"/></g>' +
    "</g>";

  var line = svg.querySelector(".wm-line");
  var guessPin = svg.querySelector(".wm-pin-guess");
  var answerPin = svg.querySelector(".wm-pin-answer");
  var highlighted = null;

  function apply() {
    svg.setAttribute("viewBox", view.x + " " + view.y + " " + view.w + " " + view.h);
    // หมุดกับเส้นต้องคงขนาดบนจอเท่าเดิมไม่ว่าจะซูมแค่ไหน
    var k = view.w / WORLD_MAP.width;
    svg.style.setProperty("--wm-k", k);
    [guessPin, answerPin].forEach(function (pin) {
      var lat = pin.getAttribute("data-lat");
      if (lat === null) return;
      var p = wmProject(Number(lat), Number(pin.getAttribute("data-lon")));
      pin.setAttribute("transform", "translate(" + p.x + " " + p.y + ") scale(" + k + ")");
    });
  }

  function clamp() {
    if (view.w > WORLD_MAP.width) view.w = WORLD_MAP.width;
    if (view.w < WM_MIN_W) view.w = WM_MIN_W;
    view.h = view.w * (home.h / home.w);
    if (view.h > WORLD_MAP.height) {
      view.h = WORLD_MAP.height;
      view.w = view.h * (home.w / home.h);
    }
    view.x = Math.max(0, Math.min(WORLD_MAP.width - view.w, view.x));
    view.y = Math.max(0, Math.min(WORLD_MAP.height - view.h, view.y));
  }

  function zoomAt(factor, clientX, clientY) {
    var r = svg.getBoundingClientRect();
    var fx = r.width ? (clientX - r.left) / r.width : 0.5;
    var fy = r.height ? (clientY - r.top) / r.height : 0.5;
    var ax = view.x + fx * view.w;
    var ay = view.y + fy * view.h;
    view.w = view.w * factor;
    clamp();
    view.x = ax - fx * view.w;
    view.y = ay - fy * view.h;
    clamp();
    apply();
  }

  function toUser(clientX, clientY) {
    var r = svg.getBoundingClientRect();
    if (!r.width || !r.height) return null;
    return {
      x: view.x + ((clientX - r.left) / r.width) * view.w,
      y: view.y + ((clientY - r.top) / r.height) * view.h,
    };
  }

  // ---- การกด/ลาก/หนีบ ----
  var pointers = {};
  var dragged = 0;
  var downAt = 0;
  var pinchStart = null;
  var locked = false;

  function pointerList() {
    return Object.keys(pointers).map(function (k) {
      return pointers[k];
    });
  }

  svg.addEventListener("pointerdown", function (e) {
    if (locked) return;
    pointers[e.pointerId] = { x: e.clientX, y: e.clientY };
    if (Object.keys(pointers).length === 1) {
      dragged = 0;
      downAt = Date.now();
    } else if (Object.keys(pointers).length === 2) {
      var l = pointerList();
      pinchStart = { dist: Math.hypot(l[0].x - l[1].x, l[0].y - l[1].y), w: view.w };
    }
    if (svg.setPointerCapture) {
      try { svg.setPointerCapture(e.pointerId); } catch (err) {}
    }
  });

  svg.addEventListener("pointermove", function (e) {
    if (locked || !pointers[e.pointerId]) return;
    var prev = pointers[e.pointerId];
    var dx = e.clientX - prev.x;
    var dy = e.clientY - prev.y;
    pointers[e.pointerId] = { x: e.clientX, y: e.clientY };
    var n = Object.keys(pointers).length;
    if (n === 1) {
      dragged += Math.abs(dx) + Math.abs(dy);
      var r = svg.getBoundingClientRect();
      if (!r.width) return;
      view.x -= (dx / r.width) * view.w;
      view.y -= (dy / r.height) * view.h;
      clamp();
      apply();
    } else if (n === 2 && pinchStart) {
      dragged += 20;
      var l = pointerList();
      var dist = Math.hypot(l[0].x - l[1].x, l[0].y - l[1].y);
      if (dist > 4 && pinchStart.dist > 4) {
        var mid = { x: (l[0].x + l[1].x) / 2, y: (l[0].y + l[1].y) / 2 };
        var want = pinchStart.w * (pinchStart.dist / dist);
        zoomAt(want / view.w, mid.x, mid.y);
      }
    }
  });

  function endPointer(e) {
    if (!pointers[e.pointerId]) return;
    var wasSingle = Object.keys(pointers).length === 1;
    delete pointers[e.pointerId];
    if (Object.keys(pointers).length < 2) pinchStart = null;
    if (locked || !wasSingle) return;
    if (dragged < 6 && Date.now() - downAt < 600 && opts.onPick) {
      var u = toUser(e.clientX, e.clientY);
      if (u) {
        var ll = wmUnproject(u.x, u.y);
        opts.onPick(ll.lat, ll.lon);
      }
    }
  }

  svg.addEventListener("pointerup", endPointer);
  svg.addEventListener("pointercancel", function (e) {
    delete pointers[e.pointerId];
    pinchStart = null;
  });

  svg.addEventListener(
    "wheel",
    function (e) {
      if (locked) return;
      e.preventDefault();
      zoomAt(e.deltaY > 0 ? 1.22 : 1 / 1.22, e.clientX, e.clientY);
    },
    { passive: false }
  );

  function setPin(pin, lat, lon) {
    pin.setAttribute("data-lat", lat);
    pin.setAttribute("data-lon", lon);
    pin.classList.remove("wm-off");
    apply();
  }

  var api = {
    guess: function (lat, lon) {
      setPin(guessPin, lat, lon);
    },
    answer: function (lat, lon) {
      setPin(answerPin, lat, lon);
    },
    // ลากเส้นเชื่อมหมุดที่ทายกับหมุดคำตอบ
    connect: function (aLat, aLon, bLat, bLon) {
      var a = wmProject(aLat, aLon);
      var b = wmProject(bLat, bLon);
      line.setAttribute("d", "M" + a.x + " " + a.y + "L" + b.x + " " + b.y);
      line.classList.remove("wm-off");
    },
    highlight: function (code) {
      if (highlighted) highlighted.classList.remove("wm-hit");
      highlighted = code ? svg.querySelector('path[data-code="' + code + '"]') : null;
      if (highlighted) highlighted.classList.add("wm-hit");
    },
    // ซูมให้เห็นทั้งสองจุดพอดี ๆ
    fit: function (points, pad) {
      if (!points.length) return;
      var xs = [];
      var ys = [];
      points.forEach(function (p) {
        var q = wmProject(p.lat, p.lon);
        xs.push(q.x);
        ys.push(q.y);
      });
      var minX = Math.min.apply(null, xs);
      var maxX = Math.max.apply(null, xs);
      var minY = Math.min.apply(null, ys);
      var maxY = Math.max.apply(null, ys);
      var m = pad === undefined ? 140 : pad;
      var w = Math.max(maxX - minX + m * 2, WM_MIN_W);
      var cx = (minX + maxX) / 2;
      var cy = (minY + maxY) / 2;
      view.w = w;
      clamp();
      // ถ้าสูงไม่พอครอบทั้งสองจุด ให้ถอยออกอีก
      while (view.h < maxY - minY + m && view.w < WORLD_MAP.width) {
        view.w = Math.min(WORLD_MAP.width, view.w * 1.25);
        clamp();
      }
      view.x = cx - view.w / 2;
      view.y = cy - view.h / 2;
      clamp();
      apply();
    },
    reset: function () {
      view.x = home.x;
      view.y = home.y;
      view.w = home.w;
      clamp();
      apply();
    },
    clear: function () {
      [guessPin, answerPin].forEach(function (p) {
        p.classList.add("wm-off");
        p.removeAttribute("data-lat");
        p.removeAttribute("data-lon");
      });
      line.classList.add("wm-off");
      line.setAttribute("d", "");
      api.highlight(null);
    },
    lock: function (on) {
      locked = !!on;
    },
    zoomBy: function (factor) {
      var r = svg.getBoundingClientRect();
      zoomAt(factor, r.left + r.width / 2, r.top + r.height / 2);
    },
  };

  apply();
  return api;
}
