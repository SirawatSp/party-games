// เจ้าของห้องตรวจคำขอและจำลองการแข่งขัน ทุกเครื่องรับผลจากแหล่งเดียว
(function(root){
  "use strict";
  const E=typeof module!=="undefined"&&module.exports?require("./doodle-race-engine.js"):root.DoodleRace;
  const copy=x=>JSON.parse(JSON.stringify(x));
  function Host(room,opts={}){
    this.room=room;this.now=opts.now||(()=>performance.now());this.seed=opts.seed||(()=>crypto.getRandomValues(new Uint32Array(1))[0]);
    this.onState=opts.onState||(()=>{});this.onRace=opts.onRace||(()=>{});this.onFrame=opts.onFrame||(()=>{});this.onAck=opts.onAck||(()=>{});
    this.players=[{id:"host",name:String(opts.name||"เจ้าของห้อง").slice(0,24),ready:false,connected:true,drawing:null}];
    this.phase="lobby";this.distance=opts.distance===200?200:100;this.round=0;this.seq=0;this.racers=[];this.elapsed=0;
    room.on("dr:join",(d,id)=>this.join(id,d));room.on("dr:ready",(d,id)=>this.ready(id,d));
    room.on("dr:edit",(_,id)=>this.edit(id));room.on("peer:leave",id=>this.leave(id));
    room.on("dr:ping",(_,id)=>room.to(id,"dr:pong",{}));
  }
  Host.prototype.ack=function(id,ok,message=""){const data={ok,message};if(id==="host")this.onAck(data);else this.room.to(id,"dr:ack",data);return ok;};
  Host.prototype.join=function(id,d){
    if(!id||id==="host")return false;
    if(this.phase!=="lobby")return this.ack(id,false,"ห้องกำลังแข่งอยู่ ให้เพื่อนกลับห้องรอก่อนแล้วเข้ามาใหม่");
    if(this.players.some(p=>p.id===id)){this.publish();return true;}
    if(this.players.length>=6)return this.ack(id,false,"ห้องเต็มแล้ว รับได้ 6 คน");
    const name=d&&typeof d.name==="string"?d.name.trim().slice(0,24):"";
    if(!name)return this.ack(id,false,"กรุณาใส่ชื่อผู้เล่น");
    this.players.push({id,name,ready:false,connected:true,drawing:null});this.publish();return true;
  };
  Host.prototype.ready=function(id,d){
    const p=this.players.find(p=>p.id===id);
    if(this.phase!=="lobby"||!p)return this.ack(id,false,"ส่งภาพได้เฉพาะตอนอยู่ในห้องรอ");
    if(!d||typeof d.name!=="string"||!d.name.trim()||d.name.length>24||!E.validDrawing(d)||JSON.stringify(d).length>1500000)return this.ack(id,false,"ภาพไม่ครบหรือใหญ่เกินไป ต้องมีลำตัวและขา 2–6 ขา");
    p.drawing=copy(d);p.ready=true;this.ack(id,true);this.publish();return true;
  };
  Host.prototype.edit=function(id){const p=this.players.find(p=>p.id===id);if(this.phase!=="lobby"||!p)return false;p.ready=false;this.publish();return true;};
  Host.prototype.leave=function(id){
    const p=this.players.find(p=>p.id===id);if(!p)return;
    if(this.phase==="lobby")this.players=this.players.filter(p=>p.id!==id);
    else{p.connected=false;if(this.phase==="countdown"){this.phase="lobby";this.players=this.players.filter(p=>p.connected);}}
    this.publish();
  };
  Host.prototype.canStart=function(){return ["lobby","result"].includes(this.phase)&&this.players.filter(p=>p.connected).length>=2&&this.players.filter(p=>p.connected).every(p=>p.ready&&p.drawing);};
  Host.prototype.start=function(distance){
    if(!this.canStart())return false;
    this.players=this.players.filter(p=>p.connected);this.distance=distance===200?200:100;this.round++;this.seq=0;this.elapsed=0;
    this.racers=this.players.map((p,i)=>E.makeRacer(copy(p.drawing),this.seed(),i));
    this.phase="countdown";this.startsAt=this.now()+3000;this.lastCount=3;this.publish();return true;
  };
  Host.prototype.publicState=function(){return {phase:this.phase,distance:this.distance,round:this.round,countdown:this.phase==="countdown"?Math.max(1,Math.ceil((this.startsAt-this.now())/1000)):0,players:this.players.map(p=>({id:p.id,name:p.name,ready:p.ready,connected:p.connected})),canStart:this.canStart()};};
  Host.prototype.publish=function(){const s=this.publicState();this.room.broadcast("dr:state",s);this.onState(s);};
  Host.prototype.snapshot=function(){return {round:this.round,seq:++this.seq,elapsed:this.elapsed,finished:this.phase==="result",racers:this.racers.map(r=>({id:r.id,distance:r.distance,speed:r.speed,time:r.time,finish:r.finish,event:r.event,eventUntil:r.eventUntil,legs:r.legs.map(l=>({phase:l.phase,cadence:l.cadence,swing:l.swing,bend:l.bend}))}))};};
  Host.prototype.tick=function(){
    if(this.phase==="countdown"){
      const n=Math.max(0,Math.ceil((this.startsAt-this.now())/1000));if(n>0){if(n!==this.lastCount){this.lastCount=n;this.publish();}return;}
      this.phase="race";const data={round:this.round,distance:this.distance,team:this.racers.map(r=>copy(r.drawing))};this.room.broadcast("dr:race",data);this.onRace(data);
    }
    if(this.phase!=="race")return;
    // ชั่วโมงฝั่งโฮสต์เป็นหลัก แท็บที่สะดุดค่อยจำลองก้าวที่ค้างจนตามทัน
    const target=Math.min(400,(this.now()-this.startsAt)/1000);let steps=0;
    while(this.elapsed+1/60<=target+1e-9&&steps++<600){this.racers.forEach(r=>E.step(r,1/60,this.distance));this.elapsed+=1/60;if(this.racers.every(r=>r.finish!==null)){this.phase="result";break;}}
    const frame=this.snapshot();this.room.broadcast("dr:frame",frame);this.onFrame(frame);if(this.phase==="result")this.publish();
  };
  Host.prototype.lobby=function(){if(this.phase!=="result")return false;this.phase="lobby";this.players=this.players.filter(p=>p.connected);this.players.forEach(p=>{p.ready=false;});this.publish();return true;};
  if(typeof module!=="undefined"&&module.exports)module.exports=Host;else root.DoodleRaceHost=Host;
})(typeof window!=="undefined"?window:this);
