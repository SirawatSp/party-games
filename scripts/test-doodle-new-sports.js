#!/usr/bin/env node
// ตรวจกลไกของกีฬาใหม่ ตั้งแต่แรงส่ง การพัก ไปจนถึงจักรแตะพื้นและการตัดจบ
const assert=require('node:assert/strict'),O=require('../js/doodle-olympics-engine.js');
const line=(points,width=9)=>({color:'#243d32',width,points});
const body=line([[180,100],[320,100],[320,190],[180,190],[180,100]]);
const armed={name:'แขนขาครบ',body:[body],legs:[line([[180,130],[90,50]],15),line([[320,130],[410,50]],15),line([[195,190],[165,270]],15),line([[305,190],[335,270]],15)]};
const bare={name:'ไม่มีแขนขา',body:[body],legs:[]};
function play(s,observe=()=>{}){for(let i=0;i<5000&&!s.done;i++){O.step(s,1/60);observe(s);s.racers.forEach(r=>{for(const k of ['x','y','vx','vy','angle','omega','distance','score','energy','discX','discY'])assert.ok(Number.isFinite(r[k]),s.mode+' '+k+' ต้องเป็นจำนวนจริง');});}assert.ok(s.done,'กีฬาใหม่ต้องจบภายใน 75 วินาที');return s;}
for(const mode of ['swim','climb','discus']){
 assert.ok(O.validAthlete(bare,[mode]),'ไม่มีแขนขาก็เล่นกีฬาใหม่ได้');
 const a=play(O.makeSession(mode,[armed,bare],[317,901],100)),b=play(O.makeSession(mode,[armed,bare],[317,901],100));
 assert.deepEqual(O.snapshot(a),O.snapshot(b),'สุ่มชุดเดิมต้องให้ผลเดิม');
 if(O.timed(mode))a.racers.forEach(r=>assert.ok(r.distance>=0&&r.distance<=O.sports[mode].finishDistance));
}
const swim=O.makeSession('swim',[armed,bare],[81,93],100);for(let i=0;i<60;i++)O.step(swim,1/60);
assert.ok(swim.racers[0].drive>swim.racers[1].drive,'แขนพายต้องสร้างแรงส่งจริง');
const tired={...bare,body:[line([[80,40],[450,40],[450,220],[80,220],[80,40]])]};let rested=false,slipped=false;
const wall=play(O.makeSession('climb',[tired,armed],[37,93],100),s=>{rested ||= s.racers[0].resting;slipped ||= s.racers[0].event.includes('ลื่น');});
assert.ok(rested,'ตัวหนักแรงจับน้อยต้องพักเติมแรง');assert.ok(slipped,'การลื่นต้องเปลี่ยนความสูงจริง');assert.ok(wall.stopped&&wall.racers[0].stopped,'หมดเวลาต้องตัดจากระยะล่าสุด');
assert.equal(wall.racers[1].stopped,undefined,'ผู้ถึงยอดก่อนหมดเวลายังมีเวลาจบจริง');
const disc=O.makeSession('discus',[armed,bare],[101,219],100);let spinning=false,flying=false;
play(disc,s=>{spinning ||= s.racers.some(r=>!r.launched&&r.omega>1);flying ||= s.racers.some(r=>r.launched&&r.discY<0&&r.discX>0);});
assert.ok(spinning&&flying,'ต้องสะสมแรงหมุนแล้วบิน ไม่แจกคะแนนล่วงหน้า');disc.racers.forEach(r=>{assert.equal(r.discY,0);assert.equal(r.distance,r.discX);assert.equal(r.score,r.discX);});
for(const elapsed of [1,4]){
 const t=O.create([armed,bare],['discus'],100,19),s=O.next(t);for(let i=0;i<elapsed*60;i++)O.step(s,1/60);
 const current=s.racers.map(r=>r.discX);assert.ok(O.stop(s));assert.ok(O.record(t));t.results[0].rows.forEach(r=>assert.equal(r.value,current[r.id],'ตัดก่อน/หลังปล่อยต้องใช้ระยะจักรปัจจุบัน'));
 if(elapsed===1)assert.deepEqual(t.results[0].rows.map(r=>r.points),[8.5,8.5],'ตัดก่อนปล่อยไม่มีผู้ชนะล่วงหน้า');
}
// รุ่นก่อนยังวาดสามสนามใหม่นี้ไม่ได้ จึงต้องกันตั้งแต่เข้าห้อง
assert.equal(O.protocol,6);
console.log('ผ่าน: ว่ายน้ำมีแรงพายจริง / ปีนมีพักและลื่น / ขว้างสะสมแรงและบินจริง / ภาพไม่มีแขนขาเล่นได้ / ทุกค่ามีขอบเขต / หมดเวลาตัดตามระยะ / ตัดก่อนและหลังปล่อยจักร / ผลเดิมเมื่อสุ่มชุดเดิม');
