# ตรวจคลังเปิดป้าย ทายรูป วันที่ 6 พฤศจิกายน 2026

ฐาน GitHub: `master` ที่ `6e79c74d274d4a7c02ee31433a50d6cb5ac56bb7` ก่อนเพิ่มชุดใหม่ ตรวจข้อมูลและไฟล์จาก checkout ของฐานนี้ รายงานนี้ไม่ใช่การยืนยันยอดเว็บจริงรอบใหม่ เพราะการเข้าถึงเว็บจริงกับแหล่ง Wikimedia ถูกนโยบายเครือข่าย Cloud ปฏิเสธด้วย HTTP 403

## ยอดและชื่อซ้ำ

- คลังมี 120 รายการ: `movies` 40, `cartoons` 40, `thai_food` 40
- ชื่อคำตอบและชื่อเรียกอื่นรวม 254 ค่า หลังปรับ Unicode NFKC แปลงตัวพิมพ์และตัดวรรคตอน ไม่พบค่าตรงกันระหว่างคนละรายการหรือคนละหมวด ชื่อเรียกต่างรูปของรายการเดียวกันไม่นับว่าซ้ำ
- ไม่พบ `sourceFile` หรือ URL `image` ซ้ำกันระหว่างคนละรายการ การตรวจนี้ยังไม่ใช่การพิสูจน์ด้วยแฮชของไฟล์โปสเตอร์ออนไลน์
- อ่านรายชื่อเรื่องทั้งหมดและแฟรนไชส์ ไม่พบการเพิ่มภาคต่อของแฟรนไชส์เดิมในฐาน 120 ที่แยกเป็นอีกโจทย์

## เครดิตและสิทธิ์

- ทุก 120 รายการมี `answer`, `cat`, `image`, `source`, `author`, `rights`, `rightsUrl`, `kind`, `sourceFile` เป็นข้อความไม่ว่าง
- แหล่งอ้างอิงเป็น `en.wikipedia.org` 79 รายการ และ `commons.wikimedia.org` 41 รายการ ภาพสำรองมี 73 รายการ
- ภาพอาหาร 40 รายการมีชื่ออาหาร ผู้สร้าง ข้อความสิทธิ์ URL สิทธิ์ และ URL ต้นทางตรงกับแถวของไฟล์นั้นใน `assets/picture-reveal/CREDITS.md` ทุกแถว
- ภาพหนังและการ์ตูน 76 จาก 80 รายการยังใช้ข้อความผู้สร้างแบบรวมว่า “เจ้าของผลงานต้นฉบับตามเครดิตในแหล่งภาพ” จึงยืนยันได้เพียงว่ามีฟิลด์และลิงก์อ้างอิง ยังยืนยันชื่อผู้สร้างเฉพาะรายไม่ได้ในรอบนี้ ต้องเปิดหน้าต้นทางตรวจเมื่อเครือข่ายพร้อม
- ไม่สามารถตรวจหน้าไฟล์ออนไลน์ซ้ำในวันที่รายงาน จึงไม่รับรองการเปลี่ยนสิทธิ์ สถานะลบ หรือความพร้อมโหลดของโปสเตอร์และภาพสำรอง ณ วันนี้

## ภาพอาหารและออฟไลน์

- เปิดและถอดรหัส JPEG ทั้ง 40 ไฟล์ได้ รวม 6,675,890 ไบต์ ภาพทุกไฟล์กว้างอย่างน้อย 640 พิกเซล และสูงอย่างน้อย 480 พิกเซล
- ตรวจภาพรวมแบบตารางครบทั้ง 40 รูป ภาพมีลักษณะสอดคล้องกับเฉลย ไม่พบคู่ภาพผิดจานอย่างชัดเจน ข้อนี้เป็นการดูไฟล์ที่มีในฐาน ไม่ใช่การตรวจหน้าต้นทางซ้ำ
- ภาพสุกี้เป็นชุดวัตถุดิบกับหม้อ และภาพข้าวคลุกกะปิเป็นจานข้าวกับเครื่องเคียงแยก จึงรับชื่ออาหารแบบรวมตามเฉลยเดิม
- URL ของอาหารทั้ง 40 ไฟล์อยู่ใน `PRECACHE_URLS` ของ `sw.js` ครบ การเล่นออฟไลน์จริงและพฤติกรรมเกมให้ดูผล Playwright ของรอบนี้แยกต่างหาก

