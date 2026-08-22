# Panoramax web viewer (vendored)

- แพ็กเกจ: `@panoramax/web-viewer` เวอร์ชัน **5.2.0**
- สัญญาอนุญาต: **MIT** (ดู `LICENSE` ในโฟลเดอร์นี้ — Copyright (c) 2022 Adrien Pavie)
- ไฟล์: `panoramax-photoviewer-5.2.0.js` คือ `build/cjs/index_photoviewer.js` จากแพ็กเกจ ไม่ได้แก้ไขอะไร
- ขนาด ~1.56 MB (บีบ gzip แล้วเหลือ ~490 KB) มี Photo Sphere Viewer 5.15.1 รวมอยู่ในไฟล์เดียว

## ทำไมถึงเก็บไฟล์ไว้เอง แทนที่จะโหลดจาก CDN

- โหลดจากโดเมนเดียวกับเว็บ ไม่ต้องพึ่ง CDN ภายนอกที่อาจถูกบล็อก
- ล็อกเวอร์ชันแน่นอน อัปเดตเมื่อเราตั้งใจอัปเดตเท่านั้น

## ข้อควรรู้

- ไฟล์นี้โหลดแบบ lazy เฉพาะตอนกดเล่นเกม "ทายถนน" เท่านั้น และ **ไม่ได้อยู่ใน precache ของ
  service worker** เพราะเกมนี้ต้องต่อเน็ตอยู่แล้ว จะได้ไม่ถ่วงคนที่ไม่ได้เล่นเกมนี้
- ใน CSS ที่ตัว viewer ฉีดเข้ามา มีลิงก์ฟอนต์ไปที่ jsdelivr อยู่ ถ้าโหลดไม่ได้จะตกไปใช้ฟอนต์ระบบ
  ไม่กระทบการเล่น
- โค้ดส่วน editor/ป้ายจราจรในบันเดิลมีการเรียก `presets.panoramax.fr` แต่เกมนี้ปิด widgets
  จึงไม่เข้าเส้นทางนั้น

## วิธีอัปเดตเวอร์ชัน

```sh
npm pack @panoramax/web-viewer@<version>
tar xzf panoramax-web-viewer-<version>.tgz
cp package/build/cjs/index_photoviewer.js vendor/panoramax/panoramax-photoviewer-<version>.js
cp package/LICENSE vendor/panoramax/LICENSE
```

แล้วแก้ชื่อไฟล์ที่ `js/street-scene.js` อ้างถึง (ตัวแปร `VIEWER_SRC`)
