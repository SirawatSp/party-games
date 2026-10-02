// กีฬาแบบการ์ตูน: รูปร่างมีผลต่อแรง ชน หมุน และทรงตัว สุ่มแรงระหว่างเล่น ไม่กำหนดแชมป์ล่วงหน้า
(function(root){
  "use strict";
  const E=typeof module!=="undefined"&&module.exports?require("./doodle-race-engine.js"):root.DoodleRace;
  const clamp=(n,a,b)=>Math.max(a,Math.min(b,n)),copy=x=>JSON.parse(JSON.stringify(x));
  const sports={
    run:{name:"วิ่งแข่ง",icon:"🏃",rule:"ปลายขาสัมผัสพื้นถีบจริง ขายาวช่วยก้าว ตัวหนักเร่งช้า",unit:"วิ"},
    sumo:{name:"ซูโม่",icon:"💥",rule:"ยันขาดัน ชนตามส่วนที่วาด ตัวหนักฐานกว้างเสียหลักยาก",unit:"วิ"},
    roll:{name:"กลิ้งลงเขา",icon:"🌀",rule:"ตัวกลมกลิ้งลื่น เหลี่ยมและแขนขายื่นเสียพลังเมื่อหมุน",unit:"วิ"},
    jump:{name:"กระโดดไกล",icon:"🚀",rule:"ขางอเก็บแรงถีบ ขายาวช่วยส่ง ตัวหนักและส่วนยื่นต้านลม",unit:"ม."},
    balance:{name:"ทรงตัว",icon:"⚖️",rule:"ฐานเท้ากว้างและตัวเตี้ยล้มยาก แขนช่วยต้านการเอียง",unit:"วิ"},
    swim:{name:"ว่ายน้ำ",icon:"🏊",rule:"พายแขนขาฝ่าน้ำ 50 ม. ตัวเพรียวต้านน้ำน้อย แขนยาวพายแรงแต่ส่วนยื่นเพิ่มแรงต้าน",unit:"วิ",finishDistance:50},
    climb:{name:"ปีนผา",icon:"🧗",rule:"ปีนให้ถึง 12 ม. แขนยาวเอื้อมไกล เส้นหนาจับแน่น ตัวหนักหมดแรงง่าย ต้องพักและระวังลื่น",unit:"วิ",finishDistance:12},
    discus:{name:"ขว้างจักร",icon:"🥏",rule:"หมุนตัวแล้วเหวี่ยงจักร แขนยาวเพิ่มระยะเหวี่ยง แต่ฐานแคบหรือแขนอ่อนทำให้แรงและมุมปล่อยเสีย",unit:"ม."}
  };
  function events(list){return Array.isArray(list)?Object.keys(sports).filter(k=>list.includes(k)):[];}
  function validAthlete(d,list){return E.validDrawing(d,!events(list).includes("run"));}
  function hull(points){
    const a=points.map(p=>[p[0],p[1]]).sort((p,q)=>p[0]-q[0]||p[1]-q[1]),cross=(o,p,q)=>(p[0]-o[0])*(q[1]-o[1])-(p[1]-o[1])*(q[0]-o[0]);
    const half=list=>{const h=[];list.forEach(p=>{while(h.length>1&&cross(h.at(-2),h.at(-1),p)<=0)h.pop();h.push(p);});h.pop();return h;};return [...half(a),...half(a.slice().reverse())];
  }
  function sample(stroke,n=24){
    const p=stroke.points,lengths=p.slice(1).map((b,i)=>Math.hypot(b[0]-p[i][0],b[1]-p[i][1])),length=lengths.reduce((a,b)=>a+b,0);let seg=0,start=0;
    return Array.from({length:n},(_,i)=>{const target=length*i/(n-1);while(seg<lengths.length-1&&start+lengths[seg]<target){start+=lengths[seg++];}const a=p[seg],b=p[seg+1],t=clamp((target-start)/(lengths[seg]||1),0,1);return [a[0]+(b[0]-a[0])*t,a[1]+(b[1]-a[1])*t];});
  }
  function geometry(d){
    const all=[...d.body,...d.legs],b=E.bounds(all),body=E.bounds(d.body);let total=0,sx=0,sy=0,ink=0;
    all.forEach(s=>s.points.slice(1).forEach((p,i)=>{const a=s.points[i],m=Math.hypot(p[0]-a[0],p[1]-a[1])*s.width;total+=m;sx+=(a[0]+p[0])*.5*m;sy+=(a[1]+p[1])*.5*m;ink+=m;}));
    const cx=total?sx/total:b.x+b.w/2,cy=total?sy/total:b.y+b.h/2;
    // เก็บจุดตามความยาวเส้น ไม่ใช้ความถี่จุดจากเมาส์เป็นความแข็งแรง
    const bodyExact=hull(d.body.flatMap(s=>hull(s.points).flatMap(p=>[[p[0]-s.width/2,p[1]-s.width/2],[p[0]+s.width/2,p[1]-s.width/2],[p[0]+s.width/2,p[1]+s.width/2],[p[0]-s.width/2,p[1]+s.width/2]]))),bodyPoints=bodyExact.filter((_,i)=>i%Math.max(1,Math.ceil(bodyExact.length/96))===0),limbs=d.legs.map(s=>{const p=sample(s),a=p[0],z=p.at(-1);let length=0;p.slice(1).forEach((q,i)=>{length+=Math.hypot(q[0]-p[i][0],q[1]-p[i][1]);});const chord=Math.hypot(z[0]-a[0],z[1]-a[1]),foot=z[1]>body.y+body.h+8;let travel=0;const progress=s.points.map((q,i)=>{if(i)travel+=Math.hypot(q[0]-s.points[i-1][0],q[1]-s.points[i-1][1]);return travel;}).map(v=>v/Math.max(1,travel));return {points:p,progress,length,chord,width:s.width,foot,flex:clamp(1-chord/(length||1),0,.65),strength:clamp(s.width/9*100/Math.max(35,length),.2,2.8)};});
    const polygon=hull([...bodyPoints,...limbs.flatMap(l=>l.points)]),bodyHull=bodyExact;let area=0,perimeter=0;
    bodyHull.forEach((p,i)=>{const q=bodyHull[(i+1)%bodyHull.length];area+=p[0]*q[1]-q[0]*p[1];perimeter+=Math.hypot(q[0]-p[0],q[1]-p[1]);});area=Math.abs(area)/2;
    const feet=limbs.filter(l=>l.foot),arms=limbs.filter(l=>!l.foot),tips=feet.map(l=>l.points.at(-1)),low=tips.length?Math.max(...tips.map(p=>p[1])):b.y+b.h;
    const contacts=tips.filter(p=>low-p[1]<22);if(!contacts.length)contacts.push(...bodyHull.filter(p=>low-p[1]<Math.max(8,body.h*.08)));
    const minX=Math.min(...contacts.map(p=>p[0])),maxX=Math.max(...contacts.map(p=>p[0])),footWidth=feet.length?Math.max(...feet.map(l=>l.width)):5;
    const halfBase=Math.max(5,(maxX-minX+footWidth)*.125),footMid=(minX+maxX)/2,comHeight=Math.max(6,(low-cy)*.25);
    const mass=clamp(Math.sqrt(Math.max(500,area)/14000)*( .75+.25*clamp(ink/Math.max(1,perimeter*9),.5,2)),.35,3.2);
    const points=polygon.map(p=>[(p[0]-cx)*.25,(p[1]-cy)*.25]),radius=Math.max(5,...points.map(p=>Math.hypot(...p))),collisionRadius=Math.max(radius,...limbs.map(l=>Math.hypot(l.points[0][0]-cx,l.points[0][1]-cy)*.25+Math.max(...l.points.map(p=>Math.hypot(p[0]-l.points[0][0],p[1]-l.points[0][1])))*.28+5+l.width*.25));
    const circularity=clamp(4*Math.PI*area/(perimeter*perimeter||1),.08,1),protrusion=Math.max(0,(b.w*b.h)/(Math.max(1,body.w*body.h))-1);
    const roundness=clamp(circularity/(1+protrusion*.8),.08,1),base=clamp(halfBase/comHeight,.08,2.5),height=clamp(comHeight/40,.2,2.5);
    const avg=a=>a.length?a.reduce((n,v)=>n+v,0)/a.length:0,strength=avg(feet.map(l=>l.strength)),spring=clamp(Math.sqrt(feet.length)*avg(feet.map(l=>l.length/110*Math.sqrt(l.width/9)*(1+l.flex*3))),.12,3.6);
    const reach=avg(arms.map(l=>l.chord/100*Math.sqrt(l.width/9))),airControl=clamp(reach*.7,.0,1.2),inertia=clamp(mass*(b.w*b.w+b.h*b.h)/45000,.2,6);
    // กีฬาใหม่ใช้แขน/ขาเส้นเดิม แรงมาจากความหนาและระยะเอื้อม ไม่ได้มาจากจำนวนจุด
    const waterDrag=clamp(Math.pow(body.h/Math.max(20,body.w),.8)+protrusion*.14,.2,3),climbReach=clamp(Math.max(20,...limbs.map(l=>l.chord))/110,.2,2.3);
    const grip=clamp(limbs.reduce((n,l)=>n+l.strength*(l.foot?.4:1),0)/Math.sqrt(Math.max(1,limbs.length)),.15,3);
    const throwing=arms.length?arms:feet,throwLimb=limbs.indexOf(throwing.slice().sort((a,b)=>b.chord-a.chord)[0]);
    const throwArm=limbs[throwLimb],lever=clamp((throwArm?throwArm.chord:35)/100,.35,2.5),throwStrength=throwArm?throwArm.strength:.25;
    return {cx,cy,w:b.w,h:b.h,bottom:low,points,bodyPoints,limbs,mass,radius,collisionRadius,base,height,roundness,area,protrusion,halfBase,footMid,comHeight,inertia,spring,airControl,waterDrag,climbReach,grip,throwLimb,lever,throwStrength,push:clamp((.3+strength*.8)*Math.sqrt(Math.max(1,feet.length))*(.65+base*.35)+reach*.35,.25,3.8),balanceControl:clamp(.3+base*.5+strength*.2+airControl*.3,.3,2.2),launchAngle:clamp(.72+avg(feet.map(l=>(l.points.at(-1)[0]-l.points[0][0])/Math.max(20,l.chord)))*.3,.48,1.03)};
  }
  // ปลายแขนขาที่จับผาหรือยืนบนแท่นต้องอยู่กับจุดสัมผัส ข้อแรกยังต่อกับเส้นเดิม
  function contactTip(r,i,mode){
    const l=r.g.limbs[i],state=r.legs[i],g=r.g,cs=Math.cos(r.angle),sn=Math.sin(r.angle);
    let dx,dy;
    if(mode==='climb'&&Number.isFinite(state.holdX)){
      dx=state.holdX;dy=r.x*90-state.holdY;
    }else if(mode==='balance'&&l.foot&&!r.out){
      const tilt=r.platformTilt||0,tip=l.points.at(-1),span=tip[0]-g.footMid;
      const bx=g.cx-g.footMid,by=g.cy-g.bottom;
      dx=span*Math.cos(tilt)-(bx*cs-by*sn);dy=span*Math.sin(tilt)-(bx*sn+by*cs);
    }else return null;
    return [g.cx+dx*cs+dy*sn,g.cy-dx*sn+dy*cs];
  }
  function pose(r,mode,sampled=false){
    const limbs=r.g.limbs.map((l,i)=>{const state=r.legs[i],a=l.points[0],sn=Math.sin(state.phase),swing=sn*state.swing,cs=Math.cos(swing),ss=Math.sin(swing),extension=state.extension;
      const target=contactTip(r,i,mode),source=sampled?l.points:r.drawing.legs[i].points;const points=source.map((p,j)=>{const t=sampled?j/(source.length-1):l.progress[j],dx=(p[0]-a[0])*extension,dy=(p[1]-a[1])*extension;return [a[0]+dx*cs-dy*ss+Math.sin(state.phase*2)*state.bend*t*t*18,a[1]+dx*ss+dy*cs];});
      if(target){const end=points.at(-1);return points.map((p,j)=>{const t=sampled?j/(source.length-1):l.progress[j],weight=t*t*(3-2*t);return [p[0]+(target[0]-end[0])*weight,p[1]+(target[1]-end[1])*weight];});}
      return points;
    });return {body:r.drawing.body.map(s=>s.points),limbs};
  }
  function outline(r,mode){const p=pose(r,mode,true);return hull([...r.g.bodyPoints,...p.limbs.flatMap((l,j)=>l.filter((_,i)=>i%3===0||i===l.length-1).flatMap(p=>{const w=r.drawing.legs[j].width/2;return [[p[0]-w,p[1]-w],[p[0]+w,p[1]-w],[p[0]+w,p[1]+w],[p[0]-w,p[1]+w]];}))]).map(p=>[(p[0]-r.g.cx)*.25,(p[1]-r.g.cy)*.25]);}
  function support(r,angle,mode){const sn=Math.sin(angle),cs=Math.cos(angle);return Math.max(2,...outline(r,mode).map(p=>p[0]*sn+p[1]*cs));}
  function articulation(r,mode,dt){
    r.legs.forEach((l,i)=>{const g=r.g.limbs[i];if(mode!=='climb'||!r.resting)l.phase+=dt*Math.PI*2*l.cadence;
      if(mode==='sumo'){l.swing=g.foot?.28:.65;l.bend=.35;l.extension=g.foot?1:.9+Math.sin(l.phase)*.18;}
      else if(mode==='roll'){l.swing=.12;l.bend=.2;l.extension=.72+Math.sin(l.phase)*.08;}
      else if(mode==='jump'){l.swing=r.launched?(g.foot?.3:.65):.12;l.bend=r.launched?.5:1.2;l.extension=r.launched?1:.65+.35*Math.abs(Math.cos(r.time*Math.PI/3));}
      else if(mode==='swim'){l.swing=g.foot?.55:1.05;l.bend=.45;l.extension=.85+Math.sin(l.phase)*.15;}
      else if(mode==='climb'){l.swing=.12;l.bend=.3;l.extension=1;}
      else if(mode==='discus'){l.swing=r.launched?.15:g.foot?.18:.75;l.bend=.25;l.extension=i===r.g.throwLimb?1.05: .85;}
      else{l.phase=-(r.angle-(r.platformTilt||0))*3-r.omega*1.2+i*.4;l.swing=g.foot?0:.8;l.bend=g.foot?.12:.5;l.extension=1;}
    });
  }
  function stance(r){const p=pose(r,'sumo',true),feet=p.limbs.filter((_,i)=>r.g.limbs[i].foot).map(p=>p.at(-1));if(!feet.length)return .18;const low=Math.max(...feet.map(p=>p[1]));return .25+.75*feet.reduce((n,p)=>n+clamp(1-(low-p[1])/30,0,1),0)/feet.length;}
  function makeSession(mode,team,seeds,distance){
    const rng=E.random(seeds[0]^0x9e3779b9),s={mode,distance,elapsed:0,done:false,rng,arena:240,tilt:0,wind:0,nextWind:0};
    s.racers=team.map((d,i)=>{
      const g=geometry(d);if(mode==='run'){const r=E.makeRacer(copy(d),seeds[i],i);r.g=g;r.mass=g.mass;r.balance=clamp(.65+g.base*.35,.65,1.3);return r;}
      const rand=E.random(seeds[i]),a=i/team.length*Math.PI*2,start=Math.max(0,Math.min(145,s.arena-g.radius-20));
      return {id:i,drawing:copy(d),g,rng:rand,x:mode==='sumo'?Math.cos(a)*start:0,y:mode==='sumo'?Math.sin(a)*start:0,vx:0,vy:0,angle:mode==='sumo'?a+Math.PI:mode==='climb'?-Math.PI/2:0,omega:0,distance:0,speed:0,time:0,finish:null,score:0,out:false,nextForce:0,forceX:0,forceY:0,event:'',eventUntil:0,launched:false,hit:0,stagger:0,drive:0,energy:1,resting:false,slipUntil:0,platformTilt:0,releaseAt:mode==='discus'?2.4+rand()*.6:0,discX:0,discY:0,discVx:0,discVy:0,legs:d.legs.map(stroke=>({stroke,phase:rand()*Math.PI*2,cadence:1.1+rand()*.5,swing:0,bend:0,extension:1}))};
    });return s;
  }
  function eliminate(r,s){r.out=true;r.finish=s.elapsed;r.score=s.elapsed;r.event='หลุดสนาม';r.eventUntil=s.elapsed+2;}
  function collision(a,b){
    const world=r=>{const sn=Math.sin(r.angle),cs=Math.cos(r.angle);return outline(r,'sumo').map(p=>[r.x+p[0]*cs-p[1]*sn,r.y+p[0]*sn+p[1]*cs]);},pa=world(a),pb=world(b);let depth=Infinity,axis=null;
    for(const poly of [pa,pb])for(let i=0;i<poly.length;i++){const p=poly[i],q=poly[(i+1)%poly.length],len=Math.hypot(q[0]-p[0],q[1]-p[1]);if(len<.001)continue;const n=[-(q[1]-p[1])/len,(q[0]-p[0])/len],project=list=>list.map(p=>p[0]*n[0]+p[1]*n[1]),aa=project(pa),bb=project(pb),over=Math.min(Math.max(...aa),Math.max(...bb))-Math.max(Math.min(...aa),Math.min(...bb));if(over<=0)return null;if(over<depth){depth=over;axis=n;}}
    if(!axis)return null;if((b.x-a.x)*axis[0]+(b.y-a.y)*axis[1]<0)axis=axis.map(v=>-v);return {depth,nx:axis[0],ny:axis[1]};
  }
  function step(s,dt){
    if(s.done)return;s.elapsed+=dt;
    if(s.mode==='run'){s.racers.forEach(r=>E.step(r,dt,s.distance));s.done=s.racers.every(r=>r.finish!==null);return;}
    s.racers.forEach(r=>{r.time=s.elapsed;r.hit=Math.max(0,r.hit-dt*3);articulation(r,s.mode,dt);});
    if(s.mode==='sumo'){
      s.arena=Math.max(75,240-Math.max(0,s.elapsed-8)*4);
      s.racers.forEach(r=>{if(r.out)return;const others=s.racers.filter(o=>o!==r&&!o.out),o=others.sort((a,b)=>Math.hypot(a.x-r.x,a.y-r.y)-Math.hypot(b.x-r.x,b.y-r.y))[0];
        if(s.elapsed>=r.nextForce){r.forceX=.7+r.rng()*.6;r.forceY=(r.rng()-.5)*.8;r.nextForce=s.elapsed+.6+r.rng();}
        const target=o?Math.atan2(o.y-r.y,o.x-r.x)+r.forceY:r.angle,turn=Math.atan2(Math.sin(target-r.angle),Math.cos(target-r.angle));r.omega+=(turn*6-r.omega*3)*dt/r.g.inertia;r.angle+=r.omega*dt;
        r.stagger=Math.max(0,r.stagger-dt*(.3+r.g.base*.4));r.drive=50*r.g.push*stance(r)*r.forceX*(r.stagger>.7?.35:1);
        const grip=.8+r.g.base*.6;r.vx=(r.vx+Math.cos(r.angle)*r.drive/r.g.mass*dt)*Math.exp(-grip*dt);r.vy=(r.vy+Math.sin(r.angle)*r.drive/r.g.mass*dt)*Math.exp(-grip*dt);r.x+=r.vx*dt;r.y+=r.vy*dt;
      });
      for(let i=0;i<s.racers.length;i++)for(let j=i+1;j<s.racers.length;j++){
        const a=s.racers[i],b=s.racers[j];if(a.out||b.out||Math.hypot(a.x-b.x,a.y-b.y)>a.g.collisionRadius+b.g.collisionRadius)continue;const hit=collision(a,b);if(!hit)continue;const {depth,nx,ny}=hit,inv=1/a.g.mass+1/b.g.mass;
        a.x-=nx*depth/inv/a.g.mass;b.x+=nx*depth/inv/b.g.mass;a.y-=ny*depth/inv/a.g.mass;b.y+=ny*depth/inv/b.g.mass;
        const rel=(b.vx-a.vx)*nx+(b.vy-a.vy)*ny,impulse=Math.max(0,-rel)*1.1/inv+(a.drive+b.drive)*dt*.08;
        a.vx-=impulse*nx/a.g.mass;a.vy-=impulse*ny/a.g.mass;b.vx+=impulse*nx/b.g.mass;b.vy+=impulse*ny/b.g.mass;
        [a,b].forEach((r,k)=>{r.hit=1;r.stagger+=impulse*.006*r.g.height/Math.max(.3,r.g.base*r.g.mass);r.omega+=(k?1:-1)*(nx*Math.sin(r.angle)-ny*Math.cos(r.angle))*impulse*.012/r.g.inertia;r.event=r.stagger>.7?'เสียหลัก!':'ยันขาแล้วดัน!';r.eventUntil=s.elapsed+.5;});
      }
      s.racers.forEach(r=>{if(!r.out&&outline(r,'sumo').some(p=>{const cs=Math.cos(r.angle),sn=Math.sin(r.angle);return Math.hypot(r.x+p[0]*cs-p[1]*sn,r.y+p[0]*sn+p[1]*cs)>s.arena;}))eliminate(r,s);});
      const alive=s.racers.filter(r=>!r.out);if(alive.length<=1||s.elapsed>=60){alive.forEach(r=>{r.finish=s.elapsed;r.score=s.elapsed+1;});s.done=true;}
    }else if(s.mode==='roll'){
      s.racers.forEach(r=>{if(r.finish!==null)return;
        if(s.elapsed>=r.nextForce){r.forceX=.9+r.rng()*.2;r.nextForce=s.elapsed+.6+r.rng()*1.5;}
        const radius=support(r,r.angle,'roll'),next=support(r,r.angle+.08,'roll'),climb=Math.max(0,next-radius)/Math.max(5,radius),drag=.12+(1-r.g.roundness)*.65+r.g.protrusion*.08;
        r.vx=clamp(r.vx+(30*(.2+r.g.roundness)*r.forceX-r.vx*drag-climb*220)*dt,1.5,110);r.x+=r.vx*dt;r.omega=r.vx/Math.max(5,radius);r.angle+=r.omega*dt;
        const bump=[250,530,780].find(x=>r.x>=x&&r.x-r.vx*dt<x);
        if(bump){r.vx*=clamp(.35+r.g.mass*.14+r.g.roundness*.3,.4,.9);r.vy=-35-35/Math.sqrt(r.g.mass);r.hit=1;r.event=r.g.roundness>.75?'กลิ้งข้ามเนิน!':'เหลี่ยมสะดุดเนิน!';r.eventUntil=s.elapsed+1;}
        r.vy+=200*dt;r.y=Math.min(0,r.y+r.vy*dt);if(r.y===0)r.vy=0;r.distance=r.x;
        if(r.x>=1000){r.finish=s.elapsed-(r.x-1000)/r.vx;r.x=r.distance=1000;}
      });if(s.elapsed>=90)s.racers.forEach(r=>{if(r.finish===null)r.finish=90+(1000-r.x)/1.5;});s.done=s.racers.every(r=>r.finish!==null);
    }else if(s.mode==='jump'){
      s.racers.forEach(r=>{if(r.finish!==null)return;if(s.elapsed<1.5)return;
        if(!r.launched){r.launched=true;const speed=clamp((12+17*Math.sqrt(r.g.spring/r.g.mass))*(.92+r.rng()*.16),12,48),angle=r.g.launchAngle+(r.rng()-.5)*.16;r.vx=Math.cos(angle)*speed;r.vy=-Math.sin(angle)*speed;r.omega=(r.rng()-.5)*3/(1+r.g.airControl);r.hit=1;r.event='ย่อขาแล้วถีบ!';r.eventUntil=s.elapsed+.8;}
        r.omega*=Math.exp(-r.g.airControl*.9*dt);r.angle+=r.omega*dt;const drag=.018+r.g.area/1600000+r.g.protrusion*.015+Math.abs(Math.sin(r.angle))*.04;
        r.vx*=Math.exp(-drag*dt);r.x+=r.vx*dt;r.vy+=9.8*dt;r.y+=r.vy*dt;
        if(r.y>=0&&r.vy>0){const fraction=clamp(r.y/(r.vy*dt),0,1);r.x-=r.vx*dt*fraction;r.y=0;r.distance=r.score=r.x;r.finish=s.elapsed-dt*fraction;r.hit=1;r.event='แตะพื้นแล้ว';}
      });s.done=s.racers.every(r=>r.finish!==null);
    }else if(s.mode==='swim'){
      // จังหวะที่ภาพพายแขนเป็นจังหวะเดียวกับแรงส่ง ส่วนแรงต้านเพิ่มตามความเร็วกำลังสอง
      s.wind=Math.sin(s.elapsed*.65)*.16;
      s.racers.forEach(r=>{if(r.finish!==null)return;
        if(s.elapsed>=r.nextForce){r.forceX=.85+r.rng()*.3;r.nextForce=s.elapsed+.8+r.rng();}
        const paddle=r.g.limbs.reduce((n,l,i)=>n+clamp(l.chord/90,0,2)*Math.sqrt(l.width/9)*(l.foot?.35:1)*(1-l.flex*.5)*Math.max(0,-Math.sin(r.legs[i].phase)),0);
        r.drive=(1.4+2.6*paddle)*r.forceX;r.vx=clamp(r.vx+(r.drive-(.12+r.g.waterDrag*.55)*r.vx*r.vx+s.wind)*dt/Math.sqrt(r.g.mass),.12,9);
        r.angle=Math.sin(s.elapsed*2+r.id)*.04;r.x+=r.vx*dt;r.distance=r.x;
        if(paddle>1.3){r.event='พายแล้วพุ่ง!';r.eventUntil=s.elapsed+.2;}
        if(r.x>=50){r.finish=s.elapsed-(r.x-50)/r.vx;r.x=r.distance=50;}
      });s.done=s.racers.every(r=>r.finish!==null);if(!s.done&&s.elapsed>=75)stop(s);
    }else if(s.mode==='climb'){
      s.racers.forEach(r=>{if(r.finish!==null)return;
        if(r.energy<.2)r.resting=true;else if(r.energy>.8)r.resting=false;
        // สลับเอื้อมก่อนจับ แล้วดึงตัวขณะที่ปลายแขนขาอยู่กับปุ่มเดิมบนผา
        let contacts=0,pull=0;
        r.legs.forEach((state,i)=>{
          const limb=r.g.limbs[i],phase=(state.phase/(Math.PI*2))%1,planted=phase>=.25;
          const joint=limb.points[0],cs=Math.cos(r.angle),sn=Math.sin(r.angle),jx=(joint[0]-r.g.cx)*cs-(joint[1]-r.g.cy)*sn,jy=(joint[0]-r.g.cx)*sn+(joint[1]-r.g.cy)*cs;
          const shoulderY=r.x*90-jy;
          if(!Number.isFinite(state.holdX)||state.planted&&!planted){
            state.fromX=Number.isFinite(state.holdX)?state.holdX:jx;state.fromY=Number.isFinite(state.holdY)?state.holdY:shoulderY;
            const candidates=[];
            for(let hx=-135;hx<=135;hx+=45)for(let row=Math.ceil((shoulderY-limb.length)/55);row<=Math.floor((shoulderY+limb.length)/55);row++){
              const hy=row*55;if(Math.hypot(hx-jx,hy-shoulderY)<=limb.length*1.05)candidates.push([hx,hy]);
            }
            candidates.sort((a,b)=>b[1]-a[1]||Math.abs(a[0]-jx)-Math.abs(b[0]-jx));
            state.canGrip=!!candidates.length;[state.targetX,state.targetY]=candidates[0]||[jx,shoulderY];
          }
          if(!planted){
            const blend=clamp(phase/.25,0,1);state.holdX=state.fromX+(state.targetX-state.fromX)*blend;state.holdY=state.fromY+(state.targetY-state.fromY)*blend;
          }else{state.holdX=state.targetX;state.holdY=state.targetY;if(state.canGrip){contacts++;pull+=(limb.foot?.35:1)*Math.max(.1,Math.sin(phase*Math.PI));}}
          state.planted=planted&&state.canGrip;
        });
        pull=r.legs.length?pull/Math.sqrt(r.legs.length):.15;
        const gap=.65+.12*Math.sin(Math.floor(r.x/.7)*2.1),reach=clamp(r.g.climbReach/gap,.3,1.8),load=r.g.grip/Math.sqrt(r.g.mass);
        r.energy=clamp(r.energy+dt*(r.resting?.3:-.055*r.g.mass/(.5+r.g.grip)*(1+r.g.climbReach*.3)),0,1);
        if(s.elapsed>=r.nextForce){r.forceX=.85+r.rng()*.3;r.nextForce=s.elapsed+.9+r.rng()*.6;
          const risk=clamp(.025+.09*r.g.mass/(r.g.grip+.4)*(1-r.energy),.025,.28);
          if(!r.resting&&r.rng()<risk){r.slipUntil=s.elapsed+.45;r.hit=1;r.event='มือหลุด ลื่นลง!';r.eventUntil=s.elapsed+.8;}
        }
        r.vx=s.elapsed<r.slipUntil?-.9:r.resting?0:(.16+.42*pull)*reach*load*r.forceX*(.55+.45*r.energy);
        if(r.legs.length&&!contacts)r.vx=Math.min(0,r.vx);
        r.x=clamp(r.x+r.vx*dt,0,12);r.distance=r.x;r.angle=-Math.PI/2+Math.sin(s.elapsed*2+r.id)*.06;
        if(s.elapsed<r.slipUntil)r.legs.forEach(l=>{l.holdY+=r.vx*90*dt;l.planted=false;});
        if(r.resting){r.event='พักแขน เติมแรง';r.eventUntil=s.elapsed+.1;}
        if(r.x>=12){r.finish=s.elapsed;r.x=r.distance=12;}
      });s.done=s.racers.every(r=>r.finish!==null);if(!s.done&&s.elapsed>=75)stop(s);
    }else if(s.mode==='discus'){
      // แรงบิดต้องเอาชนะแรงเฉื่อยของตัวและแขนก่อนปล่อย แล้วจักรบินด้วยความเร็วและมุมที่ได้จริง
      s.wind=Math.sin(s.elapsed*1.7)*.7;
      s.racers.forEach(r=>{if(r.finish!==null)return;
        if(!r.launched){
          const plant=clamp(.35+r.g.base*.45,.35,1),torque=(8+11*r.g.throwStrength)*Math.sqrt(r.g.mass)*plant;
          r.omega=clamp(r.omega+(torque-r.omega*1.6)*dt/(r.g.inertia+r.g.lever*r.g.lever*.35),0,12);r.angle+=r.omega*dt;
          r.stagger=clamp(r.omega*r.g.height*.025/(.2+r.g.base),0,1);
          if(s.elapsed>=r.releaseAt){
            const arm=r.g.limbs[r.g.throwLimb],slope=arm?(arm.points[0][1]-arm.points.at(-1)[1])/Math.max(20,arm.chord):0;
            const timing=.86+.14*Math.max(0,Math.cos(r.legs[r.g.throwLimb]?.phase||0));
            const speed=clamp(7+r.omega*r.g.lever*2.2*plant*clamp(.55+r.g.throwStrength*.25,.4,1)*timing,6,38),angle=clamp(.66+slope*.2+(r.rng()-.5)*(.14+r.stagger*.7),.2,1.25);
            r.launched=true;r.discVx=Math.cos(angle)*speed;r.discVy=-Math.sin(angle)*speed;r.discY=-Math.max(.8,r.g.comHeight*.035);r.hit=1;r.event=r.stagger>.5?'เสียหลักตอนปล่อย!':'เหวี่ยงจักรออกไป!';r.eventUntil=s.elapsed+1;
          }
        }else{
          r.omega*=Math.exp(-dt*2);r.angle+=r.omega*dt;
          r.discVx=Math.max(0,r.discVx+(s.wind-r.discVx*.025)*dt);r.discX+=r.discVx*dt;r.discVy+=9.8*dt;r.discY+=r.discVy*dt;r.score=r.distance=r.discX;
          if(r.discY>=0&&r.discVy>0){const fraction=clamp(r.discY/(r.discVy*dt),0,1);r.discX-=r.discVx*dt*fraction;r.discY=0;r.distance=r.score=r.discX;r.finish=s.elapsed-dt*fraction;r.event='จักรแตะพื้น';}
        }
      });s.done=s.racers.every(r=>r.finish!==null);
    }else if(s.mode==='balance'){
      if(s.elapsed>=s.nextWind){s.wind=(s.rng()-.5)*(.15+s.elapsed*.025);s.nextWind=s.elapsed+.4+s.rng();}
      s.tilt=Math.sin(s.elapsed*.9)*(.03+s.elapsed*.006)+Math.sin(s.elapsed*.4)*.025;
      s.racers.forEach(r=>{r.platformTilt=s.tilt;if(r.out){r.angle+=r.omega*dt;return;}if(s.elapsed>=r.nextForce){r.forceX=(r.rng()-.5)*(.05+s.elapsed*.002);r.nextForce=s.elapsed+.3+r.rng()*.6;}
        const error=r.angle-s.tilt,gravity=Math.sin(error)*(1.5+s.elapsed*.07)*r.g.height,correction=-error*r.g.balanceControl*2.2/(1+s.elapsed*.025),gust=(s.wind+r.forceX)/Math.sqrt(r.g.mass);
        r.omega+=(gravity+correction+gust-r.omega*.8)*dt/Math.sqrt(r.g.inertia);r.angle+=r.omega*dt;
        r.vx+=(Math.sin(s.tilt)*12/(.4+r.g.base)-r.vx*.7)*dt;r.x+=r.vx*dt;
        const projected=(r.g.cx-r.g.footMid)*.25*Math.cos(error)+Math.sin(error)*r.g.comHeight;
        if(Math.abs(projected)>r.g.halfBase+2||Math.abs(error)>1.05||Math.abs(r.x)>95)eliminate(r,s);
      });const alive=s.racers.filter(r=>!r.out);if(!alive.length||s.elapsed>=60){alive.forEach(r=>{r.finish=60;r.score=60;});s.done=true;}
    }
  }
  function traits(d){const g=geometry(d),feet=g.limbs.filter(l=>l.foot),length=feet.length?feet.reduce((n,l)=>n+l.length,0)/feet.length:0;return {
    run:(length>110?'ช่วงก้าวยาว':length>60?'ช่วงก้าวกลาง':'ช่วงก้าวสั้น')+' · '+(g.mass>1.5?'ตัวหนัก เร่งช้า':'ตัวเบา เร่งง่าย'),
    sumo:(g.push>1.8?'แรงดันสูง':g.push>1?'แรงดันกลาง':'แรงดันน้อย')+' · '+(g.base>.7?'ฐานมั่นคง':'ฐานแคบ เสียหลักง่าย'),
    roll:(g.roundness>.85?'กลิ้งลื่น':g.roundness>.6?'มีเหลี่ยมบ้าง':'เหลี่ยม/ส่วนยื่นมาก')+' · ความกลม '+Math.round(g.roundness*100)+'%',
    jump:(g.spring/g.mass>2?'แรงส่งสูง':g.spring/g.mass>.8?'แรงส่งกลาง':'แรงส่งน้อย')+' · '+(g.airControl>.4?'แขนช่วยลดหมุน':'หมุนกลางอากาศง่าย'),
    balance:(g.base>.8?'ฐานกว้าง':g.base>.4?'ฐานปานกลาง':'ฐานแคบ')+' · '+(g.height>1?'ศูนย์มวลสูง':'ศูนย์มวลต่ำ'),
    swim:(g.waterDrag<.7?'ตัวเพรียว ต้านน้ำน้อย':'ต้านน้ำมาก')+' · '+(g.limbs.some(l=>!l.foot&&l.chord>100)?'แขนพายยาว':g.limbs.some(l=>!l.foot)?'แขนพายสั้น':g.limbs.length?'ใช้ขาช่วยพาย':'ใช้ตัวดันน้ำ'),
    climb:(g.climbReach>1?'เอื้อมไกล':'เอื้อมสั้น')+' · '+(g.grip/Math.sqrt(g.mass)>1?'จับแน่น':'แรงจับต่อน้ำหนักน้อย'),
    discus:(g.lever>1?'แขนเหวี่ยงยาว':'แขนเหวี่ยงสั้น')+' · '+(g.base>.7?'ฐานรับแรงดี':'ฐานแคบ เสียหลักง่าย')
  };}
  // ตัดจบจากสถานะล่าสุด โดยไม่จำลองว่าคนที่ยังไม่ถึงเส้นชัยวิ่งครบแล้ว
  function stop(s){
    if(!s||s.done)return false;s.stopped=true;
    s.racers.forEach(r=>{if(r.finish!==null)return;r.stopped=true;r.finish=s.elapsed;
      if(s.mode==='jump')r.distance=r.score=r.x;
      else if(s.mode==='discus')r.distance=r.score=r.discX;
      else if(s.mode==='sumo'||s.mode==='balance')r.score=s.elapsed+(s.mode==='sumo'?1:0);
    });s.done=true;return true;
  }
  function timed(mode){return ['run','roll','swim','climb'].includes(mode);}
  function resultValue(s,r){return timed(s.mode)?r.stopped?r.distance:r.finish===null?Infinity:r.finish:r.score;}
  function resultKey(s,r){
    if(s.stopped&&timed(s.mode))return [r.stopped?1:0,r.stopped?-r.distance:r.finish];
    if(s.stopped&&['sumo','balance'].includes(s.mode))return [r.out?1:0,-r.score];
    return [0,(timed(s.mode)?1:-1)*resultValue(s,r)];
  }
  function compareResult(s,a,b){const x=resultKey(s,a),y=resultKey(s,b);return x[0]-y[0]||x[1]-y[1];}
  function rank(s){return s.racers.slice().sort((a,b)=>{if(!s.done){if(s.mode==="sumo"||s.mode==="balance")return Number(a.out)-Number(b.out)||b.score-a.score||a.id-b.id;if(s.mode==="jump")return b.x-a.x||a.id-b.id;if(s.mode==="discus")return b.discX-a.discX||a.id-b.id;return (a.finish===null?Infinity:a.finish)-(b.finish===null?Infinity:b.finish)||b.distance-a.distance||a.id-b.id;}return compareResult(s,a,b)||a.id-b.id;});}
  function create(team,list,distance=100,seed=1){const chosen=events(list);if(!chosen.length||team.length<2||team.length>6||!team.every(d=>validAthlete(d,chosen)))throw Error("เลือกกีฬาและวาดสัตว์ให้ครบก่อนแข่ง");return {team:copy(team),events:chosen,distance:distance===200?200:100,rng:E.random(seed),index:-1,session:null,results:[],totals:team.map((d,id)=>({id,name:d.name,points:0}))};}
  function next(t){if(t.session&&!t.session.done||t.index+1>=t.events.length)return null;t.index++;t.session=makeSession(t.events[t.index],t.team,t.team.map(()=>Math.floor(t.rng()*4294967296)),t.distance);return t.session;}
  function record(t){const s=t.session;if(!s||!s.done||t.results.length>t.index)return false;
    const sorted=rank(s),table=[10,7,5,3,2,1],rows=[];let i=0;
    while(i<sorted.length){let end=i+1;while(end<sorted.length&&Math.abs(compareResult(s,sorted[end],sorted[i]))<1e-7)end++;
      const points=table.slice(i,end).reduce((a,b)=>a+b,0)/(end-i);
      for(let j=i;j<end;j++){const r=sorted[j];rows.push({id:r.id,name:r.drawing.name,place:i+1,value:resultValue(s,r),stopped:!!r.stopped,points});t.totals[r.id].points=Number((t.totals[r.id].points+points).toFixed(10));}i=end;
    }t.results.push({mode:s.mode,rows});return true;
  }
  function standings(t){const a=t.totals.slice().sort((a,b)=>Math.abs(b.points-a.points)<1e-7?a.id-b.id:b.points-a.points);return a.map((r,i)=>({...r,place:i&&Math.abs(r.points-a[i-1].points)<1e-7?a.findIndex(x=>Math.abs(x.points-r.points)<1e-7)+1:i+1}));}
  function snapshot(s){return {mode:s.mode,distance:s.distance,elapsed:s.elapsed,done:s.done,stopped:!!s.stopped,arena:s.arena,tilt:s.tilt,wind:s.wind,racers:s.racers.map(r=>{const o={id:r.id};["distance","speed","time","finish","event","eventUntil","x","y","vx","vy","angle","omega","score","out","stopped","launched","hit","stagger","drive","energy","resting","platformTilt","discX","discY","discVx","discVy"].forEach(k=>{if(r[k]!==undefined)o[k]=r[k];});o.legs=r.legs.map(l=>({phase:l.phase,cadence:l.cadence,swing:l.swing,bend:l.bend,extension:l.extension,holdX:l.holdX,holdY:l.holdY,planted:l.planted}));return o;})};}
  function apply(s,data){["elapsed","done","stopped","arena","tilt","wind"].forEach(k=>{s[k]=data[k];});data.racers.forEach((r,i)=>{Object.keys(r).forEach(k=>{if(k!=="legs"&&k!=="id")s.racers[i][k]=r[k];});r.legs.forEach((l,j)=>Object.assign(s.racers[i].legs[j],l));});}
  // รุ่นข้อความออนไลน์ต้องตรงกัน ป้องกันหน้าวิ่งรุ่นเก่าอ่านสถานะของกีฬาอื่น
  const api={protocol:6,sports,events,validAthlete,geometry,pose,outline,support,traits,collision,create,next,step,rank,record,standings,snapshot,apply,makeSession,resultValue,timed,stop};if(typeof module!=="undefined"&&module.exports)module.exports=api;else root.DoodleOlympics=api;
})(typeof window!=="undefined"?window:this);
