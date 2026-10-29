import { settings } from '../core/settings.js?v=20.1.0';
import { ctx } from '../core/dom.js?v=20.1.0';
import { TAU } from '../core/config.js?v=20.1.0';
import { line,pixel } from './primitives.js?v=20.1.0';
import { drawGlowCircle } from './glow-cache.js?v=20.1.0';

export function drawEnemyProjectiles(g){
  const low=settings.quality==='low';
  ctx.shadowBlur=0;
  for(const q of g.projectiles){
    const kind=q.kind,color=kind==='skull'?'#ffbb7b':kind==='giga'?'#ffd0b0':kind==='fire'?'#ff895b':kind==='hellblast'?'#f84c7c':'#dd536c';
    line(q.x-q.vx*.030,q.y-q.vy*.030,q.x,q.y,color,kind==='giga'?6:2.4);
    drawGlowCircle(q.x,q.y,q.r,color,low?0:kind==='giga'?19:8,'#6b1a37',1);
    if(kind==='giga'){
      ctx.strokeStyle='#ffd0a8a6';ctx.lineWidth=2;ctx.beginPath();
      ctx.arc(q.x,q.y,q.r+5+Math.sin(g.t*9)*1.5,0,TAU);ctx.stroke();
    }
    if(kind==='skull'||kind==='hellblast'||kind==='fire'||kind==='giga'){
      pixel('skull',q.x,q.y,kind==='giga'?1.65:kind==='fire'?1.25:kind==='skull'?1.05:.83,Math.atan2(q.vy,q.vx)+Math.PI/2);
    }
    if(kind==='dart'){
      line(q.x-7,q.y,q.x+7,q.y,'#ffc3b4',1);
      line(q.x,q.y-7,q.x,q.y+7,'#ffc3b4',1);
    }
  }
}
