// กลไกก้าวขาแบบการ์ตูน: ใช้รูปขาจริงคำนวณแรงถีบ ไม่สุ่มอันดับไว้ล่วงหน้า
(function (root) {
  "use strict";
  const TAU = Math.PI * 2;
  const clamp = (n, lo, hi) => Math.max(lo, Math.min(hi, n));
  function random(seed) {
    let n = seed >>> 0;
    return () => { n += 0x6D2B79F5; let t = Math.imul(n ^ n >>> 15, 1 | n); t ^= t + Math.imul(t ^ t >>> 7, 61 | t); return ((t ^ t >>> 14) >>> 0) / 4294967296; };
  }
  function bounds(strokes) {
    let x=Infinity, y=Infinity, right=-Infinity, bottom=-Infinity;
    strokes.forEach(s=>s.points.forEach(p=>{x=Math.min(x,p[0]);y=Math.min(y,p[1]);right=Math.max(right,p[0]);bottom=Math.max(bottom,p[1]);}));
    return { x, y, w:right-x, h:bottom-y };
  }
  function nearest(body, point) {
    let best = null, distance = Infinity;
    body.forEach(s => s.points.forEach((a, i) => {
      const b = s.points[Math.min(i + 1, s.points.length - 1)];
      const dx = b[0] - a[0], dy = b[1] - a[1];
      const t = clamp(((point[0] - a[0]) * dx + (point[1] - a[1]) * dy) / (dx * dx + dy * dy || 1), 0, 1);
      const p = [a[0] + dx * t, a[1] + dy * t];
      const d = Math.hypot(point[0] - p[0], point[1] - p[1]);
      if (d < distance) { best = p; distance = d; }
    }));
    return { point: best, distance };
  }
  function validDrawing(d, legsOptional = false) {
    const strokeOK = s => s && /^#[0-9a-f]{6}$/i.test(s.color) && Number.isFinite(s.width) && s.width >= 1 && s.width <= 20 && Array.isArray(s.points) && s.points.length >= 2 && s.points.length <= 700 && s.points.every(p => Array.isArray(p) && p.length === 2 && p.every(Number.isFinite) && p[0] >= 0 && p[0] <= 600 && p[1] >= 0 && p[1] <= 360);
    if (!d || !Array.isArray(d.body) || !d.body.length || d.body.length > 120 || !d.body.every(strokeOK) || !Array.isArray(d.legs) || d.legs.length < (legsOptional ? 0 : 2) || d.legs.length > 6 || !d.legs.every(strokeOK)) return false;
    const b = bounds(d.body);
    return b.w >= 20 && b.h >= 10 && d.legs.every(s => Math.hypot(s.points.at(-1)[0] - s.points[0][0], s.points.at(-1)[1] - s.points[0][1]) >= 18 && nearest(d.body, s.points[0]).distance <= 42);
  }
  function makeRacer(drawing, seed, id) {
    const rng = random(seed), b = bounds(drawing.body);
    const center = [b.x + b.w / 2, b.y + b.h / 2];
    const legs = drawing.legs.map(stroke => ({stroke, phase:rng() * TAU, cadence:1.3 + rng() * 1.7, swing:.3 + rng() * .55, bend:(rng() - .5) * .6}));
    const roots = legs.map(l => l.stroke.points[0][0]);
    const spread = (Math.max(...roots) - Math.min(...roots)) / Math.max(40, b.w);
    return {id, drawing, rng, center, bodyBottom:b.y+b.h, mass:clamp(Math.sqrt(Math.max(600, b.w * b.h) / 19000), .6, 1.7), balance:clamp(.65 + spread * .45, .65, 1.15), legs, distance:0, speed:0, time:0, finish:null, event:"", eventUntil:0, nextEvent:.5 + rng() * 2, power:1, effort:0, steps:0};
  }
  function legPose(leg) {
    const origin = leg.stroke.points[0], angle = Math.sin(leg.phase) * leg.swing;
    const cs = Math.cos(angle), sn = Math.sin(angle), pts = leg.stroke.points;
    return pts.map((p, i) => {
      const x = p[0] - origin[0], y = p[1] - origin[1], t = i / (pts.length - 1);
      return [origin[0] + x * cs - y * sn + Math.sin(leg.phase * 2) * leg.bend * t * t * 24, origin[1] + x * sn + y * cs];
    });
  }
  function pose(r) {
    const legs = r.legs.map(legPose);
    let ground = r.bodyBottom;
    legs.forEach(points=>points.forEach(p=>{ground=Math.max(ground,p[1]);}));
    const lean = clamp((r.speed - 4) * .015, -.06, .09) + Math.sin(r.time * 7) * (r.event === "ขาพันกัน" ? .09 : .015);
    return {legs, ground, lean};
  }
  function step(r, dt, distance) {
    if (r.finish !== null) return;
    const oldTime = r.time, oldDistance = r.distance;
    r.time += dt;
    if (r.time >= r.nextEvent) {
      const roll = r.rng();
      r.power = roll < .18 ? .18 + r.rng() * .25 : roll > .74 ? 1.45 + r.rng() * .65 : .75 + r.rng() * .6;
      r.event = roll < .18 ? "ขาพันกัน" : roll > .74 ? "ก้าวติดลม!" : "หาจังหวะใหม่";
      r.eventUntil = r.time + 1.5;
      r.nextEvent = r.time + 1.2 + r.rng() * 2.4;
    }
    r.legs.forEach(l => {
      l.phase += dt * TAU * l.cadence * Math.sqrt(r.power);
      if (l.phase >= TAU) {
        l.phase %= TAU;
        l.cadence = 1.1 + r.rng() * 2;
        l.swing = .25 + r.rng() * .75;
        l.bend = (r.rng() - .5) * .85;
        r.steps++;
      }
    });
    const tips = r.legs.map(l => legPose(l).at(-1));
    const low = Math.max(...tips.map(p => p[1]));
    let push = 0;
    r.legs.forEach((l, i) => {
      const rootPoint = l.stroke.points[0], end = l.stroke.points.at(-1);
      const dx = end[0] - rootPoint[0], dy = end[1] - rootPoint[1];
      const angle = Math.sin(l.phase) * l.swing;
      // ปลายขาที่ใกล้พื้นและกวาดถอยหลังจะถีบตัวไปข้างหน้า
      const backward = (dx * Math.sin(angle) + dy * Math.cos(angle)) * Math.cos(l.phase) * l.swing * TAU * l.cadence;
      const contact = clamp(1 - (low - tips[i][1]) / 45, 0, 1);
      push += Math.max(0, backward) * contact;
    });
    // หารด้วยรากจำนวนขา: ขาเพิ่มช่วยได้บ้าง แต่จังหวะที่ไม่ตรงกันยังทำให้ช้าลง
    const drive = push / Math.sqrt(r.legs.length) / 36;
    r.effort += (drive - r.effort) * Math.min(1, dt * 4);
    const target = clamp((1.4 + r.effort * 2.8) * r.balance * r.power / Math.sqrt(r.mass), .65, 13);
    r.speed += (target - r.speed) * Math.min(1, dt * 2.5);
    r.distance += r.speed * dt;
    if (r.distance >= distance) {
      r.finish = oldTime + dt * (distance - oldDistance) / (r.distance - oldDistance);
      r.distance = distance;
    }
  }
  function rank(racers) { return racers.slice().sort((a,b) => (a.finish === null ? Infinity : a.finish) - (b.finish === null ? Infinity : b.finish) || b.distance - a.distance || a.id - b.id); }
  const api = {random, bounds, nearest, validDrawing, makeRacer, legPose, pose, step, rank};
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  else root.DoodleRace = api;
})(typeof window !== "undefined" ? window : this);
