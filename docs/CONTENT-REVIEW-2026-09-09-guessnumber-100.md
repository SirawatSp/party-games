# ตรวจชุดใครแม่นสุด 100 ข้อสุทธิ — 9 กันยายน 2026

ฐานก่อนเพิ่ม: master `760c5ca` มี 194 ข้อ

อ่าน `AGENTS.md` และ `docs/CONTENT-GUIDE.md` ครบก่อนเริ่ม ทำตามลำดับในหัวข้อ 1 และใช้ `scripts/add-entries.js` สำหรับการต่อข้อใหม่ทุกครั้ง

รอบนี้เขียนข้อใหม่ 103 ข้อ ลบข้อเก่าที่ซ้ำจริง 3 ข้อ จึงเพิ่มสุทธิ 100 ข้อ: 194 → 294 ข้อ ทุกข้อใหม่มีคำอธิบายพร้อมเฉลย

## สมดุลหมวด

| หมวด | ก่อน | เพิ่มสุทธิ | หลัง |
|---|---:|---:|---:|
| ไทย | 18 | 12 | 30 |
| อวกาศ | 18 | 12 | 30 |
| ร่างกาย | 19 | 11 | 30 |
| ประวัติศาสตร์ | 19 | 11 | 30 |
| สัตว์ | 18 | 11 | 29 |
| กีฬา | 18 | 11 | 29 |
| ความรู้รอบตัว | 18 | 11 | 29 |
| ป๊อปคัลเจอร์ | 19 | 10 | 29 |
| เกม | 19 | 10 | 29 |
| ภูมิศาสตร์ | 28 | 1 | 29 |

หมวดภูมิศาสตร์มีมากกว่าหมวดอื่นก่อนเริ่ม จึงเติมเพียงหนึ่งข้อ แล้วให้น้ำหนักกับหมวดที่มี 18–19 ข้อเป็นหลัก

## ตรวจคำซ้ำก่อนและหลังเขียน

ก่อนเขียนผู้สมัครแต่ละข้อค้นชื่อเฉพาะ คำตอบ ตัวเลข และคำทับศัพท์ใน `data/guess-number.js` ก่อนเสมอ ผู้สมัครเรื่องพื้นที่ประเทศไทยถูกตัดก่อนเขียน เพราะมีคำถามเดิมเรื่องเดียวกันอยู่แล้ว

ผลตรวจครั้งแรกหลังเพิ่ม 100 ข้อรายงาน REVIEW 23 กลุ่ม อ่านครบทุกบรรทัด พบข้อใหม่ซ้ำจริง 6 คู่ จึงลบเฉพาะข้อใหม่และเพิ่มข้อทดแทนผ่าน `add-entries.js`:

| คู่ซ้ำจริง | การตัดสินและข้อทดแทน |
|---|---|
| เซลล์ประสาทในสมอง 86 พันล้านเซลล์ ↔ คำถามเดิมเรื่องเดียวกัน | ลบข้อใหม่; แทนด้วยปริมาณเลือดที่ไตกรองต่อวัน |
| Challenger Deep ลึก 10,935 เมตร ↔ คำถามเดิมเรื่องเดียวกัน | ลบข้อใหม่; แทนด้วยความยาวแกรนด์แคนยอน |
| โฉนด Monopoly 28 ใบ ↔ คำถามเดิมเรื่องเดียวกัน | ลบข้อใหม่; แทนด้วยจำนวนผู้เล่นสูงสุดของ Scrabble |
| ตารางธาตุ 118 ธาตุ ↔ คำถามเดิมเรื่องเดียวกัน | ลบข้อใหม่; แทนด้วยความถี่ซีเซียม-133 ที่นิยามวินาที |
| รูปปั้นออสการ์หนัก 8.5 ปอนด์ ↔ คำถามเดิมเรื่องเดียวกัน | ลบข้อใหม่; แทนด้วยความยาวภาพยนตร์ Frozen |
| ผู้ร่วมงานออสการ์ครั้งแรก 270 คน ↔ คำถามเดิมเรื่องเดียวกัน | ลบข้อใหม่; แทนด้วยความยาวภาพยนตร์ Moana |

การตรวจทั้งคลังยังพบข้อเก่าซ้ำจริงอีก 3 คู่ จึงเก็บฉบับในหมวดเกม ลบฉบับซ้ำในหมวดความรู้รอบตัว และเพิ่มข้อใหม่ในหมวดเดิมเพื่อไม่ให้ยอดสุทธิลดลง:

