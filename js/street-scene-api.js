// ตัวกลางคุยกับ API ของ Panoramax + เกณฑ์ตรวจฉาก
// ใช้ร่วมกันทั้งเกม "ทายถนน" และหน้า street-scene-curator.html
// จะได้มั่นใจว่าฉากที่คัดเก็บกับฉากที่สุ่มสด ผ่านเกณฑ์ชุดเดียวกันเป๊ะ ๆ
//
// หมายเหตุเรื่องรูปแบบข้อมูล: Panoramax คืนข้อมูลแบบ STAC ซึ่งมีการย้าย/เพิ่มชื่อฟิลด์
// ได้ตามเวอร์ชัน โค้ดนี้จึงอ่านค่าจากหลายตำแหน่งที่เป็นไปได้ แล้วเลือกอันแรกที่เจอ
// ถ้าฟิลด์ไหนหาไม่เจอเลยจะถือว่าฉากนั้นใช้ไม่ได้ ดีกว่าเอาฉากที่ไม่รู้ที่มาไปให้เล่น

var SS_MIN_YEAR = 2008; // ก่อนหน้านี้แทบไม่มีภาพถนนอยู่แล้ว
var SS_MIN_SEQ_PICTURES = 3; // sequence สั้นกว่านี้เดินดูรอบ ๆ ไม่ได้เรื่อง

function ssEndpoint() {
  return (typeof STREET_SCENE_CONFIG !== "undefined" && STREET_SCENE_CONFIG.endpoint) || "https://api.panoramax.xyz/api";
}

// อ่านค่าจาก object ตามเส้นทางที่คั่นด้วยจุด คืน undefined ถ้าเส้นทางขาด
function ssDig(obj, path) {
  var cur = obj;
  var parts = path.split(".");
  for (var i = 0; i < parts.length; i++) {
    if (cur === null || typeof cur !== "object") return undefined;
    cur = cur[parts[i]];
  }
  return cur;
}

function ssFirst(obj, paths) {
  for (var i = 0; i < paths.length; i++) {
    var v = ssDig(obj, paths[i]);
    if (v !== undefined && v !== null && v !== "") return v;
  }
  return undefined;
}

// ---- เรียก API ----------------------------------------------------------

function ssFetchJson(url, timeoutMs) {
  var ctrl = typeof AbortController !== "undefined" ? new AbortController() : null;
  var timer = null;
  if (ctrl) timer = setTimeout(function () { ctrl.abort(); }, timeoutMs || 12000);
  return fetch(url, ctrl ? { signal: ctrl.signal } : undefined)
    .then(function (res) {
      if (!res.ok) throw new Error("HTTP " + res.status);
      return res.json();
    })
    .then(function (json) {
      if (timer) clearTimeout(timer);
      return json;
    })
    .catch(function (err) {
      if (timer) clearTimeout(timer);
      throw err;
    });
}

// ค้นภาพ 360° ในกรอบพิกัดที่กำหนด (bbox = [minLon, minLat, maxLon, maxLat])
function ssSearch(bbox, limit) {
  var url =
    ssEndpoint() +
    "/search?filter=" +
    encodeURIComponent("field_of_view = 360") +
    "&filter-lang=cql2-text&limit=" +
    (limit || 20);
  if (bbox && bbox.length === 4) url += "&bbox=" + bbox.join(",");
  return ssFetchJson(url).then(function (json) {
    return (json && json.features) || [];
  });
}

// นับจำนวนภาพใน sequence เพื่อดูว่าเดินดูรอบ ๆ ได้ไหม
function ssSequenceSize(collectionId) {
  var url = ssEndpoint() + "/collections/" + encodeURIComponent(collectionId) + "/items?limit=" + (SS_MIN_SEQ_PICTURES + 2);
  return ssFetchJson(url)
    .then(function (json) {
      return ((json && json.features) || []).length;
    })
    .catch(function () {
      return -1; // เช็กไม่ได้ ไม่ใช่ว่าไม่ผ่าน — ให้ผู้เรียกตัดสินเอง
    });
}

// ---- แกะข้อมูลออกจาก STAC item -----------------------------------------

function ssFieldOfView(item) {
  var v = ssFirst(item, [
    "properties.field_of_view",
    "properties.pers:interior_orientation.field_of_view",
    "properties.panoramax:field_of_view",
    "properties.exif.field_of_view",
  ]);
  return v === undefined ? undefined : Number(v);
}

function ssStatus(item) {
  return ssFirst(item, ["properties.geovisio:status", "properties.status", "properties.panoramax:status"]);
}

