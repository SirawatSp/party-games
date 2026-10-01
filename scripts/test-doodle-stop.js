#!/usr/bin/env node
// ตัดจบจริงทุกกีฬา ตรวจการจัดอันดับ คะแนนซ้ำ และผลที่ส่งให้ผู้เล่น
const assert=require('node:assert/strict'),O=require('../js/doodle-olympics-engine.js'),Host=require('../js/doodle-race-net.js');
const stroke=points=>({color:'#243d32',width:9,points});
const animal=name=>({name,body:[stroke([[150,120],[320,120],[320,190],[150,190],[150,120]])],legs:[stroke([[165,190],[145,245],[175,300]]),stroke([[300,190],[330,235],[310,305]])]});
const team=['หนึ่ง','สอง','สาม','สี่'].map(animal);
for(const mode of ['run','roll','swim','climb']){
 const t=O.create(team,[mode],100,42),s=O.next(t);s.elapsed=20;
 // มีผู้ถึงเส้นชัยก่อนสองคน และอีกสองคนยังต้องเรียงตามระยะ ไม่ใช้เวลาตัดจบเป็นเวลาเข้าเส้นชัย
 s.racers.forEach((r,i)=>{r.distance=r.x=[100,100,65,40][i];r.finish=i<2?10+i:null;});
 assert.ok(O.stop(s));assert.deepEqual(O.rank(s).map(r=>r.id),[0,1,2,3]);assert.ok(O.record(t));
 assert.deepEqual(t.results[0].rows.map(r=>r.points),[10,7,5,3]);assert.equal(t.results[0].rows[2].value,65);assert.ok(t.results[0].rows[2].stopped);assert.equal(t.results[0].rows[0].stopped,false);
 const totals=JSON.stringify(t.totals);assert.equal(O.stop(s),false);assert.equal(O.record(t),false);O.step(s,1);assert.equal(JSON.stringify(t.totals),totals);assert.equal(s.elapsed,20);
 const tie=O.create(team.slice(0,3),[mode],100,42),ts=O.next(tie);ts.elapsed=7;ts.racers.forEach((r,i)=>{r.distance=r.x=i===2?20:50;});O.stop(ts);O.record(tie);assert.deepEqual(tie.results[0].rows.map(r=>[r.place,r.points]),[[1,8.5],[1,8.5],[3,5]]);
}
for(const mode of ['sumo','balance']){
 const t=O.create(team,[mode],100,1),s=O.next(t);s.elapsed=12;s.racers[2].out=s.racers[3].out=true;s.racers[2].finish=s.racers[2].score=8;s.racers[3].finish=s.racers[3].score=3;
 O.stop(s);O.record(t);assert.deepEqual(t.results[0].rows.map(r=>[r.id,r.place,r.points]),[[0,1,8.5],[1,1,8.5],[2,3,5],[3,4,3]]);assert.equal(s.racers[0].out,false);
}
const jump=O.create(team.slice(0,3),['jump'],100,4),j=O.next(jump);j.elapsed=4;
j.racers[0].finish=3;j.racers[0].distance=j.racers[0].score=j.racers[0].x=30;j.racers[1].x=45;j.racers[2].x=45;
O.stop(j);O.record(jump);assert.deepEqual(jump.results[0].rows.map(r=>[r.id,r.place,r.value,r.points]),[[1,1,45,8.5],[2,1,45,8.5],[0,3,30,5]]);
assert.equal(O.stop(null),false);
class Room{constructor(){this.handlers={};this.frames=[];}on(k,f){this.handlers[k]=f;}to(){}broadcast(k,d){if(k==='dr:frame')this.frames.push(JSON.parse(JSON.stringify(d)));}}
let time=0;const room=new Room(),host=new Host(room,{events:Object.keys(O.sports),now:()=>time,seed:()=>37});host.join('g1',{name:'เพื่อน',protocol:O.protocol});host.ready('host',team[0]);host.ready('g1',team[1]);
assert.equal(host.stop(),false);
for(let i=0;i<Object.keys(O.sports).length;i++){
 assert.ok(host.start(100));assert.equal(host.stop(),false,'ตัดจบตอนนับถอยหลังไม่ได้');time=host.startsAt+2000;host.tick();assert.equal(host.phase,'race');
 assert.equal(host.stop('g1'),false,'ผู้เล่นตัดจบไม่ได้');assert.equal(host.stop('host',host.round-1),false,'คำสั่งรอบเก่าตัดรอบใหม่ไม่ได้');assert.equal(host.session.done,false);
 assert.ok(host.stop());assert.equal(host.phase,'result');assert.equal(host.tournament.results.length,i+1);
 const f=room.frames.at(-1);assert.ok(f.finished&&f.done&&f.stopped);const replica=O.makeSession(f.mode,host.tournament.team,[0,0],100);O.apply(replica,f);
 assert.deepEqual(O.rank(replica).map(r=>r.id),O.rank(host.session).map(r=>r.id));assert.deepEqual(JSON.parse(JSON.stringify(O.snapshot(replica).racers)),f.racers);assert.deepEqual(f.totals,host.tournament.totals);
 const totals=JSON.stringify(host.tournament.totals);assert.equal(host.stop(),false);time+=2000;host.tick();assert.equal(host.tournament.results.length,i+1);assert.equal(JSON.stringify(host.tournament.totals),totals);
}
assert.ok(host.canStart(),'จบครบแล้วเริ่มชุดใหม่ได้');assert.ok(host.lobby(),'กลับห้องรอได้');
console.log('ผ่าน: ตัดจบทั้ง 8 กีฬา / ถึงเส้นชัยก่อนระยะค้าง / ระยะเท่ากันแบ่งคะแนน / ผู้รอดซูโม่และทรงตัวอันดับร่วม / กระโดดใช้ระยะล่าสุด / ตัดครั้งเดียว / คะแนนไม่ซ้ำ / ห้ามผู้เล่นและคำสั่งรอบเก่า / ห้ามตัดตอนนับถอยหลัง / ภาพและผลออนไลน์ตรงกัน / ต่อกีฬาและเริ่มชุดใหม่ได้');
