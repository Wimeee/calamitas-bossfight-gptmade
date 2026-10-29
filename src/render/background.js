import { drawTerrain } from './terrain.js?v=21.1.1';
import { drawBackdropBase,drawArenaLayer } from './arena-cache.js?v=21.1.1';
import { arena } from '../core/arena.js?v=21.1.1';
import { H, TAU, VIEW_X, VIEW_Y, W } from '../core/config.js?v=21.1.1';
import { ctx } from '../core/dom.js?v=21.1.1';
import { line } from './primitives.js?v=21.1.1';


function drawBackdrop(g){
  let now=g?g.t:0;
  drawBackdropBase();
  for(let i=0;i<105;i++){
    let x=(i*293+17)%W,y=(i*173+47)%H;
    ctx.fillStyle=i%5?'#8d314777':'#d87b6f77';
    ctx.fillRect(x,(y+now*(i%3+1)*4)%H,2,2)
  }
  drawArenaLayer();
  drawTerrain();
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
  ctx.restore();
  
  for(let i=0;i<28;i++){
    let x=arena.l+i*(arena.r-arena.l)/27,flare=(Math.sin(now*3+i*2)*4);
    line(x,arena.t-9,x+flare,arena.t-17,'#f75f7b',2);
    line(x,arena.b+9,x-flare,arena.b+17,'#f75f7b',2)
  }
}


export { drawBackdrop };
