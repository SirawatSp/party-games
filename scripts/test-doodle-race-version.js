#!/usr/bin/env node
// ผู้เล่นรุ่นใหม่เจอเจ้าของห้องรุ่นเก่า ต้องหยุดก่อนสร้างสนามผิดประเภท
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),O=require('../js/doodle-olympics-engine.js');
const elements=new Map(),timers=new Set();let nextTimer=0,left=0,entered=0,frames=0,replace='';
function element(id){if(!elements.has(id))elements.set(id,{value:'',hidden:id==='drRefreshGame',disabled:false,textContent:'',handlers:{},addEventListener(k,f){this.handlers[k]=f;}});return elements.get(id);}
class Room{
 constructor(t){this.t=t;this.handlers={};Room.last=this;}
 on(k,f){this.handlers[k]=f;}
 async join(code){this.code=code;this.t.id='guest';}
 send(k,d){this.joinMessage={k,d};}
 close(){this.closed=true;}
}
const ui={enterOnline(){entered++;},leaveOnline(){left++;},race(){frames++;},frame(){frames++;},resetRound(){}};
const document={getElementById:element,addEventListener(k,f){if(k==='DOMContentLoaded')f();}},window={DoodleRaceUI:ui,addEventListener(){}};
const context={document,window,location:{href:'https://example.test/party-games/doodle-race.html?room=ABCDE',search:'?room=ABCDE',replace(url){replace=url;}},URL,URLSearchParams,crypto:require("node:crypto").webcrypto,DoodleOlympics:O,PGRoom:Room,PGPeerTransport:class{},performance:{now:()=>0},console,navigator:{},setTimeout(){timers.add(++nextTimer);return nextTimer;},setInterval(){timers.add(++nextTimer);return nextTimer;},clearTimeout(id){timers.delete(id);},clearInterval(id){timers.delete(id);}};
vm.runInNewContext(fs.readFileSync(require.resolve('../js/doodle-race-online.js'),'utf8'),context);
(async()=>{
 element('drOnlineName').value='ผู้เล่น';await element('drJoinRoom').handlers.click();assert.equal(entered,1);assert.equal(Room.last.joinMessage.d.protocol,O.protocol);
 Room.last.handlers['dr:state']({players:[],phase:'lobby'});assert.equal(left,1);assert.ok(Room.last.closed);assert.match(element('drNetMessage').textContent,/คนละรุ่น/);assert.equal(element('drRefreshGame').hidden,false);assert.equal(timers.size,0,'ห้องรุ่นต่างกันต้องหยุด timer');
 element('drRefreshGame').handlers.click();const url=new URL(replace);assert.equal(url.searchParams.get('room'),'ABCDE');assert.ok(url.searchParams.has('update'));
 await element('drJoinRoom').handlers.click();Room.last.handlers['dr:race']({round:1});assert.equal(frames,0);assert.ok(Room.last.closed);assert.equal(timers.size,0);
 await element('drJoinRoom').handlers.click();Room.last.handlers['dr:frame']({round:1});assert.equal(frames,0);assert.ok(Room.last.closed);assert.equal(timers.size,0);
 console.log('ผ่าน: ส่งรุ่นตอนเข้าห้อง / เจอเจ้าของห้องเก่าแล้วหยุด / ไม่สร้างสนามผิดประเภท / ปุ่มเปิดรุ่นสดเก็บรหัสห้อง / ปิด timer');
})().catch(e=>{console.error(e);process.exitCode=1;});
