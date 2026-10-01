document.addEventListener("DOMContentLoaded", () => {
  "use strict";
  const E = DoodleRace, O = DoodleOlympics, $ = id => document.getElementById(id);
  const colors = ["#243d32", "#df5936", "#366cba", "#965db0", "#c78c22", "#25977b"];
  const colorNames = ["เขียวเข้ม", "ส้ม", "น้ำเงิน", "ม่วง", "เหลืองเข้ม", "เขียวมิ้นต์"];
  const KEY = "pg_doodle_race_v1", panels = ["drSetup", "drEditor", "drLineup", "drRace", "drLobby"];
  const empty = i => ({name:"นักแข่ง " + (i + 1), body:[], legs:[]});
  const clone = obj => JSON.parse(JSON.stringify(obj));
  let team = [], count = 4, distance = 100, editorIndex = 0, draft, tool = "body", color = colors[0];
  let stroke = null, pointer = null, saved = null, previewFrame = 0, raceFrame = 0;
  let racers = [], elapsed = 0, countdown = 3, lastFrame = 0, accumulator = 0, paused = false, finished = false, lastRankPaint = -1;
  let raceWidth = 1000, raceHeight = 520, online = false, onlineRound = 0, onlineSeq = -1;
  let selected = Object.keys(O.sports), tournament = null, session = null, onlineHost = false;
  const STEP = 1 / 60;
  const valid = d => O.validAthlete(d,selected);
  function selectedSports(id) { return O.events([...$(id).querySelectorAll("input:checked")].map(x=>x.value)); }
  function fillSports(id, list, disabled=false) {
    $(id).replaceChildren();
    Object.entries(O.sports).forEach(([key,sport])=>{
      const label=document.createElement("label"),input=document.createElement("input"),body=document.createElement("span"),name=document.createElement("strong"),rule=document.createElement("small");
      label.className="dr-sport-option";input.type="checkbox";input.value=key;input.checked=list.includes(key);input.disabled=disabled;input.setAttribute("aria-label",sport.name);
      name.textContent=sport.icon+" "+sport.name;rule.textContent=sport.rule;body.append(name,rule);label.append(input,body);$(id).appendChild(label);
    });
  }
  function schedule(list) { return list.map((k,i)=>(i+1)+". "+O.sports[k].name).join(" → "); }
  function readSettings() { selected=selectedSports("drSports");distance=Number($("drDistance").value);$("drSchedule").textContent=selected.length?schedule(selected):"เลือกกีฬาอย่างน้อย 1 รายการก่อนเริ่ม";$("drBegin").disabled=!selected.length;$("drHostRoom").disabled=!selected.length;$("drDistance").disabled=!selected.includes("run"); }
  fillSports("drSports",selected);readSettings();
  $("drPreviewSport").replaceChildren(...Object.entries(O.sports).map(([key,sport])=>{const option=document.createElement("option");option.value=key;option.textContent=sport.name;return option;}));
  $("drSports").addEventListener("change",readSettings);

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
    if (online) return;
    try { localStorage.setItem(KEY, JSON.stringify({v:1, count, distance, team, events:selected})); }
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
    selected=O.events(saved.events);if(!selected.length)selected=["run"];fillSports("drSports",selected);$("drDistance").value=distance;readSettings();
    $("drCount").value = count; $("drDistance").value = distance;
    showLineup();
  });
  $("drBegin").addEventListener("click", () => {
    readSettings();if(!selected.length)return;count = Number($("drCount").value); distance = Number($("drDistance").value);tournament=null;
    team = Array.from({length:count}, (_, i) => team[i] || null);
    persist();
    const next = team.findIndex(d => !valid(d));
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
    $("drDrawHint").textContent = tool === "body" ? "วาดลำตัว หัว และหาง หันหน้าไปทางขวา → ขนาด ความกลม และความสูงมีผลต่อแต่ละกีฬา" : "ลากจากลำตัว: ลงล่างเป็นขาถีบพื้น ด้านข้าง/บนเป็นแขน · รวมได้ 6 เส้น ถ้าเลือกวิ่งควรมีขาลงพื้นอย่างน้อย 2 ขา";
    $("drMessage").textContent = ""; paintEditor();
  }
  $("drBodyTool").addEventListener("click", () => setTool("body"));
  $("drLegTool").addEventListener("click", () => setTool("legs"));
  function openEditor(i) {
    editorIndex = i; draft = clone(team[i] || empty(i));
    $("drTurn").textContent = online ? "ภาพของคุณเป็นความลับจนปล่อยตัว" : "ส่งเครื่องให้คนที่ " + (i + 1) + " / " + count;
    $("drPlayerNumber").textContent = String(i + 1).padStart(2,"0");
    $("drName").value = draft.name;
    $("drSave").textContent = team.some((d,j) => j !== i && !valid(d)) ? "บันทึกแล้วส่งต่อ →" : "บันทึกเข้าทีม →";
    if (online) $("drSave").textContent = "ส่งภาพและพร้อมแข่ง";
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
    $("drPreviewBtn").disabled = !valid(draft);
    if(!stroke){$("drShapeProfile").replaceChildren();if(E.validDrawing(draft,true))Object.entries(O.traits(draft)).forEach(([k,v])=>{const li=document.createElement("li"),b=document.createElement("b");b.textContent=O.sports[k].name+": ";li.append(b,document.createTextNode(v));$("drShapeProfile").appendChild(li);});}
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
      if (!hit.point || hit.distance>42) { $("drMessage").textContent="เริ่มลากแขนหรือขาจากเส้นลำตัวก่อนนะ จุดแรกจะเป็นข้อที่ขยับ"; return; }
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
    if (valid(draft)) return true;
    $("drMessage").textContent = draft.body.length ? (selected.includes("run") ? "ชุดนี้มีวิ่งแข่ง ต้องมีลำตัวและขา 2–6 ขาที่เริ่มจากลำตัว" : "วาดลำตัวให้กว้างอย่างน้อย 20 และสูง 10 หน่วย ขาที่เติมต้องต่อกับลำตัว") : "วาดลำตัวก่อนนะ ใช้ตัวเดียวแข่งทุกรายการ";
    return false;
  }
  $("drSave").addEventListener("click", () => {
    if (!validate()) return;
    storeDraft();
    if (online) { window.DoodleRaceOnline.submit(clone(draft)); return; }
    const next=team.findIndex(d => !valid(d));
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
  function previewSport() {
    if (!validate()) return;
    stopPreview(); $("drPreview").hidden=false;
    const mode=$("drPreviewSport").value;
    if(mode==="run"&&!E.validDrawing(draft)){ $("drPreviewSport").value=selected.find(k=>k!=="run")||"sumo";return previewSport(); }
    const rival=clone(draft);rival.name="คู่ซ้อม";[...rival.body,...rival.legs].forEach(s=>{s.color="#965db0";});
    const practice=O.makeSession(mode,mode==="sumo"?[clone(draft),rival]:[clone(draft)],mode==="sumo"?[seed(),seed()]:[seed()],100);let prev=0,carry=0;
    const height=mode==="run"?260:mode==="sumo"?420:mode==="climb"?450:320;setupCanvas($("drPreviewCanvas"),600,height);
    function frame(t) {
      carry+=prev?Math.min(1,(t-prev)/1000):0;prev=t;while(carry>=STEP&&!practice.done){O.step(practice,STEP);carry-=STEP;}
      if(mode==="run"){pc.clearRect(0,0,600,260);pc.strokeStyle="#a4b08d";pc.lineWidth=2;pc.beginPath();pc.moveTo(20,222);pc.lineTo(580,222);pc.stroke();drawAnimal(pc,draft,practice.racers[0],300,218,.58);}
      else DoodleOlympicsRender.paint(pc,practice,600,height);
      if(!practice.done)previewFrame=requestAnimationFrame(frame);
    }
    previewFrame=requestAnimationFrame(frame);
  }
  $("drPreviewBtn").addEventListener("click",()=>{$("drPreviewSport").value=selected[0]||"sumo";previewSport();});
  $("drPreviewSport").addEventListener("change",previewSport);
  function showLineup() {
    if (online) { window.DoodleRaceOnline.showLobby(); return; }
    $("drLineupDistance").textContent=selected.length+" กีฬา";$("drLineupSchedule").textContent=schedule(selected); $("drRoster").replaceChildren();
    team.forEach((d,i) => {
      const card=document.createElement("div");card.className="dr-racer-card";
      const canvas=document.createElement("div");canvas.className="dr-mystery";canvas.textContent="?";canvas.setAttribute("aria-label","ซ่อนภาพจนเริ่มแข่ง");
      const h=document.createElement("h3"); h.textContent=(i+1)+" · "+(d ? d.name : "รอคนที่ "+(i+1)+" วาด");
      const p=document.createElement("p");p.textContent=valid(d) ? "พร้อมแข่ง "+selected.length+" กีฬา · ภาพยังเป็นความลับ" : "ยังวาดไม่ครบ";
      const btn=document.createElement("button");btn.className="dr-secondary";btn.type="button";btn.textContent=d ? "แก้ไขภาพ" : "วาดนักแข่ง";btn.setAttribute("aria-label",(d ? "แก้ไข" : "วาด")+"นักแข่งคนที่ "+(i+1));btn.addEventListener("click",()=>openEditor(i));
      card.append(canvas,h,p,btn);$("drRoster").appendChild(card);
    });
    $("drStart").disabled = !team.every(valid);
    show("drLineup");
  }
  $("drSettings").addEventListener("click",()=>{ $("drBegin").textContent="ใช้การตั้งค่านี้ →"; show("drSetup"); });

  function fitTrack() {
    if($("drRace").hidden) return;
    raceWidth=$("drTrack").parentElement.clientWidth;
    raceHeight=session&&session.mode==="sumo"?Math.max(380,Math.min(600,raceWidth*.7)):session&&session.mode==="climb"?Math.max(460,Math.min(620,raceWidth*.65)):session&&["jump","discus"].includes(session.mode)?55+count*(raceWidth<600?210:240):55+count*(raceWidth<600 ? 120 : 145);
    setupCanvas($("drTrack"),raceWidth,raceHeight);
    $("drTrack").style.height=raceHeight+"px";
    paintRace();
  }
  window.addEventListener("resize",fitTrack);
  function paintRace() {
    if(!session)return;
    if(!online&&countdown>0){rc.clearRect(0,0,raceWidth,raceHeight);rc.fillStyle="#edf0df";rc.fillRect(0,0,raceWidth,raceHeight);return;}
    if(session.mode!=="run"){DoodleOlympicsRender.paint(rc,session,raceWidth,raceHeight);return;}
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
      if(r.finish!==null){rc.font="bold 12px sans-serif";rc.textAlign="right";rc.fillStyle="#243d32";rc.fillText(r.stopped?r.distance.toFixed(1)+" ม. · ตัดจบ":r.finish.toFixed(2)+" วิ",w-8,top+20);}
    });
  }
  function buildLiveRanks() {
    $("drLiveRanks").replaceChildren();
    racers.forEach(r=>{
      const row=document.createElement("div");row.className="dr-live-row";row.dataset.id=r.id;
      const number=document.createElement("b"), name=document.createElement("span"), meter=document.createElement("span"), bar=document.createElement("progress");
      name.className="dr-live-name";name.textContent=r.drawing.name;bar.className="dr-live-progress";bar.max=O.sports[session.mode].finishDistance||(session.mode==="run"?distance:session.mode==="roll"?1000:session.mode==="discus"?160:60);bar.value=0;bar.setAttribute("aria-label","ระยะทางของ "+r.drawing.name);
      const trait=document.createElement("small");trait.textContent=O.traits(r.drawing)[session.mode];name.appendChild(trait);if(session.mode==="jump")bar.max=300;
      row.append(number,name,meter,bar);$("drLiveRanks").appendChild(row);
    });
  }
  function metric(r) {
    if(r.stopped&&O.timed(session.mode))return (session.mode==="roll"?Math.floor(r.distance/10)+"%":r.distance.toFixed(1)+" ม.")+" · ตัดจบ";
    if(O.timed(session.mode))return r.finish!==null?r.finish.toFixed(2)+" วิ":session.mode==="roll"?Math.floor(r.x/10)+"%":r.distance.toFixed(1)+" ม."+(session.mode==="climb"?' · แรง '+Math.round(r.energy*100)+'%':'');
    if(session.mode==="jump")return (r.finish!==null?r.distance:r.x).toFixed(2)+" ม.";
    if(session.mode==="discus")return r.launched?r.discX.toFixed(2)+" ม.":"หมุนสะสมแรง";
    return r.out?r.finish.toFixed(2)+" วิ · ตกแล้ว":session.done?session.elapsed.toFixed(2)+" วิ":"ยังอยู่ · "+session.elapsed.toFixed(1)+" วิ";
  }
  function updateRanks() {
    if(!session)return;const ranked=O.rank(session);
    ranked.forEach((r,i)=>{
      const row=$("drLiveRanks").querySelector('[data-id="'+r.id+'"]');row.style.order=i;
      row.children[0].textContent=i+1;row.children[2].textContent=metric(r);
      row.children[3].value=O.timed(session.mode)||session.mode==="discus"?r.distance:session.mode==="jump"?r.x:r.out?r.finish:session.elapsed;
    });
    $("drRaceCommentary").textContent=O.sports[session.mode].rule;
  }
  function prepareRace() {
    racers=session.racers;elapsed=0;accumulator=0;lastFrame=0;paused=false;finished=false;lastRankPaint=-1;
    $("drRaceTitle").textContent=(tournament.index+1)+" / "+tournament.events.length+" · "+O.sports[session.mode].name+(session.mode==="run"?" "+distance+" เมตร":"");
    $("drStop").hidden=online&&!onlineHost;$("drStopHint").hidden=online&&!onlineHost;$("drStop").disabled=!online&&countdown>0;
    $("drResults").hidden=true;$("drPause").hidden=online;$("drRaceBack").hidden=online;$("drPause").textContent="พักการแข่งขัน";
    $("drCountdown").textContent=online?"ไป!":"3";$("drClock").textContent="0.00 วิ";$("drRaceCommentary").textContent=O.sports[session.mode].rule;
    show("drRace");buildLiveRanks();fitTrack();
  }
  function startRace() {
    if (online) { window.DoodleRaceOnline.start(); return; }
    if (!selected.length||!team.every(valid)) { showLineup(); return; }
    stopRace();tournament=O.create(team,selected,distance,seed());nextRace();
  }
  function nextRace() {
    if(online){window.DoodleRaceOnline.start();return;}
    stopRace();session=O.next(tournament);if(!session)return;countdown=3;prepareRace();raceFrame=requestAnimationFrame(raceLoop);
  }
  function raceLoop(now) {
    // ตามเวลาจริงเมื่อเฟรมเรตต่ำ ส่วนการย้ายไปแท็บอื่นใช้ปุ่มพักอัตโนมัติ
    let dt=lastFrame?Math.min(10,(now-lastFrame)/1000):0;lastFrame=now;
    if(!paused && !finished){
      if(countdown>0){const left=countdown;countdown-=dt;dt=Math.max(0,dt-left);$("drCountdown").textContent=countdown>0?Math.ceil(countdown):"ไป!";}
      if(countdown<=0){
        $("drStop").disabled=false;$("drCountdown").textContent="";accumulator+=dt;
        while(accumulator>=STEP&&!session.done){O.step(session,STEP);elapsed=session.elapsed;accumulator-=STEP;}
        $("drClock").textContent=elapsed.toFixed(2)+" วิ";
        if(elapsed-lastRankPaint>.25){updateRanks();lastRankPaint=elapsed;}
        if(session.done) finishRace();
      }
    }
    paintRace();if(!finished)raceFrame=requestAnimationFrame(raceLoop);
  }
  function setPaused(value) {
    if(finished)return;paused=value;$("drPause").textContent=paused?"แข่งต่อ ▶":"พักการแข่งขัน";$("drCountdown").textContent=paused?"พัก":countdown>0?Math.ceil(countdown):"";lastFrame=0;
  }
  $("drPause").addEventListener("click",()=>setPaused(!paused));
  $("drStop").addEventListener("click",()=>{
    if(!session||finished||countdown>0)return;
    if(online){if(onlineHost)window.DoodleRaceOnline.stop();return;}
    if(O.stop(session)){elapsed=session.elapsed;stopRace();finishRace();paintRace();}
  });
  document.addEventListener("visibilitychange",()=>{if(document.hidden && !online && !$("drRace").hidden && !finished)setPaused(true);if(document.hidden)stopPreview();});
  function scoreTable() {
    const head=document.createElement("tr");["อันดับ","สัตว์",...tournament.results.map(r=>O.sports[r.mode].name),"รวม"].forEach(t=>{const th=document.createElement("th");th.scope="col";th.textContent=t;head.appendChild(th);});$("drScoreHead").replaceChildren(head);$("drScores").replaceChildren();
    O.standings(tournament).forEach(r=>{const tr=document.createElement("tr");const cells=[r.place,r.name,...tournament.results.map(e=>e.rows.find(x=>x.id===r.id).points),r.points];cells.forEach(v=>{const td=document.createElement("td");td.textContent=typeof v==="number"?Number(v.toFixed(2)):v;tr.appendChild(td);});$("drScores").appendChild(tr);});
  }
  function finishRace() {
    finished=true;$("drStop").hidden=true;$("drStopHint").hidden=true;$("drPause").hidden=true;$("drCountdown").textContent="";updateRanks();if(!online)O.record(tournament);
    const result=tournament.results[tournament.index];if(!result)return;
    const final=tournament.index===tournament.events.length-1,winners=result.rows.filter(r=>r.place===1).map(r=>r.name);
    $("drResultLabel").textContent=(session.stopped?"ตัดจบ ":"จบ ")+O.sports[session.mode].name;$("drWinner").textContent="🏅 "+winners.join(" / ")+(winners.length>1?" ชนะร่วมกัน":" ชนะรายการนี้!");$("drPodium").replaceChildren();
    result.rows.forEach(r=>{const li=document.createElement("li"),n=document.createElement("span"),name=document.createElement("b"),value=document.createElement("span");n.textContent=r.place;name.textContent=r.name;const unit=r.stopped&&O.timed(session.mode)&&session.mode!=='roll'?'ม.':O.sports[session.mode].unit;
      const label=r.stopped&&session.mode==='roll'?Math.floor(r.value/10)+'%':(session.mode==='sumo'?session.racers[r.id].finish:r.value).toFixed(2)+' '+unit;
      value.textContent=label+(r.stopped?' · ตัดจบ':'')+' · +'+Number(r.points.toFixed(2))+' คะแนน';li.append(n,name,value);$("drPodium").appendChild(li);});
    const leaders=O.standings(tournament).filter(r=>r.place===1);$("drStandingsTitle").textContent=final?"🏆 แชมป์คะแนนรวม: "+leaders.map(r=>r.name).join(" / "):"คะแนนสะสม · แข่งแล้ว "+tournament.results.length+" / "+tournament.events.length+" รายการ";scoreTable();
    $("drNext").hidden=final||(online&&!onlineHost);$("drNext").textContent=final?"": "ต่อ: "+O.sports[tournament.events[tournament.index+1]].name+" →";
    $("drRematch").hidden=!final||(online&&!onlineHost);$("drEditTeam").hidden=online&&!onlineHost;
    $("drResults").hidden=false;$("drRaceCommentary").textContent=final?"ครบทุกกีฬาแล้ว! เริ่มชุดใหม่ได้ด้วยสัตว์ตัวเดิม":"คะแนนถูกบันทึกแล้ว กดไปรายการถัดไปโดยใช้สัตว์ตัวเดิม";
    if(typeof pgTimeUp==="function")pgTimeUp();
  }
  $("drStart").addEventListener("click",startRace);$("drRematch").addEventListener("click",startRace);$("drNext").addEventListener("click",nextRace);
  function abandon() {if(tournament&&tournament.results.length<tournament.events.length&&!window.confirm("ออกจากชุดการแข่งขันนี้? คะแนนชุดที่ยังไม่จบจะไม่ถูกเก็บ"))return;tournament=null;session=null;showLineup();}
  $("drRaceBack").addEventListener("click",abandon);$("drEditTeam").addEventListener("click",()=>online ? window.DoodleRaceOnline.backToLobby() : abandon());
  // โหมดออนไลน์ใช้ภาพของตัวเองในหน้าแก้ไข และรับภาพเพื่อนเฉพาะเมื่อโฮสต์ปล่อยตัว
  window.DoodleRaceUI = {
    show,
    enterOnline(name) { online=true; team=[empty(0)];team[0].name=name;count=1; },
    leaveOnline() { online=false;onlineHost=false;tournament=null;session=null;readSettings();team=[];count=Number($("drCount").value);stopRace();$("drRaceBack").hidden=false;$("drRematch").hidden=false;$("drEditTeam").hidden=false;$("drEditTeam").textContent="แก้ไขทีม";show("drSetup"); },
    editOnline() { openEditor(0); },
    settings(list, meters) { selected=O.events(list);distance=meters;if(!$("drEditor").hidden)setTool(tool); },
    selection() { return {events:selectedSports("drSports"),distance:Number($("drDistance").value)}; },
    race(data) {
      if (!online || data.protocol!==O.protocol || !O.sports[data.mode] || data.events[data.index]!==data.mode || data.round<=onlineRound) return;
      onlineRound=data.round;onlineSeq=-1;distance=data.distance;count=data.team.length;selected=O.events(data.events);
      tournament={team:data.team,events:selected,index:data.index,totals:data.totals,results:data.results};
      session=O.makeSession(data.mode,data.team,data.team.map(()=>0),distance);countdown=0;prepareRace();
    },
    frame(data) {
      if (!online || !session || data.protocol!==O.protocol || data.mode!==session.mode || data.round!==onlineRound || data.seq<=onlineSeq || data.racers.length!==racers.length) return;
      onlineSeq=data.seq;O.apply(session,data);elapsed=data.elapsed;tournament.totals=data.totals;tournament.results=data.results;
      $("drClock").textContent=elapsed.toFixed(2)+" วิ";$("drCountdown").textContent="";
      updateRanks();paintRace();if(data.finished&&!finished)finishRace();
    },
    hostControls(isHost) { onlineHost=isHost;$("drStop").hidden=$("drStopHint").hidden=!isHost||!session||finished;$("drNext").hidden=!isHost||!finished||!tournament||tournament.index+1>=tournament.events.length;$("drRematch").hidden=!isHost||!finished||!tournament||tournament.index+1<tournament.events.length;$("drEditTeam").hidden=!isHost;$("drEditTeam").textContent="กลับห้องรอ"; },
    resetRound() { onlineRound=0;onlineSeq=-1; }
  };
  window.addEventListener("pagehide",()=>{stopPreview();stopRace();});
  window.addEventListener("pageshow",event=>{if(event.persisted && !online && !$("drRace").hidden && !finished){setPaused(true);raceFrame=requestAnimationFrame(raceLoop);}});
});