| ไฟล์ | เฉลย | ขนาดภาพ | ไบต์ |
|---|---|---|---:|
| food-01.jpg | ผัดไทย | 960 × 960 | 253,806 |
| food-02.jpg | ต้มยำกุ้ง | 960 × 1342 | 258,709 |
| food-03.jpg | ส้มตำ | 960 × 960 | 129,094 |
| food-04.jpg | แกงเขียวหวาน | 960 × 642 | 163,499 |
| food-05.jpg | แกงมัสมั่น | 960 × 960 | 167,872 |
| food-06.jpg | ข้าวซอย | 960 × 768 | 190,461 |
| food-07.jpg | ผัดกะเพรา | 960 × 720 | 144,033 |
| food-08.jpg | ข้าวมันไก่ | 960 × 960 | 143,285 |
| food-09.jpg | ข้าวเหนียวมะม่วง | 960 × 640 | 91,954 |
| food-10.jpg | ลาบ | 960 × 638 | 121,209 |
| food-11.jpg | ข้าวผัด | 960 × 641 | 75,682 |
| food-12.jpg | ผัดซีอิ๊ว | 960 × 640 | 128,762 |
| food-13.jpg | ราดหน้า | 960 × 636 | 131,414 |
| food-14.jpg | สุกี้ | 640 × 480 | 243,425 |
| food-15.jpg | ก๋วยเตี๋ยวเรือ | 960 × 642 | 101,581 |
| food-16.jpg | เย็นตาโฟ | 960 × 720 | 114,207 |
| food-17.jpg | ข้าวขาหมู | 960 × 1349 | 316,536 |
| food-18.jpg | ข้าวหมูแดง | 960 × 960 | 216,857 |
| food-19.jpg | ข้าวคลุกกะปิ | 960 × 1280 | 430,118 |
| food-20.jpg | ข้าวยำ | 960 × 640 | 117,505 |
| food-21.jpg | แกงส้ม | 960 × 961 | 238,431 |
| food-22.jpg | พะแนง | 960 × 960 | 138,294 |
| food-23.jpg | แกงป่า | 960 × 640 | 103,064 |
| food-24.jpg | ต้มข่าไก่ | 960 × 720 | 114,613 |
| food-25.jpg | น้ำพริกอ่อง | 960 × 960 | 187,081 |
| food-26.jpg | ห่อหมก | 960 × 519 | 123,716 |
| food-27.jpg | ทอดมันปลา | 960 × 643 | 173,976 |
| food-28.jpg | ไก่ย่าง | 960 × 611 | 134,693 |
| food-29.jpg | หมูสะเต๊ะ | 960 × 720 | 160,953 |
| food-30.jpg | หมูปิ้ง | 960 × 720 | 193,753 |
| food-31.jpg | ไส้อั่ว | 960 × 960 | 164,965 |
| food-32.jpg | ไส้กรอกอีสาน | 960 × 636 | 156,194 |
| food-33.jpg | ยำวุ้นเส้น | 960 × 1369 | 169,534 |
| food-34.jpg | ขนมครก | 960 × 1269 | 167,207 |
| food-35.jpg | ขนมชั้น | 960 × 720 | 153,233 |
| food-36.jpg | ฝอยทอง | 960 × 960 | 183,011 |
| food-37.jpg | ทับทิมกรอบ | 960 × 1280 | 218,888 |
| food-38.jpg | กล้วยบวชชี | 960 × 825 | 166,300 |
| food-39.jpg | บัวลอย | 960 × 642 | 83,551 |
| food-40.jpg | ขนมเบื้อง | 960 × 720 | 104,424 |

## ตรวจชื่อร่วมกับคลังเกมอื่น

