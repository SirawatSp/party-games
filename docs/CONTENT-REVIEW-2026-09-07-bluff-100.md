# ตรวจชุดหลอกให้เชื่อ 100 ข้อ — 7 กันยายน 2026

ฐานก่อนเพิ่ม: master `8a5b09b` ซึ่งมี Flash Quiz 1,000 ข้อและชุดทดสอบเว็บใหม่
อ่าน AGENTS.md และ CONTENT-GUIDE.md ฉบับนี้ครบก่อนทำงาน
เพิ่มด้วย add-entries.js เท่านั้น: 154 → 254 ข้อ ทุกข้อใหม่มีเกร็ด 3 ข้อ
ขนาดชุด 100 ข้อตามคำขอเจ้าของล่าสุด โดยแยกร่างเป็นส่วนย่อยแล้วรวมก่อนเพิ่มครั้งเดียว

## สมดุลหมวด

| หมวด | ก่อน | เพิ่ม | หลัง |
|---|---:|---:|---:|
| กฎหมาย | 15 | 14 | 29 |
| ภาษา | 15 | 14 | 29 |
| ร่างกาย | 16 | 12 | 28 |
| อาหาร | 16 | 12 | 28 |
| ประวัติศาสตร์ | 16 | 12 | 28 |
| อวกาศ | 16 | 12 | 28 |
| ภูมิศาสตร์ | 20 | 8 | 28 |
| สัตว์ | 20 | 8 | 28 |
| ตัวเลข | 20 | 8 | 28 |

## ตรวจซ้ำและการตัดสิน

ค้นคำสำคัญ รวมชื่อทับศัพท์และคำตอบ ในคลังเดิมก่อนเขียนผู้สมัครแต่ละข้อ
ตรวจเพิ่มใน world-trivia-qa.js เพราะเกมมีโหมดนำคลังนั้นมารวมด้วย
ก่อนเพิ่มจริงเปลี่ยนผู้สมัคร 10 ข้อที่ทับกับคลังเสริม:

| ผู้สมัครที่ตัด | เหตุผล | ข้อทดแทน |
|---|---|---|
| สถานะทางกฎหมายแม่น้ำวังกานุย | แม่น้ำเดียวกัน กฎหมายปีเดียวกัน แม้สะกดต่าง | เมืองที่ลงนามไซเตส |
| อายุเม็ดเลือดแดง 120 วัน | ข้อเท็จจริงเดียวกัน | ท่อยูสเตเชียน |
| จำนวนกลีบปอดซ้าย | คลังเสริมถามรวมซ้ายขวาไว้แล้ว | ม่านตาควบคุมรูม่านตา |
| ผิวหนังเป็นอวัยวะใหญ่ที่สุด | ถามซ้ำตรงความหมาย | ท่อไต |
| ทะเลไททันมีมีเทน/อีเทน | ใกล้กับข้อฝนมีเทนบนไททัน เลี่ยงถามวงจรของเหลวเดียวกัน | พวยพุ่งขั้วใต้เอนเซลาดัส |
| แกนีมีดใหญ่ที่สุด | มีแล้วในคลังเสริม | ภูเขาไฟไอโอ |
| กบไม้ใช้กลูโคส | ข้อเท็จจริงเดียวกัน | ปลาพ่นน้ำ |
| ตุ่นปากเป็ดตรวจไฟฟ้า | ข้อเท็จจริงเดียวกัน | การเต้นผึ้ง |
| แอกโซลอเติลงอกแขนขา | ถามกลับด้านเรื่องเดียวกัน | ปลาแองเกลอร์ตัวผู้ |
| ม้าน้ำตัวผู้ฟักลูก | ถามกลับด้านเรื่องเดียวกัน | นกฮูกหันหัว 270 องศา |

หัวข้อกระดูกทารก น้ำลาย และจำนวนเซลล์มนุษย์ถูกตัดตั้งแต่คัดหัวข้อ เพราะมีในคำถามหรือเกร็ดเดิม
ไม่ใช้การคำนวณพื้นที่ A4 แบบเท่ากับ 1/16 ตารางเมตรพอดี เพราะขนาดจริงมีการปัดมิลลิเมตร

ผล `node scripts/check-content.js bluff --new 100`: ไม่มี ERROR; REVIEW ใหม่ 1 รายการ = 1 คู่

