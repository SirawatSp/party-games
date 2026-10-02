// หน้าห้องออนไลน์: ภาพส่งถึงเจ้าของห้องเท่านั้น ก่อนเปิดให้ทุกเครื่องตอนปล่อยตัว
// ใช้ชั้นเชื่อมต่อเดียวกับเกมศิลปินตัวปลอม ไม่เพิ่มบัญชีหรือคีย์ลับให้ผู้เล่น
document.addEventListener("DOMContentLoaded",()=>{
  "use strict";
  const $=id=>document.getElementById(id),ui=window.DoodleRaceUI;
  if(!ui){ $("drNetMessage").textContent="ไฟล์เกมยังอัปเดตไม่ครบ กรุณาโหลดหน้านี้ใหม่ก่อนเข้าห้อง";return; }
  let room=null,game=null,state=null,isHost=false,connected=false,busy=false,pending=false;
  let ticker=0,heartbeat=0,joinTimeout=0,saveTimeout=0,retryTimer=0,lastHeard=0;
  let credentials=null,entered=false,retries=0;
  const resumeStore='pg_doodle_room_v1';
  function remember(){try{if(credentials)sessionStorage.setItem(resumeStore,JSON.stringify(credentials));else sessionStorage.removeItem(resumeStore);}catch(e){/* บางเบราว์เซอร์ปิดพื้นที่เก็บชั่วคราว */}}
  function newKey(){const bytes=new Uint8Array(16);crypto.getRandomValues(bytes);return Array.from(bytes,b=>b.toString(16).padStart(2,'0')).join('');}
  const testMode=new URLSearchParams(location.search).get("loopback")==="1";
  const param=new URLSearchParams(location.search).get("room");
  if(param&&/^[A-Z0-9]{5}$/i.test(param))$("drRoomInput").value=param.toUpperCase();
  const myId=()=>isHost?"host":room&&room.t.id;
  function warn(text){$("drNetMessage").textContent=text;const notice=$("drConnectionNotice");if(notice){notice.textContent=text;notice.hidden=!text||!entered;const leave=$("drReconnectLeave");if(leave)leave.hidden=!text||!credentials;}}
  function wrongVersion(){cleanup("เกมของคุณกับเจ้าของห้องเป็นคนละรุ่น ให้ทุกคนเปิดเกมรุ่นล่าสุดแล้วสร้างห้องใหม่");$("drRefreshGame").hidden=false;}
  $("drRefreshGame").addEventListener("click",()=>{const url=new URL(location.href);url.searchParams.set("update",Date.now());location.replace(url.href);});
  function setBusy(value){busy=value;$("drHostRoom").disabled=value;$("drJoinRoom").disabled=value;}
  function cleanup(message=""){
    clearInterval(ticker);clearInterval(heartbeat);clearTimeout(joinTimeout);clearTimeout(saveTimeout);clearTimeout(retryTimer);
    const old=room;room=null;game=null;state=null;connected=false;pending=false;isHost=false;entered=false;credentials=null;remember();
    if(old)old.close();ui.leaveOnline();setBusy(false);$("drSave").disabled=false;warn(message);
  }
  // โทรศัพท์อาจพักทั้งเครือข่ายและตัวจับเวลา จึงเก็บภาพเดิมไว้จนเชื่อมกลับสำเร็จ
  function recover(){
    if(isHost||!credentials)return;
    clearInterval(heartbeat);clearTimeout(joinTimeout);clearTimeout(saveTimeout);clearTimeout(retryTimer);
    const old=room;room=null;connected=false;pending=false;$("drSave").disabled=false;
    if(old)old.close();setBusy(false);
    warn("กำลังเชื่อมกลับห้องเดิม… สัตว์และคะแนนของคุณยังอยู่");
    if(!document.hidden)retryTimer=setTimeout(()=>connect(false,true),Math.min(15000,1000*2**Math.min(retries++,4)));
  }
  function resume(){
    if(isHost){if(game)game.tick();return;}
    if(!credentials||busy)return;
    if(!room){clearTimeout(retryTimer);connect(false,true);return;}
    lastHeard=performance.now();
    room.send("dr:join",{name:credentials.name,resumeKey:credentials.key,protocol:DoodleOlympics.protocol});
  }
  function render(s){
    if(s.protocol!==DoodleOlympics.protocol){wrongVersion();return;}
    state=s;lastHeard=performance.now();ui.settings(s.events,s.distance);
    renderSports(s.events);$("drOnlineSchedule").textContent=s.events.map((k,i)=>(i+1)+". "+DoodleOlympics.sports[k].name).join(" → ");
    const me=s.players.find(p=>p.id===myId());if(!me)return;
    clearTimeout(joinTimeout);clearTimeout(retryTimer);connected=true;retries=0;warn("");
    $("drRoomCode").textContent=room.code;$("drOnlineDistance").value=s.distance;$("drOnlineDistance").disabled=!isHost||s.phase!=="lobby"||!s.events.includes("run");
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
  function renderSports(list){
    $("drOnlineSports").replaceChildren();Object.entries(DoodleOlympics.sports).forEach(([key,s])=>{
      const label=document.createElement("label"),input=document.createElement("input"),name=document.createElement("strong");label.className="dr-sport-option";input.type="checkbox";input.value=key;input.checked=list.includes(key);input.disabled=!isHost||state.phase!=="lobby";input.setAttribute("aria-label",s.name);name.textContent=s.icon+" "+s.name;label.append(input,name);$("drOnlineSports").appendChild(label);
    });
  }
  $("drOnlineSports").addEventListener("change",()=>{if(!game||game.phase!=="lobby")return;const list=[...$("drOnlineSports").querySelectorAll("input:checked")].map(x=>x.value);if(!list.length){renderSports(state.events);$("drLobbyNotice").textContent="ต้องเลือกอย่างน้อย 1 กีฬา";return;}game.settings(list,Number($("drOnlineDistance").value));});
  function ack(data){
    clearTimeout(saveTimeout);pending=false;$("drSave").disabled=false;
    if(!data.ok){if(!connected){cleanup(data.message);return;}$("drMessage").textContent=data.message;return;}
    ui.show("drLobby");
  }
  async function connect(host,resuming=false){
    if(busy||room)return;
    const name=resuming?credentials.name:$("drOnlineName").value.trim();const code=resuming?credentials.code:$("drRoomInput").value.trim().toUpperCase();
    if(!name){warn("ใส่ชื่อผู้เล่นก่อนนะ");return;}
    if(!host&&!/^[A-Z0-9]{5}$/.test(code)){warn("รหัสห้องมี 5 ตัวอักษร เช็กรหัสจากเพื่อนอีกครั้ง");return;}
    if(!resuming){clearTimeout(retryTimer);if(host){credentials=null;remember();}}
    if(!host&&!resuming){credentials={code,name,key:newKey()};remember();}
    setBusy(true);$("drRefreshGame").hidden=true;warn(host?"กำลังสร้างห้อง…":"กำลังเข้าห้อง…");isHost=host;
    room=new PGRoom(testMode?new PGChannelTransport():new PGPeerTransport());const current=room;
    room.on("host:leave",()=>{if(room===current)recover();});
    room.on("net:error",()=>{if(room===current){if(!isHost&&connected)recover();else warn("การเชื่อมต่อสะดุด กำลังลองเชื่อมใหม่");}});
    if(!host){
      room.on("dr:state",s=>{if(room===current)render(s);});room.on("dr:ack",d=>{if(room===current)ack(d);});
      room.on("dr:pong",()=>{if(room===current)lastHeard=performance.now();});
      room.on("dr:race",d=>{if(room===current){if(d.protocol!==DoodleOlympics.protocol){wrongVersion();return;}ui.race(d);}});room.on("dr:frame",d=>{if(room===current){if(d.protocol!==DoodleOlympics.protocol){wrongVersion();return;}lastHeard=performance.now();ui.frame(d);}});
    }
    try{
      if(host)await room.host();else await room.join(code);
      if(room!==current)return;
      if(!entered){ui.resetRound();ui.enterOnline(name);entered=true;}lastHeard=performance.now();warn("");setBusy(false);
      if(host){connected=true;game=new DoodleRaceHost(room,{name,...ui.selection(),onState:render,onRace:d=>ui.race(d),onFrame:d=>ui.frame(d),onAck:ack});game.publish();ticker=setInterval(()=>game&&game.tick(),50);}
      else{room.send("dr:join",{name,resumeKey:credentials.key,protocol:DoodleOlympics.protocol});if(room===current&&!connected)joinTimeout=setTimeout(()=>{if(room===current&&!connected)recover();},12000);}
      if(room!==current)return;
      heartbeat=setInterval(()=>{if(room!==current)return;if(!isHost&&!document.hidden){room.send("dr:ping",{});if(performance.now()-lastHeard>15000)recover();}},2000);
    }catch(e){console.warn("เชื่อมต่อห้องโอลิมปิก คิ๊กกะปู้ไม่สำเร็จ",e.type||"timeout",e.message||"");if(room===current){if(!host&&resuming){recover();return;}cleanup(host?"สร้างห้องไม่สำเร็จ บริการเชื่อมต่ออาจไม่พร้อม ลองใหม่อีกครั้ง":"เข้าห้องไม่สำเร็จ เช็กรหัสและให้เจ้าของห้องเปิดหน้าเกมไว้ หากเครือข่ายบล็อกการเชื่อมต่อ ลองเปลี่ยนเครือข่าย");}}
  }
  $("drHostRoom").addEventListener("click",()=>connect(true));$("drJoinRoom").addEventListener("click",()=>connect(false));
  $("drRoomInput").addEventListener("input",e=>{e.target.value=e.target.value.toUpperCase().replace(/[^A-Z0-9]/g,"");});
  $("drOnlineDraw").addEventListener("click",()=>{if(!state||state.phase!=="lobby")return;if(isHost)game.edit("host");else room.send("dr:edit",{});ui.editOnline();});
  $("drOnlineStart").addEventListener("click",()=>window.DoodleRaceOnline.start());
  $("drOnlineDistance").addEventListener("change",()=>{if(game&&game.phase==="lobby"){game.settings(state.events,Number($("drOnlineDistance").value));}});
  function leaveRoom(){if(room&&!isHost)room.send("dr:leave",{});cleanup("ออกจากห้องแล้ว");}
  $("drLeaveRoom").addEventListener("click",leaveRoom);
  $("drReconnectLeave").addEventListener("click",leaveRoom);
  $("drCopyRoom").addEventListener("click",async()=>{
    if(!room)return;const url=new URL(location.href);url.searchParams.set("room",room.code);url.searchParams.set("update",Date.now());
    try{await navigator.clipboard.writeText(url.href);$("drLobbyNotice").textContent="คัดลอกลิงก์แล้ว ส่งให้เพื่อนเปิดและใส่ชื่อเข้าห้องได้เลย";}
    catch(e){$("drLobbyNotice").textContent="ส่งรหัส "+room.code+" ให้เพื่อนกรอกเข้าห้อง";}
  });
  document.addEventListener("visibilitychange",()=>{if(!document.hidden)resume();});
  window.addEventListener("pageshow",resume);
  window.addEventListener("online",resume);
  window.addEventListener("pagehide",event=>{if(isHost){if(!event.persisted&&room)cleanup();}else if(room)recover();});
  try{
    const saved=JSON.parse(sessionStorage.getItem(resumeStore));
    if(saved&&/^[A-Z0-9]{5}$/.test(saved.code)&&/^[a-f0-9]{32}$/.test(saved.key)&&typeof saved.name==='string'&&saved.name.trim()&&(!param||param.toUpperCase()===saved.code)){
      credentials=saved;$("drOnlineName").value=saved.name;$("drRoomInput").value=saved.code;connect(false,true);
    }
  }catch(e){/* เริ่มห้องใหม่ได้เมื่อไม่มีข้อมูลเดิม */}
  window.DoodleRaceOnline={
    submit(d){if(!room||!state||state.phase!=="lobby"||pending)return;pending=true;$("drSave").disabled=true;$("drMessage").textContent="กำลังส่งภาพให้เจ้าของห้อง…";
      saveTimeout=setTimeout(()=>{pending=false;$("drSave").disabled=false;$("drMessage").textContent="ยังไม่ได้รับคำตอบจากห้อง ลองกดส่งอีกครั้ง";},10000);
      if(isHost)game.ready("host",d);else room.send("dr:ready",d);},
    showLobby(){ui.show("drLobby");if(state)render(state);},
    start(){if(game)game.start(Number($("drOnlineDistance").value));},
    stop(){if(isHost&&game)game.stop();},
    backToLobby(){if(game){if(game.tournament&&game.tournament.index+1<game.tournament.events.length&&!window.confirm("จบชุดการแข่งขันก่อนครบกีฬาและกลับห้องรอ?"))return;game.lobby();}}
  };
});
