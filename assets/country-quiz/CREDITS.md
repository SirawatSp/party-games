# เครดิตธงชาติและรูปทรงประเทศ

ชุดนี้ใช้ประเทศร่วมกัน 164 ประเทศสำหรับ “ทายธงชาติ” และ “ทายประเทศจากรูปทรง” เลือกเฉพาะรัฐสมาชิกสหประชาชาติที่มีเส้นรูปร่างจริงใน `data/worldmap.js` ของเว็บ ไม่ใช้จุดแทนประเทศขนาดเล็ก ไม่เพิ่มดินแดนพิพาทหรือดินแดนในปกครองเป็นคำตอบ

อัฟกานิสถานยังไม่รวมในชุดแรก เพราะรูปธงในต้นทางที่ตรวจเป็นรูปแบบสามสีเดิม จึงเว้นไว้จนกว่าจะตรวจรุ่นธงที่เหมาะสมสำหรับคำถามได้ ไม่ใช่ข้อสรุปเกี่ยวกับสถานะประเทศหรือรัฐบาล

## ภาพธงที่นำมาจากอินเทอร์เน็ต

- ผู้สร้างต้นทาง: Panayiotis Lipiridis และผู้ร่วมพัฒนา [lipis/flag-icons](https://github.com/lipis/flag-icons)
- รุ่นที่ตรึง: [`ac7e0eb3259eb62aa6100c435607e2fe03896a97`](https://github.com/lipis/flag-icons/tree/ac7e0eb3259eb62aa6100c435607e2fe03896a97/flags/4x3)
- ใช้ไฟล์ SVG ในโฟลเดอร์ `flags/4x3/` ของต้นทาง โดยเก็บสำเนาไว้ใน `assets/country-quiz/flags/` เพื่อเปิดได้โดยไม่ใช้อินเทอร์เน็ตหลังเก็บเว็บครั้งแรก
- สัญญาอนุญาตที่โครงการต้นทางประกาศ: [MIT](https://github.com/lipis/flag-icons/blob/ac7e0eb3259eb62aa6100c435607e2fe03896a97/LICENSE) เก็บข้อความสัญญาอนุญาตพร้อมบรรทัดลิขสิทธิ์ไว้ที่ [LICENSE-flag-icons.txt](LICENSE-flag-icons.txt)
- เก็บไฟล์ธงตรงกับต้นทางที่ตรึง ไม่สร้างรูปธงขึ้นใหม่และไม่เปลี่ยนสีหรือลวดลาย
- `scripts/fetch-country-flags.js` ตรวจ Git SHA-1 ของทุกไฟล์กับรายการต้นทางก่อนบันทึก พร้อมตรวจว่า SVG ไม่มีสคริปต์ รูปฝัง หรือการเรียกไฟล์ภายนอก
- ภาพธงใช้ตามชุดข้อมูลและรุ่นที่ระบุ ไม่ได้อ้างว่าสัญลักษณ์ทั้งหมดเป็นสาธารณสมบัติ หรือเป็นการรับรองสถานะรัฐบาลใด

## รูปทรงประเทศ

รูปร่างดึงจาก `WORLD_MAP.countries` ใน `data/worldmap.js` ซึ่งเว็บมีอยู่แล้ว โดยไม่แก้ไฟล์ข้อมูลต้นทาง

- ต้นทางเรขาคณิต: [Natural Earth 1:110m](https://www.naturalearthdata.com/downloads/110m-cultural-vectors/110m-admin-0-countries/) ผ่านแพ็กเกจ [world-atlas 2.0.2](https://github.com/topojson/world-atlas/tree/v2.0.2)
- สิทธิ์ของ Natural Earth: [สาธารณสมบัติ](https://www.naturalearthdata.com/about/terms-of-use/)
- ภาพเป็นเส้นรูปทรงเพื่อเล่นเกม ไม่มีรายละเอียดระดับจังหวัด และไม่ใช่แผนที่เขตแดนอย่างเป็นทางการ

## รหัสประเทศ ชื่อ และภูมิภาค

- รหัส ISO ชื่อภาษาอังกฤษ และหมวดภูมิภาคอ้างอิง [world-countries 5.1.0](https://github.com/mledoze/countries/blob/fa4f62182d19ff4f8b325cde6387c9cd9d80955a/package.json) ตรึงที่ [`fa4f62182d19ff4f8b325cde6387c9cd9d80955a`](https://github.com/mledoze/countries/tree/fa4f62182d19ff4f8b325cde6387c9cd9d80955a)
- ผู้จัดทำฐานข้อมูลต้นทาง: Mohammed Le Doze และผู้ร่วมพัฒนา
- ฐานข้อมูลใช้ [ODbL 1.0](https://opendatacommons.org/licenses/odbl/1.0/) เก็บข้อความสัญญาอนุญาตต้นทางไว้ที่ [LICENSE-world-countries.md](LICENSE-world-countries.md)
- `data/country-quiz.js` เป็นฐานข้อมูลที่ดัดแปลงจากต้นทางและเผยแพร่ส่วนฐานข้อมูลภายใต้ ODbL 1.0 เช่นเดียวกัน การดัดแปลงคือเลือกชุด 164 ประเทศ เพิ่มชื่อไทยและชื่อเรียกอื่นจากคลังเดิมของเว็บ เพิ่มพาธภาพธง และแบ่งอเมริกาเป็นอเมริกาเหนือกับอเมริกาใต้ โดยแคริบเบียนและอเมริกากลางอยู่ในหมวดอเมริกาเหนือ
- ชื่อไทยใช้จากคลังแผนที่และพรมแดนเดิมของเว็บ เพิ่ม “ประเทศไทย” สำหรับ “ไทย” และตัดชื่อเรียกที่กำกวมหรือเป็นชื่อเมือง เช่น “คองโก”, “เกาหลี” และ “ดูไบ” ออกจากคำตอบทางเลือก
- เอกสารนี้ระบุสิทธิ์ของภาพธง เรขาคณิต และฐานข้อมูลแยกกัน ไม่ใช้สัญญาอนุญาตหนึ่งแทนสิทธิ์ทั้งหมด

## รายการธงรายประเทศ

ทุกแถวใช้ผู้สร้างและ MIT ตามหัวข้อภาพธงข้างต้น ลิงก์ต้นทางตรึงรุ่นเดียวกันทุกไฟล์ ค่า `sha` เป็น Git blob SHA-1 ของไฟล์ต้นทางและสำเนาในเว็บ

| code | iso2 | ชื่อไทย | ไฟล์ในเว็บ | ต้นทาง | sha |
|---|---|---|---|---|---|
| AGO | ao | แองโกลา | [ao.svg](flags/ao.svg) | [SVG](https://github.com/lipis/flag-icons/blob/ac7e0eb3259eb62aa6100c435607e2fe03896a97/flags/4x3/ao.svg) | `b73b1ec5e45073af6e4d854881b9821bf83ffd83` |
| ALB | al | แอลเบเนีย | [al.svg](flags/al.svg) | [SVG](https://github.com/lipis/flag-icons/blob/ac7e0eb3259eb62aa6100c435607e2fe03896a97/flags/4x3/al.svg) | `e85d95f0f0a67d3d2fdd828c289a1c80210e7022` |
| ARE | ae | สหรัฐอาหรับเอมิเรตส์ | [ae.svg](flags/ae.svg) | [SVG](https://github.com/lipis/flag-icons/blob/ac7e0eb3259eb62aa6100c435607e2fe03896a97/flags/4x3/ae.svg) | `651ac8523d3d933827ccfbdf5dfd598e65bad442` |
| ARG | ar | อาร์เจนตินา | [ar.svg](flags/ar.svg) | [SVG](https://github.com/lipis/flag-icons/blob/ac7e0eb3259eb62aa6100c435607e2fe03896a97/flags/4x3/ar.svg) | `c753da103f3ceae0a975b6eda70c2776f7467c5f` |
| ARM | am | อาร์เมเนีย | [am.svg](flags/am.svg) | [SVG](https://github.com/lipis/flag-icons/blob/ac7e0eb3259eb62aa6100c435607e2fe03896a97/flags/4x3/am.svg) | `99fa4dc5979a45b249ca805c2a43d3a8c74841d2` |
| AUS | au | ออสเตรเลีย | [au.svg](flags/au.svg) | [SVG](https://github.com/lipis/flag-icons/blob/ac7e0eb3259eb62aa6100c435607e2fe03896a97/flags/4x3/au.svg) | `96e80768bb7084e490fd34ad626f40d5cea1ac7b` |
| AUT | at | ออสเตรีย | [at.svg](flags/at.svg) | [SVG](https://github.com/lipis/flag-icons/blob/ac7e0eb3259eb62aa6100c435607e2fe03896a97/flags/4x3/at.svg) | `9d2775c083280e98bcaa0fc8e136ebaef5984bf8` |
| AZE | az | อาเซอร์ไบจาน | [az.svg](flags/az.svg) | [SVG](https://github.com/lipis/flag-icons/blob/ac7e0eb3259eb62aa6100c435607e2fe03896a97/flags/4x3/az.svg) | `35575221104fccb01c19318bdb15b6247a4108d4` |
| BDI | bi | บุรุนดี | [bi.svg](flags/bi.svg) | [SVG](https://github.com/lipis/flag-icons/blob/ac7e0eb3259eb62aa6100c435607e2fe03896a97/flags/4x3/bi.svg) | `a4434a955fbcdb15e1b297cc46d884bc85cdec6c` |
| BEL | be | เบลเยียม | [be.svg](flags/be.svg) | [SVG](https://github.com/lipis/flag-icons/blob/ac7e0eb3259eb62aa6100c435607e2fe03896a97/flags/4x3/be.svg) | `ac706a0b5a148cb20a1bdecb79bb709d20455fa3` |
| BEN | bj | เบนิน | [bj.svg](flags/bj.svg) | [SVG](https://github.com/lipis/flag-icons/blob/ac7e0eb3259eb62aa6100c435607e2fe03896a97/flags/4x3/bj.svg) | `0846724d179abc3f815246236d220f6f43b9bd1a` |
| BFA | bf | บูร์กินาฟาโซ | [bf.svg](flags/bf.svg) | [SVG](https://github.com/lipis/flag-icons/blob/ac7e0eb3259eb62aa6100c435607e2fe03896a97/flags/4x3/bf.svg) | `09e53a8d5e83a6004c374f099e552ec938755ff6` |
| BGD | bd | บังกลาเทศ | [bd.svg](flags/bd.svg) | [SVG](https://github.com/lipis/flag-icons/blob/ac7e0eb3259eb62aa6100c435607e2fe03896a97/flags/4x3/bd.svg) | `16b794debd08294403b4e61c61a17ae02bfa0a44` |
| BGR | bg | บัลแกเรีย | [bg.svg](flags/bg.svg) | [SVG](https://github.com/lipis/flag-icons/blob/ac7e0eb3259eb62aa6100c435607e2fe03896a97/flags/4x3/bg.svg) | `af2d0d07c31e24fabc76bc7df026cfa046ac682e` |
| BHS | bs | บาฮามาส | [bs.svg](flags/bs.svg) | [SVG](https://github.com/lipis/flag-icons/blob/ac7e0eb3259eb62aa6100c435607e2fe03896a97/flags/4x3/bs.svg) | `5cc918e5ad40ee0af8f8d819ca3666f0e7026530` |
| BIH | ba | บอสเนียและเฮอร์เซโกวีนา | [ba.svg](flags/ba.svg) | [SVG](https://github.com/lipis/flag-icons/blob/ac7e0eb3259eb62aa6100c435607e2fe03896a97/flags/4x3/ba.svg) | `93bd9cf9378475a443d6f29b0708e932a685ae22` |
| BLR | by | เบลารุส | [by.svg](flags/by.svg) | [SVG](https://github.com/lipis/flag-icons/blob/ac7e0eb3259eb62aa6100c435607e2fe03896a97/flags/4x3/by.svg) | `948784ff17075fee77bd5abd4ae862f7bf9d0026` |
| BLZ | bz | เบลีซ | [bz.svg](flags/bz.svg) | [SVG](https://github.com/lipis/flag-icons/blob/ac7e0eb3259eb62aa6100c435607e2fe03896a97/flags/4x3/bz.svg) | `d81b16c23d446934aa0876086d8b1abeea833f9c` |
| BOL | bo | โบลิเวีย | [bo.svg](flags/bo.svg) | [SVG](https://github.com/lipis/flag-icons/blob/ac7e0eb3259eb62aa6100c435607e2fe03896a97/flags/4x3/bo.svg) | `7658e3f6c26dcb342aa0b8dc6664ebab386fb30e` |
| BRA | br | บราซิล | [br.svg](flags/br.svg) | [SVG](https://github.com/lipis/flag-icons/blob/ac7e0eb3259eb62aa6100c435607e2fe03896a97/flags/4x3/br.svg) | `719a763caaf7cc2b1809fe05b5f06e5f12e47393` |
| BRN | bn | บรูไน | [bn.svg](flags/bn.svg) | [SVG](https://github.com/lipis/flag-icons/blob/ac7e0eb3259eb62aa6100c435607e2fe03896a97/flags/4x3/bn.svg) | `f544c25e22728dc40004e88a009a49b8ab2a5118` |
| BTN | bt | ภูฏาน | [bt.svg](flags/bt.svg) | [SVG](https://github.com/lipis/flag-icons/blob/ac7e0eb3259eb62aa6100c435607e2fe03896a97/flags/4x3/bt.svg) | `20aef3a63b4dcbe769cc63bfc13c152df4102b4d` |
| BWA | bw | บอตสวานา | [bw.svg](flags/bw.svg) | [SVG](https://github.com/lipis/flag-icons/blob/ac7e0eb3259eb62aa6100c435607e2fe03896a97/flags/4x3/bw.svg) | `3435608d6c0daa48ae4a042eee336f58b9886bb9` |
| CAF | cf | สาธารณรัฐแอฟริกากลาง | [cf.svg](flags/cf.svg) | [SVG](https://github.com/lipis/flag-icons/blob/ac7e0eb3259eb62aa6100c435607e2fe03896a97/flags/4x3/cf.svg) | `a6cd3670f27279db2138f14ab185f1ac44ed3c64` |
| CAN | ca | แคนาดา | [ca.svg](flags/ca.svg) | [SVG](https://github.com/lipis/flag-icons/blob/ac7e0eb3259eb62aa6100c435607e2fe03896a97/flags/4x3/ca.svg) | `c9b23b4988b326e10be7508e91919fd1d29ec852` |
| CHE | ch | สวิตเซอร์แลนด์ | [ch.svg](flags/ch.svg) | [SVG](https://github.com/lipis/flag-icons/blob/ac7e0eb3259eb62aa6100c435607e2fe03896a97/flags/4x3/ch.svg) | `b42d6709cfaf22e773bc7aa5da7095eff742873e` |
| CHL | cl | ชิลี | [cl.svg](flags/cl.svg) | [SVG](https://github.com/lipis/flag-icons/blob/ac7e0eb3259eb62aa6100c435607e2fe03896a97/flags/4x3/cl.svg) | `5b3c72fa7c26f80593b0757227deb9c4b77bdf34` |
| CHN | cn | จีน | [cn.svg](flags/cn.svg) | [SVG](https://github.com/lipis/flag-icons/blob/ac7e0eb3259eb62aa6100c435607e2fe03896a97/flags/4x3/cn.svg) | `10d3489a0e60176c4db839ad958facf76717cbd1` |
| CIV | ci | ไอวอรีโคสต์ | [ci.svg](flags/ci.svg) | [SVG](https://github.com/lipis/flag-icons/blob/ac7e0eb3259eb62aa6100c435607e2fe03896a97/flags/4x3/ci.svg) | `4eb884d9ce66228fd23dd59ba934fb9331780d6a` |
| CMR | cm | แคเมอรูน | [cm.svg](flags/cm.svg) | [SVG](https://github.com/lipis/flag-icons/blob/ac7e0eb3259eb62aa6100c435607e2fe03896a97/flags/4x3/cm.svg) | `70adc8b6818f844e2015f0b76953d4519de585fa` |
| COD | cd | คองโก (กินชาซา) | [cd.svg](flags/cd.svg) | [SVG](https://github.com/lipis/flag-icons/blob/ac7e0eb3259eb62aa6100c435607e2fe03896a97/flags/4x3/cd.svg) | `b9cf528941371b9cc973bdc5de2bb02425fefad1` |
| COG | cg | คองโก (บราซซาวิล) | [cg.svg](flags/cg.svg) | [SVG](https://github.com/lipis/flag-icons/blob/ac7e0eb3259eb62aa6100c435607e2fe03896a97/flags/4x3/cg.svg) | `f5a0e42d4595ffca08ac64ab1188221cf01f5ee7` |
| COL | co | โคลอมเบีย | [co.svg](flags/co.svg) | [SVG](https://github.com/lipis/flag-icons/blob/ac7e0eb3259eb62aa6100c435607e2fe03896a97/flags/4x3/co.svg) | `ebd0a0fb2d4b374a6e3f6722436bd54ea89e0520` |
| CRI | cr | คอสตาริกา | [cr.svg](flags/cr.svg) | [SVG](https://github.com/lipis/flag-icons/blob/ac7e0eb3259eb62aa6100c435607e2fe03896a97/flags/4x3/cr.svg) | `5a409eebb25d8b72ff39b435bda8c22b6c0115e1` |
| CUB | cu | คิวบา | [cu.svg](flags/cu.svg) | [SVG](https://github.com/lipis/flag-icons/blob/ac7e0eb3259eb62aa6100c435607e2fe03896a97/flags/4x3/cu.svg) | `053c9ee3a0296e8594867aaea12b229ad609d0ee` |
| CYP | cy | ไซปรัส | [cy.svg](flags/cy.svg) | [SVG](https://github.com/lipis/flag-icons/blob/ac7e0eb3259eb62aa6100c435607e2fe03896a97/flags/4x3/cy.svg) | `ee4b0c78c285555b9e011ebb0356956bf10e97c3` |
| CZE | cz | เช็กเกีย | [cz.svg](flags/cz.svg) | [SVG](https://github.com/lipis/flag-icons/blob/ac7e0eb3259eb62aa6100c435607e2fe03896a97/flags/4x3/cz.svg) | `7913de3895e8c149a00419187aa0fee16fd0325e` |
| DEU | de | เยอรมนี | [de.svg](flags/de.svg) | [SVG](https://github.com/lipis/flag-icons/blob/ac7e0eb3259eb62aa6100c435607e2fe03896a97/flags/4x3/de.svg) | `71aa2d2c30f576d3577b5c93c7cc2cc9de740da7` |
| DJI | dj | จิบูตี | [dj.svg](flags/dj.svg) | [SVG](https://github.com/lipis/flag-icons/blob/ac7e0eb3259eb62aa6100c435607e2fe03896a97/flags/4x3/dj.svg) | `9b00a82056625e86235dc988080d3c142f9dbcca` |
| DNK | dk | เดนมาร์ก | [dk.svg](flags/dk.svg) | [SVG](https://github.com/lipis/flag-icons/blob/ac7e0eb3259eb62aa6100c435607e2fe03896a97/flags/4x3/dk.svg) | `563277f81d904ddf48573466c018c914d693bf6a` |
| DOM | do | สาธารณรัฐโดมินิกัน | [do.svg](flags/do.svg) | [SVG](https://github.com/lipis/flag-icons/blob/ac7e0eb3259eb62aa6100c435607e2fe03896a97/flags/4x3/do.svg) | `78c2e161edc4aead4d3877fb8d9b9bc69680cab1` |
| DZA | dz | แอลจีเรีย | [dz.svg](flags/dz.svg) | [SVG](https://github.com/lipis/flag-icons/blob/ac7e0eb3259eb62aa6100c435607e2fe03896a97/flags/4x3/dz.svg) | `5ff29a74a00be5f65b5219b35ca6caaa6399e87f` |
| ECU | ec | เอกวาดอร์ | [ec.svg](flags/ec.svg) | [SVG](https://github.com/lipis/flag-icons/blob/ac7e0eb3259eb62aa6100c435607e2fe03896a97/flags/4x3/ec.svg) | `88c50bf616564c5ed2d5d895572d4f54fcc9b29b` |
| EGY | eg | อียิปต์ | [eg.svg](flags/eg.svg) | [SVG](https://github.com/lipis/flag-icons/blob/ac7e0eb3259eb62aa6100c435607e2fe03896a97/flags/4x3/eg.svg) | `909f1e7a8f6543531e4f94cc22197f7ae09e68c7` |
| ERI | er | เอริเทรีย | [er.svg](flags/er.svg) | [SVG](https://github.com/lipis/flag-icons/blob/ac7e0eb3259eb62aa6100c435607e2fe03896a97/flags/4x3/er.svg) | `48a13b47fe6ab02a2e21693e8c5b2d2baaa2ce89` |
| ESP | es | สเปน | [es.svg](flags/es.svg) | [SVG](https://github.com/lipis/flag-icons/blob/ac7e0eb3259eb62aa6100c435607e2fe03896a97/flags/4x3/es.svg) | `a296ebf7e186054afaa06f6a27991aa1b569a5a8` |
| EST | ee | เอสโตเนีย | [ee.svg](flags/ee.svg) | [SVG](https://github.com/lipis/flag-icons/blob/ac7e0eb3259eb62aa6100c435607e2fe03896a97/flags/4x3/ee.svg) | `8b98c2c429bc94f6adca7aa099a18b8ab1b8fdd3` |
| ETH | et | เอธิโอเปีย | [et.svg](flags/et.svg) | [SVG](https://github.com/lipis/flag-icons/blob/ac7e0eb3259eb62aa6100c435607e2fe03896a97/flags/4x3/et.svg) | `518100c1d061e31c32deb67137e175c5552a41c2` |
| FIN | fi | ฟินแลนด์ | [fi.svg](flags/fi.svg) | [SVG](https://github.com/lipis/flag-icons/blob/ac7e0eb3259eb62aa6100c435607e2fe03896a97/flags/4x3/fi.svg) | `470be2d07c9df2cbedfde2f27fa42cb3a59d3657` |
| FJI | fj | ฟิจิ | [fj.svg](flags/fj.svg) | [SVG](https://github.com/lipis/flag-icons/blob/ac7e0eb3259eb62aa6100c435607e2fe03896a97/flags/4x3/fj.svg) | `332ae61d0b8a0ed313c3236f07884154f0e58a17` |
| FRA | fr | ฝรั่งเศส | [fr.svg](flags/fr.svg) | [SVG](https://github.com/lipis/flag-icons/blob/ac7e0eb3259eb62aa6100c435607e2fe03896a97/flags/4x3/fr.svg) | `e682b90020218ddd39df6f81497f14b04bdacbda` |
| GAB | ga | กาบอง | [ga.svg](flags/ga.svg) | [SVG](https://github.com/lipis/flag-icons/blob/ac7e0eb3259eb62aa6100c435607e2fe03896a97/flags/4x3/ga.svg) | `76edab429c29ee1818c8451da065df5cdd822cb1` |
| GBR | gb | สหราชอาณาจักร | [gb.svg](flags/gb.svg) | [SVG](https://github.com/lipis/flag-icons/blob/ac7e0eb3259eb62aa6100c435607e2fe03896a97/flags/4x3/gb.svg) | `799138319d8446a6407a3448185559f20b9e3415` |
| GEO | ge | จอร์เจีย | [ge.svg](flags/ge.svg) | [SVG](https://github.com/lipis/flag-icons/blob/ac7e0eb3259eb62aa6100c435607e2fe03896a97/flags/4x3/ge.svg) | `ab08a9ab4234ea1fb156a10c495984d4d5022ae2` |
| GHA | gh | กานา | [gh.svg](flags/gh.svg) | [SVG](https://github.com/lipis/flag-icons/blob/ac7e0eb3259eb62aa6100c435607e2fe03896a97/flags/4x3/gh.svg) | `5c3e3e69abef991bccb41ccb60a9e1a3023dc574` |
| GIN | gn | กินี | [gn.svg](flags/gn.svg) | [SVG](https://github.com/lipis/flag-icons/blob/ac7e0eb3259eb62aa6100c435607e2fe03896a97/flags/4x3/gn.svg) | `40d6ad4f03dbd66bd713bad8595fb88dc0d55d73` |
| GMB | gm | แกมเบีย | [gm.svg](flags/gm.svg) | [SVG](https://github.com/lipis/flag-icons/blob/ac7e0eb3259eb62aa6100c435607e2fe03896a97/flags/4x3/gm.svg) | `8fe9d669204c288298d69d08ab52e3739632fbeb` |
| GNB | gw | กินี-บิสเซา | [gw.svg](flags/gw.svg) | [SVG](https://github.com/lipis/flag-icons/blob/ac7e0eb3259eb62aa6100c435607e2fe03896a97/flags/4x3/gw.svg) | `d470bac9f71b82867e76cdb528c0c2808307df94` |
| GNQ | gq | อิเควทอเรียลกินี | [gq.svg](flags/gq.svg) | [SVG](https://github.com/lipis/flag-icons/blob/ac7e0eb3259eb62aa6100c435607e2fe03896a97/flags/4x3/gq.svg) | `64c8eb220a3049dc6162cc4298a06154dfaddd1b` |
| GRC | gr | กรีซ | [gr.svg](flags/gr.svg) | [SVG](https://github.com/lipis/flag-icons/blob/ac7e0eb3259eb62aa6100c435607e2fe03896a97/flags/4x3/gr.svg) | `599741eec82f5c8729cfa503f552c9f781f5625b` |
| GTM | gt | กัวเตมาลา | [gt.svg](flags/gt.svg) | [SVG](https://github.com/lipis/flag-icons/blob/ac7e0eb3259eb62aa6100c435607e2fe03896a97/flags/4x3/gt.svg) | `7df9df57926714b70be3d47e81b2d13b150834ba` |
| GUY | gy | กายอานา | [gy.svg](flags/gy.svg) | [SVG](https://github.com/lipis/flag-icons/blob/ac7e0eb3259eb62aa6100c435607e2fe03896a97/flags/4x3/gy.svg) | `569fb562759edd11a7ba270c83c752f03be5c042` |
| HND | hn | ฮอนดูรัส | [hn.svg](flags/hn.svg) | [SVG](https://github.com/lipis/flag-icons/blob/ac7e0eb3259eb62aa6100c435607e2fe03896a97/flags/4x3/hn.svg) | `11fde67db930e5cfeae9fc1ba2865b1e91a825e5` |
| HRV | hr | โครเอเชีย | [hr.svg](flags/hr.svg) | [SVG](https://github.com/lipis/flag-icons/blob/ac7e0eb3259eb62aa6100c435607e2fe03896a97/flags/4x3/hr.svg) | `b1a6b8341208459ebd81ac227a7a33b615d74c55` |
| HTI | ht | เฮติ | [ht.svg](flags/ht.svg) | [SVG](https://github.com/lipis/flag-icons/blob/ac7e0eb3259eb62aa6100c435607e2fe03896a97/flags/4x3/ht.svg) | `8e8efc46b9a9a5418d40e3ba2d31f7a277e4e431` |
| HUN | hu | ฮังการี | [hu.svg](flags/hu.svg) | [SVG](https://github.com/lipis/flag-icons/blob/ac7e0eb3259eb62aa6100c435607e2fe03896a97/flags/4x3/hu.svg) | `24fbfb965888e2c2f66899dd89942f2e47ca5187` |
| IDN | id | อินโดนีเซีย | [id.svg](flags/id.svg) | [SVG](https://github.com/lipis/flag-icons/blob/ac7e0eb3259eb62aa6100c435607e2fe03896a97/flags/4x3/id.svg) | `3b7c8fcfd96578480474bf942e1a0adb604dde0f` |
| IND | in | อินเดีย | [in.svg](flags/in.svg) | [SVG](https://github.com/lipis/flag-icons/blob/ac7e0eb3259eb62aa6100c435607e2fe03896a97/flags/4x3/in.svg) | `bc47d74911bb32886aa9c611feb36e6fc54ff850` |
| IRL | ie | ไอร์แลนด์ | [ie.svg](flags/ie.svg) | [SVG](https://github.com/lipis/flag-icons/blob/ac7e0eb3259eb62aa6100c435607e2fe03896a97/flags/4x3/ie.svg) | `049be14de14f4f67419f3c5e2f0c5d022b74ca39` |
| IRN | ir | อิหร่าน | [ir.svg](flags/ir.svg) | [SVG](https://github.com/lipis/flag-icons/blob/ac7e0eb3259eb62aa6100c435607e2fe03896a97/flags/4x3/ir.svg) | `8c6d516216991dea851ae9c2be9e65cd86d8783a` |
| IRQ | iq | อิรัก | [iq.svg](flags/iq.svg) | [SVG](https://github.com/lipis/flag-icons/blob/ac7e0eb3259eb62aa6100c435607e2fe03896a97/flags/4x3/iq.svg) | `804451474adb04b36660de45e082b6c758f8b7b5` |
| ISL | is | ไอซ์แลนด์ | [is.svg](flags/is.svg) | [SVG](https://github.com/lipis/flag-icons/blob/ac7e0eb3259eb62aa6100c435607e2fe03896a97/flags/4x3/is.svg) | `a6588afaefd01855a9e5587e0fb52737e03c50bd` |
| ISR | il | อิสราเอล | [il.svg](flags/il.svg) | [SVG](https://github.com/lipis/flag-icons/blob/ac7e0eb3259eb62aa6100c435607e2fe03896a97/flags/4x3/il.svg) | `f43be7e8ed7ae29d324f7f1aa0d46528e2a5c3af` |
| ITA | it | อิตาลี | [it.svg](flags/it.svg) | [SVG](https://github.com/lipis/flag-icons/blob/ac7e0eb3259eb62aa6100c435607e2fe03896a97/flags/4x3/it.svg) | `20a8bfdcc802296c682866e18c41a74fbaa702fd` |
| JAM | jm | จาเมกา | [jm.svg](flags/jm.svg) | [SVG](https://github.com/lipis/flag-icons/blob/ac7e0eb3259eb62aa6100c435607e2fe03896a97/flags/4x3/jm.svg) | `269df03836848d552789f9ea6a35ef0993694778` |
| JOR | jo | จอร์แดน | [jo.svg](flags/jo.svg) | [SVG](https://github.com/lipis/flag-icons/blob/ac7e0eb3259eb62aa6100c435607e2fe03896a97/flags/4x3/jo.svg) | `d6f927d44f21a21f3c6c23e67fbe144541d5ba66` |
| JPN | jp | ญี่ปุ่น | [jp.svg](flags/jp.svg) | [SVG](https://github.com/lipis/flag-icons/blob/ac7e0eb3259eb62aa6100c435607e2fe03896a97/flags/4x3/jp.svg) | `cc1c181ce9b2c22b5d29d04d7858d4d6ed0c878c` |
| KAZ | kz | คาซัคสถาน | [kz.svg](flags/kz.svg) | [SVG](https://github.com/lipis/flag-icons/blob/ac7e0eb3259eb62aa6100c435607e2fe03896a97/flags/4x3/kz.svg) | `2fac45bda64a3d840bf898708340cc6ee0d382be` |
| KEN | ke | เคนยา | [ke.svg](flags/ke.svg) | [SVG](https://github.com/lipis/flag-icons/blob/ac7e0eb3259eb62aa6100c435607e2fe03896a97/flags/4x3/ke.svg) | `3a67ca3ccd48b1e0fe01fd4741711d462395006d` |
| KGZ | kg | คีร์กีซสถาน | [kg.svg](flags/kg.svg) | [SVG](https://github.com/lipis/flag-icons/blob/ac7e0eb3259eb62aa6100c435607e2fe03896a97/flags/4x3/kg.svg) | `e26db95356b64999faa48d6b5fca6d8742e7d512` |
| KHM | kh | กัมพูชา | [kh.svg](flags/kh.svg) | [SVG](https://github.com/lipis/flag-icons/blob/ac7e0eb3259eb62aa6100c435607e2fe03896a97/flags/4x3/kh.svg) | `a7d52f2cb41c6b5c83316cdb0c672adf01c44d10` |
| KOR | kr | เกาหลีใต้ | [kr.svg](flags/kr.svg) | [SVG](https://github.com/lipis/flag-icons/blob/ac7e0eb3259eb62aa6100c435607e2fe03896a97/flags/4x3/kr.svg) | `6947eab2b3902872175f81d84f6966e170083c0d` |
| KWT | kw | คูเวต | [kw.svg](flags/kw.svg) | [SVG](https://github.com/lipis/flag-icons/blob/ac7e0eb3259eb62aa6100c435607e2fe03896a97/flags/4x3/kw.svg) | `3dd89e9962e65164e4ed41a305f71a1afe027085` |
| LAO | la | ลาว | [la.svg](flags/la.svg) | [SVG](https://github.com/lipis/flag-icons/blob/ac7e0eb3259eb62aa6100c435607e2fe03896a97/flags/4x3/la.svg) | `6aea6b72b4050a3e7bf89f4dd545fdb67ef334f4` |
| LBN | lb | เลบานอน | [lb.svg](flags/lb.svg) | [SVG](https://github.com/lipis/flag-icons/blob/ac7e0eb3259eb62aa6100c435607e2fe03896a97/flags/4x3/lb.svg) | `bde2581d2b1eb934cf913c203969f7f2b0f8ca8a` |
| LBR | lr | ไลบีเรีย | [lr.svg](flags/lr.svg) | [SVG](https://github.com/lipis/flag-icons/blob/ac7e0eb3259eb62aa6100c435607e2fe03896a97/flags/4x3/lr.svg) | `e482ab9d749d63d64cdf337158a2ead10a235d0a` |
| LBY | ly | ลิเบีย | [ly.svg](flags/ly.svg) | [SVG](https://github.com/lipis/flag-icons/blob/ac7e0eb3259eb62aa6100c435607e2fe03896a97/flags/4x3/ly.svg) | `1eaa51e468b7ed416ae8c332d8310feda761fa41` |
| LKA | lk | ศรีลังกา | [lk.svg](flags/lk.svg) | [SVG](https://github.com/lipis/flag-icons/blob/ac7e0eb3259eb62aa6100c435607e2fe03896a97/flags/4x3/lk.svg) | `cbd660a54ac609f29fb6433dd3c637dab91c379f` |
| LSO | ls | เลโซโท | [ls.svg](flags/ls.svg) | [SVG](https://github.com/lipis/flag-icons/blob/ac7e0eb3259eb62aa6100c435607e2fe03896a97/flags/4x3/ls.svg) | `a7c01a98ffc7cac85a3db0ca42fc8297d7642273` |
| LTU | lt | ลิทัวเนีย | [lt.svg](flags/lt.svg) | [SVG](https://github.com/lipis/flag-icons/blob/ac7e0eb3259eb62aa6100c435607e2fe03896a97/flags/4x3/lt.svg) | `90ec5d240e5e324254b093c8ce70f8d046db16f9` |
| LUX | lu | ลักเซมเบิร์ก | [lu.svg](flags/lu.svg) | [SVG](https://github.com/lipis/flag-icons/blob/ac7e0eb3259eb62aa6100c435607e2fe03896a97/flags/4x3/lu.svg) | `cc122068125c02693dee300ebec3909459ac50f7` |
| LVA | lv | ลัตเวีย | [lv.svg](flags/lv.svg) | [SVG](https://github.com/lipis/flag-icons/blob/ac7e0eb3259eb62aa6100c435607e2fe03896a97/flags/4x3/lv.svg) | `f6dececab891bd3420112183dbec9ee866ad3a1b` |
| MAR | ma | โมร็อกโก | [ma.svg](flags/ma.svg) | [SVG](https://github.com/lipis/flag-icons/blob/ac7e0eb3259eb62aa6100c435607e2fe03896a97/flags/4x3/ma.svg) | `7ce56eff707c288edbe3071bd8cb495c74dd307c` |
| MDA | md | มอลโดวา | [md.svg](flags/md.svg) | [SVG](https://github.com/lipis/flag-icons/blob/ac7e0eb3259eb62aa6100c435607e2fe03896a97/flags/4x3/md.svg) | `e9ba506a2ba85f099e2c11659d90994febde9aac` |
| MDG | mg | มาดากัสการ์ | [mg.svg](flags/mg.svg) | [SVG](https://github.com/lipis/flag-icons/blob/ac7e0eb3259eb62aa6100c435607e2fe03896a97/flags/4x3/mg.svg) | `5fa2d2440d5bfc07bf7863c6c8cbb9648053cc0a` |
| MEX | mx | เม็กซิโก | [mx.svg](flags/mx.svg) | [SVG](https://github.com/lipis/flag-icons/blob/ac7e0eb3259eb62aa6100c435607e2fe03896a97/flags/4x3/mx.svg) | `e3ec2bc596c05ef55ee501047b768a1702976e45` |
| MKD | mk | มาซิโดเนียเหนือ | [mk.svg](flags/mk.svg) | [SVG](https://github.com/lipis/flag-icons/blob/ac7e0eb3259eb62aa6100c435607e2fe03896a97/flags/4x3/mk.svg) | `4f5cae77ed60b6128d062ab55055290295359b77` |
| MLI | ml | มาลี | [ml.svg](flags/ml.svg) | [SVG](https://github.com/lipis/flag-icons/blob/ac7e0eb3259eb62aa6100c435607e2fe03896a97/flags/4x3/ml.svg) | `6f6b71695cbb3cb3f00e74d825faf95999fe768e` |
| MMR | mm | เมียนมา | [mm.svg](flags/mm.svg) | [SVG](https://github.com/lipis/flag-icons/blob/ac7e0eb3259eb62aa6100c435607e2fe03896a97/flags/4x3/mm.svg) | `42b4dee2b8ccb00e6dc5817cae1e73e18d1ab46a` |
| MNE | me | มอนเตเนโกร | [me.svg](flags/me.svg) | [SVG](https://github.com/lipis/flag-icons/blob/ac7e0eb3259eb62aa6100c435607e2fe03896a97/flags/4x3/me.svg) | `297888c7be5f223629d69c98ac7501043c42bbdf` |
| MNG | mn | มองโกเลีย | [mn.svg](flags/mn.svg) | [SVG](https://github.com/lipis/flag-icons/blob/ac7e0eb3259eb62aa6100c435607e2fe03896a97/flags/4x3/mn.svg) | `6a38a71fcf6c712461a5e85f6133bb365ae2a1bb` |
| MOZ | mz | โมซัมบิก | [mz.svg](flags/mz.svg) | [SVG](https://github.com/lipis/flag-icons/blob/ac7e0eb3259eb62aa6100c435607e2fe03896a97/flags/4x3/mz.svg) | `0f94c3a1aaa2320e891aa5e92b2c11362c770f47` |
| MRT | mr | มอริเตเนีย | [mr.svg](flags/mr.svg) | [SVG](https://github.com/lipis/flag-icons/blob/ac7e0eb3259eb62aa6100c435607e2fe03896a97/flags/4x3/mr.svg) | `d859972c5d61e8ec1d2aafb6d510f3518588ad03` |
| MWI | mw | มาลาวี | [mw.svg](flags/mw.svg) | [SVG](https://github.com/lipis/flag-icons/blob/ac7e0eb3259eb62aa6100c435607e2fe03896a97/flags/4x3/mw.svg) | `137ff87893c77827771b7ec781a1a78a8578a7f0` |
| MYS | my | มาเลเซีย | [my.svg](flags/my.svg) | [SVG](https://github.com/lipis/flag-icons/blob/ac7e0eb3259eb62aa6100c435607e2fe03896a97/flags/4x3/my.svg) | `115f864d8acfc6776feb20d64b9bf852cd32e8e0` |
| NAM | na | นามิเบีย | [na.svg](flags/na.svg) | [SVG](https://github.com/lipis/flag-icons/blob/ac7e0eb3259eb62aa6100c435607e2fe03896a97/flags/4x3/na.svg) | `35b9f783e155a4e380086dc7a8f34ad46f47963d` |
| NER | ne | ไนเจอร์ | [ne.svg](flags/ne.svg) | [SVG](https://github.com/lipis/flag-icons/blob/ac7e0eb3259eb62aa6100c435607e2fe03896a97/flags/4x3/ne.svg) | `39a82b827744d08b7013215ba2f139c9180d1bf7` |
| NGA | ng | ไนจีเรีย | [ng.svg](flags/ng.svg) | [SVG](https://github.com/lipis/flag-icons/blob/ac7e0eb3259eb62aa6100c435607e2fe03896a97/flags/4x3/ng.svg) | `81eb35f78eb16c26e25ffcb36f9f65720d062b6a` |
| NIC | ni | นิการากัว | [ni.svg](flags/ni.svg) | [SVG](https://github.com/lipis/flag-icons/blob/ac7e0eb3259eb62aa6100c435607e2fe03896a97/flags/4x3/ni.svg) | `e4861f5abaaf19c3c45d7df7208381c9beaaba0f` |
| NLD | nl | เนเธอร์แลนด์ | [nl.svg](flags/nl.svg) | [SVG](https://github.com/lipis/flag-icons/blob/ac7e0eb3259eb62aa6100c435607e2fe03896a97/flags/4x3/nl.svg) | `e90f5b03511fe47d56930eea41341521579dc8fc` |
| NOR | no | นอร์เวย์ | [no.svg](flags/no.svg) | [SVG](https://github.com/lipis/flag-icons/blob/ac7e0eb3259eb62aa6100c435607e2fe03896a97/flags/4x3/no.svg) | `a5f2a152a932b85e30cfc1921325da0e300a75bb` |
| NPL | np | เนปาล | [np.svg](flags/np.svg) | [SVG](https://github.com/lipis/flag-icons/blob/ac7e0eb3259eb62aa6100c435607e2fe03896a97/flags/4x3/np.svg) | `624285684531217f6a9e99a98ca756965f4c5251` |
| NZL | nz | นิวซีแลนด์ | [nz.svg](flags/nz.svg) | [SVG](https://github.com/lipis/flag-icons/blob/ac7e0eb3259eb62aa6100c435607e2fe03896a97/flags/4x3/nz.svg) | `935d8a749d943341ee885010bf1c31bd59809ab3` |
| OMN | om | โอมาน | [om.svg](flags/om.svg) | [SVG](https://github.com/lipis/flag-icons/blob/ac7e0eb3259eb62aa6100c435607e2fe03896a97/flags/4x3/om.svg) | `4f1461a000c837da726a8501670e6dc4aeaabcd1` |
| PAK | pk | ปากีสถาน | [pk.svg](flags/pk.svg) | [SVG](https://github.com/lipis/flag-icons/blob/ac7e0eb3259eb62aa6100c435607e2fe03896a97/flags/4x3/pk.svg) | `4ddc19f8eaa824f521c01437355fc90e14b05d9d` |
| PAN | pa | ปานามา | [pa.svg](flags/pa.svg) | [SVG](https://github.com/lipis/flag-icons/blob/ac7e0eb3259eb62aa6100c435607e2fe03896a97/flags/4x3/pa.svg) | `9ab733f4b548825e3c553d2de4ba7767137b7d6e` |
| PER | pe | เปรู | [pe.svg](flags/pe.svg) | [SVG](https://github.com/lipis/flag-icons/blob/ac7e0eb3259eb62aa6100c435607e2fe03896a97/flags/4x3/pe.svg) | `33e6cfd417813982f050488d6256c160185adeaf` |
| PHL | ph | ฟิลิปปินส์ | [ph.svg](flags/ph.svg) | [SVG](https://github.com/lipis/flag-icons/blob/ac7e0eb3259eb62aa6100c435607e2fe03896a97/flags/4x3/ph.svg) | `b910e24cd2292aacdab5731a0ddf17e3f6b42304` |
| PNG | pg | ปาปัวนิวกินี | [pg.svg](flags/pg.svg) | [SVG](https://github.com/lipis/flag-icons/blob/ac7e0eb3259eb62aa6100c435607e2fe03896a97/flags/4x3/pg.svg) | `7b7e77aad4a512ca0f47d050f6c89d627a47d352` |
| POL | pl | โปแลนด์ | [pl.svg](flags/pl.svg) | [SVG](https://github.com/lipis/flag-icons/blob/ac7e0eb3259eb62aa6100c435607e2fe03896a97/flags/4x3/pl.svg) | `42d2b0ce19161bc528e6f20f2d37691c98f8e366` |
| PRK | kp | เกาหลีเหนือ | [kp.svg](flags/kp.svg) | [SVG](https://github.com/lipis/flag-icons/blob/ac7e0eb3259eb62aa6100c435607e2fe03896a97/flags/4x3/kp.svg) | `ad1b713f16ecc8b1bc06a391568ded01f627d73d` |
| PRT | pt | โปรตุเกส | [pt.svg](flags/pt.svg) | [SVG](https://github.com/lipis/flag-icons/blob/ac7e0eb3259eb62aa6100c435607e2fe03896a97/flags/4x3/pt.svg) | `2767cd4e9faa0beec0593e039b899f78c1831fcb` |
| PRY | py | ปารากวัย | [py.svg](flags/py.svg) | [SVG](https://github.com/lipis/flag-icons/blob/ac7e0eb3259eb62aa6100c435607e2fe03896a97/flags/4x3/py.svg) | `abccd87994c05b81c6fa410bc5fa7b9312675127` |
| QAT | qa | กาตาร์ | [qa.svg](flags/qa.svg) | [SVG](https://github.com/lipis/flag-icons/blob/ac7e0eb3259eb62aa6100c435607e2fe03896a97/flags/4x3/qa.svg) | `901f3fa761a3b90598f952e7a321ad71ca7e793d` |
| ROU | ro | โรมาเนีย | [ro.svg](flags/ro.svg) | [SVG](https://github.com/lipis/flag-icons/blob/ac7e0eb3259eb62aa6100c435607e2fe03896a97/flags/4x3/ro.svg) | `fda0f7bec91d8e31052993b16b794edea4de2f95` |
| RUS | ru | รัสเซีย | [ru.svg](flags/ru.svg) | [SVG](https://github.com/lipis/flag-icons/blob/ac7e0eb3259eb62aa6100c435607e2fe03896a97/flags/4x3/ru.svg) | `cf243011ae99e45cb43edf4ca6b7c51e08419c4c` |
| RWA | rw | รวันดา | [rw.svg](flags/rw.svg) | [SVG](https://github.com/lipis/flag-icons/blob/ac7e0eb3259eb62aa6100c435607e2fe03896a97/flags/4x3/rw.svg) | `06e26ae44e4ef16948b32f246c5aafded2982635` |
| SAU | sa | ซาอุดีอาระเบีย | [sa.svg](flags/sa.svg) | [SVG](https://github.com/lipis/flag-icons/blob/ac7e0eb3259eb62aa6100c435607e2fe03896a97/flags/4x3/sa.svg) | `596cf48bb7b6005ba3fb4da6d9d6ae0b6451fa0b` |
| SDN | sd | ซูดาน | [sd.svg](flags/sd.svg) | [SVG](https://github.com/lipis/flag-icons/blob/ac7e0eb3259eb62aa6100c435607e2fe03896a97/flags/4x3/sd.svg) | `12818b4110dbe25327131f9ec898aa2e73b85fc6` |
| SEN | sn | เซเนกัล | [sn.svg](flags/sn.svg) | [SVG](https://github.com/lipis/flag-icons/blob/ac7e0eb3259eb62aa6100c435607e2fe03896a97/flags/4x3/sn.svg) | `ba8606559120bf0cca396d8d81888f8cad0e75fd` |
| SLB | sb | หมู่เกาะโซโลมอน | [sb.svg](flags/sb.svg) | [SVG](https://github.com/lipis/flag-icons/blob/ac7e0eb3259eb62aa6100c435607e2fe03896a97/flags/4x3/sb.svg) | `6066f94cd1170ea93e50e657c649e1ae75dbeea1` |
| SLE | sl | เซียร์ราลีโอน | [sl.svg](flags/sl.svg) | [SVG](https://github.com/lipis/flag-icons/blob/ac7e0eb3259eb62aa6100c435607e2fe03896a97/flags/4x3/sl.svg) | `a07baf75b40f2cbd4fc060ecf2043590c63146d1` |
| SLV | sv | เอลซัลวาดอร์ | [sv.svg](flags/sv.svg) | [SVG](https://github.com/lipis/flag-icons/blob/ac7e0eb3259eb62aa6100c435607e2fe03896a97/flags/4x3/sv.svg) | `cbc674a6e7c4ec288026a85d06876121ce0e69a4` |
| SOM | so | โซมาเลีย | [so.svg](flags/so.svg) | [SVG](https://github.com/lipis/flag-icons/blob/ac7e0eb3259eb62aa6100c435607e2fe03896a97/flags/4x3/so.svg) | `a581ac63cfaf2f58a7b5c685f620188d2c7ce826` |
| SRB | rs | เซอร์เบีย | [rs.svg](flags/rs.svg) | [SVG](https://github.com/lipis/flag-icons/blob/ac7e0eb3259eb62aa6100c435607e2fe03896a97/flags/4x3/rs.svg) | `6d4f74d7671194c6bcc9ef761f203b23805cace2` |
| SSD | ss | ซูดานใต้ | [ss.svg](flags/ss.svg) | [SVG](https://github.com/lipis/flag-icons/blob/ac7e0eb3259eb62aa6100c435607e2fe03896a97/flags/4x3/ss.svg) | `b257aa0b3e505f31f93446067b59bef8a033c58c` |
| SUR | sr | ซูรินาม | [sr.svg](flags/sr.svg) | [SVG](https://github.com/lipis/flag-icons/blob/ac7e0eb3259eb62aa6100c435607e2fe03896a97/flags/4x3/sr.svg) | `5e71c400262bac42b8f8fdd36c9a789e78c5a13b` |
| SVK | sk | สโลวาเกีย | [sk.svg](flags/sk.svg) | [SVG](https://github.com/lipis/flag-icons/blob/ac7e0eb3259eb62aa6100c435607e2fe03896a97/flags/4x3/sk.svg) | `676018e6284fcfed6c878552ef1e662fac4395dd` |
| SVN | si | สโลวีเนีย | [si.svg](flags/si.svg) | [SVG](https://github.com/lipis/flag-icons/blob/ac7e0eb3259eb62aa6100c435607e2fe03896a97/flags/4x3/si.svg) | `1bbdd94fd25406e21c452a2a905343f3298672cf` |
| SWE | se | สวีเดน | [se.svg](flags/se.svg) | [SVG](https://github.com/lipis/flag-icons/blob/ac7e0eb3259eb62aa6100c435607e2fe03896a97/flags/4x3/se.svg) | `8ba745acaf2231a519e658852e8ef874dbeb8dc7` |
| SWZ | sz | เอสวาตีนี | [sz.svg](flags/sz.svg) | [SVG](https://github.com/lipis/flag-icons/blob/ac7e0eb3259eb62aa6100c435607e2fe03896a97/flags/4x3/sz.svg) | `eb538e4476350ce9984091c289c44b5cc68b2742` |
| SYR | sy | ซีเรีย | [sy.svg](flags/sy.svg) | [SVG](https://github.com/lipis/flag-icons/blob/ac7e0eb3259eb62aa6100c435607e2fe03896a97/flags/4x3/sy.svg) | `97c05cfc93b1e68d3336507be6f885a52d353252` |
| TCD | td | ชาด | [td.svg](flags/td.svg) | [SVG](https://github.com/lipis/flag-icons/blob/ac7e0eb3259eb62aa6100c435607e2fe03896a97/flags/4x3/td.svg) | `fa3bd927c1580108677d5936898ebd9d87737d09` |
| TGO | tg | โตโก | [tg.svg](flags/tg.svg) | [SVG](https://github.com/lipis/flag-icons/blob/ac7e0eb3259eb62aa6100c435607e2fe03896a97/flags/4x3/tg.svg) | `9d6ea6c5d4882291e63193b8e878910ef13cf9b7` |
| THA | th | ไทย | [th.svg](flags/th.svg) | [SVG](https://github.com/lipis/flag-icons/blob/ac7e0eb3259eb62aa6100c435607e2fe03896a97/flags/4x3/th.svg) | `1e93a61e95bfe4bd0494ffa27d24dc4fd798eb95` |
| TJK | tj | ทาจิกิสถาน | [tj.svg](flags/tj.svg) | [SVG](https://github.com/lipis/flag-icons/blob/ac7e0eb3259eb62aa6100c435607e2fe03896a97/flags/4x3/tj.svg) | `f8c9a0371cb0311a340f5fb9fb327885a01f1851` |
| TKM | tm | เติร์กเมนิสถาน | [tm.svg](flags/tm.svg) | [SVG](https://github.com/lipis/flag-icons/blob/ac7e0eb3259eb62aa6100c435607e2fe03896a97/flags/4x3/tm.svg) | `4154ed765cfc20762704c5b0da3e8c95b36cb75c` |
| TLS | tl | ติมอร์-เลสเต | [tl.svg](flags/tl.svg) | [SVG](https://github.com/lipis/flag-icons/blob/ac7e0eb3259eb62aa6100c435607e2fe03896a97/flags/4x3/tl.svg) | `3d0701a2c8c8da8ee7b7736c49aa6a551c0d5a93` |
| TTO | tt | ตรินิแดดและโตเบโก | [tt.svg](flags/tt.svg) | [SVG](https://github.com/lipis/flag-icons/blob/ac7e0eb3259eb62aa6100c435607e2fe03896a97/flags/4x3/tt.svg) | `bc24938cf8ead7002e283b29f70b8d34ff5e8607` |
| TUN | tn | ตูนิเซีย | [tn.svg](flags/tn.svg) | [SVG](https://github.com/lipis/flag-icons/blob/ac7e0eb3259eb62aa6100c435607e2fe03896a97/flags/4x3/tn.svg) | `5735c1984de39c02488cafaebbd34d91f79c93bf` |
| TUR | tr | ตุรกี | [tr.svg](flags/tr.svg) | [SVG](https://github.com/lipis/flag-icons/blob/ac7e0eb3259eb62aa6100c435607e2fe03896a97/flags/4x3/tr.svg) | `b96da21f0e98bfaeee3312cf938417bdc4ec2639` |
| TZA | tz | แทนซาเนีย | [tz.svg](flags/tz.svg) | [SVG](https://github.com/lipis/flag-icons/blob/ac7e0eb3259eb62aa6100c435607e2fe03896a97/flags/4x3/tz.svg) | `a2cfbca42aa2695c6a539fef2c4ee5c44f4f2114` |
| UGA | ug | ยูกันดา | [ug.svg](flags/ug.svg) | [SVG](https://github.com/lipis/flag-icons/blob/ac7e0eb3259eb62aa6100c435607e2fe03896a97/flags/4x3/ug.svg) | `520eee5c7c1f005c971bd114302f9cb0b844e8fa` |
| UKR | ua | ยูเครน | [ua.svg](flags/ua.svg) | [SVG](https://github.com/lipis/flag-icons/blob/ac7e0eb3259eb62aa6100c435607e2fe03896a97/flags/4x3/ua.svg) | `03daa196837a4c6194ee0d015a866943bc859079` |
| URY | uy | อุรุกวัย | [uy.svg](flags/uy.svg) | [SVG](https://github.com/lipis/flag-icons/blob/ac7e0eb3259eb62aa6100c435607e2fe03896a97/flags/4x3/uy.svg) | `62c36f8e5e68e03d24497629b1dc34a2955d9985` |
| USA | us | สหรัฐอเมริกา | [us.svg](flags/us.svg) | [SVG](https://github.com/lipis/flag-icons/blob/ac7e0eb3259eb62aa6100c435607e2fe03896a97/flags/4x3/us.svg) | `9cfd0c927f975b7afff364179c2b850e525236c3` |
| UZB | uz | อุซเบกิสถาน | [uz.svg](flags/uz.svg) | [SVG](https://github.com/lipis/flag-icons/blob/ac7e0eb3259eb62aa6100c435607e2fe03896a97/flags/4x3/uz.svg) | `0ccca1b1b4aa9cfaf14911a49e5a89dfac314d14` |
| VEN | ve | เวเนซุเอลา | [ve.svg](flags/ve.svg) | [SVG](https://github.com/lipis/flag-icons/blob/ac7e0eb3259eb62aa6100c435607e2fe03896a97/flags/4x3/ve.svg) | `314e7f5f7f53c3f069830afd15ec278b820f00b9` |
| VNM | vn | เวียดนาม | [vn.svg](flags/vn.svg) | [SVG](https://github.com/lipis/flag-icons/blob/ac7e0eb3259eb62aa6100c435607e2fe03896a97/flags/4x3/vn.svg) | `7e4bac8f4acf3a8dc4cda58e9a3696ca65f8e91e` |
| VUT | vu | วานูอาตู | [vu.svg](flags/vu.svg) | [SVG](https://github.com/lipis/flag-icons/blob/ac7e0eb3259eb62aa6100c435607e2fe03896a97/flags/4x3/vu.svg) | `5cd5ab575f319fe39d06fa3f2f0d5b3bb397924a` |
| YEM | ye | เยเมน | [ye.svg](flags/ye.svg) | [SVG](https://github.com/lipis/flag-icons/blob/ac7e0eb3259eb62aa6100c435607e2fe03896a97/flags/4x3/ye.svg) | `de7bd613ecd7e494d1ed3c3b1e0ec749e0efd915` |
| ZAF | za | แอฟริกาใต้ | [za.svg](flags/za.svg) | [SVG](https://github.com/lipis/flag-icons/blob/ac7e0eb3259eb62aa6100c435607e2fe03896a97/flags/4x3/za.svg) | `d563adb90c0c20b32d666b9903b8ad88722f1372` |
| ZMB | zm | แซมเบีย | [zm.svg](flags/zm.svg) | [SVG](https://github.com/lipis/flag-icons/blob/ac7e0eb3259eb62aa6100c435607e2fe03896a97/flags/4x3/zm.svg) | `360f37aa19db6a0f271ffb24130b4fa836a56c56` |
| ZWE | zw | ซิมบับเว | [zw.svg](flags/zw.svg) | [SVG](https://github.com/lipis/flag-icons/blob/ac7e0eb3259eb62aa6100c435607e2fe03896a97/flags/4x3/zw.svg) | `93aac4f6cf2d11335854da77e992cebb8df50695` |
