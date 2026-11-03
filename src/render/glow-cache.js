import { ctx } from '../core/dom.js?v=26.1.2';

const stamps=new Map();
const MAX_STAMPS=96;

export function drawGlowCircle(x,y,r,color,blur,stroke='',width=1,glow=color){
  const key=r+'|'+color+'|'+blur+'|'+stroke+'|'+width+'|'+glow;
  let stamp=stamps.get(key);
  if(!stamp){
    const pad=Math.ceil(r+blur*2+width+2),canvas=document.createElement('canvas');
    canvas.width=canvas.height=pad*2;
    const c=canvas.getContext('2d');
    c.shadowColor=glow;c.shadowBlur=blur;c.fillStyle=color;
    c.beginPath();c.arc(pad,pad,r,0,Math.PI*2);c.fill();
    if(stroke){c.strokeStyle=stroke;c.lineWidth=width;c.stroke();}
    stamp={canvas,pad};
    if(stamps.size>=MAX_STAMPS)stamps.delete(stamps.keys().next().value);
    stamps.set(key,stamp);
  }
  ctx.drawImage(stamp.canvas,x-stamp.pad,y-stamp.pad);
}

export function glowCacheSize(){return stamps.size;}
