import { kitHint } from '../classes/shared.js?v=20.1.0';
import { TAU } from '../core/config.js?v=20.1.0';
import { ctx } from '../core/dom.js?v=20.1.0';
import { clamp } from '../core/math.js?v=20.1.0';
import { state } from '../core/state.js?v=20.1.0';
import { line, pixel, round, text } from './primitives.js?v=20.1.0';


function drawClassKit(g){
  const p=g.player,k=p.kit;
  if(!k)return;
  if(k.rail){
    const s=k.rail,f=s.time/s.max;
    ctx.save();
    ctx.globalAlpha=f;
    line(s.x,s.y,s.ex,s.ey,'#ffaa5544',34);
    line(s.x,s.y,s.ex,s.ey,'#ffc971',10);
    line(s.x,s.y,s.ex,s.ey,'#fffbe6',3);
    ctx.restore();
  }
  for(const z of k.zones){
    const f=z.time/z.max;
    ctx.save();
    ctx.globalAlpha=Math.min(1,f*3);
    round(z.x,z.y,z.r,'#b9383525','#ffbd7755',2);
    for(let i=0;i<6;i++){
      const a=g.t*2+i*TAU/6,b=a+.6;
      line(z.x+Math.cos(a)*z.r,z.y+Math.sin(a)*z.r,z.x+Math.cos(b)*z.r*.55,z.y+Math.sin(b)*z.r*.55,'#ffcb83',3);
    }
    ctx.strokeStyle='#ffe8be';
    ctx.lineWidth=3;
    ctx.beginPath();
    ctx.arc(z.x,z.y,z.r*(1-z.tick/.25),0,TAU);
    ctx.stroke();
    ctx.restore();
  }
  for(const s of k.blades){
    ctx.save();
    for(let i=1;i<s.trail.length;i++){
      const a=s.trail[i-1],b=s.trail[i];
      ctx.globalAlpha=i/s.trail.length*.4;
      line(a.x,a.y,b.x,b.y,s.charged?'#ffeeac':'#e7adff',s.charged?7:4);
    }
    ctx.globalAlpha=1;
    if(s.empowered)line(p.x,p.y,s.x,s.y,'#ddb6ff55',1);
    pixel('weapon-rogue',s.x,s.y,s.charged?1.05:.8,g.t*(s.returning?-19:19));
    ctx.restore();
  }
  if(p.weapon===0)return;
  const value=p.weapon===1?k.heat:p.weapon===2?k.resonance:p.weapon===4?p.stealth:1-k.abilityCd/4;
  const color=p.weapon===1?'#ffc470':p.weapon===2?'#d2a6ff':p.weapon===3?'#b8f49a':'#efb6fb';
  ctx.fillStyle='#160e22';
  ctx.fillRect(p.x-27,p.y+22,54,5);
  ctx.fillStyle=color;
  ctx.fillRect(p.x-27,p.y+22,54*clamp(value,0,1),5);
  text(p.weapon===1&&k.overheat>0?'ОХОЛОДЖЕННЯ':kitHint().replace('ЛКМ',state.deviceMode==='mobile'?'УМІННЯ':'ЛКМ'),p.x,p.y+41,9,color);
}


export { drawClassKit };