| คู่ REVIEW | ตัดสิน |
|---|---|
| กานพลู → ดอกตูม ↔ เคเปอร์ → ดอกตูม | เก็บทั้งสอง: คนละพืชและคนละเครื่องปรุง ไม่ใช่การถามกลับด้านของพืชเดียวกัน ตรวจที่มาของแต่ละข้อแยกกัน |

REVIEW เดิมที่ถูกซ่อน 2 คู่ได้รับการอ่านด้วย:

| คู่เดิม | ตัดสิน |
|---|---|
| บังกลาเทศ: ห้ามถุงพลาสติก ↔ บริโภคข้าวต่อหัว | ไม่ใช่คำถามซ้ำ แต่ข้อสถิติต้องตรวจปีและแหล่งข้อมูลต่อ ไม่ได้ยืนยันความถูกต้องทั้งหมดในรอบนี้ |
| ดาวศุกร์: หมุนกลับทาง ↔ ร้อนที่สุด | ไม่ใช่คำถามซ้ำ แต่ถ้อยคำข้อหมุนกลับทางเดิมควรตรวจความกำกวมร่วมกับดาวยูเรนัสต่อ |

การตรวจโครงสร้างผ่านไม่เท่ากับพิสูจน์ความถูกต้องของข้อเก่าทุกข้อ ข้อเก่าที่ควรเข้าคิวตรวจแหล่งข้อมูลต่อ ได้แก่คำกล่าวเรื่องห้ามเคี้ยวหมากฝรั่งขณะขับรถในสิงคโปร์ ออกซิเจนจากป่าแอมะซอน และสถิติโลกที่ไม่ระบุปี รอบนี้ไม่ได้แก้เนื้อหาเดิมด้วยมือ

## แหล่งตรวจข้อใหม่

หมายเลขเป็นลำดับในร่างตรวจ: ข้อ 1–89 ตรงกับลำดับคลัง 155–243; ข้อ 91–100 ตรงกับ 244–253; ข้อทดแทนหมายเลข 90 ถูกเพิ่มท้ายเป็นลำดับ 254
เป็นการเรียบเรียงคำถามและเกร็ดภาษาไทยใหม่ ไม่ได้คัดลอกบทความ
ตัวเลขประมาณระบุว่าเป็นค่าประมาณ; เกณฑ์เฉพาะระบุเงื่อนไขในโจทย์

