#!/usr/bin/env node
// เทียบสัตว์ที่ต่างกันทีละลักษณะ ด้วยชุดสุ่มเดียวกัน แล้ววัดผลจากการแข่งขันจริง
const assert=require('node:assert/strict'),O=require('../js/doodle-olympics-engine.js');
const line=(points,width=9)=>({color:'#243d32',width,points}),rect=(x,y,w,h)=>line([[x,y],[x+w,y],[x+w,y+h],[x,y+h],[x,y]]);
const runner={name:'ขายาว',body:[rect(150,110,170,70)],legs:[line([[165,180],[145,240],[175,315]]),line([[305,180],[330,245],[300,315]])]};
const short=JSON.parse(JSON.stringify(runner));short.name='ขาสั้น';short.legs.forEach(s=>s.points=s.points.map(p=>[p[0],180+(p[1]-180)*.3]));
const stocky={name:'เตี้ยกว้างขาหนา',body:[rect(130,135,210,85)],legs:[line([[150,220],[130,280]],15),line([[320,220],[350,280]],15)]};
const tall={name:'สูงแคบขาบาง',body:[rect(210,55,70,165)],legs:[line([[220,220],[225,330]],5),line([[270,220],[265,330]],5)]};
const circle={name:'กลม',body:[line(Array.from({length:65},(_,i)=>[250+80*Math.cos(i*Math.PI/32),160+80*Math.sin(i*Math.PI/32)]))],legs:[]};
const square={name:'เหลี่ยม',body:[rect(170,80,160,160)],legs:[]};
const straight={name:'ขาตรง',body:[rect(150,110,170,70)],legs:[line([[165,180],[165,315]]),line([[305,180],[305,315]])]};
const bent={name:'ขางอ',body:straight.body,legs:[line([[165,180],[115,235],[165,315]]),line([[305,180],[355,235],[305,315]])]};
const pairs=[['run',runner,short],['sumo',stocky,tall],['roll',circle,square],['jump',bent,straight],['balance',stocky,tall]];
const output=[];
for(const [mode,better,worse] of pairs){assert.ok(O.validAthlete(better,[mode]));assert.ok(O.validAthlete(worse,[mode]));let wins=0,totalA=0,totalB=0;
 for(let i=0;i<24;i++){const swap=i%2,team=swap?[worse,better]:[better,worse],seed=125+i*73,s=O.makeSession(mode,team,[seed,seed],100);
  for(let n=0;n<6000&&!s.done;n++)O.step(s,1/60);assert.ok(s.done,mode+' ต้องจบ');const a=s.racers[swap],b=s.racers[1-swap];
  const va=mode==='jump'?a.distance:a.finish,vb=mode==='jump'?b.distance:b.finish;totalA+=va;totalB+=vb;wins+=O.rank(s)[0].id===swap?1:0;
 }
 const meanA=totalA/24,meanB=totalB/24;output.push({mode,wins,meanA:Number(meanA.toFixed(2)),meanB:Number(meanB.toFixed(2))});
 assert.ok(wins>=18,mode+' รูปที่เหมาะต้องชนะอย่างชัดเจนข้ามหลายเมล็ดและสลับตำแหน่ง');
 if(['run','roll'].includes(mode))assert.ok(meanA<meanB*.9,mode+' เวลาเฉลี่ยต้องดีขึ้นอย่างน้อย 10%');
 if(mode==='jump')assert.ok(meanA>meanB*1.2,'ขางอต้องกระโดดไกลขึ้นอย่างน้อย 20%');
 if(mode==='balance')assert.ok(meanA>meanB*2,'ฐานกว้างตัวเตี้ยต้องยืนได้นานขึ้นอย่างน้อยสองเท่า');
}
console.log(JSON.stringify(output,null,2));
// จำนวนจุด สี และลำดับการวาดเส้นไม่ควรสร้างความได้เปรียบ
const dense=JSON.parse(JSON.stringify(stocky));dense.body=dense.body.map(s=>({...s,points:s.points.flatMap((p,i)=>i===s.points.length-1?[p]:Array.from({length:20},(_,j)=>[p[0]+(s.points[i+1][0]-p[0])*j/20,p[1]+(s.points[i+1][1]-p[1])*j/20]))}));
for(const k of ['mass','base','spring','roundness','push','balanceControl'])assert.ok(Math.abs(O.geometry(dense)[k]-O.geometry(stocky)[k])<1e-7,'จุดถี่ต้องไม่เพิ่ม '+k);
const recolored=JSON.parse(JSON.stringify(stocky));recolored.body.reverse();recolored.legs.reverse();[...recolored.body,...recolored.legs].forEach(s=>s.color='#df5936');
for(const k of ['mass','base','spring','roundness','push','balanceControl'])assert.ok(Math.abs(O.geometry(recolored)[k]-O.geometry(stocky)[k])<1e-7,'สี/ลำดับเส้นต้องไม่เพิ่ม '+k);
const arms={...runner,legs:[...runner.legs,line([[320,145],[430,145]])]};
const bare=O.makeSession('sumo',[runner,runner],[5,5],100),reach=O.makeSession('sumo',[arms,runner],[5,5],100);
for(const s of [bare,reach])s.racers.forEach((r,i)=>{r.x=i*65;r.y=0;r.angle=0;});
assert.equal(O.collision(...bare.racers),null);assert.ok(O.collision(...reach.racers),'แขนที่ยื่นต้องแตะคู่แข่งก่อนลำตัว ไม่ใช้วงชนขนาดเดียวกัน');
const thick=JSON.parse(JSON.stringify(runner));thick.legs.forEach(s=>s.width=15);assert.ok(O.geometry(thick).push>O.geometry(runner).push,'ขาหนาใช้ดันได้แรงขึ้น');
// แขนขาขยับจริงและข้อแรกยังต่อกับลำตัว ภาพต้นฉบับยังเหมือนเดิม
for(const mode of ['sumo','roll','jump','balance']){const before=JSON.stringify(runner),s=O.makeSession(mode,[runner,runner],[17,29],100),first=JSON.stringify(O.pose(s.racers[0],mode));for(let n=0;n<30;n++)O.step(s,1/60);const second=O.pose(s.racers[0],mode);assert.notEqual(JSON.stringify(second),first,mode+' ข้อต่อต้องขยับ');second.limbs.forEach((p,i)=>assert.deepEqual(p[0],runner.legs[i].points[0]));assert.equal(JSON.stringify(runner),before);}
module.exports={pairs,output};
for(const mode of Object.keys(O.sports)){const winners=new Set();for(let i=0;i<16;i++){const s=O.makeSession(mode,Array.from({length:4},()=>runner),Array.from({length:4},(_,j)=>900+i*37+j*19),100);for(let n=0;n<6000&&!s.done;n++)O.step(s,1/60);winners.add(O.rank(s)[0].id);}assert.ok(winners.size>=3,mode+' รูปใกล้เคียงกันต้องยังเปลี่ยนผู้ชนะตามจังหวะสุ่ม');}
console.log('ผ่าน: รูปที่เหมาะได้เปรียบทุกกีฬา / สลับตำแหน่ง / ความถี่จุดและสีไม่เพิ่มแรง / แขนแตะคู่แข่งจริง / ขาหนาเพิ่มแรง / ข้อต่อขยับแต่ภาพเดิมไม่เสีย / รูปเหมือนกันยังสุ่มเปลี่ยนผู้ชนะ');

// เส้นบางยังมีความหนาชนกัน และเส้นคดเคี้ยวยาวไม่ทำให้จุดเกิดอยู่นอกสนาม
const thin={name:'เส้นบาง',body:[line([[100,100],[300,250]],3)],legs:[]},thinSession=O.makeSession('sumo',[thin,thin],[5,5],100);
thinSession.racers.forEach((r,i)=>{r.x=i;r.y=0;r.angle=0;});assert.ok(O.collision(...thinSession.racers),'เส้นบางต้องไม่ทะลุคู่แข่ง');
const scribble={...runner,legs:[line(Array.from({length:600},(_,i)=>i%2?[400,320]:[165,180]))]};
const spawn=O.makeSession('sumo',[scribble,runner],[5,5],100);spawn.racers.forEach(r=>assert.ok(Number.isFinite(r.x)&&Math.hypot(r.x,r.y)<spawn.arena,'เส้นยาวต้องไม่ทำให้เกิดนอกสนาม'));
console.log('ผ่าน: เส้นบางชนได้ / เส้นยาวไม่ทำให้เกิดนอกสนาม');
