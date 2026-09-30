// กีฬาแบบการ์ตูน: รูปร่างมีผลต่อแรง ชน หมุน และทรงตัว สุ่มแรงระหว่างเล่น ไม่กำหนดแชมป์ล่วงหน้า
(function(root){
  "use strict";
  const E=typeof module!=="undefined"&&module.exports?require("./doodle-race-engine.js"):root.DoodleRace;
  const clamp=(n,a,b)=>Math.max(a,Math.min(b,n)),copy=x=>JSON.parse(JSON.stringify(x));
  const sports={
    run:{name:"วิ่งแข่ง",icon:"🏃",rule:"ขาที่วาดสุ่มก้าว ใครเข้าเส้นชัยก่อนชนะ",unit:"วิ"},
    sumo:{name:"ซูโม่",icon:"💥",rule:"ชนกันบนวงที่ค่อย ๆ หด ใครอยู่ในสนามเป็นตัวสุดท้ายชนะ",unit:"วิ"},
    roll:{name:"กลิ้งลงเขา",icon:"🌀",rule:"กลิ้งผ่านเนินและสิ่งกีดขวาง ใครถึงปลายทางก่อนชนะ",unit:"วิ"},
    jump:{name:"กระโดดไกล",icon:"🚀",rule:"สุ่มแรงปล่อยตัว หมุนกลางอากาศ วัดระยะที่แตะพื้นครั้งแรก",unit:"ม."},
    balance:{name:"ทรงตัว",icon:"⚖️",rule:"แท่นโยกแรงขึ้นเรื่อย ๆ ใครยืนอยู่ได้นานที่สุดชนะ",unit:"วิ"}
  };
  function events(list){return Array.isArray(list)?Object.keys(sports).filter(k=>list.includes(k)):[];}
  function validAthlete(d,list){return E.validDrawing(d,!events(list).includes("run"));}
  function geometry(d){
    const strokes=[...d.body,...d.legs],b=E.bounds(strokes);let total=0,sx=0,sy=0;
    // ถ่วงศูนย์มวลด้วยความยาวและความหนาเส้น ป้องกันการเพิ่มจุดถี่แล้วเปลี่ยนน้ำหนัก
    strokes.forEach(s=>s.points.slice(1).forEach((p,i)=>{const a=s.points[i],m=Math.hypot(p[0]-a[0],p[1]-a[1])*s.width;total+=m;sx+=(a[0]+p[0])*.5*m;sy+=(a[1]+p[1])*.5*m;}));
    const cx=total?sx/total:b.x+b.w/2,cy=total?sy/total:b.y+b.h/2;
    const all=strokes.flatMap(s=>s.points),stride=Math.max(1,Math.ceil(all.length/200));
    const points=all.filter((_,i)=>i%stride===0).map(p=>[(p[0]-cx)*.25,(p[1]-cy)*.25]);
    const feet=all.filter(p=>p[1]>b.y+b.h*.82),base=feet.length?feet.reduce((n,p)=>Math.max(n,p[0]),-Infinity)-feet.reduce((n,p)=>Math.min(n,p[0]),Infinity):b.w*.2;
    return {cx,cy,w:b.w,h:b.h,bottom:b.y+b.h,points,mass:clamp(Math.sqrt(b.w*b.h/28000),.5,1.8),radius:clamp(Math.hypot(b.w,b.h)*.095,18,55),base:clamp(base/Math.max(20,b.h),.12,2),height:clamp((cy-b.y)/Math.max(10,b.h),.1,.9),roundness:Math.min(b.w,b.h)/Math.max(b.w,b.h)};
  }
  function makeSession(mode,team,seeds,distance){
    const rng=E.random(seeds[0]^0x9e3779b9),s={mode,distance,elapsed:0,done:false,rng,arena:220,tilt:0,wind:0,nextWind:0};
    s.racers=team.map((d,i)=>{
      if(mode==="run")return E.makeRacer(copy(d),seeds[i],i);
      const g=geometry(d),rand=E.random(seeds[i]),a=i/team.length*Math.PI*2;
      return {id:i,drawing:copy(d),g,rng:rand,x:mode==="sumo"?Math.cos(a)*125:0,y:mode==="sumo"?Math.sin(a)*125:0,vx:0,vy:0,angle:0,omega:0,distance:0,speed:0,time:0,finish:null,score:0,out:false,nextForce:0,forceX:0,forceY:0,event:"",eventUntil:0,launched:false,legs:[]};
    });return s;
  }
  function support(r,angle){const sn=Math.sin(angle),cs=Math.cos(angle);return Math.max(8,...r.g.points.map(p=>p[0]*sn+p[1]*cs));}
  function eliminate(r,s){r.out=true;r.finish=s.elapsed;r.score=s.elapsed;r.event="หลุดสนาม";}
  function step(s,dt){
    if(s.done)return;s.elapsed+=dt;
    if(s.mode==="run"){
      s.racers.forEach(r=>E.step(r,dt,s.distance));s.done=s.racers.every(r=>r.finish!==null);return;
    }
    if(s.mode==="sumo"){
      s.arena=Math.max(65,220-Math.max(0,s.elapsed-6)*3.4);
      s.racers.forEach(r=>{if(r.out)return;r.time=s.elapsed;
        if(s.elapsed>=r.nextForce){const others=s.racers.filter(o=>o!==r&&!o.out),o=others.sort((a,b)=>Math.hypot(a.x-r.x,a.y-r.y)-Math.hypot(b.x-r.x,b.y-r.y))[0];const angle=o?Math.atan2(o.y-r.y,o.x-r.x):(r.rng()*Math.PI*2);const kick=100+r.rng()*260;r.forceX=Math.cos(angle)*kick-r.x*.35;r.forceY=Math.sin(angle)*kick-r.y*.35;r.nextForce=s.elapsed+.35+r.rng()*.8;r.omega=(r.rng()-.5)*2;}
        r.vx=(r.vx+r.forceX/r.g.mass*dt)*Math.exp(-1.3*dt);r.vy=(r.vy+r.forceY/r.g.mass*dt)*Math.exp(-1.3*dt);r.x+=r.vx*dt;r.y+=r.vy*dt;r.angle+=r.omega*dt;
      });
      for(let i=0;i<s.racers.length;i++)for(let j=i+1;j<s.racers.length;j++){
        const a=s.racers[i],b=s.racers[j];if(a.out||b.out)continue;let dx=b.x-a.x,dy=b.y-a.y,len=Math.hypot(dx,dy);if(len<.001){dx=.001;dy=0;len=.001;}
        const limit=a.g.radius+b.g.radius;if(len>=limit)continue;const nx=dx/len,ny=dy/len,inv=1/a.g.mass+1/b.g.mass,over=(limit-len)/inv;
        a.x-=nx*over/a.g.mass;a.y-=ny*over/a.g.mass;b.x+=nx*over/b.g.mass;b.y+=ny*over/b.g.mass;
        const rel=(b.vx-a.vx)*nx+(b.vy-a.vy)*ny;
        if(rel<0){const impulse=-(1.35)*rel/inv;a.vx-=impulse*nx/a.g.mass;a.vy-=impulse*ny/a.g.mass;b.vx+=impulse*nx/b.g.mass;b.vy+=impulse*ny/b.g.mass;}
      }
      s.racers.forEach(r=>{if(!r.out&&Math.hypot(r.x,r.y)+r.g.radius*.55>s.arena)eliminate(r,s);});
      const alive=s.racers.filter(r=>!r.out);if(alive.length<=1||s.elapsed>=60){alive.forEach(r=>{r.finish=s.elapsed;r.score=s.elapsed+1;});s.done=true;}
    }else if(s.mode==="roll"){
      s.racers.forEach(r=>{if(r.finish!==null)return;r.time=s.elapsed;
        if(s.elapsed>=r.nextForce){r.forceX=14+r.rng()*35;r.nextForce=s.elapsed+.6+r.rng()*1.5;}
        const rough=Math.abs(support(r,r.angle)-support(r,r.angle+.08));
        r.vx=clamp(r.vx+(r.forceX/Math.sqrt(r.g.mass)+12-r.vx*(.08+rough*.045))*dt,3,100);r.x+=r.vx*dt;r.angle+=r.vx/(r.g.radius+rough)*dt;
        const bump=[250,530,780].find(x=>r.x>=x&&r.x-r.vx*dt<x);
        if(bump){r.vx*=.45+r.rng()*.35;r.vy=-40-r.rng()*70;r.event="เด้งผ่านเนิน!";r.eventUntil=s.elapsed+1;}
        r.vy+=200*dt;r.y=Math.min(0,r.y+r.vy*dt);if(r.y===0)r.vy=0;r.distance=r.x;
        if(r.x>=1000){r.finish=s.elapsed-(r.x-1000)/r.vx;r.x=r.distance=1000;}
      });
      if(s.elapsed>=90)s.racers.forEach(r=>{if(r.finish===null)r.finish=90+(1000-r.x)/3;});s.done=s.racers.every(r=>r.finish!==null);
    }else if(s.mode==="jump"){
      s.racers.forEach(r=>{if(r.finish!==null)return;r.time=s.elapsed;
        if(s.elapsed<1.5)return;
        if(!r.launched){r.launched=true;r.vx=(18+r.rng()*14)/Math.pow(r.g.mass,.25);r.vy=-(13+r.rng()*7);r.omega=(r.rng()-.5)*9;}
        r.angle+=r.omega*dt;const drag=.015+.035*Math.abs(Math.sin(r.angle))*(1-r.g.roundness);
        r.vx*=Math.exp(-drag*dt);r.x+=r.vx*dt;r.vy+=9.8*dt;r.y+=r.vy*dt;
        if(r.y>=0&&r.vy>0){const fraction=clamp(r.y/(r.vy*dt),0,1);r.x-=r.vx*dt*fraction;r.y=0;r.distance=r.score=r.x;r.finish=s.elapsed-dt*fraction;}
      });s.done=s.racers.every(r=>r.finish!==null);
    }else if(s.mode==="balance"){
      if(s.elapsed>=s.nextWind){s.wind=(s.rng()-.5)*(.025+s.elapsed/120);s.nextWind=s.elapsed+.4+s.rng();}
      s.tilt=Math.sin(s.elapsed*.9)*(.008+s.elapsed*.002)+Math.sin(s.elapsed*.4)*.012;
      s.racers.forEach(r=>{if(r.out)return;r.time=s.elapsed;if(s.elapsed>=r.nextForce){r.forceX=(r.rng()-.5)*(.015+s.elapsed*.001);r.nextForce=s.elapsed+.3+r.rng()*.6;}const stability=r.g.base/(.7+r.g.height);
        r.omega+=(Math.sin(r.angle-s.tilt)*(.18+s.elapsed*.012)/Math.max(.3,stability)+(s.wind+r.forceX)/r.g.mass-r.omega*1.1)*dt;
        r.angle+=r.omega*dt;r.vx+=(Math.sin(s.tilt)*25+s.wind*5/r.g.mass-r.vx*.5)*dt;r.x+=r.vx*dt;
        if(Math.abs(r.angle-s.tilt)>.85||Math.abs(r.x)>85)eliminate(r,s);
      });const alive=s.racers.filter(r=>!r.out);if(!alive.length||s.elapsed>=60){alive.forEach(r=>{r.finish=60;r.score=60;});s.done=true;}
    }
  }
  function resultValue(s,r){return s.mode==="run"||s.mode==="roll"?r.finish===null?Infinity:r.finish:r.score;}
  function rank(s){const low=["run","roll"].includes(s.mode);return s.racers.slice().sort((a,b)=>{if(!s.done){if(s.mode==="sumo"||s.mode==="balance")return Number(a.out)-Number(b.out)||b.score-a.score||a.id-b.id;if(s.mode==="jump")return b.x-a.x||a.id-b.id;return (a.finish===null?Infinity:a.finish)-(b.finish===null?Infinity:b.finish)||b.distance-a.distance||a.id-b.id;}return (low?1:-1)*(resultValue(s,a)-resultValue(s,b))||a.id-b.id;});}
  function create(team,list,distance=100,seed=1){const chosen=events(list);if(!chosen.length||team.length<2||team.length>6||!team.every(d=>validAthlete(d,chosen)))throw Error("เลือกกีฬาและวาดสัตว์ให้ครบก่อนแข่ง");return {team:copy(team),events:chosen,distance:distance===200?200:100,rng:E.random(seed),index:-1,session:null,results:[],totals:team.map((d,id)=>({id,name:d.name,points:0}))};}
  function next(t){if(t.session&&!t.session.done||t.index+1>=t.events.length)return null;t.index++;t.session=makeSession(t.events[t.index],t.team,t.team.map(()=>Math.floor(t.rng()*4294967296)),t.distance);return t.session;}
  function record(t){const s=t.session;if(!s||!s.done||t.results.length>t.index)return false;
    const sorted=rank(s),table=[10,7,5,3,2,1],rows=[];let i=0;
    while(i<sorted.length){let end=i+1;while(end<sorted.length&&Math.abs(resultValue(s,sorted[end])-resultValue(s,sorted[i]))<1e-7)end++;
      const points=table.slice(i,end).reduce((a,b)=>a+b,0)/(end-i);
      for(let j=i;j<end;j++){const r=sorted[j];rows.push({id:r.id,name:r.drawing.name,place:i+1,value:resultValue(s,r),points});t.totals[r.id].points=Number((t.totals[r.id].points+points).toFixed(10));}i=end;
    }t.results.push({mode:s.mode,rows});return true;
  }
  function standings(t){const a=t.totals.slice().sort((a,b)=>Math.abs(b.points-a.points)<1e-7?a.id-b.id:b.points-a.points);return a.map((r,i)=>({...r,place:i&&Math.abs(r.points-a[i-1].points)<1e-7?a.findIndex(x=>Math.abs(x.points-r.points)<1e-7)+1:i+1}));}
  function snapshot(s){return {mode:s.mode,distance:s.distance,elapsed:s.elapsed,done:s.done,arena:s.arena,tilt:s.tilt,racers:s.racers.map(r=>{const o={id:r.id};["distance","speed","time","finish","event","eventUntil","x","y","vx","vy","angle","omega","score","out","launched"].forEach(k=>{if(r[k]!==undefined)o[k]=r[k];});o.legs=r.legs.map(l=>({phase:l.phase,cadence:l.cadence,swing:l.swing,bend:l.bend}));return o;})};}
  function apply(s,data){["elapsed","done","arena","tilt"].forEach(k=>{s[k]=data[k];});data.racers.forEach((r,i)=>{Object.keys(r).forEach(k=>{if(k!=="legs"&&k!=="id")s.racers[i][k]=r[k];});r.legs.forEach((l,j)=>Object.assign(s.racers[i].legs[j],l));});}
  const api={sports,events,validAthlete,geometry,create,next,step,rank,record,standings,snapshot,apply,makeSession,resultValue};if(typeof module!=="undefined"&&module.exports)module.exports=api;else root.DoodleOlympics=api;
})(typeof window!=="undefined"?window:this);
