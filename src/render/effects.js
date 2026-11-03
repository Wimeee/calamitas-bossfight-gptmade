import { drawWarriorImpact } from './warrior.js?v=25.0.0';
import { arena } from '../core/arena.js?v=25.0.0';
import { TAU } from '../core/config.js?v=25.0.0';
import { ctx } from '../core/dom.js?v=25.0.0';
import { clamp, rnd } from '../core/math.js?v=25.0.0';
import { state } from '../core/state.js?v=25.0.0';
import { line, pixel, text } from './primitives.js?v=25.0.0';


function drawPatternWarnings(g){
  for(const w of g.patternWarnings){
    ctx.save();
    ctx.globalAlpha=.3+.5*(1-w.left/w.max);
    ctx.strokeStyle='#ffc89a';
    ctx.lineWidth=2;
    ctx.setLineDash([7,8]);
    if(w.kind==='spiral'){
      ctx.beginPath();
      ctx.arc(w.x,w.y,39,w.angle+.38,w.angle+TAU-.38);
      ctx.stroke();
      text('↻',w.x,w.y+6,23,'#ffcf9d');
    }else
    if(w.kind==='cross'){
      for(const sign of [-1,1]){
        const y=sign<0?arena.t:arena.b,x=sign<0?arena.l:arena.r;
        for(const off of [-140,-105,-70,70,105,140]){
          line(w.x+off,y,w.x+off,y-sign*36,'#ffb58b',2);
          line(x,w.y+off,x-sign*36,w.y+off,'#ffb58b',2);
        }
      }
    }else
    {
      for(const x of [arena.l,arena.r])for(let i=-1;i<=1;i++){
        const y=w.y+i*45,a=Math.atan2(300-y,500-x)+i*.08;
        pixel('skull',x,y,.85);
        line(x,y,x+Math.cos(a)*150,y+Math.sin(a)*150,'#ffb58b',1);
      }
    }
    ctx.restore();
  }
}


function attackKind(id){
  return id==='ranger'?'ranger':id==='mage'?'mage':id==='rogue'?'rogue':id==='summon'||id?.startsWith('cosmic')?'summon':'melee'
}


function weaponImpact(x,y,id){
  const g=state.game;
  g.impacts.push({x,y,kind:attackKind(id),life:.26,max:.26,angle:rnd(0,TAU)});
  if(g.impacts.length>70)g.impacts.splice(0,g.impacts.length-70);
}


function drawWeaponImpacts(g){
  for(const f of g.impacts){
    if(drawWarriorImpact(f))continue;
    const k=clamp(f.life/f.max,0,1);
    ctx.save();
    ctx.globalAlpha=k;
    pixel('impact-'+f.kind,f.x,f.y,.8+(1-k)*.9,f.angle);
    ctx.restore();
  }
}


export { drawPatternWarnings, attackKind, weaponImpact, drawWeaponImpacts };
