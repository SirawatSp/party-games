// ดึงรูปของสถานที่มาแสดงในโหมด "สถานที่สำคัญ" ของเกมทายถนน
//
// ทำไมต้องมีรูป: ถ้าบอกชื่อสถานที่ตรง ๆ มันไม่ใช่การทาย เพราะชื่อมีคำตอบอยู่ในตัว
// ("กำแพงเมืองจีน" ก็บอกอยู่แล้วว่าจีน) เกมจึงต้องโชว์รูปโดยไม่บอกชื่อ
//
// ที่มารูป: ภาพหลักของบทความวิกิพีเดียภาษาอังกฤษ ซึ่งเก็บอยู่บน Wikimedia Commons
// รูปพวกนี้เปิดให้ใช้ได้แต่เกือบทั้งหมด "ต้องให้เครดิต" จึงต้องถามชื่อคนถ่าย
// กับสัญญาอนุญาตมาแสดงด้วยเสมอ ไม่ใช่ดึงแต่รูปมาใช้เฉย ๆ
//
// สองคำขอต่อหนึ่งรอบ:
//   1. ถาม en.wikipedia.org ว่าบทความนี้มีภาพหลักชื่อไฟล์อะไร และขอรูปย่อขนาดพอดีจอ
//   2. ถาม commons.wikimedia.org ว่าไฟล์นั้นใครถ่าย สัญญาอนุญาตอะไร
//
// ถ้าขั้นไหนพลาด (ออฟไลน์ โดนบล็อก บทความไม่มีรูป) จะคืน null แล้วเกมไปเล่นต่อ
// ด้วยการ์ดเบาะแสแทน โหมดนี้จึงยังเล่นได้แม้ไม่มีเน็ต ตามที่ออกแบบไว้แต่แรก

var LM_PHOTO_WIDTH = 900;
var LM_PHOTO_TIMEOUT = 9000;
var lmPhotoCache = {};

function lmFetchJson(url) {
  var ctrl = typeof AbortController !== "undefined" ? new AbortController() : null;
  var timer = null;
  if (ctrl) timer = setTimeout(function () { ctrl.abort(); }, LM_PHOTO_TIMEOUT);
  return fetch(url, ctrl ? { signal: ctrl.signal } : undefined)
    .then(function (res) {
      if (timer) clearTimeout(timer);
      if (!res.ok) throw new Error("HTTP " + res.status);
      return res.json();
    })
    .catch(function (err) {
      if (timer) clearTimeout(timer);
      throw err;
    });
}

// ค่าที่ Commons ส่งกลับมาเป็น HTML (มีลิงก์ ตัวหนา ฯลฯ) เอาแต่ข้อความล้วน
function lmPlainText(html) {
  if (!html) return "";
  var div = document.createElement("div");
  div.innerHTML = String(html);
  return (div.textContent || "").replace(/\s+/g, " ").trim();
}

function lmFirstPage(json) {
  var pages = json && json.query && json.query.pages;
  if (!pages) return null;
  var keys = Object.keys(pages);
  return keys.length ? pages[keys[0]] : null;
}

// ขั้นที่ 1: ภาพหลักของบทความ
function lmLeadImage(title) {
  var url =
    "https://en.wikipedia.org/w/api.php?action=query&format=json&origin=*" +
    "&prop=pageimages&piprop=thumbnail%7Cname&pithumbsize=" + LM_PHOTO_WIDTH +
    "&titles=" + encodeURIComponent(title);
  return lmFetchJson(url).then(function (json) {
    var page = lmFirstPage(json);
    if (!page || page.missing !== undefined) throw new Error("ไม่มีบทความชื่อนี้");
    if (!page.thumbnail || !page.thumbnail.source) throw new Error("บทความนี้ไม่มีภาพหลัก");
    return { src: page.thumbnail.source, file: page.pageimage || "" };
  });
}

// ขั้นที่ 2: เครดิตของไฟล์รูป
function lmCredit(file) {
  if (!file) return Promise.resolve(null);
  var url =
    "https://commons.wikimedia.org/w/api.php?action=query&format=json&origin=*" +
    "&prop=imageinfo&iiprop=extmetadata%7Curl&titles=" + encodeURIComponent("File:" + file);
  return lmFetchJson(url)
    .then(function (json) {
      var page = lmFirstPage(json);
      var info = page && page.imageinfo && page.imageinfo[0];
      var meta = (info && info.extmetadata) || {};
      var pick = function (k) { return meta[k] && meta[k].value ? lmPlainText(meta[k].value) : ""; };
      return {
        author: pick("Artist") || pick("Credit") || "ไม่ระบุชื่อผู้ถ่าย",
        license: pick("LicenseShortName") || pick("License") || "ดูที่หน้าต้นทาง",
        licenseUrl: (meta.LicenseUrl && meta.LicenseUrl.value) || "",
        // ลิงก์นี้มีชื่อสถานที่อยู่ในนั้น ห้ามโชว์ตอนกำลังเล่น เอาไว้โชว์ตอนเฉลยเท่านั้น
        sourceUrl: (info && info.descriptionurl) || "",
      };
    })
    .catch(function () {
      return null;
    });
}

// คืน Promise ที่ได้ข้อมูลรูปพร้อมเครดิต หรือ null ถ้าหาไม่ได้
// โหลดรูปให้ขึ้นจอเสร็จก่อนค่อยคืนค่า เกมจะได้ไม่เริ่มจับเวลาตอนภาพยังไม่มา
function lmLoadPhoto(landmark) {
  var title = landmark.wiki || landmark.en;
  if (!title) return Promise.resolve(null);
  if (lmPhotoCache[title] !== undefined) return Promise.resolve(lmPhotoCache[title]);

  return lmLeadImage(title)
    .then(function (img) {
      return lmCredit(img.file).then(function (credit) {
        return new Promise(function (resolve) {
          var probe = new Image();
          var done = false;
          var finish = function (ok) {
            if (done) return;
            done = true;
            resolve(ok ? { src: img.src, credit: credit } : null);
          };
          probe.onload = function () { finish(true); };
          probe.onerror = function () { finish(false); };
          setTimeout(function () { finish(false); }, LM_PHOTO_TIMEOUT);
          probe.src = img.src;
        });
      });
    })
    .catch(function () {
      return null;
    })
    .then(function (result) {
      lmPhotoCache[title] = result;
      return result;
    });
}
