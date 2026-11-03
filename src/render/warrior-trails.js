import { ctx } from '../core/dom.js?v=26.2.0';

const trails=new Map();
function trail(wide){
  if(trails.has(wide))return trails.get(wide);
  const radius=wide?136:114,pad=radius+24,direction=wide?1:-1,span=wide?1.55:1.15;
  const canvas=document.createElement('canvas');canvas.width=canvas.height=pad*2;
  const c=canvas.getContext('2d');c.translate(pad,pad);c.lineCap='round';
  // Hand-drawn tapered energy ribbons: cached once, rotated at display rate.
  for(let i=0;i<40;i++){
    const f=i/40,a=-direction*span*(1-f),b=-direction*span*(1-(i+1)/40);
    for(const [width,color,alpha]of [[28,'#9a4dff',.26],[18,'#465dff',.55],[8,'#8eeaff',.9],[3,'#fff5ff',.95]]){
      c.globalAlpha=f*alpha;c.lineWidth=width*(.25+.75*f);c.strokeStyle=color;
      c.beginPath();c.arc(0,0,radius,a,b,direction<0);c.stroke();
    }
    if(i%9===0){
      const x=Math.cos(a)*(radius+10),y=Math.sin(a)*(radius+10);
      c.globalAlpha=f*.8;c.fillStyle=i%2?'#ffd59c':'#eac6ff';
      c.fillRect(x-1,y-3,2,6);c.fillRect(x-3,y-1,6,2);
    }
  }
  const stamp={canvas,pad};trails.set(wide,stamp);return stamp;
}

export function prepareWarriorTrails(){trail(false);trail(true);}

export function drawWarriorTrail(g,s,angle,progress){
  const stamp=trail(s.wide);
  ctx.save();ctx.translate(g.player.x,g.player.y);ctx.rotate(angle);ctx.shadowBlur=0;
  ctx.globalAlpha=Math.pow(Math.sin(Math.PI*Math.max(0,Math.min(1,progress))),.45);
  ctx.drawImage(stamp.canvas,-stamp.pad,-stamp.pad);ctx.restore();
}
