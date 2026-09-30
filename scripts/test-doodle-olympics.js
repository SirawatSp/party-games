#!/usr/bin/env node
// ตรวจการแข่งขันจริง คะแนนเสมอ การใช้ภาพเดิม และข้อความที่เครื่องอื่นได้รับ
const assert=require('node:assert/strict'),O=require('../js/doodle-olympics-engine.js'),Host=require('../js/doodle-race-net.js');
const vm=require('node:vm'),fs=require('node:fs'),renderScope={DoodleOlympics:O};vm.runInNewContext(fs.readFileSync(require.resolve('../js/doodle-olympics-render.js'),'utf8'),renderScope);
// บันทึกคำสั่งวาดจริง ทั้งเส้นสัตว์ การหมุน และสนาม ไม่ตรวจเพียงอันดับหรือคะแนน
function paintTrace(s,w){const trace=[],context=new Proxy({}, {get:(_,key)=>(...args)=>{args.forEach(a=>{if(typeof a==='number')assert.ok(Number.isFinite(a),'พิกัดภาพต้องไม่เป็น NaN');});trace.push([key,...args]);},set:(_,key,value)=>{trace.push([key,value]);return true;}});renderScope.DoodleOlympicsRender.paint(context,s,w,s.mode==='sumo'?520:55+s.racers.length*120);return JSON.stringify(trace);}
const stroke=points=>({color:'#243d32',width:9,points});
const animal=(name,w=180,h=90)=>({name,body:[stroke([[100,100],[100+w,100],[100+w,100+h],[100,100+h],[100,100]])],legs:[stroke([[120,100+h],[110,290]]),stroke([[80+w,100+h],[110+w,305]])]});
const team=[animal('ตัวกว้าง'),animal('ตัวสูง',100,150),animal('ตัวเล็ก',65,45)],modes=Object.keys(O.sports),before=JSON.stringify(team);
function play(s){for(let i=0;i<24000&&!s.done;i++)O.step(s,1/60);assert.ok(s.done,'ทุกกีฬาต้องจบ');for(const r of s.racers){assert.ok(Number.isFinite(r.finish));assert.ok(r.finish>=0);for(const k of ['x','y','angle','score'])if(r[k]!==undefined)assert.ok(Number.isFinite(r[k]));}return s;}
function whole(seed,n=team){const t=O.create(n,modes,200,seed);while(O.next(t)){assert.equal(O.next(t),null,'ห้ามข้ามรายการที่ยังแข่ง');play(t.session);assert.ok(O.record(t));const totals=JSON.stringify(t.totals);assert.ok(!O.record(t),'ห้ามนับคะแนนซ้ำ');assert.equal(JSON.stringify(t.totals),totals);}return t;}
const t=whole(33),again=whole(33);assert.deepEqual(t.results,again.results,'เมล็ดเดิมให้ผลเดิม');assert.equal(t.results.length,5);assert.equal(JSON.stringify(team),before,'ภาพต้นฉบับไม่เปลี่ยน');assert.deepEqual(t.totals,again.totals);
for(const row of t.totals)assert.equal(row.points,t.results.reduce((n,e)=>n+e.rows.find(r=>r.id===row.id).points,0));
const six=whole(40,Array.from({length:6},(_,i)=>animal('ตัว'+i,60+i*25,55+i*15)));assert.equal(six.results.length,5);
const champions=new Set();for(let seed=1;seed<=20;seed++)champions.add(O.standings(whole(seed))[0].id);assert.ok(champions.size>1,'การสุ่มต้องเปลี่ยนแชมป์ได้');
const two=O.create(team.slice(0,2),['jump','sumo','run','unknown','jump'],100,3);assert.deepEqual(two.events,['run','sumo','jump']);
const noLeg={...animal('ไม่มีขา'),legs:[]};assert.ok(O.validAthlete(noLeg,['sumo','roll','jump','balance']));assert.ok(!O.validAthlete(noLeg,['run']));assert.throws(()=>O.create(team,[],100,1));assert.throws(()=>O.create([noLeg,animal('มีขา')],['run'],100,1));
const tie=O.create(team,['jump'],100,1);O.next(tie);tie.session.done=true;tie.session.racers.forEach((r,i)=>{r.finish=5;r.score=i===2?30:40;});O.record(tie);assert.deepEqual(tie.results[0].rows.map(r=>[r.place,r.points]),[[1,8.5],[1,8.5],[3,5]]);assert.deepEqual(O.standings(tie).map(r=>r.place),[1,1,3]);
assert.notEqual(O.geometry(team[0]).mass,O.geometry(team[2]).mass);assert.notEqual(O.geometry(team[0]).base,O.geometry(team[1]).base);
class Room{constructor(){this.handlers={};this.messages=[];this.guests=[[],[]];}on(k,f){this.handlers[k]=f;}to(id,k,d){this.messages.push({id,k,d:JSON.parse(JSON.stringify(d))});}broadcast(k,d){const m=JSON.parse(JSON.stringify({k,d}));this.messages.push(m);this.guests.forEach(g=>g.push(JSON.parse(JSON.stringify(m))));}}
let time=0,seed=90;const room=new Room(),host=new Host(room,{events:modes,name:'โฮสต์',now:()=>time,seed:()=>seed++});host.join('g1',{name:'เพื่อน',protocol:O.protocol});host.join('g2',{name:'เพื่อนสอง',protocol:O.protocol});team.forEach((d,i)=>host.ready(i? 'g'+i:'host',d));
assert.ok(!host.join('old',{name:'เกมวิ่งรุ่นเก่า'}),'รุ่นเก่าต้องเข้าชุดหลายกีฬาไม่ได้');assert.ok(!host.join('future',{name:'รุ่นต่างกัน',protocol:999}));assert.equal(host.players.length,3);assert.match(room.messages.at(-1).d.message,/คนละรุ่น/);
assert.ok(!host.settings([],100));assert.ok(host.canStart());const original=JSON.stringify(host.players.map(p=>p.drawing));
for(let e=0;e<5;e++){
 assert.ok(host.start(200));assert.ok(!host.settings(['run'],100));assert.ok(!host.start(100));
 time=host.startsAt-1;host.tick();assert.equal(host.phase,'countdown');assert.equal(room.messages.filter(m=>m.k==='dr:race').length,e);
 time=host.startsAt;host.tick();assert.equal(host.phase,'race');
 const reveal=room.guests[0].filter(m=>m.k==='dr:race').at(-1).d;assert.equal(reveal.protocol,O.protocol);assert.equal(reveal.mode,modes[e]);
 const replicas=room.guests.map(()=>O.makeSession(reveal.mode,reveal.team,reveal.team.map(()=>0),reveal.distance));
 for(let i=0;i<8000&&host.phase==='race';i++){time+=100;host.tick();const frame=room.guests[0].filter(m=>m.k==='dr:frame').at(-1).d;assert.equal(frame.protocol,O.protocol);replicas.forEach(r=>O.apply(r,frame));if(modes[e]!=='run'&&(i%10===0||frame.finished)){for(const w of [390,1000]){const expected=paintTrace(host.session,w);replicas.forEach(r=>assert.equal(paintTrace(r,w),expected,modes[e]+' ทุกเครื่องต้องวาดสนามและสัตว์เหมือนกัน'));}}}
 assert.equal(host.phase,'result');assert.equal(host.tournament.results.length,e+1);
 const data=room.guests[0].filter(m=>m.k==='dr:frame').at(-1).d;assert.ok(data.finished);
 const replica=O.makeSession(modes[e],team,[0,0,0],200);O.apply(replica,data);assert.deepEqual(O.rank(replica).map(r=>r.id),O.rank(host.session).map(r=>r.id));
 assert.deepEqual(data.totals,host.tournament.totals);assert.deepEqual(data.results,host.tournament.results);
 assert.equal(JSON.stringify(host.players.map(p=>p.drawing)),original,'ทั้งชุดใช้ภาพเดิมโดยไม่ส่งซ้ำ');
}
assert.deepEqual(room.guests[0],room.guests[1]);
for(const m of room.messages.filter(m=>m.k==='dr:state'))assert.ok(!/"(body|legs|points|drawing|team)"/.test(JSON.stringify(m.d)),'ห้องรอไม่มีภาพ');
assert.ok(host.lobby());assert.ok(host.settings(['jump','balance'],100));assert.ok(host.ready('host',noLeg));assert.ok(host.settings(['run'],100));assert.equal(host.players[0].ready,false,'เลือกวิ่งแล้วภาพไม่มีขาต้องวาดเพิ่ม');
// หลุดระหว่างชุดก็ยังใช้รายชื่อเดิมและคะแนนเดิมจนจบชุด
host.ready('host',team[0]);host.settings(['jump','balance'],100);host.start(100);for(time=host.startsAt;host.phase!=='result';time+=100)host.tick();const points=JSON.stringify(host.tournament.totals);host.start(100);host.leave('g2');assert.equal(host.phase,'result');assert.equal(JSON.stringify(host.tournament.totals),points);assert.ok(host.start(100));assert.equal(host.racers.length,3);for(time=host.startsAt;host.phase!=='result';time+=100)host.tick();assert.equal(host.tournament.results.length,2);
console.log('ผ่าน: กีฬา 5 แบบ / 2–6 ตัว / เมล็ดเดิมผลเดิม / รูปร่างมีผล / สุ่มเปลี่ยนแชมป์ / คะแนนเสมอ / ไม่นับซ้ำ / ใช้ภาพเดียวตลอดชุด / 3 เครื่องรับคะแนนเหมือนกัน / คำสั่งวาดทั้งสี่กีฬาตรงกันบนจอเล็กและใหญ่ / กันรุ่นเก่าเข้าห้อง / ไม่เปิดภาพก่อนแข่ง / หลุดแล้วยังเก็บคะแนนเดิม');