| ข้อเก่าซ้ำ | ข้อทดแทน |
|---|---|
| เปียโนมาตรฐาน 88 คีย์ | ความจุตัวเลขของ QR Code Model 2 สูงสุด 7,089 หลัก |
| ไพ่หนึ่งสำรับ 52 ใบ | พื้นที่ BMP ของ Unicode 65,536 โค้ดพอยต์ |
| กระดานหมากรุก 64 ช่อง | IPv6 minimum link MTU 1,280 อ็อกเท็ต |

ผลสุดท้าย `node scripts/check-content.js guessnumber --new 103`: ไม่มี ERROR; REVIEW 19 กลุ่ม อ่านครบทุกบรรทัดและตัดสินดังนี้

| คำตอบร่วม | การตัดสิน |
|---:|---|
| 11 | เก็บทั้งหมด: เขตเวลารัสเซีย ผู้เล่นฟุตบอล น้ำหนักหัวใจยีราฟ และคะแนนชนะเกมเทเบิลเทนนิสเป็นคนละข้อเท็จจริง |
| 6,000 | เก็บทั้งคู่: น้ำหนักช้างกับจำนวนเรือดีเดย์คนละหน่วยและคนละเรื่อง |
| 50 | เก็บทั้งหมด: กำลังมด ปีกนกฮัมมิงเบิร์ด สระโอลิมปิก รัฐสหรัฐฯ เขตกรุงเทพฯ และโบนัส Scrabble คนละเรื่อง |
| 150 | เก็บทั้งคู่: อายุเต่ากาลาปาโกสกับเลือดที่ไตกรองคนละหน่วยและคนละเรื่อง |
| 15 | เก็บทั้งหมด: อัตราหายใจ ผู้เล่นรักบี้ อัตรากะพริบตา คะแนนเซตตัดสินวอลเลย์บอล และรูปปั้นออสการ์คนละเรื่อง |
| 24 | เก็บทั้งหมด: สถิติกลั้นหายใจ shot clock และกะรัตทองคนละเรื่อง |
| 10 | เก็บทั้งหมด: ระยะถ้ำหลวง ยอดวิว Baby Shark และนาทีต่อควอเตอร์บาสเกตบอลคนละเรื่อง |
| 16 | เก็บทั้งคู่: น้ำหนักลูกโบว์ลิ่งกับขนาดสไปรต์มาริโอคนละหน่วยและคนละเรื่อง |
| 70 | เก็บทั้งคู่: เส้นรอบวงฟุตบอลกับระยะยิงธนูคนละเรื่อง |
| 100 | เก็บทั้งหมด: จุดเดือดน้ำ อายุเต่า และจำนวนแผ่น Scrabble คนละเรื่อง |
| 54 | เก็บทั้งคู่: ประเทศในแอฟริกากับบล็อก Jenga คนละเรื่อง |
| 4.2 | เก็บทั้งคู่: ปีแสงถึงพรอกซิมากับชั่วโมงแสงถึงเนปจูนคนละหน่วยและคนละเรื่อง |
| 32 | เก็บทั้งหมด: ฟันแท้ บ้าน Monopoly และบิต IPv4 คนละเรื่อง |
| 28 | เก็บทั้งหมด: โฉนด Monopoly อายุครรภ์วอลลาบี และกิโลเมตรส่วนต่อขยาย MRT คนละเรื่อง |
| 42 | เก็บทั้งคู่: หมาก Connect 4 กับวันเก็บเม็ดเลือดแดงคนละเรื่อง |
| 20 | เก็บทั้งคู่: นาทีต่อวัน Minecraft กับอายุ Taylor Swift คนละเรื่อง |
| 25 | เก็บทั้งหมด: วันหมุนดวงอาทิตย์ สมาชิกฝูงลีเมอร์ ฟุตของลำไส้ และคะแนนวอลเลย์บอลคนละเรื่อง |
| 12 | เก็บทั้งคู่: วินาที shot clock 3x3 กับจำนวนรางวัลออสการ์คนละเรื่อง |
| 18 | เก็บทั้งคู่: นิ้วของฐาน MLB กับจำนวนสถานี MRT คนละเรื่อง |

