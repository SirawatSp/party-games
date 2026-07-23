// Service Worker สำหรับเล่นออฟไลน์ได้ทั้งเว็บ (เก็บ cache ทุกหน้า/สคริปต์/คลังโจทย์ไว้ในเครื่อง)
// เปิดเว็บครั้งแรกตอนมีเน็ต ระบบจะโหลดเก็บไว้ให้อัตโนมัติ ครั้งต่อไปเปิดได้แม้ไม่มีเน็ตเลย
// อัปเดตเนื้อหาเว็บทีไร ให้เปลี่ยนเลข CACHE_VERSION เพื่อบังคับดาวน์โหลดของใหม่ทับของเก่า
const CACHE_VERSION = "party-games-v1";

const PRECACHE_URLS = [
  "./",
  "index.html",
  "manifest.json",
  "animalrace.html",
  "category.html",
  "charades.html",
  "crocodile.html",
  "drinking-games.html",
  "flashquiz.html",
  "guess-number.html",
  "insider.html",
  "matchup.html",
  "personal-facts.html",
  "psychology.html",
  "tapple.html",
  "taxi.html",
  "tenbut.html",
  "thisorthat.html",
  "trivia.html",
  "wavelength.html",
  "who-is-most.html",
  "who-ordered.html",
  "css/style.css",
  "js/animalrace.js",
  "js/category.js",
  "js/charades.js",
  "js/crocodile.js",
  "js/drinking-games.js",
  "js/flashquiz.js",
  "js/guess-number.js",
  "js/insider.js",
  "js/main.js",
  "js/matchup.js",
  "js/personal-facts.js",
  "js/psychology.js",
  "js/tapple.js",
  "js/taxi.js",
  "js/tenbut.js",
  "js/thisorthat.js",
  "js/wavelength.js",
  "js/who-is-most.js",
  "js/who-ordered.js",
  "js/world-trivia.js",
  "data/architects.js",
  "data/category-game.js",
  "data/charades.js",
  "data/drinking-games.js",
  "data/flashquiz.js",
  "data/game-counts.js",
  "data/guess-number.js",
  "data/insider.js",
  "data/matchup.js",
  "data/personal-facts.js",
  "data/psychology.js",
  "data/race-animals.js",
  "data/shes-a-10-but.js",
  "data/tapple-categories-en.js",
  "data/tapple-categories.js",
  "data/taxi.js",
  "data/thisorthat.js",
  "data/wavelength.js",
  "data/who-is-most.js",
  "data/world-trivia-qa.js",
  "data/world-trivia.js",
  "assets/logo.png",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE_VERSION)
      .then((cache) => cache.addAll(PRECACHE_URLS))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE_VERSION).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;
  // ข้ามคำขอข้ามโดเมน (เช่นฟอนต์จาก Google Fonts) ให้เบราว์เซอร์จัดการตามปกติ
  // ตอนออฟไลน์ฟอนต์จะโหลดไม่ได้ก็แค่ fallback ไปฟอนต์ระบบ ไม่กระทบการเล่น
  if (new URL(req.url).origin !== self.location.origin) return;

  event.respondWith(
    caches.match(req).then((cached) => {
      const network = fetch(req)
        .then((res) => {
          if (res && res.status === 200) {
            const clone = res.clone();
            caches.open(CACHE_VERSION).then((cache) => cache.put(req, clone));
          }
          return res;
        })
        .catch(() => cached);
      // cache-first: มีของเก่าให้ใช้ก่อนเลยเพื่อความเร็ว/ออฟไลน์ พร้อมอัปเดตของใหม่เงียบ ๆ เบื้องหลัง
      return cached || network;
    })
  );
});