ค้นชื่อไทยและชื่อเรียกอื่นภาษาอังกฤษในไฟล์ `data/*.js` อื่นทั้งหมด ยกเว้นข้อมูลแผนที่กับไฟล์จำนวนที่สร้างอัตโนมัติ ใช้คำยาวตั้งแต่ 4 อักขระเพื่อลดผลบวกลวงจากคำสั้นอย่าง “Up” และจับขอบคำสำหรับชื่อภาษาอังกฤษ พบข้อความตรงกันที่ต้องพิจารณาใน 77 จาก 120 รายการ การพบชื่อร่วมไม่ใช่โจทย์ซ้ำในเกมเปิดป้าย: คลังอื่นใช้ใบ้คำ เลือกความชอบ หรือถามข้อเท็จจริง ส่วนเกมนี้ให้เปิดภาพทายชื่อ ตารางนี้เก็บจุดที่ต้องพิจารณาและไม่ใช้เป็นเหตุลบเนื้อหาเกมอื่น

| เฉลย | ไฟล์อื่นที่พบชื่อหรือชื่อเรียกอื่น |
|---|---|
| แฮร์รี่ พอตเตอร์ กับศิลาอาถรรพ์ | `flashquiz.js` · `guess-number.js` · `insider.js` · `sketch-references.js` |
| โดราเอมอน | `charades.js` · `favorites.js` · `flashquiz.js` · `insider.js` · `matchup.js` |
| ผัดไทย | `charades.js` · `fake-artist.js` · `flashquiz.js` · `insider.js` · `thisorthat.js` · `tier-list.js` |
| ไททานิก | `charades.js` · `flashquiz.js` · `guess-number.js` |
| นารูโตะ | `charades.js` · `flashquiz.js` · `matchup.js` |
| ต้มยำกุ้ง | `charades.js` · `fake-artist.js` · `flashquiz.js` · `insider.js` · `matchup.js` · `thisorthat.js` · `tier-list.js` |
| วันพีซ | `charades.js` · `flashquiz.js` |
| ส้มตำ | `category-game.js` · `charades.js` · `fake-artist.js` · `favorites.js` · `flashquiz.js` · `insider.js` · `matchup.js` · `rapidfire.js` · `thisorthat.js` · `tier-list.js` |
| อวตาร | `charades.js` · `flashquiz.js` · `guess-number.js` |
| แกงเขียวหวาน | `charades.js` · `fake-artist.js` · `flashquiz.js` · `insider.js` · `thisorthat.js` |
| ไพเรทส์ ออฟ เดอะ แคริบเบียน | `flashquiz.js` |
| แกงมัสมั่น | `flashquiz.js` · `insider.js` · `thisorthat.js` |
| สไปเดอร์แมน | `charades.js` · `flashquiz.js` · `insider.js` · `matchup.js` · `sketch-references.js` |
| มิติวิญญาณมหัศจรรย์ | `flashquiz.js` · `guess-number.js` |
| ข้าวซอย | `charades.js` · `fake-artist.js` · `flashquiz.js` · `thisorthat.js` · `tier-list.js` |
| โฟรเซ่น | `charades.js` · `flashquiz.js` · `guess-number.js` |
| ผัดกะเพรา | `charades.js` · `fake-artist.js` · `favorites.js` · `flashquiz.js` · `thisorthat.js` · `tier-list.js` |
| เดอะ ลอร์ด ออฟ เดอะ ริงส์ | `flashquiz.js` |
| ทอย สตอรี่ | `charades.js` · `flashquiz.js` · `guess-number.js` · `world-trivia-qa.js` |
| ข้าวมันไก่ | `category-game.js` · `charades.js` · `fake-artist.js` · `favorites.js` · `flashquiz.js` · `insider.js` · `thisorthat.js` · `tier-list.js` |
| เดอะ เมทริกซ์ | `flashquiz.js` |
| โปเกมอน | `charades.js` · `flashquiz.js` · `guess-number.js` · `world-trivia-qa.js` |
| ข้าวเหนียวมะม่วง | `charades.js` · `fake-artist.js` · `flashquiz.js` · `insider.js` · `matchup.js` · `personal-facts.js` · `thisorthat.js` · `tier-list.js` · `who-is-most.js` |
| กังฟูแพนด้า | `charades.js` · `flashquiz.js` |
| สตาร์ วอร์ส | `flashquiz.js` · `guess-number.js` · `world-trivia.js` |
| ทรานส์ฟอร์เมอร์ส | `charades.js` |
| โดดเดี่ยวผู้น่ารัก | `world-trivia-qa.js` |
| จอว์ส | `flashquiz.js` |
| อี.ที. เพื่อนรัก | `flashquiz.js` |
| คนเหล็ก | `flashquiz.js` |
| คิงคอง | `charades.js` · `world-trivia.js` |
| พี่มาก..พระโขนง | `charades.js` · `flashquiz.js` |
| แฟนฉัน | `charades.js` · `flashquiz.js` |
| เดอะ ก็อดฟาเธอร์ | `flashquiz.js` |
| องค์บาก | `flashquiz.js` |
| เครยอนชินจัง | `charades.js` · `flashquiz.js` |
| เซเลอร์มูน | `charades.js` · `flashquiz.js` |
| ดาบพิฆาตอสูร | `flashquiz.js` |
| เอ็นคานโต | `flashquiz.js` |
| เดอะ ไลอ้อน คิง | `flashquiz.js` |
| อะลาดิน | `charades.js` · `fake-artist.js` · `flashquiz.js` |
| นีโม่ ปลาเล็กหัวใจโต๊โต | `charades.js` · `flashquiz.js` |
| รวมเหล่ายอดคนพิทักษ์โลก | `flashquiz.js` |
| คาร์ส | `flashquiz.js` |
| พ่อครัวตัวจี๊ด หัวใจคับโลก | `flashquiz.js` |
| มหัศจรรย์อารมณ์อลเวง | `flashquiz.js` |
| วันอลวน วิญญาณอลเวง | `flashquiz.js` |
| โมอาน่า | `charades.js` · `guess-number.js` |
| นครสัตว์มหาสนุก | `flashquiz.js` |
| เชร็ค | `charades.js` · `flashquiz.js` |
| วอลล์·อี | `flashquiz.js` |
| ข้าวผัด | `charades.js` · `fake-artist.js` · `flashquiz.js` · `insider.js` · `matchup.js` · `thisorthat.js` · `tier-list.js` |
| ผัดซีอิ๊ว | `charades.js` · `insider.js` · `thisorthat.js` · `tier-list.js` |
| ราดหน้า | `flashquiz.js` · `tier-list.js` |
| สุกี้ | `charades.js` · `insider.js` · `thisorthat.js` · `tier-list.js` |
| ก๋วยเตี๋ยวเรือ | `charades.js` · `fake-artist.js` · `flashquiz.js` · `insider.js` · `thisorthat.js` · `tier-list.js` |
| เย็นตาโฟ | `charades.js` · `matchup.js` · `thisorthat.js` · `tier-list.js` |
| ข้าวขาหมู | `charades.js` · `fake-artist.js` · `thisorthat.js` |
| ข้าวหมูแดง | `charades.js` · `thisorthat.js` · `tier-list.js` |
| ข้าวคลุกกะปิ | `charades.js` · `insider.js` · `thisorthat.js` · `tier-list.js` |
| ข้าวยำ | `charades.js` · `tier-list.js` |
| แกงส้ม | `charades.js` · `fake-artist.js` · `thisorthat.js` · `tier-list.js` |
| แกงป่า | `tier-list.js` |
| ต้มข่าไก่ | `charades.js` · `fake-artist.js` · `flashquiz.js` · `insider.js` |
| น้ำพริกอ่อง | `thisorthat.js` |
| ไก่ย่าง | `charades.js` · `fake-artist.js` · `thisorthat.js` · `tier-list.js` |
| หมูสะเต๊ะ | `charades.js` · `thisorthat.js` |
| หมูปิ้ง | `charades.js` · `fake-artist.js` · `favorites.js` · `matchup.js` · `thisorthat.js` · `tier-list.js` |
| ไส้อั่ว | `charades.js` |
| ไส้กรอกอีสาน | `thisorthat.js` · `tier-list.js` |
| ยำวุ้นเส้น | `charades.js` · `fake-artist.js` · `insider.js` · `thisorthat.js` · `tier-list.js` |
| ขนมครก | `charades.js` · `fake-artist.js` · `flashquiz.js` · `thisorthat.js` · `tier-list.js` · `world-trivia-qa.js` |
| ขนมชั้น | `charades.js` · `fake-artist.js` |
| ฝอยทอง | `charades.js` · `flashquiz.js` |
| ทับทิมกรอบ | `charades.js` · `fake-artist.js` · `matchup.js` · `tier-list.js` |
| บัวลอย | `charades.js` · `fake-artist.js` · `matchup.js` · `thisorthat.js` · `tier-list.js` |
| ขนมเบื้อง | `charades.js` · `thisorthat.js` · `tier-list.js` |

