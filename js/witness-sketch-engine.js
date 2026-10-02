// เจ้าของห้องคุมรอบและเวลา ส่งต้นฉบับเฉพาะคนใบ้ ส่งภาพวาดให้ทุกคนเมื่อเฉลยแล้วเท่านั้น
(function(global){
  "use strict";
  const COLORS=["#252525","#dc4444","#326acd","#e2ac25","#438956","#ffffff"];
  function drawing(value){
    if(!Array.isArray(value)||value.length>60)return null;
    let count=0;
    const out=[];
    for(const s of value){
      if(!s||!COLORS.includes(s.color)||!Number.isFinite(s.width)||s.width<0.003||s.width>0.04||!Array.isArray(s.points)||!s.points.length||s.points.length>240)return null;
      count+=s.points.length;if(count>1200)return null;
      const points=[];
      for(const p of s.points){if(!Array.isArray(p)||p.length!==2||p.some(n=>!Number.isFinite(n)||n<0||n>1))return null;points.push(p.slice());}
      out.push({color:s.color,width:s.width,points});
    }
    return out;
  }
  function name(value){return String(value||"เพื่อน").trim().slice(0,24)||"เพื่อน";}
  function Host(options){
    this.send=options.send;this.pick=options.pick;this.now=options.now||Date.now;this.paper=!!options.paper;
    this.players=[{id:"host",peer:"host",name:name(options.name),connected:true,key:null}];
    this.phase="lobby";this.round=0;this.serial=0;this.nextPlayer=1;this.lastWitness=null;this.roundId="";this.witness=null;this.participants=[];this.reference=null;this.clues=[];this.art={};this.submitted=new Set();this.deadline=0;
    this.cat="all";this.duration=120;this.lastTick=0;
  }
  Host.prototype.me=function(peer){return this.players.find(p=>p.peer===peer&&p.connected);};
  Host.prototype.error=function(peer,message){this.send(peer,"sk:error",{message});return false;};
  Host.prototype.snapshot=function(id){
    const s={protocol:1,phase:this.phase,round:this.round,roundId:this.roundId,you:id,paper:this.paper,witness:this.witness,cat:this.cat,duration:this.duration,remaining:this.phase==="drawing"?Math.max(0,Math.ceil((this.deadline-this.now())/1000)):this.duration,
      players:this.players.map(p=>({id:p.id,name:p.name,connected:p.connected,artist:this.participants.includes(p.id)&&p.id!==this.witness,submitted:this.submitted.has(p.id)})),clues:this.clues.slice(),own:this.art[id]||[]};
    if(this.reference&&(id===this.witness||this.phase==="reveal"))s.reference=this.reference;
    return s;
  };
  Host.prototype.sync=function(p){
    this.send(p.peer,"sk:state",this.snapshot(p.id));
    // ภาพแต่ละคนแยกข้อความ เพื่อไม่ให้แกลเลอรีทั้งห้องเกินขนาดของช่องข้อมูล
    if(this.phase==="reveal")this.participants.filter(id=>id!==this.witness).forEach(id=>this.send(p.peer,"sk:gallery",{roundId:this.roundId,id,strokes:this.art[id]||[]}));
  };
  Host.prototype.publish=function(){this.players.filter(p=>p.connected).forEach(p=>this.sync(p));};
  Host.prototype.join=function(peer,d){
    if(!d||d.protocol!==1||typeof d.key!=="string"||!/^[a-f0-9]{32}$/.test(d.key))return this.error(peer,"เกมคนละรุ่น กรุณาเปิดหน้าเกมใหม่");
    let p=this.players.find(p=>p.key===d.key);
    if(p){p.peer=peer;p.connected=true;this.publish();return true;}
    if(this.me(peer))return this.error(peer,"คุณอยู่ในห้องแล้ว");
    if(this.players.length>=8)return this.error(peer,"ห้องเต็มแล้ว (สูงสุด 8 คน)");
    p={id:"p"+this.nextPlayer++,peer,key:d.key,name:name(d.name),connected:true};this.players.push(p);this.publish();return true;
  };
  Host.prototype.disconnect=function(peer){const p=this.me(peer);if(p&&p.id!=="host"){p.connected=false;this.publish();}};
  Host.prototype.leave=function(peer){const p=this.me(peer);if(!p||p.id==="host")return;this.players=this.players.filter(x=>x!==p);if(p.id===this.witness&&this.phase==="prepare"){this.witness=this.players.find(x=>x.connected).id;this.lastWitness=this.witness;this.prepare();}else this.publish();};
  Host.prototype.replace=function(peer,d){if(peer!=="host"||this.phase!=="prepare"||!d||d.roundId!==this.roundId)return false;const old=this.players.find(p=>p.id===this.witness);if(old&&old.connected)return false;const p=this.players.find(p=>p.connected&&this.participants.includes(p.id));if(!p)return false;this.witness=p.id;this.lastWitness=p.id;return this.prepare();};
  Host.prototype.newRound=function(peer,settings){
    if(peer!=="host"||!['lobby','reveal'].includes(this.phase))return false;
    const active=this.players.filter(p=>p.connected);
    if(!this.paper&&active.length<2)return this.error(peer,"รอเพื่อนเข้ามาอย่างน้อยอีก 1 คน");
    this.cat=settings&&['all','people','characters'].includes(settings.cat)?settings.cat:this.cat;
    this.duration=settings&&[60,90,120,180].includes(settings.duration)?settings.duration:this.duration;
    const last=active.findIndex(p=>p.id===this.lastWitness);
    this.witness=active[(last+1)%active.length].id;this.lastWitness=this.witness;this.participants=active.map(p=>p.id);this.round++;
    return this.prepare();
  };
  Host.prototype.prepare=function(){
    const reference=this.pick(this.cat);if(!reference)return this.error("host","หมวดนี้ยังไม่มีภาพ");
    this.reference=reference;this.phase="prepare";this.roundId=this.round+":"+(++this.serial);this.art={};this.submitted.clear();this.clues=[];this.deadline=0;this.publish();return true;
  };
  Host.prototype.begin=function(peer,d){const p=this.me(peer);if(!p||p.id!==this.witness||this.phase!=="prepare"||!d||d.roundId!==this.roundId)return false;this.phase="drawing";this.deadline=this.now()+this.duration*1000;this.publish();return true;};
  Host.prototype.skip=function(peer,d){const p=this.me(peer);if(!p||!(p.id===this.witness||p.id==="host")||this.phase!=="prepare"||!d||d.roundId!==this.roundId)return false;return this.prepare();};
  Host.prototype.save=function(peer,d,submit){
    const p=this.me(peer);if(!p||!d||d.roundId!==this.roundId||this.phase!=="drawing"||p.id===this.witness||!this.participants.includes(p.id)||this.submitted.has(p.id))return false;
    if(this.now()>=this.deadline){this.end("host",{roundId:this.roundId});return false;}
    const strokes=drawing(d.strokes);if(!strokes)return this.error(peer,"ภาพมีเส้นมากเกินไป หรือข้อมูลไม่ครบ กรุณาย้อนเส้นล่าสุด");
    this.art[p.id]=strokes;
    if(submit){this.submitted.add(p.id);this.publish();}else this.send(p.peer,"sk:saved",{roundId:this.roundId});
    return true;
  };
  Host.prototype.clue=function(peer,d){const p=this.me(peer);if(!p||p.id!==this.witness||this.phase!=="drawing"||!d||d.roundId!==this.roundId||typeof d.text!=="string"||!d.text.trim()||this.clues.length>=30)return false;this.clues.push(d.text.trim().slice(0,180));this.publish();return true;};
  Host.prototype.end=function(peer,d){const p=this.me(peer);if(!p||!(p.id===this.witness||p.id==="host")||this.phase!=="drawing"||!d||d.roundId!==this.roundId)return false;this.phase="reveal";this.publish();return true;};
  Host.prototype.tick=function(){if(this.phase!=="drawing")return;if(this.now()>=this.deadline){this.end("host",{roundId:this.roundId});return;}if(this.now()-this.lastTick>=1000){this.lastTick=this.now();this.publish();}};
  Host.prototype.handle=function(type,d,peer){
    if(type==="join")return this.join(peer,d);
    if(type==="ping"){const p=this.me(peer);if(p){if(this.phase==="drawing"&&this.now()>=this.deadline)this.end("host",{roundId:this.roundId});else this.sync(p);}return;}
    if(type==="begin")return this.begin(peer,d);
    if(type==="skip")return this.skip(peer,d);
    if(type==="replace")return this.replace(peer,d);
    if(type==="draft")return this.save(peer,d,false);
    if(type==="submit")return this.save(peer,d,true);
    if(type==="clue")return this.clue(peer,d);
    if(type==="end")return this.end(peer,d);
    if(type==="leave")return this.leave(peer);
  };
  global.WitnessSketch={Host,drawing,COLORS};
})(typeof window!=="undefined"?window:globalThis);
