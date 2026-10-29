import { arena } from '../core/arena.js?v=19.0.0';
import { H, TAU, VIEW_X, VIEW_Y, W } from '../core/config.js?v=19.0.0';
import { ctx } from '../core/dom.js?v=19.0.0';
import { line } from './primitives.js?v=19.0.0';


function drawBackdrop(g){
  let now=g?g.t:0;
  ctx.fillStyle='#0c0710';
  ctx.fillRect(-VIEW_X,-VIEW_Y,W,H);
  let grad=ctx.createRadialGradient(500,320,50,500,280,610);
  grad.addColorStop(0,'#341224');
  grad.addColorStop(.65,'#210b1a');
  grad.addColorStop(1,'#07070d');
  ctx.fillStyle=grad;
  ctx.fillRect(-VIEW_X,-VIEW_Y,W,H);
  for(let i=0;i<105;i++){
    let x=(i*293+17)%W,y=(i*173+47)%H;
    ctx.fillStyle=i%5?'#8d314777':'#d87b6f77';
    ctx.fillRect(x,(y+now*(i%3+1)*4)%H,2,2)
  }
  ctx.fillStyle='#24101c';
  ctx.fillRect(arena.l,arena.t,arena.r-arena.l,arena.b-arena.t);
  for(let x=arena.l+33;x<arena.r;x+=32){
    line(x,arena.t,x,arena.b,'#8b334018',1)
  }
  for(let y=arena.t+28;y<arena.b;y+=32){
    line(arena.l,y,arena.r,y,'#8b33401d',1)
  }
  // Decorative ritual seals, pulsing embers and faint central cracks (visual only).
  ctx.save();
  ctx.globalAlpha=.25;
  for(const [sx,sy] of [[arena.l+105,arena.t+95],[arena.r-105,arena.b-95],[arena.l+105,arena.b-95],[arena.r-105,arena.t+95]]){
    ctx.strokeStyle='#b33f5a';
    ctx.lineWidth=1.4;
    ctx.beginPath();
    ctx.arc(sx,sy,31+Math.sin(now*1.5+sx)*2,0,TAU);
    ctx.stroke();
    for(let k=0;k<6;k++){
      let a=k*TAU/6+now*.08;
      line(sx+Math.cos(a)*14,sy+Math.sin(a)*14,sx+Math.cos(a)*25,sy+Math.sin(a)*25,'#c55b76',1)
    }
  }
  ctx.globalAlpha=.22;
  line(340,410,420,375,'#7b3950',3);
  line(420,375,520,388,'#7b3950',2);
  line(520,388,605,349,'#7b3950',2);
  ctx.restore();
  
  ctx.shadowColor='#ec365b';
  ctx.shadowBlur=14;
  ctx.strokeStyle='#f44d63';
  ctx.lineWidth=5;
  ctx.strokeRect(arena.l,arena.t,arena.r-arena.l,arena.b-arena.t);
  ctx.shadowBlur=0;
  ctx.strokeStyle='#812537';
  ctx.lineWidth=11;
  ctx.strokeRect(arena.l-10,arena.t-10,arena.r-arena.l+20,arena.b-arena.t+20);
  for(let i=0;i<28;i++){
    let x=arena.l+i*(arena.r-arena.l)/27,flare=(Math.sin(now*3+i*2)*4);
    line(x,arena.t-9,x+flare,arena.t-17,'#f75f7b',2);
    line(x,arena.b+9,x-flare,arena.b+17,'#f75f7b',2)
  }
}


export { drawBackdrop };
