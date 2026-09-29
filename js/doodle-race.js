document.addEventListener("DOMContentLoaded", () => {
  "use strict";
  const E = DoodleRace, $ = id => document.getElementById(id);
  const colors = ["#243d32", "#df5936", "#366cba", "#965db0", "#c78c22", "#25977b"];
  const colorNames = ["เขียวเข้ม", "ส้ม", "น้ำเงิน", "ม่วง", "เหลืองเข้ม", "เขียวมิ้นต์"];
  const KEY = "pg_doodle_race_v1", panels = ["drSetup", "drEditor", "drLineup", "drRace"];
  const empty = i => ({name:"นักแข่ง " + (i + 1), body:[], legs:[]});
  const clone = obj => JSON.parse(JSON.stringify(obj));
  let team = [], count = 4, distance = 100, editorIndex = 0, draft, tool = "body", color = colors[0];
  let stroke = null, pointer = null, saved = null, previewFrame = 0, raceFrame = 0;
  let racers = [], elapsed = 0, countdown = 3, lastFrame = 0, accumulator = 0, paused = false, finished = false, lastRankPaint = -1;
  let raceWidth = 1000, raceHeight = 520;
  const STEP = 1 / 60;
  const dc = $("drDraw").getContext("2d"), pc = $("drPreviewCanvas").getContext("2d"), rc = $("drTrack").getContext("2d");

  function setupCanvas(canvas, width, height) {
    const ratio = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.round(width * ratio); canvas.height = Math.round(height * ratio);
    canvas.getContext("2d").setTransform(ratio, 0, 0, ratio, 0, 0);
  }
  setupCanvas($("drDraw"), 600, 360);
  setupCanvas($("drPreviewCanvas"), 600, 260);

  function stopPreview() { cancelAnimationFrame(previewFrame); previewFrame = 0; $("drPreview").hidden = true; }
  function stopRace() { cancelAnimationFrame(raceFrame); raceFrame = 0; }
  function show(id) {
    stopPreview();
    if (id !== "drRace") stopRace();
    panels.forEach(p => { $(p).hidden = p !== id; });
    $(id).scrollIntoView({behavior:"instant", block:"start"});
  }
  function persist() {
    try { localStorage.setItem(KEY, JSON.stringify({v:1, count, distance, team})); }
    catch (e) { $("drMessage").textContent = "เครื่องนี้บันทึกภาพอัตโนมัติไม่ได้ แต่ยังเล่นรอบนี้ต่อได้"; }
  }
  function storeDraft() {
    draft.name = $("drName").value.trim().slice(0,24) || "นักแข่ง " + (editorIndex + 1);
    team[editorIndex] = clone(draft); persist();
  }
  try {
    const raw = localStorage.getItem(KEY);
    if (raw && raw.length < 2500000) {
      const data = JSON.parse(raw);
      const strokeOK = s => s && colors.includes(s.color) && [5,9,15].includes(s.width) && Array.isArray(s.points) && s.points.length >= 2 && s.points.length <= 700 && s.points.every(p => Array.isArray(p) && p.length === 2 && p.every(Number.isFinite) && p[0] >= 0 && p[0] <= 600 && p[1] >= 0 && p[1] <= 360);
      const draftOK = d => d === null || (d && typeof d.name === "string" && d.name.length <= 24 && Array.isArray(d.body) && d.body.length <= 120 && d.body.every(strokeOK) && Array.isArray(d.legs) && d.legs.length <= 6 && d.legs.every(strokeOK));
      if (data.v === 1 && Number.isInteger(data.count) && data.count >= 2 && data.count <= 6 && [100,200].includes(data.distance) && Array.isArray(data.team) && data.team.length === data.count && data.team.every(draftOK)) saved = data;
    }
  } catch (e) { /* ข้อมูลเก่าเสียหรือพื้นที่เก็บปิดอยู่ ให้เริ่มเกมใหม่ได้ตามปกติ */ }
  $("drRestore").hidden = !saved;
  $("drRestore").addEventListener("click", () => {
    ({team, count, distance} = clone(saved));
    $("drCount").value = count; $("drDistance").value = distance;
    showLineup();
  });
  $("drBegin").addEventListener("click", () => {
    count = Number($("drCount").value); distance = Number($("drDistance").value);
    team = Array.from({length:count}, (_, i) => team[i] || null);
    persist();
    const next = team.findIndex(d => !E.validDrawing(d));
    if (next < 0) showLineup(); else openEditor(next);
  });
  colors.forEach((c, i) => {
    const b = document.createElement("button"); b.type = "button"; b.style.background = c;
    b.setAttribute("aria-label", "ปากกาสี" + colorNames[i]); b.setAttribute("aria-pressed", String(i === 0));
    b.addEventListener("click", () => { color = c; [...$("drColors").children].forEach(x => x.setAttribute("aria-pressed", String(x === b))); });
    $("drColors").appendChild(b);
  });
  function setTool(next) {
    stopPreview(); tool = next;
    $("drBodyTool").setAttribute("aria-pressed", String(tool === "body"));
    $("drLegTool").setAttribute("aria-pressed", String(tool === "legs"));
    $("drDrawHint").textContent = tool === "body" ? "วาดลำตัว หัว และหาง หันหน้าไปทางขวา → แล้วค่อยกด “เติมขา”" : "ลากจากลำตัวลงไปถึงปลายเท้า ยกนิ้ว = จบ 1 ขา วาดขางอหรือขายาวได้ 2–6 ขา";
    $("drMessage").textContent = ""; paintEditor();
  }
  $("drBodyTool").addEventListener("click", () => setTool("body"));
  $("drLegTool").addEventListener("click", () => setTool("legs"));
  function openEditor(i) {
    editorIndex = i; draft = clone(team[i] || empty(i));
    $("drTurn").textContent = "ส่งเครื่องให้คนที่ " + (i + 1) + " / " + count;
    $("drPlayerNumber").textContent = String(i + 1).padStart(2,"0");
    $("drName").value = draft.name;
    $("drSave").textContent = team.some((d,j) => j !== i && !E.validDrawing(d)) ? "บันทึกแล้วส่งต่อ →" : "บันทึกเข้าทีม →";
    show("drEditor"); setTool(draft.body.length ? "legs" : "body");
  }
  $("drName").addEventListener("input", storeDraft);
  function drawStroke(ctx, s, points = s.points) {
    ctx.beginPath(); ctx.lineCap = "round"; ctx.lineJoin = "round"; ctx.strokeStyle = s.color; ctx.lineWidth = s.width;
    points.forEach((p, i) => i ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1])); ctx.stroke();
  }
  function paintEditor() {
    dc.clearRect(0,0,600,360);
    draft.legs.forEach(s => drawStroke(dc,s)); draft.body.forEach(s => drawStroke(dc,s));
    if (tool === "legs") draft.legs.forEach((s,i) => {
      const p=s.points[0]; dc.fillStyle="#fffef8"; dc.strokeStyle="#df5936"; dc.lineWidth=2;
      dc.beginPath(); dc.arc(p[0],p[1],8,0,Math.PI*2); dc.fill(); dc.stroke();
      dc.fillStyle="#243d32"; dc.font="10px sans-serif"; dc.textAlign="center"; dc.fillText(i+1,p[0],p[1]+3);
    });
    if (stroke) drawStroke(dc, stroke);
    $("drLegCount").textContent = draft.legs.length + "/6";
    $("drUndo").disabled = !draft[tool].length;
    $("drPreviewBtn").disabled = !E.validDrawing(draft);
  }
  function point(event) {
    const r=$("drDraw").getBoundingClientRect();
    return [Math.max(8,Math.min(592,(event.clientX-r.left)/r.width*600)),Math.max(8,Math.min(352,(event.clientY-r.top)/r.height*360))];
  }
  $("drDraw").addEventListener("pointerdown", e => {
    if (pointer !== null || (e.pointerType === "mouse" && e.button !== 0)) return;
    e.preventDefault(); stopPreview(); $("drMessage").textContent="";
    if (draft[tool].length >= (tool === "legs" ? 6 : 120)) { $("drMessage").textContent="เต็มจำนวนเส้นแล้ว ใช้ปุ่มย้อนเพื่อลบเส้นล่าสุดได้"; return; }
    let p=point(e);
    if (tool === "legs") {
      const hit=E.nearest(draft.body,p);
      if (!hit.point || hit.distance>42) { $("drMessage").textContent="เริ่มลากขาจากเส้นลำตัวก่อนนะ จุดแรกจะเป็นข้อที่ขยับ"; return; }
      p=hit.point;
    }
    pointer=e.pointerId; $("drDraw").setPointerCapture(pointer);
    stroke={color,width:Number($("drBrush").value),points:[p]};
  });
  $("drDraw").addEventListener("pointermove", e => {
    if(e.pointerId!==pointer || !stroke) return;
    e.preventDefault(); const p=point(e), last=stroke.points.at(-1);
    if(Math.hypot(p[0]-last[0],p[1]-last[1])>1.4 && stroke.points.length<650) stroke.points.push(p);
    paintEditor();
  });
  function endStroke(e) {
    if (e.pointerId !== pointer || !stroke) return;
    if (e.type !== "pointercancel" && e.type !== "lostpointercapture") {
      const p=point(e); stroke.points.push(p);
      if (tool === "legs" && Math.hypot(p[0]-stroke.points[0][0],p[1]-stroke.points[0][1])<18) $("drMessage").textContent="ขาสั้นเกินไป ลากจากลำตัวให้ปลายเท้าห่างออกมาอีกนิด";
      else draft[tool].push(stroke);
    }
    stroke=null; pointer=null; storeDraft(); paintEditor();
  }
  ["pointerup","pointercancel","lostpointercapture"].forEach(name => $("drDraw").addEventListener(name,endStroke));
  $("drUndo").addEventListener("click", () => { stopPreview(); draft[tool].pop(); storeDraft(); paintEditor(); });
  $("drClear").addEventListener("click", () => {
    if (!draft[tool].length) return;
    if (!window.confirm(tool === "body" ? "ล้างลำตัวและขาทั้งหมดเพื่อวาดใหม่?" : "ล้างขาทั้งหมด แล้ววาดขาใหม่?")) return;
    stopPreview(); draft[tool]=[]; if(tool === "body") draft.legs=[]; storeDraft(); paintEditor();
  });
  $("drExample").addEventListener("click", () => {
    if ((draft.body.length || draft.legs.length) && !window.confirm("ใช้ตัวอย่างม้าแทนภาพที่กำลังวาด?")) return;
    const s = points => ({color,width:9,points});
    draft.body=[s([[170,165],[193,132],[256,124],[329,143],[363,78],[399,84],[427,129],[387,141],[362,196],[287,220],[197,204],[170,165]]),s([[176,160],[132,129],[112,154]]),s([[380,83],[382,57],[397,83]]),s([[399,109],[402,109]])];
    draft.legs=[s([[197,204],[181,251],[171,307],[192,308]]),s([[233,213],[257,266],[236,316],[260,316]]),s([[330,206],[341,263],[382,305],[398,305]]),s([[359,197],[378,246],[348,306],[369,306]])];
    storeDraft(); setTool("legs");
  });
  function validate() {
    if (E.validDrawing(draft)) return true;
    $("drMessage").textContent = draft.body.length ? "ต้องมีลำตัวกว้างอย่างน้อยนิดหนึ่ง และขา 2–6 ขาที่เริ่มจากลำตัวก่อนลงแข่ง" : "วาดลำตัวก่อน แล้วเติมขาอย่างน้อย 2 ขานะ";
    return false;
  }
  $("drSave").addEventListener("click", () => {
    if (!validate()) return;
    storeDraft(); const next=team.findIndex(d => !E.validDrawing(d));
    if(next>=0) openEditor(next); else showLineup();
  });
  $("drEditorBack").addEventListener("click", () => { storeDraft(); showLineup(); });
  function seed() { return window.crypto && crypto.getRandomValues ? crypto.getRandomValues(new Uint32Array(1))[0] : Math.floor(Math.random()*4294967296); }

  function drawAnimal(ctx, drawing, state, x, floor, scale) {
    const b=E.bounds(drawing.body), cx=b.x+b.w/2;
    const p=state ? E.pose(state) : {legs:drawing.legs.map(s=>s.points),ground:E.bounds([...drawing.body,...drawing.legs]).y+E.bounds([...drawing.body,...drawing.legs]).h,lean:0};
    ctx.save(); ctx.translate(x,floor); ctx.scale(scale,scale);
    ctx.rotate(p.lean); ctx.translate(-cx,-p.ground);
    drawing.legs.forEach((s,i)=>drawStroke(ctx,s,p.legs[i]));
    drawing.body.forEach(s=>drawStroke(ctx,s)); ctx.restore();
  }
  $("drPreviewBtn").addEventListener("click", () => {
    if (!validate()) return;
    stopPreview(); $("drPreview").hidden=false;
    const r=E.makeRacer(draft,seed(),0); let prev=0;
    function frame(t) {
      const dt=prev ? Math.min(.05,(t-prev)/1000) : 0; prev=t; E.step(r,dt,100000);
      pc.clearRect(0,0,600,260); pc.strokeStyle="#a4b08d"; pc.lineWidth=2; pc.beginPath();pc.moveTo(20,222);pc.lineTo(580,222);pc.stroke();
      drawAnimal(pc,draft,r,300,218,.58); previewFrame=requestAnimationFrame(frame);
    }
    previewFrame=requestAnimationFrame(frame);
  });
  function showLineup() {
    $("drLineupDistance").textContent=distance+" ม."; $("drRoster").replaceChildren();
    team.forEach((d,i) => {
      const card=document.createElement("div");card.className="dr-racer-card";
      const canvas=document.createElement("canvas"); setupCanvas(canvas,300,190);
      if(d && d.body.length) drawAnimal(canvas.getContext("2d"),d,null,150,175,.44);
      canvas.setAttribute("aria-label",d ? "ภาพของ "+d.name : "ยังไม่มีนักแข่ง");
      const h=document.createElement("h3"); h.textContent=(i+1)+" · "+(d ? d.name : "รอคนที่ "+(i+1)+" วาด");
      const p=document.createElement("p");p.textContent=E.validDrawing(d) ? d.legs.length+" ขา · พร้อมซิ่ง" : "ยังวาดไม่ครบ";
      const btn=document.createElement("button");btn.className="dr-secondary";btn.type="button";btn.textContent=d ? "แก้ไขภาพ" : "วาดนักแข่ง";btn.setAttribute("aria-label",(d ? "แก้ไข" : "วาด")+"นักแข่งคนที่ "+(i+1));btn.addEventListener("click",()=>openEditor(i));
      card.append(canvas,h,p,btn);$("drRoster").appendChild(card);
    });
    $("drStart").disabled = !team.every(E.validDrawing);
    show("drLineup");
  }
  $("drSettings").addEventListener("click",()=>{ $("drBegin").textContent="ใช้การตั้งค่านี้ →"; show("drSetup"); });

  function fitTrack() {
    if($("drRace").hidden) return;
    raceWidth=$("drTrack").parentElement.clientWidth;
    raceHeight=55+count*(raceWidth<600 ? 108 : 132);
    setupCanvas($("drTrack"),raceWidth,raceHeight);
    $("drTrack").style.height=raceHeight+"px";
    paintRace();
  }
  window.addEventListener("resize",fitTrack);
  function paintRace() {
    const w=raceWidth, h=raceHeight, lane=(h-55)/count, small=w<600, start=small?48:100, end=w-(small?48:100), scale=small?.13:.23;
    rc.clearRect(0,0,w,h);rc.fillStyle="#e2e9cd";rc.fillRect(0,0,w,55);
    rc.font="12px sans-serif";rc.fillStyle="#415438";rc.textAlign="center";
    [0,.25,.5,.75,1].forEach(f=>rc.fillText(Math.round(f*distance)+" ม.",start+(end-start)*f,29));
    racers.forEach((r,i)=>{
      const top=55+i*lane, ground=top+lane-16;
      rc.fillStyle=i%2 ? "#f2edda" : "#fbf8ec"; rc.fillRect(0,top,w,lane);
      rc.strokeStyle="#d0d3bd";rc.lineWidth=1;rc.beginPath();rc.moveTo(0,ground+1);rc.lineTo(w,ground+1);rc.stroke();
      rc.setLineDash([3,6]);rc.beginPath();rc.moveTo(start,top);rc.lineTo(start,top+lane);rc.stroke();rc.setLineDash([]);
      for(let y=top;y<top+lane;y+=8)for(let col=0;col<2;col++){rc.fillStyle=(Math.floor((y-top)/8)+col)%2?"#fffef4":"#8b957b";rc.fillRect(end+col*7,y,7,8);}
      rc.fillStyle=colors[i];rc.font="bold 13px sans-serif";rc.textAlign="left";rc.fillText(String(i+1).padStart(2,"0")+" · "+r.drawing.name,12,top+21,small?140:220);
      const x=start+(end-start)*r.distance/distance;
      drawAnimal(rc,r.drawing,r,x,ground-3,scale);
      rc.fillStyle=colors[i];rc.beginPath();rc.moveTo(x,ground+3);rc.lineTo(x-4,ground+9);rc.lineTo(x+4,ground+9);rc.closePath();rc.fill();
      if(r.eventUntil>r.time && r.finish===null && countdown<=0){rc.font="11px sans-serif";rc.textAlign="right";rc.fillStyle="#aa452a";rc.fillText(r.event,w-12,top+22);}
      if(r.finish!==null){rc.font="bold 12px sans-serif";rc.textAlign="right";rc.fillStyle="#243d32";rc.fillText(r.finish.toFixed(2)+" วิ",w-8,top+20);}
    });
  }
  function buildLiveRanks() {
    $("drLiveRanks").replaceChildren();
    racers.forEach(r=>{
      const row=document.createElement("div");row.className="dr-live-row";row.dataset.id=r.id;
      const number=document.createElement("b"), name=document.createElement("span"), meter=document.createElement("span"), bar=document.createElement("progress");
      name.className="dr-live-name";name.textContent=r.drawing.name;bar.className="dr-live-progress";bar.max=distance;bar.value=0;bar.setAttribute("aria-label","ระยะทางของ "+r.drawing.name);
      row.append(number,name,meter,bar);$("drLiveRanks").appendChild(row);
    });
  }
  function updateRanks() {
    const ranked=E.rank(racers);
    ranked.forEach((r,i)=>{
      const row=$("drLiveRanks").querySelector('[data-id="'+r.id+'"]');row.style.order=i;
      row.children[0].textContent=i+1;row.children[2].textContent=r.finish!==null ? "🏁 "+r.finish.toFixed(2)+" วิ" : Math.floor(r.distance)+" ม.";row.children[3].value=r.distance;
    });
    const leader=ranked[0];
    $("drRaceCommentary").textContent=leader.finish!==null ? leader.drawing.name+" เข้าเส้นชัยแล้ว! เชียร์ตัวที่เหลือกันต่อ" : "นำอยู่: "+leader.drawing.name+" · "+Math.floor(leader.distance)+" / "+distance+" เมตร";
  }
  function startRace() {
    if (!team.every(E.validDrawing)) { showLineup(); return; }
    stopRace(); racers=team.map((d,i)=>E.makeRacer(clone(d),seed(),i));
    elapsed=0;countdown=3;accumulator=0;lastFrame=0;paused=false;finished=false;lastRankPaint=-1;
    $("drRaceTitle").textContent="วิ่ง "+distance+" เมตร";$("drResults").hidden=true;$("drPause").hidden=false;$("drPause").textContent="พักการแข่งขัน";
    $("drCountdown").textContent="3";$("drClock").textContent="0.00 วิ";$("drRaceCommentary").textContent="ขาทุกคู่กำลังตั้งหลัก…";
    show("drRace");buildLiveRanks();fitTrack();raceFrame=requestAnimationFrame(raceLoop);
  }
  function raceLoop(now) {
    let dt=lastFrame?Math.min(.1,(now-lastFrame)/1000):0;lastFrame=now;
    if(!paused && !finished){
      if(countdown>0){countdown-=dt;$("drCountdown").textContent=countdown>0?Math.ceil(countdown):"ไป!";dt=0;}
      else{
        $("drCountdown").textContent="";accumulator+=dt;
        while(accumulator>=STEP){racers.forEach(r=>E.step(r,STEP,distance));elapsed+=STEP;accumulator-=STEP;}
        $("drClock").textContent=elapsed.toFixed(2)+" วิ";
        if(elapsed-lastRankPaint>.25){updateRanks();lastRankPaint=elapsed;}
        if(racers.every(r=>r.finish!==null)) finishRace();
      }
    }
    paintRace();if(!finished)raceFrame=requestAnimationFrame(raceLoop);
  }
  function setPaused(value) {
    if(finished)return;paused=value;$("drPause").textContent=paused?"แข่งต่อ ▶":"พักการแข่งขัน";$("drCountdown").textContent=paused?"พัก":countdown>0?Math.ceil(countdown):"";lastFrame=0;
  }
  $("drPause").addEventListener("click",()=>setPaused(!paused));
  document.addEventListener("visibilitychange",()=>{if(document.hidden && !$("drRace").hidden && !finished)setPaused(true);if(document.hidden)stopPreview();});
  function finishRace() {
    finished=true;$("drPause").hidden=true;$("drCountdown").textContent="";updateRanks();
    const ranked=E.rank(racers);$("drWinner").textContent="🏆 "+ranked[0].drawing.name+" ชนะ!";$("drPodium").replaceChildren();
    ranked.forEach((r,i)=>{const li=document.createElement("li"),n=document.createElement("span"),name=document.createElement("b"),time=document.createElement("span");n.textContent=i+1;name.textContent=r.drawing.name;time.textContent=r.finish.toFixed(2)+" วิ";li.append(n,name,time);$("drPodium").appendChild(li);});
    $("drResults").hidden=false;$("drRaceCommentary").textContent="ครบทุกตัวแล้ว! ภาพเดิมแข่งซ้ำได้ จังหวะใหม่อาจพาแชมป์คนใหม่มา";
    if(typeof pgTimeUp==="function")pgTimeUp();
  }
  $("drStart").addEventListener("click",startRace);$("drRematch").addEventListener("click",startRace);
  $("drRaceBack").addEventListener("click",showLineup);$("drEditTeam").addEventListener("click",showLineup);
  window.addEventListener("pagehide",()=>{stopPreview();stopRace();});
  window.addEventListener("pageshow",event=>{if(event.persisted && !$("drRace").hidden && !finished){setPaused(true);raceFrame=requestAnimationFrame(raceLoop);}});
});