| ข้อ | เรื่องและแหล่งข้อมูล |
|---:|---|
| 1 | [GDPR มาตรา 83 — EDPB](https://www.edpb.europa.eu/system/files/2023-09/final_decision_tiktok_in-21-9-1_-_redacted_8_september_2023.pdf) |
| 2 | [การสมรสหลังเสียชีวิต มาตรา 171 — Légifrance](https://www.legifrance.gouv.fr/codes/article_lc/LEGIARTI000024025844) |
| 3 | [รัฐธรรมนูญญี่ปุ่น — สภาผู้แทนราษฎร](https://www.shugiin.go.jp/internet/itdb_english.nsf/html/statics/english/constitution_e.htm) |
| 4 | [การใช้แอนตาร์กติกอย่างสันติ — สำนักเลขาธิการสนธิสัญญา](https://www.ats.aq/e/peaceful.html) |
| 5 | [ต้นฉบับอนุสัญญาไซเตส](https://cites.org/sites/default/files/eng/disc/CITES-Convention-EN.pdf) |
| 6 | [องค์ประกอบศาล ICJ](https://www.icj-cij.org/court/) |
| 7 | [ทะเบียนสนธิสัญญาอวกาศ — สหประชาชาติ](https://treaties.un.org/pages/showdetails.aspx?objid=0800000280128cbd), [หลักกฎหมายอวกาศ](https://www.un.org/en/node/226999) |
| 8 | [ระบบลงคะแนนและวีโต — คณะมนตรีความมั่นคง](https://main.un.org/securitycouncil/en/content/voting-system) |
| 9 | [อนุสัญญาสิทธิเด็ก ข้อ 1 — UNICEF](https://www.unicef.org/child-rights-convention/convention-text) |
| 10 | [กฎหมายทะเล มาตรา 3 — สหประชาชาติ](https://www.un.org/Depts/los/convention_agreements/texts/unclos/part2.htm) |
| 11 | [อนุสัญญาออตตาวา — ICRC](https://www.icrc.org/en/article/FAQ-anti-personnel-mine-ban-convention-ottawa-treaty) |
| 12 | [พิธีสารมอนทรีออล — ทะเบียนสนธิสัญญา](https://treaties.un.org/pages/ViewDetails.aspx?chapter=27&mtdsg_no=XXVII-2-a&src=TREATY) |
| 13 | [ประวัติอนุสัญญาแรมซาร์](https://www.ramsar.org/history-convention) |
| 14 | [บทแก้ไขรัฐธรรมนูญสหรัฐฯ 11–27 — หอจดหมายเหตุแห่งชาติ](https://www.archives.gov/founding-docs/amendments-11-27) |
| 15 | [ที่มาชื่อ Bluetooth — องค์กร Bluetooth](https://www.bluetooth.com/about-us/bluetooth-origin/) |
| 16 | [รากศัพท์มาลาเรีย — CDC](https://wwwnc.cdc.gov/eid/article/12/7/et-1207_article) |
| 17 | [boycott — Merriam-Webster](https://www.merriam-webster.com/dictionary/boycott) |
| 18 | [รากศัพท์ vaccine — Etymologia](https://pmc.ncbi.nlm.nih.gov/articles/PMC3377431/) |
| 19 | [ที่มาของแซนด์วิช — Smithsonian](https://www.smithsonianmag.com/history/gavrilo-princips-sandwich-79480741/) |
| 20 | [ผลงานอัลควาริซมี — Library of Congress](https://www.loc.gov/resource/gdcwdl.wdl_07462/?st=gallery) |
| 21 | [ampersand — Merriam-Webster](https://www.merriam-webster.com/dictionary/ampersand) |
| 22 | [quarantine — Etymonline](https://www.etymonline.com/word/quarantine) |
| 23 | [karaoke — Merriam-Webster](https://www.merriam-webster.com/dictionary/karaoke) |
| 24 | [salary — Merriam-Webster](https://www.merriam-webster.com/dictionary/salary) |
| 25 | [avocado — Merriam-Webster](https://www.merriam-webster.com/dictionary/avocado) |
| 26 | [denim — Merriam-Webster](https://www.merriam-webster.com/dictionary/denim) |
| 27 | [silhouette — Merriam-Webster](https://www.merriam-webster.com/dictionary/silhouette) |
| 28 | [disaster — Merriam-Webster](https://www.merriam-webster.com/dictionary/disaster) |
| 29 | [ท่อยูสเตเชียน — Cleveland Clinic](https://my.clevelandclinic.org/health/body/22072-eustachian-tubes) |
| 30 | [การทำงานของไต — NIDDK](https://www.niddk.nih.gov/health-information/kidney-disease/kidneys-how-they-work) |
| 31 | [เคลือบฟัน — Cleveland Clinic](https://my.clevelandclinic.org/health/body/24655-teeth) |
| 32 | [งานวิจัยกล้ามเนื้อหูชั้นกลาง](https://pmc.ncbi.nlm.nih.gov/articles/PMC10273355/) |
| 33 | [กล้ามเนื้อม่านตา — Cleveland Clinic](https://my.clevelandclinic.org/health/body/24317-pupil-of-the-eye) |
| 34 | [ท่อไต — Cleveland Clinic](https://my.clevelandclinic.org/health/body/ureters) |
| 35 | [เอ็นร้อยหวาย — Cleveland Clinic](https://my.clevelandclinic.org/health/body/achilles-tendon-calcaneal-tendon) |
| 36 | [ต่อมไพเนียล — Cleveland Clinic](https://my.clevelandclinic.org/health/body/23334-pineal-gland) |
| 37 | [กระดูกสะบ้า — NCBI Bookshelf](https://www.ncbi.nlm.nih.gov/books/NBK519534/?report=reader) |
| 38 | [ขี้หู — Cleveland Clinic](https://my.clevelandclinic.org/health/body/24624-earwax) |
| 39 | [กะบังลม — Cleveland Clinic](https://my.clevelandclinic.org/health/body/21578-diaphragm) |
| 40 | [เซลล์รูปกรวยและการมองสี — NIH](https://newsinhealth.nih.gov/2010/02/can-t-see-certain-colors) |
| 41 | [น้ำเลี้ยงเมเปิลที่น้ำตาล 2.5% — USDA Forest Service](https://www.srs.fs.usda.gov/pubs/misc/ag_654/volume_2/acer/saccharum.htm) |
| 42 | [ปริมาณนมทำพาร์มิจาโนเรจจาโน — ผู้ผลิต](https://shop.parmigianoreggiano.com/fr-lu/collections/lameria-le-grand) |
| 43 | [หญ้าฝรั่น — Kew](https://shop.kew.org/saffron-crocus-handmade-pin-brooch) |
| 44 | [ข้อกำหนดบัลซามิกเรจโจเอมีเลีย PDO — EUR-Lex](https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=oj%3AJOC_2013_172_R_0008_01) |
| 45 | [กานพลู — Kew](https://powo.science.kew.org/taxon/urn%3Alsid%3Aipni.org%3Anames%3A601421-1/general-information) |
| 46 | [เคเปอร์ — Kew](https://powo.science.kew.org/taxon/urn%3Alsid%3Aipni.org%3Anames%3A30001562-2/general-information) |
| 47 | [ขมิ้น — Kew](https://www.kew.org/plants/turmeric) |
| 48 | [ยีสต์ในขนมปัง — Exploratorium](https://dev-annex.exploratorium.edu/cooking/bread/bread_science.html) |
| 49 | [วิทยาศาสตร์ขนมปังและเบกกิงโซดา — พิพิธภัณฑ์เกษตรและอาหารแคนาดา](https://ingeniumcanada.org/sites/default/files/2019-03/Apprentice-Chef-bread-science-eak.pdf) |
| 50 | [ผลแท้มะม่วงหิมพานต์ — University of Florida](https://ask.ifas.ufl.edu/publication/hs377) |
| 51 | [วงศ์ Rosaceae — Kew](https://powo.science.kew.org/taxon/urn%3Alsid%3Aipni.org%3Anames%3A30000200-2/general-information) |
| 52 | [SCOBY — University of Illinois Extension](https://extension.illinois.edu/sites/default/files/fermented_foods.pdf) |
| 53 | [ประวัติยกเลิกโทษประหาร — กระทรวงยุติธรรมฝรั่งเศส](https://www.mediatheque.justice.gouv.fr/direct/4265-275ba26369bd67d81bb4413bcfab51bbed782dbd-1535980163-direct) |
| 54 | [สัญญาณไฟเวสต์มินสเตอร์ 1868–1869 — Historic England](https://historicengland.org.uk/images-books/photos/englands-places/card/170748) |
| 55 | [สมุดบันทึกแมลงคอมพิวเตอร์ — Smithsonian](https://www.si.edu/object/log-book-computer-bug%3Anmah_334663) |
| 56 | [หอไอเฟลกับวิทยาศาสตร์ — ผู้ดูแลหอ](https://www.toureiffel.paris/en/the-monument/eiffel-tower-and-science) |
| 57 | [ศิลาโรเซตตา — British Museum](https://www.britishmuseum.org/collection/object/Y_EA24) |
| 58 | [สุสานจิ๋นซี — UNESCO](https://whc.unesco.org/en/list/441/) |
| 59 | [การค้นพบสุสานตุตันคามุน — British Museum](https://www.britishmuseum.org/visit/object-trails/tutankhamun-ancient-and-modern-perspectives) |
| 60 | [ปอมเปอีหลังการปะทุ — อุทยานโบราณคดี](https://pompeiisites.org/en/pompeii-map/analysis/pompeii-after-the-eruption/) |
| 61 | [ประวัติเปิดอาคาร — Sydney Opera House](https://www.sydneyoperahouse.com/our-story/50-years-extraordinary-moments) |
| 62 | [วัสดุเทพีเสรีภาพ — NPS](https://home.nps.gov/stli/planyourvisit/frequently-asked-questions-statue-of-liberty.htm) |
| 63 | [การเปิดกำแพงเบอร์ลิน — เมืองเบอร์ลิน](https://www.berlin.de/en/history/8482274-8619314-opening-and-fall-of-the-berlin-wall.en.html) |
| 64 | [พิธีโนเบลครั้งแรก — Nobel Prize](https://www.nobelprize.org/prizes/themes/the-very-first-nobel-prizes) |
| 65 | [ฤดูกาลยูเรนัส — NASA](https://www.nasa.gov/podcasts/gravity-assist/gravity-assist-ice-giants-uranus-neptune-with-amy-simon/) |
| 66 | [ดาวพฤหัสบดี — NASA](https://science.nasa.gov/jupiter/jupiter-facts/) |
| 67 | [รอยแยกและพวยพุ่งเอนเซลาดัส — NASA](https://science.nasa.gov/missions/cassini/cassini-at-enceladus-a-decade-plus-of-discovery/) |
| 68 | [ความหนาแน่นดาวนิวตรอน — NASA](https://www.nasa.gov/centers-and-facilities/goddard/new-nasa-mission-to-study-mysterious-neutron-stars-aid-in-deep-space-navigation/) |
| 69 | [หลักฐานมหาสมุทรยูโรปา — NASA](https://europa.nasa.gov/europa/ocean/) |
| 70 | [วงโคจรไทรทัน — NASA](https://science.nasa.gov/neptune/moons/triton/) |
| 71 | [ชื่อหัวใจพลูโต — NASA](https://science.nasa.gov/solar-system/gravity-assist-pluto-with-alan-stern/) |
| 72 | [ซีรีส — NASA](https://science.nasa.gov/dwarf-planets/ceres/facts/) |
| 73 | [ไอโอ — NASA](https://science.nasa.gov/jupiter/jupiter-moons/io/) |
| 74 | [วอยเอเจอร์ 1 — NASA](https://science.nasa.gov/mission/voyager/voyager-1/) |
| 75 | [อุณหภูมิโฟโตสเฟียร์ — NASA](https://pwg.gsfc.nasa.gov/stargaze/Sun1lite.htm) |
| 76 | [ข้อมูลระบบสุริยะและบริวารดาวอังคาร — NASA](https://www.nasa.gov/wp-content/uploads/2011/05/Solar_System_Lithograph_Set_h.pdf?emrc=c77ddc) |
| 77 | [เมืองหลวง — รัฐบาลแอฟริกาใต้](https://www.gov.za/about-sa/south-africas-provinces) |
| 78 | [อิสตันบูลสองทวีป — หน่วยงานอิสตันบูล](https://istanbul.gov.tr/asya-ve-avrupayi-birlestiren-sehir-istanbul) |
| 79 | [ติติกากาเปรูและโบลิเวีย — Ramsar](https://www.ramsar.org/es/node/9042) |
| 80 | [ระบบคลอง — การคลองปานามา](https://pancanal.com/preguntas-frecuentes/) |
| 81 | [ช่องแคบยิบรอลตาร์ — NASA](https://science.nasa.gov/earth/earth-observatory/the-strait-of-gibraltar-151478/) |
| 82 | [ทะเลสาบวิกตอเรีย — UNDP](https://www.undp.org/tanzania/stories/shared-waters-shared-future-celebrating-lake-victoria) |
| 83 | [คิลิมันจาโร — UNESCO](https://whc.unesco.org/en/list/403) |
| 84 | [คาไนมา — UNESCO](https://whc.unesco.org/en/list/701) |
| 85 | [ปลาพ่นน้ำ — Australian Museum](https://australian.museum/learn/animals/fishes/sevenspot-archerfish-toxotes-chatareus/) |
| 86 | [การเต้นผึ้ง — Arizona State University](https://askabiologist.asu.edu/games-sims/bee-dance-game/introduction.html) |
| 87 | [ปลาแองเกลอร์ — Smithsonian Ocean](https://ocean.si.edu/ocean-life/fish/anglerfish-lure-prey-throughout-ocean) |
| 88 | [การหันหัวนกฮูก — San Diego Zoo](https://animals.sandiegozoo.org/animals/owl) |
| 89 | [คาวิเทชันจากกั้งตั๊กแตน — Smithsonian](https://www.si.edu/collections/snapshot/behold-mantis-shrimp) |
| 90 | [งานวิจัยอวัยวะรับเสียงบนขาคู่หน้าจิ้งหรีด](https://pmc.ncbi.nlm.nih.gov/articles/PMC5681576/) |
| 91 | [งานวิจัยอายุฉลามกรีนแลนด์ ปี 2016](https://pubmed.ncbi.nlm.nih.gov/27516602/) |
| 92 | [เกล็ดตัวลิ่น — San Diego Zoo](https://animals.sandiegozoo.org/animals/tree-pangolin) |
| 93 | [จำนวนสถานะ — Rubik's](https://www.rubiks.com/products/rubiks-3x3) |
| 94 | [เบรลล์ — RNIB](https://www.rnib.org.uk/living-with-sight-loss/education-and-learning/braille-tactile-codes/) |
| 95 | [กฎปีอธิกสุรทิน — Royal Museums Greenwich](https://www.rmg.co.uk/stories/time/which-years-are-leap-years-can-you-have-leap-seconds); คำนวณจากกฎได้ 100−4+1 = 97 |
| 96 | [ตาแรกหมากรุก — Chess.com](https://www.chess.com/article/view/every-chess-opening-move-ranked); ตรวจนับเบี้ย 16 และม้า 4 |
| 97 | [ขนาดและจุดวางหมากโกะ — British Go Association](https://www.britgo.org/intro/intro2.html); คำนวณ 19×19 = 361 |
| 98 | [กติกาวอลเลย์บอล — FIVB](https://www.fivb.com/volleyball/the-game/official-volleyball-rules/) |
| 99 | [ระบบแบ่งออกเทฟ — Yamaha](https://www.yamaha.com/en/musical_instrument_guide/pipeorgan/play/) |
| 100 | [กติกาคะแนนสมบูรณ์โบว์ลิง — USBC](https://bowl.com/getmedia/004237d3-3d9a-4f03-8cf2-91c916df8d79/hsguide.pdf) |

## การตรวจซ้ำรอบสุดท้าย

การอ่าน REVIEW ทั้งเว็บพบคำสะกด โคอาล่า ในคลังเสริม ทับกับข้อใหม่ โคอาลา เรื่องลายนิ้วมือ จึงลบข้อใหม่ 1 ข้อด้วยสคริปต์ที่ยืนยันเป้าหมายและสำรองไว้ แล้วเพิ่มข้อจิ้งหรีดด้วย add-entries.js ให้ครบ 100 อีกครั้ง รวมผู้สมัครที่ตัดเพราะทับคลังเสริม 11 ข้อ (10 ก่อนเพิ่ม และ 1 หลังเพิ่ม)

ผลตรวจใหม่ยังเป็น REVIEW 1 คู่ ดอกตูม เก็บทั้งสองด้วยเหตุผลข้างต้น; การตรวจทั้งเว็บรายงาน 63 กลุ่ม ไม่ใช่ 63 คู่ ทั้งหมดนอกจากกลุ่มดอกตูมเป็นข้อมูลเดิม อ่านแล้วพบข้อซ้ำจริงเดิมใน guessnumber 3 คู่: เปียโน 88 คีย์ หมากรุก 64 ช่อง และไพ่ 52 ใบ ต้องเก็บกวาดในรอบคลังนั้น ยังไม่รวมว่าแก้แล้วในชุดนี้

## ทดสอบก่อนเผยแพร่

- เว็บฐานล่าสุดก่อนเพิ่มและเว็บหลังเพิ่มจริง: smoke-test.js ผ่าน 42/42 ทั้งสองครั้ง โดยใช้ Playwright ที่มีในระบบกับ Microsoft Edge ไม่เพิ่ม dependency ให้เว็บ
- ทดสอบหน้าเกมจริงกับคำถามใหม่ 100 ข้อ โดยจำกัดคลังเฉพาะในคำตอบเครือข่ายของการทดสอบ ไม่แก้ไฟล์เว็บ
- โหมดคนโกหกเห็นคำตอบ: ผ่าน 100 รอบไม่ซ้ำก่อนครบคลัง
- โหมดคนโกหกไม่เห็นคำตอบ: ผ่าน 100 รอบไม่ซ้ำก่อนครบคลัง
- ทั้งสองโหมด: คนรู้จริงเห็นคำตอบและเกร็ดตรงครบ 3 ข้อ คนโกหกไม่มีเกร็ดค้าง และหน้าสรุปแสดงเฉลย/เกร็ดตรงกัน ไม่มี JavaScript error
- ไม่ได้อ้างว่าการทดสอบนี้ครอบคลุมตรรกะเกมทุกเส้นทางหรือความถูกต้องของข้อเก่าทั้งหมด
