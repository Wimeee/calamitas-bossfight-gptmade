import {asgardianConfig as c} from '../../config/asgardian.js?v=26.0.4';
import {movementConfig} from '../../config/movement.js?v=26.0.4';
import {emitAsgardianTrail} from '../systems/asgardian-effects.js?v=26.0.4';
const TICK=1/60;
function runSpeed(p){return p.grounded?movementConfig.runSpeed:movementConfig.airSpeed;}
function remaining(speed,limit,phase=0){let ticks=0;while(speed>limit&&ticks<120){speed*=speed>c.fastThreshold?c.fastDecay:c.slowDecay;ticks++;}return Math.max(TICK-phase,ticks*TICK-phase);}
export function startAsgardianDash(g,direction){const p=g.player;if(p.aegisDash||p.dashCd>0||!g.ritual&&(p.aegisReadyAt||0)>g.t)return false;
 p.aegisDash={speed:c.startSpeed,elapsed:0,phase:0,ticks:0,started:g.t,fromRitual:!!g.ritual,hits:new Map()};p.aegisDashDuration=remaining(c.startSpeed,runSpeed(p));p.dashT=p.aegisDashDuration;p.dashX=direction;p.dashY=0;p.vx=direction*c.startSpeed;p.dashCd=0;p.contactGuard=0;return true;
}
export function endAsgardianDash(g,a=g.player.aegisDash){if(!a)return;const p=g.player;p.aegisReadyAt=g.ritual?0:a.started+a.elapsed+c.cooldown;p.dashCd=g.ritual?c.cooldown:Math.max(0,p.aegisReadyAt-g.t);p.dashT=0;p.aegisDash=null;}
export function moveAsgardianDash(g,dt){const p=g.player,a=p.aegisDash;if(!a)return p.vx*dt;if(a.fromRitual&&!g.ritual){a.started=g.t-dt-a.elapsed;a.fromRitual=false;}let left=dt,dx=0;
 while(left>1e-10&&p.aegisDash){const step=Math.min(left,TICK-a.phase);dx+=a.speed*p.dashX*step;a.elapsed+=step;a.phase+=step;left-=step;
  if(a.phase>=TICK-1e-10){a.phase=0;a.ticks++;if(a.elapsed<=c.slamWindow+1e-10)emitAsgardianTrail(g,p.x+dx,p.y,a.speed*p.dashX,p.vy,a.started+a.elapsed);
   if(a.speed>c.fastThreshold)a.speed*=c.fastDecay;else if(a.speed>runSpeed(p))a.speed*=c.slowDecay;
   if(a.speed<=runSpeed(p)){p.vx=a.speed*p.dashX;endAsgardianDash(g,a);}else{p.vx=a.speed*p.dashX;p.dashT=remaining(a.speed,runSpeed(p),a.phase);}
  }
 }
 if(left>0)dx+=p.vx*left;return dx;
}
