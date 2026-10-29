import { TAU } from '../core/config.js?v=19.0.0';
import { ctx } from '../core/dom.js?v=19.0.0';
import { hpMini, line, pixel, round, text } from './primitives.js?v=19.0.0';


function drawBrother(br,g){
  pixel('brother'+br.kind,br.x,br.y+Math.sin(g.t*3+br.kind)*2,1.6,0,br.x>g.player.x);
  text(br.kind?'CATASTROPHE':'CATACLYSM',br.x,br.y-63,11,'#ffd4ca');
  hpMini(br.x,br.y-58,br.hp,br.max,65,'#ed9e8b');
}


function drawCalamitas(g){
  const b=g.boss,inv=g.stage!=='normal';
  if(inv){
    ctx.save();
    ctx.strokeStyle='#f4496666';
    ctx.lineWidth=2;
    ctx.beginPath();
    ctx.arc(b.x,b.y,53,0,TAU);
    ctx.stroke();
    ctx.restore();
  }
  pixel('witch'+(Math.floor(g.t*7)%3),b.x,b.y,1.65,0,g.player.x<b.x);
  if(g.t<(b.hitFlash||0)){
    ctx.strokeStyle='#fff5d8';
    ctx.strokeRect(b.x-33,b.y-48,66,96);
  }
  if(inv)text('IMMUNE',b.x,b.y-61,10,'#ffadb5');
}


function drawSepulcher(g){
  // A continuous long chain of skeletal ribs and a horned skull, behind the hearts.
  const point=i=>{
    const a=g.t*1.15-i*.115;
    return {x:500+Math.sin(a)*245,y:315+Math.sin(a*1.9)*125+i*1.2}
  };
  ctx.save();
  ctx.globalAlpha=.82;
  for(let i=30;i>=1;i--){
    const v=point(i),prev=point(i-1);
    pixel('rib',v.x,v.y,.63+(.98-i/65),Math.atan2(prev.y-v.y,prev.x-v.x)+Math.PI/2);
  }
  const h=point(0),next=point(1);
  pixel('serpentHead',h.x,h.y,1.5,Math.atan2(h.y-next.y,h.x-next.x)+Math.PI/2);
  ctx.restore();
  text('SEPULCHER — ЗНИЩИ СЕРЦЯ',500,109,14,'#ffc1bd');
}


function drawMaelstrom(g){
  if(!g.maelstrom)return;
  const m=g.maelstrom,t=g.t,p=g.player;
  const distance=Math.hypot(p.x-m.x,p.y-m.y);
  ctx.save();
  ctx.translate(m.x,m.y);
  // Gravity field is visible before the actual contact radius.
  const range=255;
  ctx.strokeStyle='#9d57bb35';
  ctx.lineWidth=2;
  ctx.setLineDash([6,11]);
  ctx.beginPath();
  ctx.arc(0,0,range,0,TAU);
  ctx.stroke();
  ctx.setLineDash([]);
  for(let i=0;i<18;i++){
    const a=i*TAU/18-t*.48,r=range-14+Math.sin(t*2+i)*8;
    const x=Math.cos(a)*r,y=Math.sin(a)*r;
    line(x,y,x-Math.cos(a)*14-Math.sin(a)*7,y-Math.sin(a)*14+Math.cos(a)*7,'#d684cf73',2);
  }
  const glow=ctx.createRadialGradient(0,0,19,0,0,m.r*1.72);
  glow.addColorStop(0,'#05020b');
  glow.addColorStop(.31,'#230a37');
  glow.addColorStop(.63,'#913073b0');
  glow.addColorStop(1,'#4c183500');
  ctx.fillStyle=glow;
  ctx.beginPath();
  ctx.arc(0,0,m.r*1.72,0,TAU);
  ctx.fill();
  for(let i=0;i<5;i++){
    ctx.save();
    ctx.rotate(t*(i%2?-.92:1.2)+i*.7);
    ctx.strokeStyle=i%2?'#e775b2c9':'#885cdddf';
    ctx.lineWidth=6-i*.65;
    ctx.beginPath();
    ctx.ellipse(0,0,m.r*.83+i*7,m.r*.53+i*5,i*.23,0,TAU);
    ctx.stroke();
    ctx.restore();
  }
  ctx.shadowColor='#b248ac';
  ctx.shadowBlur=27;
  round(0,0,m.r*.61,'#050309','#e898d5',4);
  ctx.shadowBlur=0;
  round(0,0,m.r*.48,'#000006','#4c2b65',2);
  for(let i=0;i<12;i++){
    let a=i*TAU/12-t*1.4,r=m.r*.80+Math.sin(t*2+i)*9;
    round(Math.cos(a)*r,Math.sin(a)*r,3,'#f5aac8')
  }
  ctx.restore();
  text('WHISPERING MAELSTROM',m.x,m.y-m.r-29,12,'#f6c3ef');
  if(distance<range&&distance>m.r+12)text('↘ ПРИТЯГАННЯ ↙',p.x,p.y-32,12,'#dfb1fa');
}


export { drawBrother, drawCalamitas, drawSepulcher, drawMaelstrom };