## อ่านผลตัวตรวจเนื้อหาฐานเดิม

อ่าน `check-content-before.log` ครบ 140 บรรทัด รวม REVIEW ทั้ง 109 รายการ ตัวตรวจผ่าน 27 คลัง ไม่มี ERROR และไม่มี REVIEW ของ `picturereveal` ทุก REVIEW เป็นการใช้คำตอบร่วมกัน: Flash Quiz 78 กลุ่ม, ทายเลข 26 กลุ่ม, Bluff 3 กลุ่ม และ Trivia QA 2 กลุ่ม

คู่ที่แสดงถามคนละเรื่อง แม้คำตอบตรงกัน เช่น ประเทศญี่ปุ่นตอบเรื่องทางรถไฟ ชา ขนมและอีโมจิ, เลข 11 ตอบเรื่องเขตเวลา ฟุตบอล หัวใจยีราฟและคะแนนปิงปอง, ดาวศุกร์ตอบทั้งทิศหมุนและอุณหภูมิ จึงไม่ใช้จำนวน REVIEW เป็นหลักฐานว่ามี 109 โจทย์ซ้ำ บางคู่ใช้หัวข้อใกล้กันแต่คนละแง่ เช่น ชื่อศิลปินกับผลงานคนละชิ้นหรือจังหวัดกับสถานที่คนละแห่ง ไม่เกี่ยวกับการเพิ่มรูปในรอบนี้