REVIEW ของข้อเก่าที่ถูกซ่อนเหลือ 7 กลุ่มหลังลบข้อซ้ำจริงสามคู่แล้ว ตรวจแล้วเป็นเพียงคำตอบตัวเลขเท่ากันในคำถามคนละเรื่อง

## แหล่งตรวจข้อใหม่

คำถามและคำอธิบายเป็นการเรียบเรียงภาษาไทยใหม่ ตัวเลขประมาณระบุว่าเป็นค่าประมาณ และตัวเลขที่ขึ้นกับเวลาใส่วันที่กำกับ

| หมวด | แหล่งหลัก |
|---|---|
| อวกาศ | [NASA Solar System Facts](https://science.nasa.gov/solar-system/solar-system-facts/), [NASA Sun Facts](https://science.nasa.gov/sun/facts/), [NASA Basics of Space Flight](https://science.nasa.gov/learn/basics-of-space-flight/chapter1-2/), [NASA Solar System resource](https://science.nasa.gov/resource/our-solar-system-2/) |
| สัตว์ | [Smithsonian Asian elephant](https://nationalzoo.si.edu/animals/asian-elephant), [Cheetah](https://nationalzoo.si.edu/animals/cheetah), [Alpaca](https://nationalzoo.si.edu/animals/alpaca), [River otter](https://nationalzoo.si.edu/animals/north-american-river-otter), [Giant panda](https://nationalzoo.si.edu/animals/news/search-three-ounce-bundle-panda), [Wallaby](https://nationalzoo.si.edu/animals/news/jumping-joy-meet-zoos-new-baby-wallaby), [Golden lion tamarin](https://nationalzoo.si.edu/animals/golden-lion-tamarin), [Fishing cat](https://www.nationalzoo.si.edu/animals/fishing-cat), [Orangutan](https://nationalzoo.si.edu/animals/orangutan), [Ring-tailed lemur](https://www.nationalzoo.si.edu/animals/ring-tailed-lemur) |
| ร่างกาย | [NIDDK kidneys](https://www.niddk.nih.gov/health-information/kidney-disease/kidneys-how-they-work), [NIH Healthy Mind](https://www.nih.gov/about-nih/nih-turning-discovery-into-health/healthy-mind), [NINDS brain](https://www.ninds.nih.gov/news-events/directors-messages/all-directors-messages/weeklong-celebration-helps-public-learn-importance-brain-and-brain-research), [NEI tears](https://www.nei.nih.gov/eye-health-information/healthy-vision/how-eyes-work/how-tears-work), [NHLBI blood donation](https://www.nhlbi.nih.gov/sites/default/files/publications/35341_NHLBI_OSPEEC_2022_Blood_Donation_Handout_English_Web_v09_RELEASE_508.pdf), [NHLBI respiratory system](https://www.nhlbi.nih.gov/health/lungs/respiratory-system) |
| กีฬา | [World Athletics 400 m](https://worldathletics.org/disciplines/track-running/400-metres), [FIBA 2024 rules](https://assets.fiba.basketball/image/upload/documents-corporate-fiba-official-rules-2024-v10a.pdf), [FIBA 3x3](https://about.fiba.basketball/en/our-sport/3x3-basketball), [FIVB rules](https://www.fivb.com/wp-content/uploads/2025/01/FIVB-Volleyball_Rules2025_2028-EN.pdf), [ITTF statutes](https://db.ittf.com/sites/default/files/public/2026-02/2026_Statutes_v1_consolidated_clean.pdf), [World Rugby scoring](https://passport.world.rugby/laws-of-the-game/laws-by-number/8-scoring), [World Archery disciplines](https://www.worldarchery.sport/sport/disciplines), [MLB field](https://www.mlb.com/official-information/basics/field) |
| ประวัติศาสตร์ | [British Library Magna Carta](https://support.bl.uk/Files/896d2a42-173a-4cd7-8698-a47b00d248af/Friends-Newsletter-Spring-2015-v2.pdf), [British Museum Rosetta Stone](https://www.britishmuseum.org/collection/object/Y_EA24), [UNESCO Bayeux Tapestry](https://www.unesco.org/en/memory-world/bayeux-tapestry?hub=1081), [US National Archives signers](https://www.archives.gov/founding-docs/join-the-signers), [NPS D-Day](https://home.nps.gov/articles/general-eisenhower.htm), [UNESCO Terracotta Army](https://whc.unesco.org/en/documents/6448), [NPS Gettysburg](https://home.nps.gov/gett/learn/news/presskit.htm) |
| เกม | [Hasbro Jenga](https://instructions.hasbro.com/en-us/instruction/JENGA-Game), [Hasbro Scrabble](https://instructions.hasbro.com/en-us/instruction/scrabble-board-game), [Hasbro Monopoly](https://instructions.hasbro.com/en-hk/instruction/monopoly-standard-monopoly), [Mattel UNO](https://m.service.mattel.com/us/Technical/productDetail?prodno=FFK04&siteid=27), [Nintendo Super Mario](https://www.nintendo.com/us/whatsnew/wahoo-see-the-platforming-history-of-super-mario-and-even-get-a-few-fun-facts/), [FIDE equipment](https://handbook.fide.com/chapter/ChessEquipmentWithoutElectronicComponenets032026) |
| ป๊อปคัลเจอร์ | [Academy first Oscars](https://www.oscars.org/oscars/ceremonies/1929/memorable-moments), [Academy Oscar history](https://oscars.org/sites/oscars/files/94aa_oscar_history.pdf), [Academy statue production](https://www.oscars.org/news/academy-and-polich-tallix-fine-art-foundry-revive-art-oscarr-statuettes), [Grammy Thriller](https://www.grammy.com/news/michael-jacksons-thriller-record-1/), [Disney Snow White](https://movies.disney.com/snow-white-and-the-seven-dwarfs), [Disney Frozen](https://movies.disney.com/frozen), [Disney Moana](https://movies.disney.com/moana), [Grammy Taylor Swift](https://www.grammy.com/news/grammy-rewind-52nd-annual-grammy-awards/) |
| ภูมิศาสตร์ | [NOAA Challenger Deep](https://oceanexplorer.noaa.gov/ocean-fact/ocean-depth/), [NPS Grand Canyon FAQ](https://www.nps.gov/grca/faqs.htm) |
| ไทย | [UNESCO Thailand](https://whc.unesco.org/en/statesparties/th), [UNESCO Si Thep](https://whc.unesco.org/en/list/1662/), [Grand Palace history](https://www.royalgrandpalace.th/en/discover/history/), [Emerald Buddha](https://www.royalgrandpalace.th/en/discover/architecture/1/the-emerald-buddha), [TAT Wat Arun](https://www.tatnews.org/2020/01/tat-offers-an-updated-travel-guide-to-wat-arun-in-bangkok/), [MRTA Blue Line](https://www.mrta.co.th/en/chaloem-ratchamongkhon-line) |
| ความรู้รอบตัว | [BIPM defining constants](https://www.bipm.org/en/measurement-units/si-defining-constants), [NIST cryogenics](https://www.nist.gov/mml/acmd/cryogenic-technologies-project/about-cryogenics), [NIST standard atmosphere](https://www.nist.gov/pml/special-publication-330/sp-330-appendix-1), [RFC 791 IPv4](https://www.rfc-editor.org/info/rfc791/), [RFC 8200 IPv6](https://www.rfc-editor.org/info/rfc8200/), [DENSO WAVE QR versions](https://www.qrcode.com/en/about/version.html/index.html), [DENSO WAVE Model 2](https://www.qrcode.com/en/codes/model12.html/), [Unicode codespace](https://www.unicode.org/versions/Unicode16.0.0/core-spec/chapter-2/), [Library of Congress Braille](https://www.loc.gov/nls/services-and-resources/informational-publications/about-braille/), [IUPAC periodic table](https://iupac.org/iptei/) |

## ทดสอบก่อนเผยแพร่

- หน้าเกมจริงสุ่มเล่น 103 รอบไม่ซ้ำก่อนครบชุด ทุกครั้งแสดงคำตอบและคำอธิบายตรงกับข้อมูล ไม่มี JavaScript error
- ตรวจคำถามทั้งคลัง: ไม่มีข้อความคำถามซ้ำตรงตัว และข้อใหม่ทั้ง 103 มีคำอธิบายครบ
- smoke test เปิดทุกหน้าและเส้นทางสำคัญผ่าน 42/42
- `scripts/ship.js` ตรวจทุกคลังผ่าน สร้างป้ายจำนวนหน้าแรกใหม่ และเลื่อน service-worker cache
- การตรวจนี้ยืนยันข้อใหม่และเส้นทางที่ทดสอบ ไม่ได้อ้างว่าได้พิสูจน์ความถูกต้องของข้อเก่าทุกข้อในเว็บ
