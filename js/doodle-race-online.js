// หน้าห้องออนไลน์: ภาพส่งถึงเจ้าของห้องเท่านั้น ก่อนเปิดให้ทุกเครื่องตอนปล่อยตัว
// ใช้ชั้นเชื่อมต่อเดียวกับเกมศิลปินตัวปลอม ไม่เพิ่มบัญชีหรือคีย์ลับให้ผู้เล่น
document.addEventListener("DOMContentLoaded",()=>{
  "use strict";
  const $=id=>document.getElementById(id),ui=window.DoodleRaceUI;
  if(!ui){ $("drNetMessage").textContent="ไฟล์เกมยังอัปเดตไม่ครบ กรุณาโหลดหน้านี้ใหม่ก่อนเข้าห้อง";return; }
  let room=null,game=null,state=null,isHost=false,connected=false,busy=false,pending=false;
  let ticker=0,heartbeat=0,joinTimeout=0,saveTimeout=0,lastHeard=0;
  const testMode=new URLSearchParams(location.search).get("loopback")==="1";
  const param=new URLSearchParams(location.search).get("room");
  if(param&&/^[A-Z0-9]{5}$/i.test(param))$("drRoomInput").value=param.toUpperCase();
  const myId=()=>isHost?"host":room&&room.t.id;
  function warn(text){$("drNetMessage").textContent=text;}
  function setBusy(value){busy=value;$("drHostRoom").disabled=value;$("drJoinRoom").disabled=value;}
  function cleanup(message=""){
    clearInterval(ticker);clearInterval(heartbeat);clearTimeout(joinTimeout);clearTimeout(saveTimeout);
    const old=room;room=null;game=null;state=null;connected=false;pending=false;isHost=false;
    if(old)old.close();ui.leaveOnline();setBusy(false);$("drSave").disabled=false;warn(message);
  }
  function render(s){
    state=s;lastHeard=performance.now();
    const me=s.players.find(p=>p.id===myId());if(!me)return;
    clearTimeout(joinTimeout);connected=true;
    $("drRoomCode").textContent=room.code;$("drOnlineDistance").value=s.distance;$("drOnlineDistance").disabled=!isHost||s.phase!=="lobby";
    $("drOnlineStart").hidden=!isHost;$("drOnlineStart").disabled=!s.canStart;$("drOnlineDraw").disabled=s.phase!=="lobby";
    $("drOnlineDraw").textContent=me.ready?"แก้ไขสัตว์ของฉัน":"วาดสัตว์ของฉัน";
    $("drRoomPlayers").replaceChildren();
    s.players.forEach(p=>{const row=document.createElement("div"),name=document.createElement("b"),status=document.createElement("span");row.className="dr-room-player";row.dataset.ready=p.ready;
      name.textContent=p.name+(p.id===myId()?" (คุณ)":"")+(p.id==="host"?" · เจ้าของห้อง":"");status.textContent=!p.connected?"หลุดจากห้อง":p.ready?"พร้อมแล้ว ✓":"กำลังวาด…";row.append(name,status);$("drRoomPlayers").appendChild(row);});
    $("drLobbyNotice").textContent=s.phase==="countdown"?"เตรียมเปิดภาพ… "+s.countdown:s.players.length<2?"ส่งรหัสให้เพื่อนเข้ามาอย่างน้อยอีก 1 คน":s.canStart?(isHost?"ทุกคนพร้อมแล้ว กดเริ่มแข่งได้เลย":"ทุกคนพร้อมแล้ว รอเจ้าของห้องเริ่มแข่ง"):"วาดให้ครบ แล้วกดส่งภาพและพร้อมแข่ง";
    $("drRoomHint").textContent=testMode?"โหมดทดสอบข้ามแท็บในเบราว์เซอร์เดียว · ไม่ได้เชื่อมผ่านอินเทอร์เน็ต":"ภาพเปิดพร้อมกันตอนปล่อยตัว · เจ้าของห้องต้องเปิดหน้านี้ไว้ตลอดรอบ";
    if(s.phase==="countdown")ui.show("drLobby");
    else if(s.phase==="lobby"&&$("drEditor").hidden)ui.show("drLobby");
    ui.hostControls(isHost);
  }
  function ack(data){
    clearTimeout(saveTimeout);pending=false;$("drSave").disabled=false;
    if(!data.ok){if(!connected){cleanup(data.message);return;}$("drMessage").textContent=data.message;return;}
    ui.show("drLobby");
  }
  async function connect(host){
    if(busy||room)return;
    const name=$("drOnlineName").value.trim();const code=$("drRoomInput").value.trim().toUpperCase();
    if(!name){warn("ใส่ชื่อผู้เล่นก่อนนะ");return;}
    if(!host&&!/^[A-Z0-9]{5}$/.test(code)){warn("รหัสห้องมี 5 ตัวอักษร เช็กรหัสจากเพื่อนอีกครั้ง");return;}
    setBusy(true);warn(host?"กำลังสร้างห้อง…":"กำลังเข้าห้อง…");isHost=host;
    room=new PGRoom(testMode?new PGChannelTransport():new PGPeerTransport());const current=room;
    room.on("host:leave",()=>{if(room===current)cleanup("เจ้าของห้องออกหรือหลุดจากการเชื่อมต่อ ห้องนี้ปิดแล้ว กรุณาสร้างหรือเข้าห้องใหม่");});
    room.on("net:error",()=>{if(room===current)warn("การเชื่อมต่อสะดุด ถ้ายังไม่เข้าห้องให้ลองใหม่อีกครั้ง");});
    if(!host){
      room.on("dr:state",s=>{if(room===current)render(s);});room.on("dr:ack",d=>{if(room===current)ack(d);});
      room.on("dr:pong",()=>{if(room===current)lastHeard=performance.now();});
      room.on("dr:race",d=>{if(room===current)ui.race(d);});room.on("dr:frame",d=>{if(room===current){lastHeard=performance.now();ui.frame(d);}});
    }
    try{
      if(host)await room.host();else await room.join(code);
      if(room!==current)return;
      ui.resetRound();ui.enterOnline(name);lastHeard=performance.now();warn("");setBusy(false);
      if(host){connected=true;game=new DoodleRaceHost(room,{name,distance:Number($("drDistance").value),onState:render,onRace:d=>ui.race(d),onFrame:d=>ui.frame(d),onAck:ack});game.publish();ticker=setInterval(()=>game&&game.tick(),50);}
      else{room.send("dr:join",{name});joinTimeout=setTimeout(()=>{if(room===current&&!connected)cleanup("ห้องไม่ตอบรับ อาจเป็นรหัสของเกมอื่นหรือเจ้าของห้องหลุดแล้ว");},12000);}
      heartbeat=setInterval(()=>{if(room!==current)return;if(!isHost){room.send("dr:ping",{});if(performance.now()-lastHeard>15000)cleanup("ติดต่อเจ้าของห้องไม่ได้ ห้องปิดแล้ว ลองเข้าห้องใหม่");}},2000);
    }catch(e){console.warn("เชื่อมต่อห้องวาดสัตว์ซิ่งไม่สำเร็จ",e.type||"timeout",e.message||"");if(room===current)cleanup(host?"สร้างห้องไม่สำเร็จ บริการเชื่อมต่ออาจไม่พร้อม ลองใหม่อีกครั้ง":"เข้าห้องไม่สำเร็จ เช็กรหัสและให้เจ้าของห้องเปิดหน้าเกมไว้ หากเครือข่ายบล็อกการเชื่อมต่อ ลองเปลี่ยนเครือข่าย");}
  }
  $("drHostRoom").addEventListener("click",()=>connect(true));$("drJoinRoom").addEventListener("click",()=>connect(false));
  $("drRoomInput").addEventListener("input",e=>{e.target.value=e.target.value.toUpperCase().replace(/[^A-Z0-9]/g,"");});
  $("drOnlineDraw").addEventListener("click",()=>{if(!state||state.phase!=="lobby")return;if(isHost)game.edit("host");else room.send("dr:edit",{});ui.editOnline();});
  $("drOnlineStart").addEventListener("click",()=>window.DoodleRaceOnline.start());
  $("drOnlineDistance").addEventListener("change",()=>{if(game&&game.phase==="lobby"){game.distance=Number($("drOnlineDistance").value);game.publish();}});
  $("drLeaveRoom").addEventListener("click",()=>cleanup("ออกจากห้องแล้ว"));
  $("drCopyRoom").addEventListener("click",async()=>{
    if(!room)return;const url=new URL(location.href);url.searchParams.set("room",room.code);
    try{await navigator.clipboard.writeText(url.href);$("drLobbyNotice").textContent="คัดลอกลิงก์แล้ว ส่งให้เพื่อนเปิดและใส่ชื่อเข้าห้องได้เลย";}
    catch(e){$("drLobbyNotice").textContent="ส่งรหัส "+room.code+" ให้เพื่อนกรอกเข้าห้อง";}
  });
  window.addEventListener("pagehide",()=>{if(room)cleanup();});
  window.DoodleRaceOnline={
    submit(d){if(!room||!state||state.phase!=="lobby"||pending)return;pending=true;$("drSave").disabled=true;$("drMessage").textContent="กำลังส่งภาพให้เจ้าของห้อง…";
      saveTimeout=setTimeout(()=>{pending=false;$("drSave").disabled=false;$("drMessage").textContent="ยังไม่ได้รับคำตอบจากห้อง ลองกดส่งอีกครั้ง";},10000);
      if(isHost)game.ready("host",d);else room.send("dr:ready",d);},
    showLobby(){ui.show("drLobby");if(state)render(state);},
    start(){if(game)game.start(Number($("drOnlineDistance").value));},
    backToLobby(){if(game)game.lobby();}
  };
});
