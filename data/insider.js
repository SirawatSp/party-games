// เกม Insider (จอมบงการ) — คลังคำลับแบ่งตามหมวด ให้ผู้นำ (Leader) เห็นคำคนเดียว
const INSIDER_WORDS = [
  { category: "สัตว์", word: "ยีราฟ" }, { category: "สัตว์", word: "เพนกวิน" },
  { category: "สัตว์", word: "จระเข้" }, { category: "สัตว์", word: "อูฐ" },
  { category: "สัตว์", word: "แมงกะพรุน" }, { category: "สัตว์", word: "ค้างคาว" },
  { category: "สัตว์", word: "เต่า" }, { category: "สัตว์", word: "กระต่าย" },
  { category: "สัตว์", word: "แมงป่อง" }, { category: "สัตว์", word: "นกกระจอกเทศ" },
  { category: "สัตว์", word: "ปลาหมึก" }, { category: "สัตว์", word: "หมี" },

  { category: "อาหาร", word: "ต้มยำกุ้ง" }, { category: "อาหาร", word: "ซูชิ" },
  { category: "อาหาร", word: "พิซซ่า" }, { category: "อาหาร", word: "ส้มตำ" },
  { category: "อาหาร", word: "หมูกระทะ" }, { category: "อาหาร", word: "ราเมง" },
  { category: "อาหาร", word: "แกงเขียวหวาน" }, { category: "อาหาร", word: "ข้าวผัด" },
  { category: "อาหาร", word: "สปาเก็ตตี้" }, { category: "อาหาร", word: "ทาโก้" },
  { category: "อาหาร", word: "เกี๊ยวซ่า" }, { category: "อาหาร", word: "ขนมปังปิ้ง" },

  { category: "สถานที่", word: "สนามบิน" }, { category: "สถานที่", word: "วัดพระแก้ว" },
  { category: "สถานที่", word: "ตลาดนัดจตุจักร" }, { category: "สถานที่", word: "หอไอเฟล" },
  { category: "สถานที่", word: "โรงพยาบาล" }, { category: "สถานที่", word: "สวนสัตว์" },
  { category: "สถานที่", word: "ห้องสมุด" }, { category: "สถานที่", word: "สนามกีฬา" },
  { category: "สถานที่", word: "ตลาดสด" }, { category: "สถานที่", word: "ปั๊มน้ำมัน" },
  { category: "สถานที่", word: "พิพิธภัณฑ์" }, { category: "สถานที่", word: "ชายหาด" },

  { category: "สิ่งของ", word: "ร่ม" }, { category: "สิ่งของ", word: "แว่นตากันแดด" },
  { category: "สิ่งของ", word: "กระติกน้ำแข็ง" }, { category: "สิ่งของ", word: "ลูกโป่ง" },
  { category: "สิ่งของ", word: "เข็มขัดนิรภัย" }, { category: "สิ่งของ", word: "ไฟแช็ก" },
  { category: "สิ่งของ", word: "นาฬิกาปลุก" }, { category: "สิ่งของ", word: "กระเป๋าเป้" },
  { category: "สิ่งของ", word: "ที่ชาร์จโทรศัพท์" }, { category: "สิ่งของ", word: "กรรไกร" },
  { category: "สิ่งของ", word: "เทียนไข" }, { category: "สิ่งของ", word: "ร่มกันแดด" },

  { category: "อาชีพ", word: "นักบิน" }, { category: "อาชีพ", word: "หมอฟัน" },
  { category: "อาชีพ", word: "ยูทูบเบอร์" }, { category: "อาชีพ", word: "พนักงานดับเพลิง" },
  { category: "อาชีพ", word: "บาริสต้า" }, { category: "อาชีพ", word: "ไกด์นำเที่ยว" },
  { category: "อาชีพ", word: "ตำรวจ" }, { category: "อาชีพ", word: "ครู" },
  { category: "อาชีพ", word: "สถาปนิก" }, { category: "อาชีพ", word: "นักข่าว" },
  { category: "อาชีพ", word: "เชฟ" }, { category: "อาชีพ", word: "วิศวกร" },

  { category: "คนดัง/ตัวละคร", word: "แบทแมน" }, { category: "คนดัง/ตัวละคร", word: "โดราเอมอน" },
  { category: "คนดัง/ตัวละคร", word: "แฮร์รี่ พอตเตอร์" }, { category: "คนดัง/ตัวละคร", word: "ซานตาคลอส" },
  { category: "คนดัง/ตัวละคร", word: "สไปเดอร์แมน" }, { category: "คนดัง/ตัวละคร", word: "เจ้าหญิงเอลซ่า" },
  { category: "คนดัง/ตัวละคร", word: "พิคาชู" }, { category: "คนดัง/ตัวละคร", word: "เชอร์ล็อก โฮล์มส์" },

  { category: "กีฬา", word: "มวยไทย" }, { category: "กีฬา", word: "แบดมินตัน" },
  { category: "กีฬา", word: "ปิงปอง" }, { category: "กีฬา", word: "ว่ายน้ำ" },
  { category: "กีฬา", word: "บาสเกตบอล" }, { category: "กีฬา", word: "กอล์ฟ" },
  { category: "กีฬา", word: "ชกมวย" }, { category: "กีฬา", word: "สเก็ตน้ำแข็ง" },

  { category: "เทคโนโลยี", word: "หูฟังไร้สาย" }, { category: "เทคโนโลยี", word: "โดรน" },
  { category: "เทคโนโลยี", word: "พาวเวอร์แบงก์" }, { category: "เทคโนโลยี", word: "สมาร์ทวอทช์" },
  { category: "เทคโนโลยี", word: "หุ่นยนต์ดูดฝุ่น" }, { category: "เทคโนโลยี", word: "กล้องวงจรปิด" },
  { category: "เทคโนโลยี", word: "จอคอมพิวเตอร์" }, { category: "เทคโนโลยี", word: "เครื่องพิมพ์" },

  { category: "ธรรมชาติ", word: "ภูเขาไฟ" }, { category: "ธรรมชาติ", word: "รุ้งกินน้ำ" },
  { category: "ธรรมชาติ", word: "น้ำตก" }, { category: "ธรรมชาติ", word: "ทะเลทราย" },
  { category: "ธรรมชาติ", word: "ภูเขาน้ำแข็ง" }, { category: "ธรรมชาติ", word: "ทุ่งดอกไม้" },
  { category: "ธรรมชาติ", word: "ป่าฝน" }, { category: "ธรรมชาติ", word: "พายุทอร์นาโด" },

  { category: "ยานพาหนะ", word: "เรือสำเภา" }, { category: "ยานพาหนะ", word: "รถตุ๊กตุ๊ก" },
  { category: "ยานพาหนะ", word: "บอลลูนอากาศร้อน" }, { category: "ยานพาหนะ", word: "สเก็ตบอร์ด" },
  { category: "ยานพาหนะ", word: "เฮลิคอปเตอร์" }, { category: "ยานพาหนะ", word: "รถไฟใต้ดิน" },
  { category: "ยานพาหนะ", word: "จักรยาน" }, { category: "ยานพาหนะ", word: "เรือดำน้ำ" },

  { category: "เครื่องดื่ม", word: "กาแฟเย็น" }, { category: "เครื่องดื่ม", word: "ชาเขียว" },
  { category: "เครื่องดื่ม", word: "น้ำมะพร้าว" }, { category: "เครื่องดื่ม", word: "โซดา" },
  { category: "เครื่องดื่ม", word: "นมสด" }, { category: "เครื่องดื่ม", word: "เบียร์" },

  { category: "เสื้อผ้า/แฟชั่น", word: "เนคไท" }, { category: "เสื้อผ้า/แฟชั่น", word: "หมวกแก๊ป" },
  { category: "เสื้อผ้า/แฟชั่น", word: "ผ้าพันคอ" }, { category: "เสื้อผ้า/แฟชั่น", word: "ถุงเท้า" },
  { category: "เสื้อผ้า/แฟชั่น", word: "กระโปรง" }, { category: "เสื้อผ้า/แฟชั่น", word: "สูท" },

  { category: "ของเล่น", word: "ว่าว" }, { category: "ของเล่น", word: "ลูกข่าง" },
  { category: "ของเล่น", word: "ตุ๊กตาหมี" }, { category: "ของเล่น", word: "หุ่นยนต์ของเล่น" },
  { category: "ของเล่น", word: "บล็อกไม้" }, { category: "ของเล่น", word: "รถบังคับ" },

  { category: "อวกาศ", word: "ดาวหาง" }, { category: "อวกาศ", word: "จรวด" },
  { category: "อวกาศ", word: "มนุษย์ต่างดาว" }, { category: "อวกาศ", word: "กล้องโทรทรรศน์" },
  { category: "อวกาศ", word: "หลุมดำ" }, { category: "อวกาศ", word: "ดวงจันทร์" },

  { category: "สภาพอากาศ", word: "ฟ้าผ่า" }, { category: "สภาพอากาศ", word: "หมอก" },
  { category: "สภาพอากาศ", word: "ลูกเห็บ" }, { category: "สภาพอากาศ", word: "สายรุ้ง" },
  { category: "สภาพอากาศ", word: "พายุฝน" }, { category: "สภาพอากาศ", word: "แดดจ้า" },

  { category: "เทศกาล/ประเพณี", word: "สงกรานต์" }, { category: "เทศกาล/ประเพณี", word: "ลอยกระทง" },
  { category: "เทศกาล/ประเพณี", word: "ตรุษจีน" }, { category: "เทศกาล/ประเพณี", word: "คริสต์มาส" },
  { category: "เทศกาล/ประเพณี", word: "ฮาโลวีน" }, { category: "เทศกาล/ประเพณี", word: "วันวาเลนไทน์" },

  { category: "โรงเรียน/สำนักงาน", word: "กระดานดำ" }, { category: "โรงเรียน/สำนักงาน", word: "ยางลบ" },
  { category: "โรงเรียน/สำนักงาน", word: "เครื่องคิดเลข" }, { category: "โรงเรียน/สำนักงาน", word: "ที่เย็บกระดาษ" },
  { category: "โรงเรียน/สำนักงาน", word: "กระดาษโน้ต" }, { category: "โรงเรียน/สำนักงาน", word: "ปากกาเน้นข้อความ" },

  { category: "ดนตรี", word: "กีตาร์" }, { category: "ดนตรี", word: "กลองชุด" },
  { category: "ดนตรี", word: "ไวโอลิน" }, { category: "ดนตรี", word: "เปียโน" },
  { category: "ดนตรี", word: "ไมโครโฟน" }, { category: "ดนตรี", word: "ลำโพง" }
];
