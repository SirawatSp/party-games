#!/usr/bin/env node
// ตรวจจุดสัมผัสจริงของภาพ ไม่ให้ขาทะลุแท่นหรือมือจับผาลอยตามตัว
const assert=require('node:assert/strict'),O=require('../js/doodle-olympics-engine.js');
const line=(points,width=9)=>({color:'#243d32',width,points});
const d={name:'ตัวทดสอบ',body:[line([[180,110],[320,110],[320,190],[180,190],[180,110]])],legs:[line([[180,135],[90,45]],15),line([[320,135],[410,45]],15),line([[195,190],[155,270]],15),line([[305,190],[345,270]],15)]};
function rotate(p,angle){const cs=Math.cos(angle),sn=Math.sin(angle);return [p[0]*cs-p[1]*sn,p[0]*sn+p[1]*cs];}
const close=(a,b)=>assert.ok(Math.abs(a-b)<1e-7,a+' ≠ '+b);
let held=0,moved=0;
const climb=O.makeSession('climb',[d,d],[19,71],100);
for(let n=0;n<480&&!climb.done;n++){
 const prev=climb.racers[0].legs.map(l=>({...l}));O.step(climb,1/60);const r=climb.racers[0],pose=O.pose(r,'climb');
 pose.limbs.forEach((limb,i)=>{assert.deepEqual(limb[0],d.legs[i].points[0]);const state=r.legs[i],tip=rotate([limb.at(-1)[0]-r.g.cx,limb.at(-1)[1]-r.g.cy],r.angle);close(tip[0],state.holdX);close(r.x*90-tip[1],state.holdY);
  if(state.planted){close(state.holdX/45,Math.round(state.holdX/45));close(state.holdY/55,Math.round(state.holdY/55));if(prev[i].planted&&r.hit===0){close(state.holdX,prev[i].holdX);close(state.holdY,prev[i].holdY);held++;}}
  else if(prev[i].holdY!==state.holdY)moved++;
 });
 const replica=O.makeSession('climb',[d,d],[0,0],100);O.apply(replica,JSON.parse(JSON.stringify(O.snapshot(climb))));assert.deepEqual(O.pose(replica.racers[0],'climb'),pose,'ผู้เล่นต้องเห็นจุดจับเดียวกับโฮสต์');
}
assert.ok(held>100&&moved>10,'ต้องมีทั้งเอื้อมและยึดมือขณะดึงตัว');
const balance=O.makeSession('balance',[d,d],[19,71],100);let checked=0;
for(let n=0;n<900&&!balance.done;n++){
 O.step(balance,1/60);for(const r of balance.racers){if(r.out)continue;const pose=O.pose(r,'balance'),center=rotate([r.g.cx-r.g.footMid,r.g.cy-r.g.bottom],r.angle);
  pose.limbs.forEach((p,i)=>{assert.deepEqual(p[0],d.legs[i].points[0]);if(!r.g.limbs[i].foot)return;const tip=rotate([p.at(-1)[0]-r.g.cx,p.at(-1)[1]-r.g.cy],r.angle),onBeam=rotate([center[0]+tip[0],center[1]+tip[1]],-balance.tilt);close(onBeam[1],0);close(onBeam[0],d.legs[i].points.at(-1)[0]-r.g.footMid);checked++;});
  const replica=O.makeSession('balance',[d,d],[0,0],100);O.apply(replica,JSON.parse(JSON.stringify(O.snapshot(balance))));assert.deepEqual(O.pose(replica.racers[r.id],'balance'),pose);
 }
}
assert.ok(checked>100,'ต้องยืนบนแท่นที่กำลังโยกจริง');
console.log('ผ่าน: ปีนมีช่วงเอื้อมและมือยึดปุ่มจริง / จุดจับไม่ลอยตามตัว / เท้าทรงตัวอยู่บนแท่นที่เอียง / ข้อแรกยังต่อกับรูปเดิม / โฮสต์และผู้เล่นเห็นจุดสัมผัสเดียวกัน');