พบข้อบกพร่องเดิมที่ตรวจจากข้อความในไฟล์ได้โดยตรง: `data/flashquiz.js` บรรทัด 47 ถาม “ลูกสนุกเกอร์หมายเลข 8” แต่คำอธิบายกล่าวถึง “กีฬาพูล ลูกดำหมายเลข 8” คำถามกับคำอธิบายจึงใช้คนละกีฬา เก็บไว้เป็นข้อสังเกตนอกขอบเขตและยังไม่ได้แก้ อีกทั้งคำถามบรรทัด 149 ใช้ “ปัจจุบัน” กับอันดับประชากร จึงควรระบุปีเมื่อทำรอบบำรุงเนื้อหาภายหลัง รอบนี้ยังไม่ได้ตรวจข้อเท็จจริงเหล่านั้นกับแหล่งออนไลน์

## รายการเสนอรอบถัดไปที่ยังไม่ผ่านการรับเข้า

เตรียม [รายการเสนอรอบแรก](picture-reveal-round1-candidates.json) จำนวน 45 รายการ หมวดละ 15 มีเฉพาะ `answer`, `cat`, `aliases` ยังไม่มี URL ภาพ เครดิตหรือสิทธิ์ที่ตรวจจากต้นทาง จึงยังไม่ต่อเข้าคลังใช้งาน ตรวจชื่อกับชื่อเรียกอื่นหลัง normalize แล้วไม่ชนฐานเดิมและไม่ชนข้ามรายการที่เสนอ ไม่เพิ่มแฟรนไชส์เดิมซ้ำ การสะกดชื่อไทยบางเรื่องเป็นชื่อเรียกในไทยที่เสนอ ต้องเทียบกับหน้าต้นทางก่อนรับเข้า

