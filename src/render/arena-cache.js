import { arena } from '../core/arena.js?v=20.1.0';
import { settings } from '../core/settings.js?v=20.1.0';
import { H,VIEW_X,VIEW_Y,W } from '../core/config.js?v=20.1.0';
import { ctx } from '../core/dom.js?v=20.1.0';

let base=null,arenaLayer=null,arenaKey='';
function surface(){const c=document.createElement('canvas');c.width=W;c.height=H;return c;}
function stroke(c,x1,y1,x2,y2,color,width=1){c.strokeStyle=color;c.lineWidth=width;c.beginPath();c.moveTo(x1,y1);c.lineTo(x2,y2);c.stroke();}

export function drawBackdropBase(){
  if(!base){
    base=surface();const c=base.getContext('2d');c.translate(VIEW_X,VIEW_Y);
    c.fillStyle='#0c0710';c.fillRect(-VIEW_X,-VIEW_Y,W,H);
    const gradient=c.createRadialGradient(500,320,50,500,280,610);
    gradient.addColorStop(0,'#341224');gradient.addColorStop(.65,'#210b1a');gradient.addColorStop(1,'#07070d');
    c.fillStyle=gradient;c.fillRect(-VIEW_X,-VIEW_Y,W,H);
  }
  ctx.drawImage(base,-VIEW_X,-VIEW_Y);
}

export function drawArenaLayer(){
  const key=[arena.l,arena.r,arena.t,arena.b,settings.quality==='low'].join('|');
  if(key!==arenaKey){
    arenaKey=key;arenaLayer=surface();const c=arenaLayer.getContext('2d');c.translate(VIEW_X,VIEW_Y);
    c.fillStyle='#24101c';c.fillRect(arena.l,arena.t,arena.r-arena.l,arena.b-arena.t);
    for(let x=arena.l+33;x<arena.r;x+=32)stroke(c,x,arena.t,x,arena.b,'#8b334018');
    for(let y=arena.t+28;y<arena.b;y+=32)stroke(c,arena.l,y,arena.r,y,'#8b33401d');
    c.globalAlpha=.22;
    stroke(c,340,410,420,375,'#7b3950',3);stroke(c,420,375,520,388,'#7b3950',2);stroke(c,520,388,605,349,'#7b3950',2);
    c.globalAlpha=1;c.shadowColor='#ec365b';c.shadowBlur=settings.quality==='low'?0:14;
    c.strokeStyle='#f44d63';c.lineWidth=5;c.strokeRect(arena.l,arena.t,arena.r-arena.l,arena.b-arena.t);
    c.shadowBlur=0;c.strokeStyle='#812537';c.lineWidth=11;c.strokeRect(arena.l-10,arena.t-10,arena.r-arena.l+20,arena.b-arena.t+20);
  }
  ctx.drawImage(arenaLayer,-VIEW_X,-VIEW_Y);
}
