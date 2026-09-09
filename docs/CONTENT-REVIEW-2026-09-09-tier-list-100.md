# รายงานตรวจเนื้อหา Tier Talk 100 หัวข้อ — 2026-09-09

## ขอบเขต

- เพิ่มเกม `Tier Talk — จัดเทียร์ให้รู้ใจ` พร้อมหัวข้อจัดอันดับ 100 ชุด
- ทุกหัวข้อมีตัวเลือก 6 อย่างและคำถามชวนคุยต่อ
- แบ่งเป็น 10 หมวด หมวดละ 10 หัวข้อ: เดต, ของกิน, เที่ยว, วงเพื่อน, ชีวิตประจำวัน, บันเทิง, ค่านิยม, ความทรงจำ, สมมติเล่น และใช้เงิน
- เพิ่มข้อมูลผ่าน `scripts/add-entries.js` เท่านั้น

## แหล่งแนวคิด

ใช้แหล่งต่อไปนี้เพื่อศึกษาว่าหัวข้อแบบใดกระตุ้นการแสดงความคิดเห็น การอธิบายเหตุผล และการเปิดเผยตัวตนระหว่างผู้เล่นได้ดี โดยเขียนโจทย์ภาษาไทยใหม่ทั้งหมด ไม่คัดลอกข้อความจากแหล่ง:

- [36 Questions for Increasing Closeness — Greater Good in Action](https://ggia.berkeley.edu/practice/36_questions_for_increasing_closeness)
- [Tier List Ideas — Tier List Ranking](https://www.tierlistranking.com/guides/tier-list-ideas.html)
- [Things to Rank — TierSort](https://tiersort.com/things-to-rank)
- [Tier List Ideas — My Tier Maker](https://www.mytiermaker.com/blog/tier-list-ideas/)
- [Best Party Games for Adults 2026](https://www.neverhaveieveronline.com/best-party-games-adults-2026/)

## ผลตรวจซ้ำ

- `node scripts/check-content.js tierlist --new 100`: ผ่าน ไม่มี ERROR
- REVIEW: 0 คู่ จึงไม่มีคู่ที่ต้องลบหรือเขียนทดแทน
- ชื่อหัวข้อซ้ำแบบตรงตัวหรือหลังปรับรูปคำ: 0
- ตัวเลือกซ้ำภายในหัวข้อเดียวกัน: 0
- ทุกหัวข้อมีคำถามชวนคุย: 100/100

## ผลทดสอบเกม

- เล่นหัวข้อครบทั้ง 100 ชุดโดยไม่สุ่มซ้ำก่อนครบรอบ
- ทดลองวางตัวเลือกครบ 6 อย่าง ย้ายเทียร์ ล้างกระดาน เปลี่ยนหัวข้อ และกรองหมวดบนหน้าจอมือถือ
- ตรวจหน้าเว็บทั้งหมด: ผ่าน 43/43 รายการ ไม่มี JavaScript error
- อัปเดตจำนวนเกมและแคชออฟไลน์เป็น `party-games-v55`
