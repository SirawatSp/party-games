# Flash Quiz ชุดใหม่ รอบแรก 100 ข้อ

ฐานบน master: `62e4ca1` มี 1,630 ข้อ เพิ่มเป็น 1,730 ข้อ เป้าหมาย 2,500 ยังเหลือ 770 ข้อ
ไม่ได้เพิ่มหรือเปลี่ยนคำถามเดิม 1,630 ข้อ

## หมวด

บ้านและงานออกแบบ 25 · เข้าครัว 25 · ถ่ายภาพ 25 · ฟังและเล่นดนตรี 25

เพิ่มครั้งละ 25 ข้อผ่าน `add-entries.js` พร้อม dry-run และตรวจหลังเพิ่ม
ตรวจคำสำคัญทั้งคำถามและคำตอบก่อนร่าง อ่านรายการดนตรีเดิมเพื่อจับการสะกดภาษาอังกฤษ

## การตัดสิน REVIEW และข้อซ้ำ

- “ไขมัน”: อูฐสะสมอะไรในโหนก กับของเหลวที่ใช้ปรุงเป็ดกงฟี เป็นคนละข้อเท็จจริง เก็บไว้
- “น้ำ”: ธาตุของสควอร์เทิล กับของเหลวในอ่างซูวี เป็นคนละข้อเท็จจริง เก็บไว้
- crescendo: ข้อใหม่เป็นเพียงการสะกดไทยของเรื่องเดิม จึงตัดแล้วแทนด้วย ritardando
- a cappella: ข้อใหม่ถามกลับด้านเรื่องเดิม จึงตัดแล้วแทนด้วยเทรโมโลบนเครื่องสาย
- หลังเปลี่ยนเหลือ REVIEW ใหม่ 2 รายการตามข้างต้น ไม่มี ERROR

## แหล่งที่ตรวจประกอบการร่าง

- [ศัพท์โครงสร้างและสถาปัตยกรรม มหาวิทยาลัยอิลลินอยส์](https://iopn.library.illinois.edu/pressbooks/designbuiltenvironment/back-matter/glossary/)
- [ชนิดแบบสถาปัตยกรรม พิพิธภัณฑ์ Sir John Soane](https://www.soane.org/understanding-architectural-drawings)
- [เทอร์ราซโซ ฐานข้อมูลวัสดุ Museum of Fine Arts](https://cameo.mfa.org/wiki/Terrazzo)
- [วิธีปรุงอาหาร UC Davis](https://campusrecreation.ucdavis.edu/sites/g/files/dgvnsk6556/files/inline-files/Cooking%20Methods.pdf)
- [รูส์ Michelin Guide](https://guide.michelin.com/en/article/dining-in/what-is-roux)
- [กานาช Good Food](https://tollbit.bbcgoodfood.com/glossary/chocolate-ganache-glossary)
- [พานาคอตตา Cambridge Dictionary](https://dictionary.cambridge.org/dictionary/english/pannacotta?topic=puddings-desserts-and-ices)
- [โนริ Harvard Nutrition Source](https://nutritionsource.hsph.harvard.edu/seaweed/)
- [ศัพท์ภาพถ่าย Nikon](https://www.nikonusa.com/learn-and-explore/photography-glossary)
- [โบเก้ Nikon](https://www.nikonusa.com/learn-and-explore/c/tips-and-techniques/bokeh-for-beginners)
- [รูรับแสง Nikon](https://www.nikonusa.com/learn-and-explore/c/tips-and-techniques/what-is-aperture)
- [ระยะชัดลึก Canon](https://files.canon-europe.com/files/webcontent/rf-lens-world/knowledge/depth-of-field/index.html)
- [ศัพท์ภาพถ่าย Adobe](https://www.adobe.com/uk/creativecloud/photography/discover/photography-terms.html)
- [รอว์และเจเพ็ก Adobe](https://www.adobe.com/creativecloud/photography/discover/raw-vs-jpeg.html)
- [โครงสร้างเพลง Fender](https://www.fender.com/articles/techniques/parts-of-a-song-keep-it-straight)
- [ส่วนจบเพลง Open University](https://www.open.edu/openlearn/history-the-arts/listening-form-popular-music/content-section-12)
- [ศัพท์ดนตรี Khan Academy](https://www.khanacademy.org/humanities/music/music-basics2/reading-music2/a/glossary-of-musical-terms)
- [ริทาร์ดันโด Cambridge Dictionary](https://dictionary.cambridge.org/dictionary/english/ritardando)

## การตรวจ

`check-content.js flashquiz --new 100` ผ่าน โดยตัดสิน REVIEW ครบทั้ง 2 รายการ
`ship.js` ผ่านครบ 25 คลัง สร้างจำนวนใหม่และเลื่อน cache เป็น v96
`node --check js/flashquiz.js` ผ่าน
การเรียก smoke test ครั้งแรกยังรันไม่ได้ เพราะไม่มี Chromium ที่ Playwright ต้องการ
ผลตรวจเบราว์เซอร์และการส่งขึ้น master รายงานในข้อความส่งมอบตามที่ทำได้จริง

ทดสอบตัวควบคุมด้วย DOM จำลองผ่าน: ทุกหมวดมีโจทย์ ชุดใหม่ 100 ชุดเดิม 1,630 ตัวกรองมีผลทั้งสองโหมด และเริ่ม/เฉลย/จบรอบดวลได้ ตรวจเปรียบเทียบกับฐานแล้วโจทย์เดิมเหมือนเดิมทุกฟิลด์ ทดสอบ cache ที่มีอยู่ผ่าน การดาวน์โหลด Chromium เพิ่มได้รับไฟล์ไม่สมบูรณ์ จึงยังนับ smoke test เบราว์เซอร์อัตโนมัติว่าไม่ผ่านการรัน
