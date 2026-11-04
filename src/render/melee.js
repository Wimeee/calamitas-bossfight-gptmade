import { drawWarriorWeapon } from './warrior.js?v=29.1.1';
import { arkAngle } from '../classes/melee.js?v=29.1.1';
import { TAU } from '../core/config.js?v=29.1.1';
import { ctx } from '../core/dom.js?v=29.1.1';
import { clamp, lerp } from '../core/math.js?v=29.1.1';
import { line, round, text } from './primitives.js?v=29.1.1';
import { weaponAim } from './weapons.js?v=29.1.1';


function drawArkBlade(x,y,a,length,side=1,alpha=1){
  ctx.save();
  ctx.translate(x,y);
  ctx.rotate(a);
  ctx.scale(length/136,side*length/136);
  ctx.globalAlpha=alpha;
  ctx.beginPath();
  ctx.moveTo(-17,0);
  ctx.lineTo(14,-9);
  ctx.lineTo(34,-16);
  ctx.lineTo(73,-14);
  ctx.lineTo(119,-28);
  ctx.lineTo(136,-24);
  ctx.lineTo(113,-7);
  ctx.lineTo(128,1);
  ctx.lineTo(73,12);
  ctx.lineTo(37,9);
  ctx.lineTo(18,5);
  ctx.closePath();
  ctx.fillStyle='#221735';
  ctx.fill();
  ctx.strokeStyle='#f8d8a3';
  ctx.lineWidth=3;
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(24,-7);
  ctx.lineTo(72,-8);
  ctx.lineTo(117,-23);
  ctx.lineTo(95,-3);
  ctx.lineTo(112,0);
  ctx.lineTo(65,6);
  ctx.lineTo(35,3);
  ctx.closePath();
  ctx.fillStyle=side>0?'#af73e8':'#69dbe3';
  ctx.fill();
  line(28,-2,93,-6,'#f1e6ff',2);
  line(8,0,-18,0,'#eec78a',6);
  round(-21,0,9,'#21152d','#e9bc73',3);
  round(13,0,5,'#fff4c4','#965abe',2);
  for(let i=0;i<3;i++){
    const sx=45+i*21,sy=-1-i*2;
    line(sx-3,sy,sx+3,sy,'#fff7e0',1);
    line(sx,sy-3,sx,sy+3,'#fff7e0',1);
  }
  ctx.restore();
}


function drawArkPair(x,y,a,length,opening=.2,alpha=1){
  drawArkBlade(x,y,a-opening,length,1,alpha);
  drawArkBlade(x,y,a+opening,length,-1,alpha)
}


function drawSword(g){
  if(drawWarriorWeapon(g))return;
  const p=g.player,s=p.swing;
  if(s){
    const progress=clamp(1-s.time/s.max,0,1),a=arkAngle(s,progress),reach=s.wide?146:124,sign=s.wide?1:-1;
    ctx.save();
    ctx.translate(p.x,p.y);
    for(let i=12;i>0;i--){
      const past=arkAngle(s,Math.max(0,progress-i*.018));
      ctx.globalAlpha=(1-i/13)*.3;
      ctx.strokeStyle=i%2?'#ba7bea':'#76e8ef';
      ctx.lineWidth=18;
      ctx.beginPath();
      ctx.arc(0,0,reach-16,past,arkAngle(s,Math.max(0,progress-(i-1)*.018)),sign<0);
      ctx.stroke();
    }
    ctx.restore();
    drawArkBlade(p.x,p.y,a,reach,s.wide?-1:1);
    if(s.boost>1)drawArkBlade(p.x,p.y,a+.12,reach,-1,.85);
  }
  if(p.arkThrow){
    const s=p.arkThrow,ready=!s.returning&&s.age>=.466&&s.age<=1.7475;
    const points=[];
    for(let i=0;i<=8;i++){
      const f=i/8;
      points.push({x:lerp(p.x,s.x,f),y:lerp(p.y,s.y,f)+Math.sin(f*Math.PI)*Math.sin(g.t*6+i)*11});
    }
    for(let i=1;i<points.length;i++){
      const a=points[i-1],b=points[i];
      line(a.x,a.y,b.x,b.y,'#ab9fe5aa',1.5);
      round(b.x,b.y,i%2?2:3,'#eff6ff');
    }
    if(ready){
      ctx.save();
      ctx.strokeStyle='#ffe4b3';
      ctx.lineWidth=2;
      ctx.setLineDash([4,9]);
      ctx.beginPath();
      ctx.arc(s.x,s.y,83,0,TAU);
      ctx.stroke();
      ctx.restore();
      text('ВІДПУСТИ · SNAP',s.x,s.y-94,11,'#ffe4b3');
    }
    drawArkPair(s.x,s.y,s.snapLife?weaponAim(g):s.angle,80,s.snapLife?.04:.44);
    if(s.snapLife){
      ctx.save();
      ctx.globalAlpha=s.snapLife/.22;
      ctx.strokeStyle='#fff4d0';
      ctx.lineWidth=6;
      ctx.beginPath();
      ctx.arc(s.x,s.y,94*(1-s.snapLife/.3),0,TAU);
      ctx.stroke();
      ctx.restore();
    }
  }
  if(p.arkParry){
    const s=p.arkParry;
    drawArkPair(p.x,p.y,s.angle,135,.55*s.time/s.max);
  }
  if(p.arkRip){
    const r=p.arkRip,f=r.time/r.max;
    ctx.save();
    ctx.globalAlpha=f;
    line(r.x,r.y,r.ex,r.ey,'#8a3cb966',62*f);
    line(r.x,r.y,r.ex,r.ey,'#ecb4ff',5);
    line(r.x,r.y,r.ex,r.ey,'#fff6df',1);
    drawArkPair(r.ex,r.ey,r.angle,100,.4*f);
    ctx.restore();
  }
  if(p.weapon===0){
    const charges=p.arkCharges||0;
    text(charges?'✦ '+charges+' · ПКМ: BIG RIP':p.arkParryCd>0?'PARRY '+p.arkParryCd.toFixed(1)+'с':'ПКМ: PARRY',p.x,p.y+37,10,charges?'#ffe3a4':'#b4d7e9');
  }
}


export { drawArkBlade, drawArkPair, drawSword };
