#!/usr/bin/env node
// ทดสอบการกลับจากแอพอื่น เปลี่ยนการเชื่อมต่อ และโหลดหน้าใหม่ระหว่างชุดกีฬา
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const O=require('../js/doodle-olympics-engine.js'),Host=require('../js/doodle-race-net.js');
const line=points=>({color:'#243d32',width:9,points});
const animal={name:'สัตว์เดิม',body:[line([[150,100],[310,100],[310,180],[150,180],[150,100]])],legs:[line([[170,180],[150,260]]),line([[290,180],[310,260]])]};
class Messages{constructor(){this.handlers={};this.messages=[];}on(k,f){this.handlers[k]=f;}to(id,k,d){this.messages.push({id,k,d:JSON.parse(JSON.stringify(d))});}broadcast(k,d){this.to('*',k,d);}}
const key='a'.repeat(32),room=new Messages();let now=0;
const host=new Host(room,{events:['balance','climb'],now:()=>now,seed:()=>12});
host.join('old',{name:'ผู้เล่น',resumeKey:key,protocol:O.protocol});host.ready('host',animal);host.ready('old',animal);
const drawing=JSON.stringify(host.players[1].drawing);host.start(100);host.leave('old');assert.equal(host.phase,'countdown','การพักแอพระหว่างนับถอยหลังต้องไม่ยกเลิกรายการ');
room.messages=[];host.join('new',{name:'ผู้เล่น',resumeKey:key,protocol:O.protocol});assert.equal(host.players.length,2);assert.equal(host.players[1].id,'new');assert.ok(host.players[1].connected);
assert.ok(!room.messages.some(m=>m.k==='dr:race'),'กลับระหว่างนับถอยหลังยังไม่เห็นภาพเพื่อน');
now=host.startsAt+5000;host.tick();const round=host.round,elapsed=host.session.elapsed;
host.leave('new');assert.ok(host.join('again',{name:'ชื่อที่เปลี่ยน',resumeKey:key,protocol:O.protocol}));
assert.equal(host.round,round);assert.equal(host.session.elapsed,elapsed);assert.equal(host.players.length,2);assert.equal(JSON.stringify(host.players[1].drawing),drawing);
const race=room.messages.filter(m=>m.id==='again'&&m.k==='dr:race').at(-1).d,frame=room.messages.filter(m=>m.id==='again'&&m.k==='dr:frame').at(-1).d;
const replica=O.makeSession(race.mode,race.team,[0,0],race.distance);O.apply(replica,frame);assert.deepEqual(O.snapshot(replica),O.snapshot(host.session),'กลับมาแล้วต้องได้สนาม ท่าทาง และผลล่าสุด');
host.leave('new');assert.ok(host.players[1].connected,'การปิดท่อเก่าต้องไม่ตัดผู้เล่นที่เชื่อมกลับแล้ว');
assert.ok(!host.join('impostor',{name:'ผู้เล่น',resumeKey:'b'.repeat(32),protocol:O.protocol}),'ชื่อเหมือนกันไม่ใช่สิทธิ์ยึดตัวสัตว์');
assert.equal(host.players.length,2);host.stop();const points=JSON.stringify(host.tournament.totals),results=JSON.stringify(host.tournament.results);
host.leave('again');host.join('results',{name:'ผู้เล่น',resumeKey:key,protocol:O.protocol});assert.equal(JSON.stringify(host.tournament.totals),points);assert.equal(JSON.stringify(host.tournament.results),results);
assert.ok(room.messages.filter(m=>m.id==='results'&&m.k==='dr:frame').at(-1).d.finished);
host.start(100);now=host.startsAt+1000;host.tick();host.leave('results');host.join('last',{name:'ผู้เล่น',resumeKey:key,protocol:O.protocol});assert.equal(room.messages.filter(m=>m.id==='last'&&m.k==='dr:race').at(-1).d.mode,'climb');
for(const m of room.messages.filter(m=>m.k==='dr:state'))assert.ok(!/resumeKey|"body"|"legs"/.test(JSON.stringify(m.d)),'สถานะสาธารณะต้องไม่มีรหัสกลับเข้าห้องหรือภาพ');