| หมวด | รายการที่เสนอ |
|---|---|
| หนังดัง | จอห์น วิค · มิชชั่น อิมพอสซิเบิล · เดอะ มัมมี่ · โกสต์บัสเตอร์ส · เอเลี่ยน · คนเรียกผี · หมอผี เอ็กซอร์ซิสต์ · ชอว์แชงค์ · ดิบดวลดิบ · แกลดิเอเตอร์ · ชีวิตอัศจรรย์ของพาย · กู้ตาย 140 ล้านไมล์ · ชนชั้นปรสิต · ด่วนนรก ซอมบี้คลั่ง · ฉลาดเกมส์โกง |
| การ์ตูนดัง | ดราก้อนบอล · แขนกล คนแปรธาตุ · ฮันเตอร์ × ฮันเตอร์ · วันพันช์แมน · โตเกียวกูล · ดร.สโตน เจ้าแห่งวิทยาศาสตร์ · บลูล็อก ขังดวลแข้ง · คนเก่งฟ้าประทาน · ดิจิมอน · แฮมทาโร่ · แม่มดน้อยโดเรมี · ซากุระ มือปราบไพ่ทาโรต์ · หลับตาฝัน ถึงชื่อเธอ · ฤดูฝัน ฉันมีเธอ · การผนึกประตูของซุซุเมะ |
| อาหารไทย | ข้าวหน้าเป็ด · ข้าวหมกไก่ · ข้าวต้มปลา · โจ๊ก · ขนมจีนน้ำยา · ขนมจีนน้ำเงี้ยว · ผัดผักบุ้งไฟแดง · ไข่พะโล้ · แกงเลียง · แกงไตปลา · คั่วกลิ้ง · สะตอผัดกะปิ · ปูผัดผงกะหรี่ · หอยทอด · ข้าวหลาม |


ตรวจคำสำคัญของรายการเสนอในคลังอื่นด้วย พบข้อความตรงกันที่ต้องพิจารณา 19 จาก 45 รายการตามตารางต่อไปนี้ ยังไม่ใช่การนับโจทย์ซ้ำ: “เอเลี่ยน” และ “มัมมี่” ในบางคลังหมายถึงสิ่งมีชีวิต/ตัวละครทั่วไป ไม่ได้ระบุภาพยนตร์ และ “โจ๊ก” ที่พบใน `sketch-references.js` กับ `flashquiz.js` เป็นส่วนต้นของ “โจ๊กเกอร์” จึงเป็นผลบวกลวงจากการค้นข้อความ ต้องอ่านบริบทก่อนตัดสิน

| รายการเสนอ | ไฟล์ที่ค้นเจอคำสำคัญ |
|---|---|
| จอห์น วิค | `charades.js` |
| เดอะ มัมมี่ | `fake-artist.js` · `flashquiz.js` |
| เอเลี่ยน | `rapidfire.js` · `situations.js` · `thisorthat.js` |
| แกลดิเอเตอร์ | `guess-number.js` |
| ชนชั้นปรสิต | `flashquiz.js` |
| ฉลาดเกมส์โกง | `charades.js` |
| ดราก้อนบอล | `charades.js` · `flashquiz.js` |
| ข้าวหน้าเป็ด | `charades.js` |
| ข้าวหมกไก่ | `fake-artist.js` |
| ข้าวต้มปลา | `fake-artist.js` · `thisorthat.js` · `tier-list.js` |
| โจ๊ก | `charades.js` · `fake-artist.js` · `flashquiz.js` · `guess-number.js` · `insider.js` · `matchup.js` · `sketch-references.js` · `thisorthat.js` · `tier-list.js` |
| ขนมจีนน้ำยา | `charades.js` · `thisorthat.js` · `tier-list.js` · `world-trivia-qa.js` |
| ขนมจีนน้ำเงี้ยว | `thisorthat.js` |
| ไข่พะโล้ | `thisorthat.js` |
| แกงเลียง | `thisorthat.js` |
| แกงไตปลา | `thisorthat.js` |
| คั่วกลิ้ง | `thisorthat.js` · `tier-list.js` |
| หอยทอด | `charades.js` · `fake-artist.js` · `tier-list.js` |
| ข้าวหลาม | `charades.js` · `drinking-games.js` · `flashquiz.js` · `tier-list.js` |

ขั้นที่ค้าง: ตรวจชื่อเรียกอื่นกับแฟรนไชส์จากต้นทาง, เลือกภาพตรงเฉลย, ตรวจหน้าไฟล์และผู้สร้าง/สิทธิ์, ดาวน์โหลดภาพอาหารเพิ่ม 15 ไฟล์, เปิดภาพจริงครบ 45 รูป, เติมด้วย `add-entries.js --dry` แล้วรับเข้า, เพิ่ม precache อาหาร, รันตัวตรวจและ Playwright ทุกหมวด จากนั้นจึงรัน `ship.js` ตามงานรวม ไม่มีการกล่าวว่ารายการเสนอผ่านตรวจภาพหรือทำให้ยอดเป็น 165 แล้ว
