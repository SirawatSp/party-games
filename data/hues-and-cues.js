// เกม Hues & Cues — กระดานสี 30 คอลัมน์ x 16 แถว = 480 ช่องสี (อ้างอิงขนาดกระดานจริงของบอร์ดเกม)
// พิกัดอ่านแบบเดียวกับของจริง: แถว A-P (บนลงล่าง) และคอลัมน์ 1-30 (ซ้ายไปขวา)
// สีสร้างจากสูตร HSL ต่อเนื่อง: คอลัมน์ = เฉดสี (hue) ไล่รอบวงล้อสี,
// แถว = ความสว่าง ไล่จากโทนพาสเทลสว่างด้านบน ลงไปหาโทนเข้มมืดด้านล่าง
const HUES_COLS = 30;
const HUES_ROWS = 16;

const HUES_GRID = (function () {
  const grid = [];
  for (let r = 0; r < HUES_ROWS; r++) {
    const t = r / (HUES_ROWS - 1);
    // ยิ่งแถวล่างยิ่งมืด ส่วนความอิ่มสีพุ่งสุดช่วงกลางกระดาน (แถวบน/ล่างจะออกพาสเทล/หม่นกว่า)
    const l = Math.round(88 - 74 * t);
    const s = Math.round(62 + 38 * Math.sin(Math.PI * t));
    for (let c = 0; c < HUES_COLS; c++) {
      grid.push({ h: Math.round((c * 360) / HUES_COLS), s: s, l: l });
    }
  }
  return grid;
})();