function ssAuthor(item) {
  var providers = ssDig(item, "providers");
  if (Array.isArray(providers)) {
    // ตาม STAC ผู้ถ่ายคือ provider ที่มี role เป็น producer
    for (var i = 0; i < providers.length; i++) {
      var p = providers[i];
      var roles = (p && p.roles) || [];
      if (roles.indexOf("producer") >= 0 && p.name) return p.name;
    }
    for (var j = 0; j < providers.length; j++) {
      if (providers[j] && providers[j].name) return providers[j].name;
    }
  }
  return ssFirst(item, ["properties.geovisio:producer", "properties.created_by", "properties.operator"]);
}

function ssLicense(item) {
  return ssFirst(item, ["properties.license", "license", "properties.geovisio:license"]);
}

function ssLinkHref(item, rel) {
  var links = ssDig(item, "links");
  if (!Array.isArray(links)) return undefined;
  for (var i = 0; i < links.length; i++) {
    if (links[i] && links[i].rel === rel && links[i].href) return links[i].href;
  }
  return undefined;
}

function ssSourceUrl(item) {
  return (
    ssLinkHref(item, "self") ||
    (item && item.collection && item.id
      ? ssEndpoint() + "/collections/" + item.collection + "/items/" + item.id
      : undefined)
  );
}

function ssImageUrl(item) {
  return ssFirst(item, ["assets.hd.href", "assets.sd.href", "assets.thumb.href"]);
}

function ssCapturedAt(item) {
  return ssFirst(item, ["properties.datetime", "properties.created", "properties.start_datetime"]);
}

// ---- เกณฑ์ตรวจฉาก -------------------------------------------------------

// คืน { ok: true, scene: {...} } หรือ { ok: false, why: "เหตุผล" }
// scene ที่คืนมาใช้รูปแบบเดียวกับที่เก็บใน data/street-scenes.js เป๊ะ ๆ
function ssValidate(item) {
  if (!item || !item.id || !item.collection) return { ok: false, why: "ไม่มี id หรือ collection" };

  var fov = ssFieldOfView(item);
  if (fov !== 360) return { ok: false, why: "ไม่ใช่ภาพ 360° (field_of_view = " + fov + ")" };

  var status = ssStatus(item);
  if (status && String(status).toLowerCase() !== "ready") return { ok: false, why: "สถานะยังไม่ ready (" + status + ")" };

  var coords = ssDig(item, "geometry.coordinates");
  if (!Array.isArray(coords) || coords.length < 2) return { ok: false, why: "ไม่มีพิกัด" };
  var lon = Number(coords[0]);
  var lat = Number(coords[1]);
  if (!isFinite(lon) || !isFinite(lat) || Math.abs(lat) > 90 || Math.abs(lon) > 180) {
    return { ok: false, why: "พิกัดเพี้ยน (" + lat + ", " + lon + ")" };
  }

  var captured = ssCapturedAt(item);
  if (!captured) return { ok: false, why: "ไม่มีวันที่ถ่าย" };
  var t = Date.parse(captured);
  if (isNaN(t)) return { ok: false, why: "วันที่ถ่ายอ่านไม่ออก (" + captured + ")" };
  var year = new Date(t).getUTCFullYear();
  var nowYear = new Date().getUTCFullYear();
  // เจอของจริงมาแล้วว่ามีภาพที่ปีถ่ายเป็นอนาคต ต้องกันไว้
  if (year > nowYear) return { ok: false, why: "วันที่ถ่ายอยู่ในอนาคต (" + year + ")" };
  if (year < SS_MIN_YEAR) return { ok: false, why: "วันที่ถ่ายเก่าเกินจริง (" + year + ")" };

  if (!ssImageUrl(item)) return { ok: false, why: "ไม่มีไฟล์ภาพให้โหลด" };

  var license = ssLicense(item);
  if (!license) return { ok: false, why: "ไม่รู้สัญญาอนุญาต จึงเอามาใช้ไม่ได้" };

  var author = ssAuthor(item);
  if (!author) return { ok: false, why: "ไม่รู้ว่าใครถ่าย จึงให้เครดิตไม่ได้" };

  var country = typeof ssCountryAt === "function" ? ssCountryAt(lat, lon) : null;
  if (!country) return { ok: false, why: "หาไม่เจอว่าพิกัดนี้อยู่ประเทศไหน (อาจอยู่กลางทะเลหรือเป็นดินแดนที่เกมไม่ได้ตั้งชื่อ)" };

  return {
    ok: true,
    scene: {
      id: item.id.slice(0, 8),
      pictureId: item.id,
      sequenceId: item.collection,
      answer: { lat: lat, lon: lon },
      country: country.code,
      provider: "Panoramax",
      author: String(author),
      license: String(license),
      licenseUrl: ssLinkHref(item, "license") || "",
      sourceUrl: ssSourceUrl(item) || "",
      capturedAt: captured,
    },
  };
}
