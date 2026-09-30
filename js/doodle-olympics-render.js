// วาดสนามเฉพาะกีฬา โดยใช้เส้นสัตว์เดิมทั้งตัวและไม่ขยับขาในกีฬาที่ไม่ใช่วิ่ง
(function(root){
  "use strict";
  const colors=["#243d32","#df5936","#366cba","#965db0","#c78c22","#25977b"];
  function stroke(c,s){c.strokeStyle=s.color;c.lineWidth=s.width;c.lineCap="round";c.lineJoin="round";c.beginPath();s.points.forEach((p,i)=>i?c.lineTo(...p):c.moveTo(...p));c.stroke();}
  function animal(c,r,x,y,scale,angle,pivotBottom=false){c.save();c.translate(x,y);c.rotate(angle);c.scale(scale,scale);c.translate(-r.g.cx,-(pivotBottom?r.g.bottom:r.g.cy));[...r.drawing.legs,...r.drawing.body].forEach(s=>stroke(c,s));c.restore();}
  function text(c,t,x,y,color="#243d32",size=13,align="left"){c.font="bold "+size+"px sans-serif";c.fillStyle=color;c.textAlign=align;c.fillText(t,x,y);}
  function paint(c,s,w,h){
    c.clearRect(0,0,w,h);c.fillStyle="#fbf8ed";c.fillRect(0,0,w,h);
    if(s.mode==="sumo"){
      const scale=Math.min(w/620,(h-65)/540);c.save();c.translate(w/2,h/2+18);c.scale(scale,scale);
      c.fillStyle="#dce8c2";c.strokeStyle="#a4b08d";c.lineWidth=5;c.beginPath();c.arc(0,0,s.arena,0,Math.PI*2);c.fill();c.stroke();
      c.setLineDash([4,8]);c.lineWidth=1;c.beginPath();c.arc(0,0,s.arena*.82,0,Math.PI*2);c.stroke();c.setLineDash([]);
      s.racers.forEach((r,i)=>{c.globalAlpha=r.out?.22:1;animal(c,r,r.x,r.y,.25,r.angle);text(c,(i+1)+" · "+r.drawing.name,r.x,r.y-r.g.radius-12,colors[i],12,"center");});c.restore();
      text(c,"วงหดลงเรื่อย ๆ · อย่าให้เพื่อนชนตก!",w/2,28,"#243d32",13,"center");return;
    }
    const lane=(h-40)/s.racers.length,small=w<600,left=small?42:80,right=w-(small?30:70),scale=small?.13:.21;
    s.racers.forEach((r,i)=>{
      const top=40+i*lane,ground=top+lane-20;c.save();c.beginPath();c.rect(0,top,w,lane);c.clip();c.fillStyle=i%2?"#f2edda":"#fbf8ed";c.fillRect(0,top,w,lane);
      text(c,(i+1)+" · "+r.drawing.name,12,top+20,colors[i],12);
      if(s.mode==="roll"){
        c.strokeStyle="#b7c8a3";c.lineWidth=8;c.beginPath();c.moveTo(left,ground-38);c.lineTo(right,ground);c.stroke();
        [250,530,780].forEach(n=>{const x=left+(right-left)*n/1000,y=ground-38*(1-n/1000);c.fillStyle="#c1ceab";c.beginPath();c.moveTo(x-9,y);c.lineTo(x,y-14);c.lineTo(x+9,y);c.fill();});
        const x=left+(right-left)*r.x/1000;
        const support=Math.max(8,...r.g.points.map(p=>p[0]*Math.sin(r.angle)+p[1]*Math.cos(r.angle)))*scale/.25;
        animal(c,r,x,ground-38*(1-r.x/1000)-support+r.y*.45,scale,r.angle);text(c,r.finish===null?Math.floor(r.x/10)+"%":r.finish.toFixed(2)+" วิ",w-12,top+20,colors[i],12,"right");
        c.fillStyle="#df5936";c.fillRect(right,ground-35,3,35);
      }else if(s.mode==="jump"){
        c.fillStyle="#ead8a9";c.fillRect(left,ground,right-left,20);c.strokeStyle="#b59d69";c.lineWidth=1;
        [0,40,80,120,160,200].forEach(n=>{const x=left+(right-left)*n/200;c.beginPath();c.moveTo(x,ground);c.lineTo(x,ground+8);c.stroke();});
        const x=left+(right-left)*r.x/200;
        const support=Math.max(8,...r.g.points.map(p=>p[0]*Math.sin(r.angle)+p[1]*Math.cos(r.angle)))*scale/.25;
        if(r.launched)animal(c,r,x,ground-support+r.y*2.4,scale,r.angle);else animal(c,r,left,ground,scale,0,true);
        if(r.finish!==null){c.strokeStyle=colors[i];c.setLineDash([3,3]);c.beginPath();c.moveTo(x,top+34);c.lineTo(x,ground);c.stroke();c.setLineDash([]);}
        text(c,r.finish!==null?r.distance.toFixed(2)+" ม.":r.launched?"กำลังลอย…":"เตรียมปล่อยตัว",w-12,top+20,colors[i],12,"right");
      }else{
        const mid=w/2;c.save();c.translate(mid,ground);c.rotate(s.tilt);c.fillStyle="#a4b68b";c.fillRect(-105,-4,210,8);c.restore();
        c.fillStyle="#d1c49e";c.beginPath();c.moveTo(mid,ground+3);c.lineTo(mid-20,ground+19);c.lineTo(mid+20,ground+19);c.fill();
        const fall=r.out?Math.min(180,(s.elapsed-r.finish)*160):0;c.globalAlpha=r.out?.35:1;
        animal(c,r,mid+r.x,ground+Math.sin(s.tilt)*r.x+fall,scale,r.angle,true);c.globalAlpha=1;
        text(c,r.out?"ตกเมื่อ "+r.finish.toFixed(2)+" วิ":"ยังทรงตัวอยู่",w-12,top+20,colors[i],12,"right");
      }c.restore();
    });
    text(c,s.mode==="roll"?"ทางลงเขา · ผ่านเนินเดียวกันทุกตัว":s.mode==="jump"?"วัดระยะตอนแตะพื้นครั้งแรก · เมตร": "ทุกแท่นโยกเหมือนกัน · ฐานกว้างช่วยทรงตัว",w/2,25,"#243d32",12,"center");
  }
  root.DoodleOlympicsRender={paint};
})(typeof window!=="undefined"?window:this);