const storage=new Map(),sessionStorage={getItem:k=>storage.get(k)||null,setItem:(k,v)=>storage.set(k,v),removeItem:k=>storage.delete(k)};
function screen(){
 const elements=new Map(),timers=new Map(),events={},documentEvents={};let timerId=0,time=0,left=0,entered=0,rooms=[];
 function el(id){if(!elements.has(id))elements.set(id,{value:'',hidden:true,disabled:false,textContent:'',handlers:{},children:[],dataset:{},appendChild(a){this.children.push(a);},addEventListener(k,f){this.handlers[k]=f;},replaceChildren(){this.children=[];},append(...a){this.children.push(...a);},setAttribute(){}});return elements.get(id);}
 class GuestRoom{constructor(t){this.t=t;this.handlers={};this.messages=[];rooms.push(this);}on(k,f){this.handlers[k]=f;}async join(code){this.code=code;this.t.id='g'+rooms.length;}send(k,d){this.messages.push({k,d});}close(){this.closed=true;}}
 const ui={enterOnline(){entered++;},leaveOnline(){left++;},settings(){},hostControls(){},show(){},resetRound(){},race(){},frame(){}};
 const doc={hidden:false,getElementById:el,createElement:()=>el('generated'+elements.size),addEventListener(k,f){if(k==='DOMContentLoaded')f();else documentEvents[k]=f;}};
 const ctx={document:doc,window:{DoodleRaceUI:ui,addEventListener(k,f){events[k]=f;}},location:{href:'https://example.test/doodle-race.html?room=ABCDE',search:'?room=ABCDE'},URL,URLSearchParams,crypto:require('node:crypto').webcrypto,sessionStorage,DoodleOlympics:O,PGRoom:GuestRoom,PGPeerTransport:class{},performance:{now:()=>time},console,navigator:{},setTimeout(f,delay){timers.set(++timerId,{f,delay,interval:false});return timerId;},setInterval(f,delay){timers.set(++timerId,{f,delay,interval:true});return timerId;},clearTimeout(id){timers.delete(id);},clearInterval(id){timers.delete(id);}};
 vm.runInNewContext(fs.readFileSync(require.resolve('../js/doodle-race-online.js'),'utf8'),ctx);
 return {el,rooms,doc,events,documentEvents,timers,get left(){return left;},get entered(){return entered;},set time(t){time=t;},accept(){const r=rooms.at(-1);r.handlers['dr:state']({protocol:O.protocol,phase:'lobby',events:['climb'],distance:100,players:[{id:r.t.id,name:'ผู้เล่น',ready:true,connected:true}],canStart:false});},async flush(){await Promise.resolve();await Promise.resolve();}};
}
(async()=>{
 const s=screen();s.el('drOnlineName').value='ผู้เล่น';await s.el('drJoinRoom').handlers.click();s.accept();assert.equal(s.entered,1);
 const first=s.rooms[0],saved=JSON.parse(storage.get('pg_doodle_room_v1'));
 s.doc.hidden=true;s.time=60000;for(const t of s.timers.values())if(t.interval)t.f();assert.equal(s.left,0,'ขณะพักแอพต้องไม่ถูกพาออกจากเกม');
 s.doc.hidden=false;s.documentEvents.visibilitychange();assert.equal(first.messages.at(-1).k,'dr:join');assert.equal(first.messages.at(-1).d.resumeKey,saved.key);
 s.time=80000;for(const t of [...s.timers.values()])if(t.interval)t.f();assert.ok(first.closed,'ท่อที่ไม่ตอบรับต้องถูกแทนที่');assert.equal(s.left,0);
 for(const [id,t] of [...s.timers])if(!t.interval){s.timers.delete(id);t.f();}await s.flush();s.accept();assert.equal(s.rooms.length,2);assert.equal(s.entered,1,'การต่อท่อใหม่ต้องไม่ล้างภาพของตัวเอง');assert.equal(s.rooms[1].messages[0].d.resumeKey,saved.key);
 s.events.pagehide({persisted:true});assert.equal(s.left,0);s.events.pageshow();await s.flush();s.accept();assert.equal(s.rooms.at(-1).messages[0].d.resumeKey,saved.key);
 const reload=screen();await reload.flush();assert.equal(reload.rooms.length,1,'หน้าโหลดใหม่ต้องลองกลับเข้าห้องเอง');assert.equal(reload.rooms[0].messages[0].d.resumeKey,saved.key);reload.accept();
 reload.el('drLeaveRoom').handlers.click();assert.equal(reload.left,1);assert.ok(!storage.has('pg_doodle_room_v1'));assert.equal(reload.timers.size,0);
 s.el('drLeaveRoom').handlers.click();assert.equal(s.timers.size,0);
 console.log('ผ่าน: พักแอพ 60 วินาทีไม่โดนเด้ง / เชื่อมท่อใหม่และโหลดใหม่ใช้สัตว์เดิม / กลับระหว่างนับถอยหลังไม่เผยภาพ / กลับกลางกีฬาและหน้าผลได้ / สนามล่าสุดตรงกัน / คะแนนไม่ซ้ำ / กันยึดสัตว์ด้วยชื่อ / ออกห้องแล้วหยุดเชื่อมกลับ');
})().catch(e=>{console.error(e);process.exitCode=1;});
