import {finish} from '../game/session.js?v=27.1.0';
import {getTerrain} from '../world/terrain.js?v=27.1.0';
import {sayCalamitas} from './dialogue.js?v=27.1.0';
export function beginAcceptance(g){const b=g.boss;b.hp=1;g.acceptTicks=0;g.acceptRemainder=0;g.acceptT=0;b.x=500;b.y=270;b.vx=(g.player.x<b.x?1:-1)*600;b.vy=-420;b.contactDamage=0;b.dontTakeDamage=true;sayCalamitas(g,'SCalDesparationText4',4.8);}
export function updateAcceptance(dt,g){if(g.mode!=='playing')return;g.acceptRemainder=(g.acceptRemainder||0)+dt;
 while(g.acceptRemainder+1e-10>=1/60){g.acceptRemainder=Math.max(0,g.acceptRemainder-1/60);g.acceptTicks=(g.acceptTicks||0)+1;g.acceptT=g.acceptTicks/60;const b=g.boss,oldFoot=b.y+21;b.vy=Math.min(480,(b.vy||0)+.165*60);b.vx=(b.vx||0)*.965;b.x+=b.vx/60;b.y+=b.vy/60;
  if(b.vy>=0){for(const p of getTerrain().platforms)if(b.x>=p.l&&b.x<=p.r&&oldFoot<=p.y&&b.y+21>=p.y){b.y=p.y-21;b.vy=0;break;}}
  if(!g.rematch){const index={300:1,600:2,900:3}[g.acceptTicks];if(index)sayCalamitas(g,'SCalAcceptanceText'+index,4.8,false);}
  if(g.acceptTicks>=(g.rematch?480:1200)){b.departed=true;finish(true);break;}
 }
}
