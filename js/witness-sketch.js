// เล่นคำให้การบนกระดาษหรือในห้องออนไลน์ ภาพต้นฉบับไม่อยู่ในหน้าจอของคนวาดก่อนเฉลย
document.addEventListener("DOMContentLoaded",()=>{
  "use strict";
  const $=id=>document.getElementById(id),params=new URLSearchParams(location.search),testMode=params.get("loopback")==="1",Engine=window.WitnessSketch;
  const CAT_LABEL={people:"คนดัง",characters:"ตัวละคร · รูปคอสเพลย์"};
  const pickers={};
  function pick(cat){if(!pickers[cat])pickers[cat]=createPicker(SKETCH_REFERENCES.filter(p=>cat==="all"||p.cat===cat),"pg_witness_sketch_"+cat);return pickers[cat]();}
  let room=null,host=null,state=null,isHost=false,paper=false,connected=false,busy=false,credentials=null;
  let ticker=0,heartbeat=0,retryTimer=0,joinTimer=0,lastHeard=0,roundKey="",imageKey="",imageTimer=0,loaded=false,refHidden=false;
  let strokes=[],activeStroke=null,pointerId=null,draftTimer=0,dirty=false,keyboardDrawing=false,keyboardPoint=[.5,.5],gallery=new Map();
  const storage="pg_witness_sketch_room_v1",draftStorage="pg_witness_sketch_draft_v1",canvas=$("wsCanvas"),ctx=canvas.getContext("2d");
  function notice(text){$("wsNotice").textContent=text;}
  function remember(){try{if(credentials)sessionStorage.setItem(storage,JSON.stringify(credentials));else sessionStorage.removeItem(storage);}catch(e){/* บางเครื่องปิดพื้นที่เก็บข้อมูล */}}
  function storeDraft(){try{sessionStorage.setItem(draftStorage,JSON.stringify({roundId:roundKey,code:room&&room.code,strokes}));}catch(e){/* วาดต่อได้แม้พื้นที่เก็บเต็ม */}}
  function savedDraft(s){try{const d=JSON.parse(sessionStorage.getItem(draftStorage)||"null");if(d&&d.roundId===s.roundId&&d.code===(room&&room.code))return Engine.drawing(d.strokes);}catch(e){/* ข้อมูลเก่าเสียหาย */}return null;}
  function freshKey(){const b=new Uint8Array(16);crypto.getRandomValues(b);return Array.from(b,x=>x.toString(16).padStart(2,"0")).join("");}
  function settings(){return {cat:$("wsCategory").value,duration:Number($("wsDuration").value)};}
  function me(){return state&&state.players.find(p=>p.id===state.you);}
  function canDraw(){const p=me();return connected&&state&&state.phase==="drawing"&&p&&p.artist&&!p.submitted;}
  function command(type,data={}){if(!connected)return;const payload={...data,roundId:state&&state.roundId};if(host)host.handle(type,payload,"host");else if(room)room.send("sk:"+type,payload);}
  function renderDrawing(target,list){const c=target.getContext("2d");c.fillStyle="#ffffff";c.fillRect(0,0,target.width,target.height);c.lineCap="round";c.lineJoin="round";for(const s of list){c.strokeStyle=s.color;c.fillStyle=s.color;c.lineWidth=s.width*target.width;c.beginPath();s.points.forEach((p,i)=>{const x=p[0]*target.width,y=p[1]*target.height;if(!i)c.moveTo(x,y);else c.lineTo(x,y);});if(s.points.length===1){const p=s.points[0];c.arc(p[0]*target.width,p[1]*target.height,c.lineWidth/2,0,2*Math.PI);c.fill();}else c.stroke();}}
  function repaint(){renderDrawing(canvas,strokes);}
  function flushDraft(){clearTimeout(draftTimer);draftTimer=0;if(dirty&&canDraw()){command("draft",{strokes});dirty=false;}}
  function changed(){dirty=true;storeDraft();repaint();if(!draftTimer)draftTimer=setTimeout(flushDraft,700);}
  function finishStroke(){activeStroke=null;keyboardDrawing=false;if(pointerId!==null){try{canvas.releasePointerCapture(pointerId);}catch(e){/* นิ้วอาจถูกเบราว์เซอร์ยกเลิกไปก่อน */}pointerId=null;}if(dirty)changed();}
  function point(e){const r=canvas.getBoundingClientRect();return [Math.max(0,Math.min(1,(e.clientX-r.left)/r.width)),Math.max(0,Math.min(1,(e.clientY-r.top)/r.height))];}
  function newStroke(p){if(strokes.length>=60||strokes.reduce((n,s)=>n+s.points.length,0)>=1200){notice("กระดาษมีเส้นครบแล้ว ย้อนเส้นหรือล้างภาพเพื่อวาดต่อได้");return false;}activeStroke={color:$("wsColor").value,width:Number($("wsWidth").value),points:[p]};strokes.push(activeStroke);changed();return true;}
  function extend(p){if(!activeStroke)return;const last=activeStroke.points[activeStroke.points.length-1];if(Math.hypot(last[0]-p[0],last[1]-p[1])<.005)return;if(activeStroke.points.length>=240||strokes.reduce((n,s)=>n+s.points.length,0)>=1200){finishStroke();return;}activeStroke.points.push(p);changed();}
  canvas.addEventListener("pointerdown",e=>{if(!canDraw()||pointerId!==null||e.button!==0)return;e.preventDefault();canvas.focus({preventScroll:true});if(newStroke(point(e))){pointerId=e.pointerId;canvas.setPointerCapture(e.pointerId);}});
  canvas.addEventListener("pointermove",e=>{if(e.pointerId===pointerId&&canDraw())extend(point(e));});
  ["pointerup","pointercancel","lostpointercapture"].forEach(type=>canvas.addEventListener(type,e=>{if(e.pointerId===pointerId)finishStroke();}));
  canvas.addEventListener("keydown",e=>{if(!canDraw())return;const steps={ArrowLeft:[-.02,0],ArrowRight:[.02,0],ArrowUp:[0,-.02],ArrowDown:[0,.02]};if(steps[e.key]){e.preventDefault();keyboardPoint=keyboardPoint.map((v,i)=>Math.max(0,Math.min(1,v+steps[e.key][i])));if(keyboardDrawing)extend(keyboardPoint.slice());}else if(e.key==="Enter"){e.preventDefault();if(keyboardDrawing)finishStroke();else keyboardDrawing=newStroke(keyboardPoint.slice());}else if(e.key==="Escape")finishStroke();});
  $("wsUndo").addEventListener("click",()=>{if(canDraw()){finishStroke();strokes.pop();changed();}});
  $("wsClear").addEventListener("click",()=>{if(canDraw()){finishStroke();strokes=[];changed();}});
  $("wsSubmit").addEventListener("click",()=>{if(!canDraw())return;finishStroke();flushDraft();command("submit",{strokes});});
  function source(ref){return "https://commons.wikimedia.org/wiki/File:"+encodeURIComponent(ref.file);}
  function reference(target,ref,privateView){
    target.replaceChildren();const figure=document.createElement("figure"),img=document.createElement("img"),caption=document.createElement("figcaption"),credit=document.createElement("p"),link=document.createElement("a"),license=document.createElement("a");
    caption.textContent=ref.name+(ref.cat==="characters"?" · ภาพคอสเพลย์":"");img.alt=caption.textContent;img.referrerPolicy="no-referrer";img.decoding="async";link.textContent="ดูภาพต้นฉบับ";link.href=source(ref);link.target="_blank";link.rel="noopener noreferrer";license.textContent=ref.license;license.href=ref.licenseUrl;license.target="_blank";license.rel="noopener noreferrer";credit.className="ws-credit";credit.append("ภาพ: "+ref.author+" · ",license," · ",link);figure.append(img,caption,credit);target.append(figure);
    const key=state.roundId;let settled=false;const timeout=setTimeout(()=>{if(!settled&&(!privateView||imageKey===key)){if(privateView){loaded=false;$("wsBegin").disabled=true;$("wsImageStatus").textContent="รูปยังโหลดไม่เสร็จ ลองเปลี่ยนรูปหรือเช็กอินเทอร์เน็ต ยังไม่เริ่มจับเวลา";}else{const p=document.createElement("p");p.textContent="ภาพยังโหลดไม่เสร็จ เปิดลิงก์ต้นฉบับด้านล่างได้";figure.prepend(p);}}},12000);
    function ready(ok){settled=true;clearTimeout(timeout);if(privateView&&imageKey===key){loaded=ok;$("wsBegin").disabled=!ok;$("wsImageStatus").textContent=ok?"รูปพร้อมแล้ว เริ่มเมื่อเพื่อนพร้อมวาด":"โหลดรูปไม่สำเร็จ กดเปลี่ยนรูปได้ ยังไม่เริ่มจับเวลา";}if(!ok){img.hidden=true;if(!privateView){const p=document.createElement("p");p.textContent="โหลดภาพไม่สำเร็จ เปิดภาพจากลิงก์ต้นฉบับด้านล่างได้";figure.prepend(p);}}}
    img.onload=()=>ready(img.naturalWidth>0);img.onerror=()=>ready(false);
    // ใช้ชื่อไฟล์ที่ตรวจจากหน้าแหล่งที่มาแล้ว ไม่ค้นหารูปใหม่ด้วยชื่อคนขณะเล่น
    img.src=ref.image;
    if(privateView)imageTimer=timeout;
  }
  function drawGallery(){const box=$("wsGallery");box.replaceChildren();state.players.filter(p=>p.artist).forEach(p=>{const figure=document.createElement("figure"),c=document.createElement("canvas"),caption=document.createElement("figcaption");c.width=400;c.height=500;c.setAttribute("aria-label","ภาพวาดของ "+p.name);caption.textContent=p.name+(gallery.has(p.id)?"":" · รอภาพ…");renderDrawing(c,gallery.get(p.id)||[]);figure.append(c,caption);box.append(figure);});}
  function render(s){
    if(!s||s.protocol!==1||!Array.isArray(s.players))return;
    const previous=state;state=s;lastHeard=performance.now();connected=true;busy=false;
    clearTimeout(joinTimer);notice("");$("wsSetup").hidden=true;$("wsRoom").hidden=paper;$("wsRound").hidden=s.phase==="lobby"||s.phase==="reveal";$("wsReveal").hidden=s.phase!=="reveal";
    $("wsCode").textContent=room?room.code:"";$("wsStart").hidden=!isHost||s.phase!=="lobby";$("wsStart").disabled=s.players.filter(p=>p.connected).length<2;
    $("wsRoomHint").textContent=testMode?"ทดสอบข้ามแท็บในเครื่องเดียว · ไม่ได้เชื่อมผ่านอินเทอร์เน็ต":s.phase==="lobby"?"ส่งรหัสให้เพื่อน แล้วเจ้าของห้องเริ่มรอบได้เลย":"คนใบ้: "+(s.players.find(p=>p.id===s.witness)?.name||"เพื่อน")+" · เจ้าของห้องต้องเปิดเกมไว้";
    $("wsPlayers").replaceChildren();s.players.forEach(p=>{const el=document.createElement("span");el.className="ws-player";el.textContent=p.name+(p.id===s.you?" (คุณ)":"")+(p.id===s.witness?" · คนใบ้":"")+(!p.connected?" · รอเชื่อมกลับ":p.submitted?" · ส่งภาพแล้ว":"");$("wsPlayers").append(el);});
    const changedRound=roundKey!==s.roundId;if(changedRound){finishStroke();roundKey=s.roundId;strokes=savedDraft(s)||Engine.drawing(s.own)||[];dirty=!!savedDraft(s);gallery.clear();repaint();}
    const self=me(),witness=s.you===s.witness,artist=self&&self.artist;
    $("wsRoundLabel").textContent="แฟ้มที่ "+s.round+" · "+(CAT_LABEL[s.cat]||"คละภาพ");$("wsClock").textContent=Math.floor(s.remaining/60)+":"+String(s.remaining%60).padStart(2,"0");
    $("wsRole").textContent=witness?"คุณคือคนใบ้":artist?"คุณคือคนวาด":"รอเข้ารอบถัดไป";
    $("wsWitness").hidden=!witness;$("wsArtist").hidden=!artist||s.phase!=="drawing";$("wsWaiting").hidden=witness||artist&&s.phase==="drawing";
    $("wsWaitingText").textContent=artist?"คนใบ้กำลังเปิดรูป เตรียมปากกาไว้ได้เลย ยังไม่เริ่มจับเวลา":"คุณเข้ามาระหว่างรอบ ดูการเฉลยด้วยกัน แล้วร่วมวาดในรอบถัดไป";
    $("wsArtistHint").textContent=self&&self.submitted?"ส่งภาพแล้ว ✓ รอคนใบ้เปิดต้นฉบับ ดูภาพของคุณได้ แต่แก้ไม่ได้แล้ว":"ฟังคำบอก แล้ววาดในกระดาษนี้ คุณจะยังไม่เห็นภาพต้นฉบับ";
    $("wsSubmit").disabled=!canDraw();$("wsTools").querySelectorAll("button,select").forEach(el=>el.disabled=!canDraw());
    $("wsBegin").hidden=s.phase!=="prepare";$("wsSkip").hidden=s.phase!=="prepare";$("wsHide").hidden=s.phase!=="drawing";$("wsClueForm").hidden=paper||!witness||s.phase!=="drawing";$("wsEnd").hidden=s.phase!=="drawing"||!(isHost||witness);
    $("wsReplaceWitness").hidden=!isHost||paper||s.phase!=="prepare"||!!s.players.find(p=>p.id===s.witness&&p.connected);
    if(witness&&s.reference&&imageKey!==s.roundId){clearTimeout(imageTimer);imageKey=s.roundId;loaded=false;refHidden=false;$("wsReference").hidden=false;$("wsHide").textContent="ซ่อนรูปชั่วคราว";$("wsBegin").disabled=true;$("wsImageStatus").textContent="กำลังโหลดรูป… ยังไม่เริ่มจับเวลา";reference($("wsReference"),s.reference,true);}
    else if(!witness){clearTimeout(imageTimer);imageKey="";$("wsReference").replaceChildren();$("wsImageStatus").textContent="";}
    $("wsClues").replaceChildren();s.clues.forEach(t=>{const li=document.createElement("li");li.textContent=t;$("wsClues").append(li);});
    $("wsNext").hidden=!isHost;$("wsHome").hidden=!paper;
    if(s.phase==="reveal"&&(!previous||previous.phase!=="reveal"||changedRound)){finishStroke();reference($("wsAnswer"),s.reference,false);drawGallery();}
    if(s.phase!=="reveal")$("wsAnswer").replaceChildren();
    if(dirty&&canDraw())flushDraft();
  }
  function makeHost(){host=new Engine.Host({paper,name:paper?"คนใบ้":$("wsName").value,pick,send:(peer,type,data)=>{if(peer==="host"){if(type==="sk:state")render(data);else if(type==="sk:gallery")receiveGallery(data);else if(type==="sk:error")notice(data.message);}else if(room)room.to(peer,type,data);}});ticker=setInterval(()=>host&&host.tick(),250);}
  function receiveGallery(d){if(!state||state.phase!=="reveal"||!d||d.roundId!==state.roundId)return;const value=Engine.drawing(d.strokes);if(value){gallery.set(d.id,value);drawGallery();}}
  function cleanup(clear=true){clearInterval(ticker);clearInterval(heartbeat);clearTimeout(retryTimer);clearTimeout(joinTimer);clearTimeout(draftTimer);if(room){const old=room;room=null;old.close();}host=null;state=null;connected=false;busy=false;paper=false;isHost=false;roundKey="";if(clear){credentials=null;remember();}$("wsSetup").hidden=false;["wsRoom","wsRound","wsReveal"].forEach(id=>$(id).hidden=true);$("wsReference").replaceChildren();$("wsAnswer").replaceChildren();imageKey="";}
  function recover(){if(isHost||paper||!credentials||busy)return;connected=false;notice("กำลังเชื่อมกลับเข้าห้องเดิม ภาพของคุณยังเก็บไว้ในเครื่อง…");clearTimeout(retryTimer);retryTimer=setTimeout(()=>connect(false,true),1200);}
  async function connect(asHost,resuming=false){
    if(busy)return;busy=true;isHost=asHost;paper=false;connected=false;clearTimeout(retryTimer);clearInterval(heartbeat);clearTimeout(joinTimer);
    if(room){const old=room;room=null;old.close();}
    const current=new PGRoom(testMode?new PGChannelTransport():new PGPeerTransport());room=current;
    current.on("sk:state",(s,from)=>{if(room===current&&!isHost&&from==="host")render(s);});current.on("sk:gallery",(d,from)=>{if(room===current&&!isHost&&from==="host")receiveGallery(d);});current.on("sk:error",(d,from)=>{if(room!==current||from!=="host")return;busy=false;notice(d.message);clearTimeout(joinTimer);});
    current.on("peer:leave",peer=>{if(room===current&&host)host.disconnect(peer);});current.on("host:leave",()=>{if(room===current){busy=false;recover();}});current.on("net:error",()=>{if(room===current){busy=false;if(!isHost)recover();else notice("การเชื่อมต่อห้องมีปัญหา เพื่อนอาจต้องเชื่อมกลับ กรุณาเปิดหน้านี้ไว้");}});
    ["join","ping","begin","skip","replace","draft","submit","clue","end","leave"].forEach(type=>current.on("sk:"+type,(d,peer)=>{if(room===current&&host)host.handle(type,d,peer);}));
    try{
      if(asHost){await current.host();if(room!==current)return;connected=true;busy=false;makeHost();host.publish();}
      else{if(!resuming){credentials={key:freshKey(),code:$("wsCodeInput").value.trim().toUpperCase(),name:$("wsName").value};remember();}if(!credentials||!/^[A-HJKMNP-Z2-9]{5}$/.test(credentials.code))throw new Error("รหัสห้องต้องเป็น 5 ตัว กรุณาเช็กรหัสกับเพื่อน");await current.join(credentials.code);if(room!==current)return;current.send("sk:join",{protocol:1,key:credentials.key,name:credentials.name});joinTimer=setTimeout(()=>{if(room===current&&!connected){busy=false;recover();}},12000);}
      heartbeat=setInterval(()=>{if(room!==current||isHost||document.hidden)return;if(connected){current.send("sk:ping",{});if(performance.now()-lastHeard>14000){busy=false;recover();}}},3000);
    }catch(e){if(room!==current)return;busy=false;notice((resuming?"ยังเชื่อมกลับไม่ได้ เจ้าของห้องต้องเปิดหน้าเกมไว้ · ":"")+e.message);if(resuming)retryTimer=setTimeout(()=>connect(false,true),5000);}
  }
  $("wsPaper").addEventListener("click",()=>{cleanup();paper=true;isHost=true;connected=true;makeHost();host.newRound("host",settings());});
  $("wsHost").addEventListener("click",()=>{credentials=null;remember();notice("กำลังสร้างห้อง…");connect(true);});$("wsJoin").addEventListener("click",()=>{notice("กำลังเข้าห้อง…");connect(false);});
  $("wsStart").addEventListener("click",()=>host&&host.newRound("host",settings()));$("wsNext").addEventListener("click",()=>host&&host.newRound("host",settings()));
  $("wsBegin").addEventListener("click",()=>{if(loaded)command("begin");});$("wsSkip").addEventListener("click",()=>command("skip"));$("wsEnd").addEventListener("click",()=>command("end"));
  $("wsReplaceWitness").addEventListener("click",()=>command("replace"));
  $("wsHide").addEventListener("click",()=>{refHidden=!refHidden;$("wsReference").hidden=refHidden;$("wsHide").textContent=refHidden?"ดูรูปอีกครั้ง":"ซ่อนรูปชั่วคราว";});
  $("wsClueForm").addEventListener("submit",e=>{e.preventDefault();command("clue",{text:$("wsClueInput").value});$("wsClueInput").value="";});
  $("wsLeave").addEventListener("click",()=>{command("leave");cleanup();notice("ออกจากห้องแล้ว");});$("wsHome").addEventListener("click",()=>{cleanup();notice("");});
  $("wsCopy").addEventListener("click",async()=>{if(!room)return;const url=new URL("witness-sketch.html",location.href);url.searchParams.set("room",room.code);if(testMode)url.searchParams.set("loopback","1");try{await navigator.clipboard.writeText(url.href);notice("คัดลอกลิงก์แล้ว ส่งให้เพื่อนเข้าห้องได้เลย");}catch(e){notice("รหัสห้อง: "+room.code+" · ลิงก์: "+url.href);}});
  function resume(){if(document.hidden)return;if(host){host.tick();host.publish();return;}if(credentials){if(room&&connected){room.send("sk:ping",{});if(performance.now()-lastHeard>14000)recover();}else{busy=false;recover();}}}
  document.addEventListener("visibilitychange",()=>{if(document.hidden){finishStroke();flushDraft();storeDraft();}else resume();});window.addEventListener("pageshow",resume);window.addEventListener("online",resume);
  window.addEventListener("pagehide",()=>{finishStroke();storeDraft();});
  if(params.get("room"))$("wsCodeInput").value=params.get("room").toUpperCase();
  try{const saved=JSON.parse(sessionStorage.getItem(storage)||"null");if(saved&&/^[a-f0-9]{32}$/.test(saved.key)&&/^[A-HJKMNP-Z2-9]{5}$/.test(saved.code)){credentials=saved;$("wsName").value=saved.name;$("wsCodeInput").value=saved.code;notice("กำลังกลับเข้าห้องเดิม…");connect(false,true);}}catch(e){/* ข้ามข้อมูลเก่าที่อ่านไม่ได้ */}
  repaint();
});
