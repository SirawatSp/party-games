#!/usr/bin/env node
// ตรวจข้อมูลที่ส่งข้ามเครื่องจริงในระดับข้อความ ไม่ใช่ตรวจเพียงว่าปุ่มมีอยู่
const assert=require('node:assert/strict');
const Host=require('../js/doodle-race-net.js');
const E=require('../js/doodle-race-engine.js'),O=require('../js/doodle-olympics-engine.js');
const stroke=points=>({color:'#243d32',width:9,points});
const animal={name:'ตัวลับ',body:[stroke([[150,120],[320,120],[320,190],[150,190],[150,120]])],legs:[stroke([[165,190],[145,245],[175,300]]),stroke([[300,190],[330,235],[310,305]])]};
class Room{constructor(){this.events={};this.messages=[];this.guests=[[],[]];}on(t,f){this.events[t]=f;}broadcast(t,d){const m=JSON.parse(JSON.stringify({t,d}));this.messages.push(m);this.guests.forEach(g=>g.push(JSON.parse(JSON.stringify(m))));}to(id,t,d){this.messages.push({id,t,d});}receive(t,d,id){return this.events[t](d,id);}}
let time=0,nextSeed=12;const room=new Room();const host=new Host(room,{name:'เจ้าของ',now:()=>time,seed:()=>nextSeed++});
assert.ok(!host.start(100));room.receive('dr:join',{name:'เพื่อน',protocol:O.protocol},'g1');room.receive('dr:join',{name:'เพื่อนสอง',protocol:O.protocol},'g2');
assert.ok(!host.ready('intruder',animal));assert.ok(!host.ready('g1',{...animal,legs:[]}));
assert.ok(host.ready('host',animal));assert.ok(host.ready('g1',animal));assert.ok(host.ready('g2',animal));
assert.ok(host.canStart());
function noImages(){for(const m of room.messages.filter(m=>m.t==='dr:state')){const text=JSON.stringify(m.d);assert.ok(!/"(drawing|body|legs|points|team)"/.test(text),'ห้องรอต้องไม่ส่งภาพไปให้เครื่องอื่น');}}
noImages();assert.ok(host.edit('g1'));assert.ok(!host.canStart());host.ready('g1',animal);
assert.ok(host.start(200));assert.ok(!host.start(100));assert.ok(!host.edit('g1'));assert.ok(!host.ready('g1',animal));
time=2999;host.tick();assert.equal(host.phase,'countdown');assert.equal(room.messages.filter(m=>m.t==='dr:race').length,0);noImages();
time=3000;host.tick();assert.equal(host.phase,'race');assert.equal(room.messages.filter(m=>m.t==='dr:race').length,1);
room.receive('dr:join',{name:'มาสาย',protocol:O.protocol},'g3');assert.equal(host.players.length,3);
// แท็บโฮสต์สะดุด 5 วินาที ต้องไล่จำลองต่อโดยไม่เปลี่ยนผลหรือค้าง
for(time=8000;time<200000&&host.phase!=='result';time+=100)host.tick();
assert.equal(host.phase,'result');assert.ok(host.racers.every(r=>r.finish!==null));
assert.deepEqual(room.guests[0],room.guests[1],'ทุกเครื่องรับภาพและสถานะแข่งเดียวกัน');
const final=room.guests[0].filter(m=>m.t==='dr:frame').at(-1).d;assert.ok(final.finished);assert.equal(final.racers.length,3);
assert.deepEqual(E.rank(final.racers).map(r=>r.id),E.rank(host.racers).map(r=>r.id));
const first=host.racers.map(r=>r.finish);assert.ok(host.start(100));time=host.startsAt+1000;host.tick();assert.equal(host.phase,'race');
host.leave('g2');assert.equal(host.players.find(p=>p.id==='g2').connected,false);
for(;time<300000&&host.phase!=='result';time+=100)host.tick();assert.equal(host.phase,'result');assert.notDeepEqual(host.racers.map(r=>r.finish),first);
assert.ok(host.lobby());assert.equal(host.players.length,2);assert.ok(host.players.every(p=>p.ready),"กลับห้องแล้วยังใช้สัตว์ตัวเดิมได้");noImages();
host.ready('host',animal);host.ready('g1',animal);host.start(100);host.leave('g1');assert.equal(host.phase,'lobby');assert.equal(host.players.length,1);
for(let i=0;i<5;i++)host.join('player'+i,{name:'คน'+i,protocol:O.protocol});assert.equal(host.players.length,6);assert.ok(!host.join('overflow',{name:'ล้น',protocol:O.protocol}));
const before=JSON.stringify(host.players[0].drawing);const input=JSON.parse(JSON.stringify(animal));host.ready('host',input);input.body[0].points[0][0]=0;assert.equal(JSON.stringify(host.players[0].drawing),before);
console.log('ผ่าน: ซ่อนภาพจนปล่อยตัว / 3 เครื่องได้ผลเดียวกัน / ตรวจสิทธิ์และภาพผิด / สุ่มรอบใหม่ / 200 เมตรจบครบ / คนหลุดและห้องเต็ม');
