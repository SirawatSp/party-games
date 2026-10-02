#!/usr/bin/env node
// ตรวจรอบจริง การส่งข้อมูลลับ การกลับเข้าห้อง และขนาดภาพ ไม่ต้องมีเบราว์เซอร์หรือเน็ต
const assert=require("node:assert/strict"),fs=require("node:fs"),vm=require("node:vm"),path=require("node:path"),{spawnSync}=require("node:child_process");
require("../js/witness-sketch-engine.js");
const {Host,drawing}=globalThis.WitnessSketch;
const root=path.join(__dirname,".."),pool=require("./content-pools.js").loadPool(require("./content-pools.js").byKey("sketch"));
let time=0,chosen=0,messages=[];
const host=new Host({name:"เจ้าของ",now:()=>time,pick:()=>pool[chosen++%pool.length],send:(peer,type,data)=>messages.push(JSON.parse(JSON.stringify({peer,type,data})))});
const keyA="a".repeat(32),keyB="b".repeat(32),keyC="c".repeat(32),stroke=[{color:"#252525",width:.013,points:[[.1,.2],[.4,.6]]}];
assert.equal(host.newRound("host",{}),false,"ต้องมีผู้เล่นออนไลน์สองคน");
assert.equal(host.join("x",{protocol:99,key:keyA}),false);
assert.equal(host.join("a",{protocol:1,key:keyA,name:"เพื่อนหนึ่ง"}),true);
assert.equal(host.join("b",{protocol:1,key:keyB,name:"เพื่อนสอง"}),true);
assert.equal(host.newRound("host",{cat:"people",duration:60}),true);
let token=host.roundId;
assert.equal(host.witness,"host");assert.equal(host.phase,"prepare");
assert.ok(host.snapshot("host").reference);
for(const id of ["p1","p2"]){const s=host.snapshot(id);assert.ok(!("reference" in s));assert.ok(!JSON.stringify(s).includes(host.reference.file));assert.ok(!JSON.stringify(s).includes(host.reference.name));}
assert.equal(host.begin("a",{roundId:token}),false);
assert.equal(host.skip("b",{roundId:token}),false);
assert.equal(host.begin("host",{roundId:"เก่า"}),false);
assert.equal(host.skip("host",{roundId:token}),true);assert.notEqual(host.roundId,token);
assert.equal(host.begin("host",{roundId:token}),false);token=host.roundId;
assert.equal(host.begin("host",{roundId:token}),true);assert.equal(host.phase,"drawing");
assert.equal(host.save("a",{roundId:token,strokes:stroke},false),true);
assert.deepEqual(host.snapshot("p1").own,stroke);assert.deepEqual(host.snapshot("p2").own,[]);
assert.equal(host.clue("b",{roundId:token,text:"ไม่ใช่คนใบ้"}),false);
assert.equal(host.clue("host",{roundId:token,text:"<b>ผมสั้น</b>"}),true);assert.equal(host.snapshot("p1").clues[0],"<b>ผมสั้น</b>");
assert.equal(host.save("host",{roundId:token,strokes:stroke},true),false);
assert.equal(host.save("b",{roundId:token,strokes:[{...stroke[0],points:[[Infinity,0]]}]},false),false);
assert.equal(host.save("a",{roundId:token,strokes:stroke},true),true);
assert.equal(host.save("a",{roundId:token,strokes:[]},false),false,"ส่งแล้วแก้ไม่ได้");
assert.ok(!messages.some(m=>m.type==="sk:gallery"),"ยังไม่ส่งภาพวาดให้เพื่อนก่อนเฉลย");
host.disconnect("a");assert.equal(host.players.length,3);assert.equal(host.players[1].connected,false);
assert.equal(host.join("a-new",{protocol:1,key:keyA,name:"ชื่อใหม่"}),true);assert.equal(host.players.length,3);assert.equal(host.players[1].id,"p1");assert.equal(host.players[1].name,"เพื่อนหนึ่ง");assert.ok(host.snapshot("p1").players.find(p=>p.id==="p1").submitted);assert.deepEqual(host.snapshot("p1").own,stroke);
assert.equal(host.save("a",{roundId:token,strokes:[]},true),false,"ช่องเชื่อมต่อเก่าส่งแทนช่องใหม่ไม่ได้");
assert.equal(host.join("c",{protocol:1,key:keyC,name:"เข้าช้า"}),true);assert.equal(host.snapshot("p3").players.find(p=>p.id==="p3").artist,false);
assert.equal(host.end("b",{roundId:token}),false);
time=61000;host.tick();assert.equal(host.phase,"reveal");assert.ok(host.snapshot("p2").reference);
for(const peer of ["host","a-new","b","c"]){const gallery=messages.filter(m=>m.peer===peer&&m.type==="sk:gallery");assert.equal(gallery.length,2);assert.deepEqual(gallery.find(m=>m.data.id==="p1").data.strokes,stroke);}
assert.equal(host.newRound("host",{}),true);token=host.roundId;assert.equal(host.witness,"p1");assert.deepEqual(host.art,{});assert.equal(host.snapshot("p3").players.find(p=>p.id==="p3").artist,true);assert.ok(!host.snapshot("host").reference);assert.ok(host.snapshot("p1").reference);
host.disconnect("a-new");assert.equal(host.replace("b",{roundId:token}),false);assert.equal(host.replace("host",{roundId:token}),true);assert.equal(host.witness,"host");
assert.equal(host.begin("host",{roundId:host.roundId}),true);assert.equal(host.end("host",{roundId:host.roundId}),true);assert.equal(host.newRound("host",{}),true);assert.equal(host.witness,"p2");host.leave("b");assert.equal(host.witness,"host");assert.equal(host.phase,"prepare");
assert.equal(drawing(null),null);assert.equal(drawing([{...stroke[0],color:"url(x)"}]),null);assert.equal(drawing([{...stroke[0],width:-1}]),null);assert.equal(drawing(Array(61).fill(stroke[0])),null);
const largest=Array.from({length:5},()=>({...stroke[0],points:Array.from({length:240},(_,i)=>[i/239,(239-i)/239])}));assert.ok(drawing(largest));assert.ok(JSON.stringify({roundId:"999:999",strokes:largest}).length<60000,"แต่ละภาพส่งได้ในข้อความเดียว");assert.equal(drawing([...largest,stroke[0]]),null);
const paper=new Host({paper:true,name:"คนใบ้",pick:()=>pool[0],send:()=>{},now:()=>time});assert.ok(paper.newRound("host",{duration:90}));assert.ok(paper.begin("host",{roundId:paper.roundId}));assert.ok(paper.end("host",{roundId:paper.roundId}));
assert.equal(pool.length,16);assert.equal(new Set(pool.map(p=>p.name)).size,pool.length);assert.equal(new Set(pool.map(p=>p.file)).size,pool.length);assert.equal(new Set(pool.map(p=>p.image)).size,pool.length);
for(const ref of pool){assert.equal(new URL(ref.image).protocol,"https:");assert.ok(["thumb.wikimedia.org","upload.wikimedia.org"].includes(new URL(ref.image).hostname));assert.ok(decodeURIComponent(ref.image).includes(ref.file));assert.ok(ref.author&&ref.license&&ref.licenseUrl);}
const html=fs.readFileSync(path.join(root,"witness-sketch.html"),"utf8"),sw=fs.readFileSync(path.join(root,"sw.js"),"utf8"),ui=fs.readFileSync(path.join(root,"js/witness-sketch.js"),"utf8");
assert.ok(!/<img/i.test(html),"หน้าแรกไม่มีต้นฉบับติด DOM");assert.ok(!/innerHTML/.test(ui),"ชื่อและคำใบ้ใช้ textContent");
assert.ok(!/<\/\w+\s+[^>]/.test(html),"แท็กปิดไม่มีแอตทริบิวต์ที่ทำให้เบราว์เซอร์ทิ้งตัวเลือก");
const categoryMarkup=html.match(/<select id="wsCategory">([\s\S]*?)<\/select>/)[1];assert.deepEqual([...categoryMarkup.matchAll(/<option value="([^"]+)"/g)].map(m=>m[1]),["all","people","characters"],"เมนูต้องเลือกได้ทั้งสองหมวดจริง");
for(const asset of ["witness-sketch.html","css/witness-sketch.css?v=92","js/witness-sketch-engine.js?v=91","js/witness-sketch.js?v=91","data/sketch-references.js"])assert.ok(sw.includes('"'+asset+'"'));
const before=fs.readFileSync(path.join(root,"data/sketch-references.js"),"utf8"),temp=fs.mkdtempSync(path.join(require("node:os").tmpdir(),"pg-sketch-test-")),input=path.join(temp,"new.json");fs.writeFileSync(input,JSON.stringify([pool[0]]));try{const guard=spawnSync(process.execPath,["scripts/add-entries.js","sketch",input,"--init"],{cwd:root,encoding:"utf8"});assert.equal(guard.status,2);assert.match(guard.stderr,/--init/);assert.equal(fs.readFileSync(path.join(root,"data/sketch-references.js"),"utf8"),before,"--init ไม่เขียนทับคลังเดิม");}finally{fs.rmSync(temp,{recursive:true,force:true});}
// ทดสอบด้วยชั้นรับส่งข้อความจริงแบบ loopback เพื่อให้การส่งบทบาทส่วนตัววิ่งผ่าน PGRoom
const context={window:{},setTimeout,clearTimeout,Uint32Array,console};vm.createContext(context);vm.runInContext(fs.readFileSync(path.join(root,"js/net-room.js"),"utf8"),context);
(async()=>{const W=context.window,a=new W.PGRoom(new W.PGLoopbackTransport()),b=new W.PGRoom(new W.PGLoopbackTransport());const received=[];const h=new Host({name:"โฮสต์",pick:()=>pool[0],send:(peer,type,data)=>{if(peer!=="host")a.to(peer,type,data);}});a.on("sk:join",(d,peer)=>h.join(peer,d));b.on("sk:state",d=>received.push(d));const code=await a.host();await b.join(code);b.send("sk:join",{protocol:1,key:"d".repeat(32),name:"คนวาด"});await new Promise(r=>setTimeout(r,20));assert.ok(h.newRound("host",{}));await new Promise(r=>setTimeout(r,20));assert.equal(received.at(-1).phase,"prepare");assert.ok(!received.at(-1).reference);a.close();b.close();console.log("ผ่าน: บทบาทลับ วาด/ส่ง/เฉลย เวลา สลับคนใบ้ ผู้เข้าช้า กลับเข้าห้อง ข้อมูลผิด ขนาดข้อความ คลังภาพ และ PGRoom loopback");})().catch(e=>{console.error(e);process.exitCode=1;});
