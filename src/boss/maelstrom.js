import { hurt } from '../combat/damage.js?v=20.0.0';
import { arena } from '../core/arena.js?v=20.0.0';
import { clamp, lerp, norm } from '../core/math.js?v=20.0.0';
import { state } from '../core/state.js?v=20.0.0';


function updateMaelstrom(dt){
  const g=state.game,p=g.player,m=g.maelstrom;
  if(!m||g.stage==='accept')return;
  // Stronger, visible gravity; never cancel the player's intentional dash.
  const speedMult=(g.stage==='seekers'||g.stage==='hearts')?.80:1;
  const target=norm(p.x-m.x,p.y-m.y);
  const chase=142*speedMult;
  m.vx=lerp(m.vx,target.x*chase,clamp(dt*1.45,0,1));
  m.vy=lerp(m.vy,target.y*chase,clamp(dt*1.45,0,1));
  m.x=clamp(m.x+m.vx*dt,arena.l+m.r+9,arena.r-m.r-9);
  m.y=clamp(m.y+m.vy*dt,arena.t+m.r+9,arena.b-m.r-9);
  m.pulse+=dt;
  const dx=m.x-p.x,dy=m.y-p.y,d=Math.hypot(dx,dy),range=255;
  if(d<range&&d>4){
    const strength=1-d/range;
    // noticeable at the outer radius, then strongly accelerating near the center
    const gravity=(72+380*strength*strength)*dt;
    if(p.dashT<=0){
      p.x=clamp(p.x+dx/d*gravity,arena.l+11,arena.r-11);
      p.y=clamp(p.y+dy/d*gravity,arena.t+11,arena.b-11);
    }
  }
  if(d<m.r+8)hurt(d<m.r*.57?99:56,'contact','Whispering Maelstrom');
}


export { updateMaelstrom };
