#!/usr/bin/env node
// ตรวจแรงขา เวลาเข้าเส้นชัย และความสุ่มที่ไม่ล็อกผู้ชนะไว้กับช่องวิ่ง
const assert = require("node:assert/strict");
const E = require("../js/doodle-race-engine.js");
const s = points => ({color:"#243d32", width:9, points});
const animal = {name:"ตัวทดสอบ", body:[s([[150,120],[320,120],[320,190],[150,190],[150,120]])], legs:[s([[165,190],[145,245],[175,300]]),s([[300,190],[330,235],[310,305]])]};
assert.ok(E.validDrawing(animal));
assert.ok(!E.validDrawing({...animal,legs:[]}));
assert.ok(!E.validDrawing({...animal,legs:[s([[20,20],[30,80]]),animal.legs[1]]}));
assert.ok(!E.validDrawing({...animal,legs:[s([[165,190],[NaN,300]]),animal.legs[1]]}));
assert.deepEqual(E.nearest(animal.body,[200,200]).point,[200,190]);
const snapshot=JSON.stringify(animal);
function finish(drawing, seed, metres=100) {
  const r=E.makeRacer(drawing,seed,0);
  for(let i=0;i<24000 && r.finish===null;i++){
    const previous=r.distance;E.step(r,1/60,metres);
    assert.ok(Number.isFinite(r.distance) && r.distance>=previous && r.distance<=metres);
  }
  assert.ok(r.finish!==null && r.finish>0 && r.finish<400,"ต้องเข้าเส้นชัยได้");
  return r;
}
const short=JSON.parse(snapshot);short.legs.forEach(l=>l.points=l.points.map((p,i)=>i?[p[0],190+(p[1]-190)*.3]:p));
const wide=JSON.parse(snapshot);wide.body[0].points=wide.body[0].points.map(p=>[p[0]*1.4,p[1]*.8]);wide.legs=wide.legs.map(l=>({...l,points:l.points.map(p=>[p[0]*1.4,p[1]*.8])}));
const base=finish(animal,42), repeat=finish(animal,42), changed=finish(short,42), bigger=finish(wide,42);
assert.equal(base.finish,repeat.finish,"เวลาเหมือนเดิมเมื่อรูปและเมล็ดสุ่มเหมือนเดิม");
assert.notEqual(base.finish,changed.finish,"ขาที่วาดต้องมีผลต่อแรงวิ่ง");
assert.notEqual(base.finish,bigger.finish,"ขนาดตัวต้องมีผลต่อแรงวิ่ง");
assert.equal(JSON.stringify(animal),snapshot,"แข่งแล้วภาพต้นฉบับต้องไม่เปลี่ยน");
const winners=new Set();
for(let race=0;race<20;race++){
  const rs=Array.from({length:6},(_,i)=>({...finish(animal,1000+race*31+i),id:i}));
  winners.add(E.rank(rs)[0].id);
}
assert.ok(winners.size>=4,"ไม่ควรชนะซ้ำเพราะลำดับช่องวิ่ง");
const ordered=E.rank([{id:0,distance:100,finish:12.009},{id:1,distance:100,finish:12.001}]);
assert.equal(ordered[0].id,1,"ถึงในเฟรมเดียวกันต้องเรียงตามเวลาข้ามเส้นจริง");
const long=finish(animal,42,200);assert.ok(long.finish>base.finish);
const weird=JSON.parse(snapshot);weird.legs=[s([[150,120],[80,100],[30,120]]),s([[320,120],[365,40],[399,20]])];
assert.ok(E.validDrawing(weird));finish(weird,867);
const poseR=E.makeRacer(animal,19,0), first=E.pose(poseR);E.step(poseR,.1,100);const second=E.pose(poseR);
assert.notDeepEqual(first.legs,second.legs,"ขาแต่ละเส้นต้องขยับจริง");
second.legs.forEach((leg,i)=>assert.deepEqual(leg[0],animal.legs[i].points[0],"ข้อขายังยึดกับลำตัว"));
console.log("ผ่าน: รูปมีผลต่อแรงก้าว / สุ่มผู้ชนะได้หลายช่อง / 100 และ 200 เมตรจบครบ / เวลาข้ามเส้นไม่ลำเอียง / รูปและข้อขาไม่เสีย");
console.log("ตัวอย่าง 100 เมตร: "+base.finish.toFixed(2)+" วิ · ขาสั้น: "+changed.finish.toFixed(2)+" วิ · 200 เมตร: "+long.finish.toFixed(2)+" วิ");
