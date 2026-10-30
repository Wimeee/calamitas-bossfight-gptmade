import { movePlayerWithTerrain } from '../game/movement.js?v=22.1.0';
import { hurt } from '../combat/damage.js?v=22.1.0';
import { arena } from '../core/arena.js?v=22.1.0';
import { clamp, lerp, norm } from '../core/math.js?v=22.1.0';
import { state } from '../core/state.js?v=22.1.0';


function updateMaelstrom(dt){
  const g=state.game,p=g.player,m=g.maelstrom;
  if(!m||g.stage==='accept')return;
  m.age=(m.age||0)+dt;
  if(m.age<1.6){m.pulse+=dt;return;}
  const speedMult=(g.stage==='seekers'||g.stage==='hearts')?.80:1;
  const target=norm(p.x-m.x,p.y-m.y);
  const chase=(g.difficulty==='death'?112:g.difficulty==='revenge'?102:92)*speedMult;
  m.vx=lerp(m.vx,target.x*chase,clamp(dt*.7,0,1));
  m.vy=lerp(m.vy,target.y*chase,clamp(dt*.7,0,1));
  m.x=clamp(m.x+m.vx*dt,arena.l+m.r+9,arena.r-m.r-9);
  m.y=clamp(m.y+m.vy*dt,arena.t+m.r+9,arena.b-m.r-9);
  m.pulse+=dt;
  const dx=m.x-p.x,dy=m.y-p.y,d=Math.hypot(dx,dy),range=255;
  if(d<range&&d>4){
    const strength=1-d/range;
    // noticeable at the outer radius, then strongly accelerating near the center
    const gravity=(25+140*strength*strength)*dt;
    if(p.dashT<=0){
      movePlayerWithTerrain(g,dx/d*gravity,dy/d*gravity);
    }
  }
  if(d<m.r+8)hurt(d<m.r*.57?99:56,'contact','Whispering Maelstrom');
}


export { updateMaelstrom };
