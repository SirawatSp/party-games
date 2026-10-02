// วาดแขนขาจากข้อต่อเดิม ตามจังหวะที่ฟิสิกส์ใช้ถีบ ดัน ย่อ และรักษาสมดุล
(function(root){
  "use strict";
  const colors=["#243d32","#df5936","#366cba","#965db0","#c78c22","#25977b"];
  function stroke(c,s,points=s.points){c.strokeStyle=s.color;c.lineWidth=s.width;c.lineCap="round";c.lineJoin="round";c.beginPath();points.forEach((p,i)=>i?c.lineTo(...p):c.moveTo(...p));c.stroke();}
  function animal(c,r,x,y,scale,angle,mode){const p=DoodleOlympics.pose(r,mode);c.save();c.translate(x,y);c.rotate(angle);c.scale(scale,scale);c.translate(-r.g.cx,-r.g.cy);r.drawing.legs.forEach((s,i)=>stroke(c,s,p.limbs[i]));r.drawing.body.forEach(s=>stroke(c,s));c.restore();}
  function text(c,t,x,y,color="#243d32",size=13,align="left"){c.font="bold "+size+"px sans-serif";c.fillStyle=color;c.textAlign=align;c.fillText(t,x,y);}
  function paint(c,s,w,h){
    c.clearRect(0,0,w,h);c.fillStyle="#fbf8ed";c.fillRect(0,0,w,h);
    if(s.mode==="sumo"){
      const scale=Math.min(w/620,(h-65)/540);c.save();c.translate(w/2,h/2+18);c.scale(scale,scale);
      c.fillStyle="#dce8c2";c.strokeStyle="#a4b08d";c.lineWidth=5;c.beginPath();c.arc(0,0,s.arena,0,Math.PI*2);c.fill();c.stroke();
      c.setLineDash([4,8]);c.lineWidth=1;c.beginPath();c.arc(0,0,s.arena*.82,0,Math.PI*2);c.stroke();c.setLineDash([]);
      s.racers.forEach((r,i)=>{c.globalAlpha=r.out?.22:1;animal(c,r,r.x,r.y,.25,r.angle,s.mode);if(r.hit>0&&!r.out){c.strokeStyle="#df5936";c.lineWidth=3;c.beginPath();c.arc(r.x,r.y,r.g.radius+6+(1-r.hit)*12,0,Math.PI*2);c.stroke();}text(c,(i+1)+" · "+r.drawing.name,r.x,r.y-r.g.radius-12,colors[i],12,"center");if(r.eventUntil>s.elapsed)text(c,r.event,r.x,r.y+r.g.radius+16,"#b44424",11,"center");});c.restore();
      text(c,"ยันขาแล้วดัน · ชนตามรูปจริง · ฐานแคบเสียหลักง่าย",w/2,28,"#243d32",13,"center");return;
    }
    if(s.mode==="climb"){
      const col=w/s.racers.length,top=80,bottom=h-45,span=bottom-top;
      s.racers.forEach((r,i)=>{const mid=col*(i+.5),scale=Math.min(.45,(col-18)/Math.max(360,r.g.w,r.g.h),span/(1080+r.g.radius*8)),origin=bottom-r.g.radius*4*scale;
        c.save();c.beginPath();c.rect(i*col,40,col,h-40);c.clip();c.fillStyle=i%2?"#e6d7bb":"#f0e4cd";c.fillRect(i*col,40,col,h-40);
        for(let n=0;n<=22;n++){
          const y=origin-n*55*scale;if(y<top-20)continue;

          for(let x=-135;x<=135;x+=45){c.fillStyle="#b4a07a";c.beginPath();c.ellipse(mid+x*scale,y,Math.max(2,9*scale),Math.max(2,6*scale),0,0,Math.PI*2);c.fill();}
        }
        [0,3,6,9,12].forEach(m=>text(c,m+' ม.',i*col+3,origin-m*90*scale-5,"#8c784d",9));
        r.legs.forEach(l=>{if(l.planted&&Number.isFinite(l.holdX)){c.fillStyle=colors[i];c.beginPath();c.arc(mid+l.holdX*scale,origin-l.holdY*scale,Math.max(3,12*scale),0,Math.PI*2);c.fill();}});
        animal(c,r,mid,origin-r.x*90*scale,scale,r.angle,s.mode);
        c.fillStyle="#df5936";c.fillRect(i*col+5,origin-1080*scale,col-10,3);
        text(c,r.drawing.name.slice(0,Math.max(4,Math.floor(col/9))),mid,55,colors[i],11,"center");
        text(c,r.stopped?r.distance.toFixed(1)+' ม. · ตัดจบ':r.finish!==null?r.finish.toFixed(1)+' วิ':r.x.toFixed(1)+' ม.',mid,69,colors[i],10,"center");
        c.fillStyle="#c9c2a4";c.fillRect(i*col+8,h-22,col-16,6);c.fillStyle=r.resting?"#c78c22":colors[i];c.fillRect(i*col+8,h-22,(col-16)*r.energy,6);
        text(c,r.resting?'พักเติมแรง':r.eventUntil>s.elapsed?r.event:'แรง '+Math.round(r.energy*100)+'%',mid,h-29,colors[i],9,"center");c.restore();
      });text(c,"ปีน 12 ม. · ระยะเอื้อม แรงจับ น้ำหนัก และการพัก",w/2,25,"#243d32",12,"center");return;
    }
    const lane=(h-40)/s.racers.length,small=w<600,left=small?42:80,right=w-(small?30:70),scale=small?.13:.21;
    s.racers.forEach((r,i)=>{
      const top=40+i*lane,ground=top+lane-20;c.save();c.beginPath();c.rect(0,top,w,lane);c.clip();c.fillStyle=i%2?"#f2edda":"#fbf8ed";c.fillRect(0,top,w,lane);
      text(c,(i+1)+" · "+r.drawing.name,12,top+20,colors[i],12);
      if(s.mode==="roll"){
        c.strokeStyle="#b7c8a3";c.lineWidth=8;c.beginPath();c.moveTo(left,ground-38);c.lineTo(right,ground);c.stroke();
        [250,530,780].forEach(n=>{const x=left+(right-left)*n/1000,y=ground-38*(1-n/1000);c.fillStyle="#c1ceab";c.beginPath();c.moveTo(x-9,y);c.lineTo(x,y-14);c.lineTo(x+9,y);c.fill();});
        const x=left+(right-left)*r.x/1000;
        const support=DoodleOlympics.support(r,r.angle,s.mode)*scale/.25;
        animal(c,r,x,ground-38*(1-r.x/1000)-support+r.y*.45,scale,r.angle,s.mode);text(c,r.stopped?Math.floor(r.x/10)+"% · ตัดจบ":r.finish===null?Math.floor(r.x/10)+"%":r.finish.toFixed(2)+" วิ",w-12,top+20,colors[i],12,"right");
        c.fillStyle="#df5936";c.fillRect(right,ground-35,3,35);
      }else if(s.mode==="swim"){
        const water=top+lane*.64,swimScale=Math.min(scale,(lane-45)/r.g.h);c.fillStyle="#c9e7e9";c.fillRect(0,top+30,w,lane-30);
        c.strokeStyle="#80bfc6";c.lineWidth=2;for(let line=0;line<3;line++){c.beginPath();for(let x=left;x<=right;x+=8){const y=water+line*9+Math.sin(x*.06+s.elapsed*2)*3;x===left?c.moveTo(x,y):c.lineTo(x,y);}c.stroke();}
        const x=left+(right-left)*r.x/50;animal(c,r,x,water-5+Math.sin(s.elapsed*3+r.id)*3,swimScale,r.angle,s.mode);
        c.strokeStyle="#ecb85a";c.setLineDash([5,5]);c.beginPath();c.moveTo(left,ground+6);c.lineTo(right,ground+6);c.stroke();c.setLineDash([]);c.fillStyle="#df5936";c.fillRect(right,top+32,3,lane-38);
        text(c,r.stopped?r.x.toFixed(1)+' ม. · ตัดจบ':r.finish!==null?r.finish.toFixed(2)+' วิ':r.x.toFixed(1)+' / 50 ม.',w-12,top+20,colors[i],12,"right");
      }else if(s.mode==="discus"){
        c.fillStyle="#dfe8c5";c.fillRect(left,ground,right-left,20);[0,40,80,120,160].forEach(n=>text(c,n+' ม.',left+(right-left)*n/160,ground+16,"#8c784d",9,"center"));
        const support=DoodleOlympics.support(r,r.angle,s.mode)*scale/.25;animal(c,r,left,ground-support,scale,r.angle,s.mode);
        let x,y;
        if(r.launched){x=left+(right-left)*r.discX/160;y=ground+r.discY*Math.min(2.2,(lane-65)/80);c.strokeStyle=colors[i];c.setLineDash([3,4]);c.beginPath();c.moveTo(x,ground);c.lineTo(x,y);c.stroke();c.setLineDash([]);}
        else{const p=DoodleOlympics.pose(r,s.mode),tip=p.limbs[r.g.throwLimb]?.at(-1)||[r.g.cx+35,r.g.cy],dx=(tip[0]-r.g.cx)*scale,dy=(tip[1]-r.g.cy)*scale;x=left+dx*Math.cos(r.angle)-dy*Math.sin(r.angle);y=ground-support+dx*Math.sin(r.angle)+dy*Math.cos(r.angle);}
        c.fillStyle="#df5936";c.beginPath();c.ellipse(x,y,7,3,s.elapsed*4,0,Math.PI*2);c.fill();
        text(c,r.launched||r.stopped?r.discX.toFixed(2)+' ม.'+(r.stopped?' · ตัดจบ':''): 'หมุนสะสมแรง…',w-12,top+20,colors[i],12,"right");
      }else if(s.mode==="jump"){
        c.fillStyle="#ead8a9";c.fillRect(left,ground,right-left,20);c.strokeStyle="#b59d69";c.lineWidth=1;
        [0,60,120,180,240,300].forEach(n=>{const x=left+(right-left)*n/300;c.beginPath();c.moveTo(x,ground);c.lineTo(x,ground+8);c.stroke();text(c,n,x,ground+17,"#8c784d",9,"center");});
        const x=left+(right-left)*r.x/300;
        const support=DoodleOlympics.support(r,r.angle,s.mode)*scale/.25;
        animal(c,r,x,ground-support+r.y*1.3,scale,r.angle,s.mode);
        if(r.finish!==null){c.strokeStyle=colors[i];c.setLineDash([3,3]);c.beginPath();c.moveTo(x,top+34);c.lineTo(x,ground);c.stroke();c.setLineDash([]);}
        text(c,r.finish!==null?r.distance.toFixed(2)+" ม.":r.launched?"กำลังลอย…":"เตรียมปล่อยตัว",w-12,top+20,colors[i],12,"right");
      }else{
        const mid=w/2,factor=scale/.25;c.save();c.translate(mid,ground);c.rotate(s.tilt);c.fillStyle="#a4b68b";c.fillRect(-95*factor,-4,190*factor,8);
        c.strokeStyle=colors[i];c.lineWidth=3;c.beginPath();c.moveTo((r.x-r.g.halfBase)*factor,-5);c.lineTo((r.x+r.g.halfBase)*factor,-5);c.stroke();c.restore();
        c.fillStyle="#d1c49e";c.beginPath();c.moveTo(mid,ground+3);c.lineTo(mid-20,ground+19);c.lineTo(mid+20,ground+19);c.fill();
        const fall=r.out?Math.min(180,(s.elapsed-r.finish)*160):0;c.globalAlpha=r.out?.35:1;
        const pivotX=mid+r.x*factor*Math.cos(s.tilt),pivotY=ground+r.x*factor*Math.sin(s.tilt),dx=(r.g.cx-r.g.footMid)*scale,dy=(r.g.cy-r.g.bottom)*scale;
        const x=pivotX+dx*Math.cos(r.angle)-dy*Math.sin(r.angle),y=pivotY+dx*Math.sin(r.angle)+dy*Math.cos(r.angle)+fall;
        animal(c,r,x,y,scale,r.angle,s.mode);c.globalAlpha=1;
        if(!r.out){
          const projected=(r.g.cx-r.g.footMid)*.25*Math.cos(r.angle-s.tilt)+Math.sin(r.angle-s.tilt)*r.g.comHeight;
          const px=pivotX+projected*factor*Math.cos(s.tilt),py=pivotY+projected*factor*Math.sin(s.tilt);
          c.strokeStyle="#c78c22";c.lineWidth=1;c.setLineDash([3,3]);c.beginPath();c.moveTo(x,y);c.lineTo(px,py);c.stroke();c.setLineDash([]);
          c.fillStyle="#c78c22";c.beginPath();c.arc(x,y,3,0,Math.PI*2);c.fill();
        }
        text(c,r.out?"ตกเมื่อ "+r.finish.toFixed(2)+" วิ":"ยังทรงตัวอยู่",w-12,top+20,colors[i],12,"right");
      }if(r.eventUntil>s.elapsed)text(c,r.event,left,top+38,"#b44424",11);c.restore();
    });
    const title={roll:"ความกลมช่วยรักษาความเร็ว · ส่วนยื่นและเหลี่ยมเสียพลัง",jump:"ย่อขาเก็บแรง · ขางอและน้ำหนักมีผลต่อระยะ",balance:"แท่นโยก · จุดเหลืองคือศูนย์มวล · เส้นสีคือฐานเท้า",swim:"ว่าย 50 ม. · จังหวะพายสร้างแรง ตัวเพรียวลดแรงต้าน",discus:"หมุนสะสมแรง → ปล่อยจักร · แขนและฐานเท้ามีผล"};text(c,title[s.mode],w/2,25,"#243d32",12,"center");
  }
  root.DoodleOlympicsRender={paint};
})(typeof window!=="undefined"?window:this);
