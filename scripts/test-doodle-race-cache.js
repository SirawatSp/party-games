#!/usr/bin/env node
// ตรวจว่าเข้าหน้าเกมได้รุ่นสดก่อน cache และยังเปิดออฟไลน์ได้
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const handlers={},requests=[],stored=[],cached={status:200,version:'เก่า'},fresh={status:200,version:'ใหม่',clone(){return this;}},self={location:{origin:'https://example.test'},addEventListener(k,f){handlers[k]=f;}};
let offline=false,status=200,cacheHit=cached;
const caches={match:async req=>typeof req==='string'?cached:cacheHit,open:async()=>({put:async(req,res)=>stored.push(res),addAll:async()=>{}})};
vm.runInNewContext(fs.readFileSync(require.resolve('../sw.js'),'utf8'),{self,caches,URL,fetch:async(req,opts)=>{requests.push(opts);if(offline)throw Error('ออฟไลน์');return status===200?fresh:{status};}});
async function request(mode,url){let response;handlers.fetch({request:{method:'GET',mode,url},respondWith(r){response=r;}});return response;}
(async()=>{
 assert.equal(await request('navigate','https://example.test/party-games/doodle-race.html'),fresh);assert.equal(requests.at(-1).cache,'no-store');assert.equal(stored.at(-1),fresh);
 offline=true;assert.equal(await request('navigate','https://example.test/party-games/doodle-race.html'),cached);
 cacheHit=null;assert.equal(await request('navigate','https://example.test/party-games/doodle-race.html?update=123'),cached,'ลิงก์ชวนเพื่อนใหม่ยังเปิดหน้าเกมที่เก็บไว้ได้ตอนออฟไลน์');
 offline=false;cacheHit=cached;status=503;assert.equal(await request('navigate','https://example.test/party-games/doodle-race.html'),cached);
 status=200;assert.equal(await request('cors','https://example.test/party-games/js/doodle-race.js?v=84'),cached,'ไฟล์ที่มีเลขรุ่นยังโหลดจาก cache ตามเดิม');
 assert.equal(await request('navigate','https://another.test/doodle-race.html'),undefined);
 console.log('ผ่าน: หน้าเกมโหลดรุ่นล่าสุดก่อน / เปิดออฟไลน์ / ลิงก์ใหม่ออฟไลน์ / เซิร์ฟเวอร์สะดุด / cache ไฟล์ระบุรุ่น');
})().catch(e=>{console.error(e);process.exitCode=1;});
