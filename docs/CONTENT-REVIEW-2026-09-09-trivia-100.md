# รายงานตรวจเนื้อหา Trivia 100 ข้อ — 2026-09-09

## ขอบเขตและสมดุลหมวด

- เพิ่ม 100 ข้อในโหมดจริงหรือมั่ว พร้อมเฉลยและคำอธิบายทุกข้อ
- ธรรมชาติ 34 ข้อ: 49 → 83
- ประวัติศาสตร์ 33 ข้อ: 49 → 82
- สถิติโลก 33 ข้อ: 49 → 82
- หมวดที่มีอยู่แล้วมากกว่าเพื่อนอย่างกฎหมายและวัฒนธรรมไม่ได้เพิ่มในรอบนี้
- สัดส่วนคำตอบ: จริง 57 ข้อ · มั่ว 43 ข้อ
- เพิ่มข้อมูลเป็นชุดละ 25 ผ่าน `scripts/add-entries.js` เท่านั้น

## แหล่งตรวจข้อเท็จจริง

ใช้แหล่งต้นทางและหน่วยงานเจ้าของข้อมูลเป็นหลัก แล้วเรียบเรียงข้อความภาษาไทยใหม่:

- [Solar System Facts — NASA](https://science.nasa.gov/solar-system/solar-system-facts/)
- [Moons: Facts — NASA](https://science.nasa.gov/solar-system/moons/facts/)
- [Six Fascinating Animals — Smithsonian](https://www.si.edu/stories/peek-six-animals-smithsonian)
- [A Brief History of the Smithsonian Institution](https://www.si.edu/newsdesk/factsheets/brief-history-smithsonian-institution)
- [Recognize the Unusual — Smithsonian Lemelson Center](https://invention.si.edu/invention-stories/recognize-unusual)
- [Thomas Edison's Inventive Life — Smithsonian Lemelson Center](https://invention.si.edu/invention-stories/thomas-edisons-inventive-life)
- [Sputnik and the Dawn of the Space Age — NASA History](https://history.nasa.gov/wp-content/uploads/static/history/sputnik.html)
- [The Origins of Sound Recording — U.S. National Park Service](https://www.nps.gov/edis/learn/historyculture/origins-of-sound-recording.htm)
- [Invention Timelines — U.S. National Park Service](https://www.nps.gov/alpo/learn/historyculture/inventions.htm)
- [Where the Web Was Born — CERN](https://home.cern/science/computing/the-birth-of-the-web/where-web-was-born/)
- [Post-it Notes origin — 3M](https://www.3m.com/3M/en_US/consumer-us/stories/full-story/?storyid=e9f444d3-a5c5-46f1-a34b-082ff275aa7d)
- [Best records of 2025 — Guinness World Records](https://www.guinnessworldrecords.com/news/2025/12/best-records-of-2025-feats-of-strength-massive-food-and-one-iconic-doggy-playdate)
- [Tallest domino structure — Guinness World Records](https://www.guinnessworldrecords.com/news/2025/6/youtuber-hevesh5-assembles-crack-team-of-domino-stackers-to-build-worlds-tallest-tower)
- [Deepest underwater model photoshoot — Guinness World Records](https://www.guinnessworldrecords.com/news/2025/1/photographer-and-model-dive-to-dangerous-depths-for-most-beautiful-photoshoot-yet)
- [Longest fingernails — Guinness World Records](https://www.guinnessworldrecords.com/news/2024/1/how-do-you-go-to-the-bathroom-with-the-worlds-longest-fingernails-763062)
- [Largest pizza — Guinness World Records](https://www.guinnessworldrecords.com/news/2023/1/youtuber-airrack-claims-slice-of-history-with-worlds-largest-pizza-735637)

## ผลตรวจซ้ำและ REVIEW

- ตรวจคำหลักของหัวข้อเสนอเทียบ `data/world-trivia.js` ก่อนเขียนแต่ละชุด และตัดหัวข้อที่ชนของเดิม เช่น ดาวศุกร์ร้อนที่สุด, กล้วยเป็นเบอร์รี, วอมแบตถ่ายมูลทรงลูกบาศก์, ออกซ์ฟอร์ดเก่ากว่าแอซเท็ก และเว็บแคมเฝ้าหม้อกาแฟ
- `node scripts/check-content.js trivia --new 100`: ผ่าน ไม่มี ERROR
- REVIEW: 0 คู่ จึงไม่มีคู่ที่ต้องลบหรือเขียนทดแทน
- ข้อความซ้ำตรงตัวหรือหลังปรับรูปคำ: 0

## ผลทดสอบ

- ข้อมูลใหม่ 100/100 ข้อมีคำอธิบายยาวผ่านเกณฑ์ และชื่อข้อความไม่ซ้ำ
- การสุ่มข้อมูลใหม่ครบวงได้ 100/100 ข้อโดยไม่ซ้ำก่อนครบรอบ
- ทดลองเฉลยแล้วแสดงคำอธิบายของข้อนั้นตรงกัน และตัวกรองหมวดธรรมชาติทำงาน
- ตรวจหน้าเว็บทั้งหมดผ่าน 43/43 รายการ ไม่มี JavaScript error
- อัปเดตป้ายหน้าแรกเป็น Trivia 816 ข้อรวมสองโหมด และแคชออฟไลน์เป็น `party-games-v56`
