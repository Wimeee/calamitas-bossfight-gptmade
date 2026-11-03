import {state} from '../core/state.js?v=25.0.0';
import {audio} from '../core/audio.js?v=25.0.0';
import {applyPlayerHex} from '../combat/debuffs.js?v=25.0.0';
import {finish} from '../game/session.js?v=25.0.0';
import {movementConfig} from '../../config/movement.js?v=25.0.0';
const clamp01=n=>Math.max(0,Math.min(1,n));
export function spawnMaelstrom(g,x,y){return g.maelstrom={x,y,vx:0,vy:0,r:17,scale:Math.fround(.1),opacity:0,age:0,ticks:0,sitStill:90,speedAdd:0,speedLimit:23,timeLeft:36000,remainder:0};}
function step(g,m){
 const p=g.player;if(!m.ticks)audio.minion('maelstromSpawn',g);
 m.ticks++;m.age=m.ticks/60;
 if(m.scale<1.9&&m.timeLeft>90)m.scale=Math.fround(m.scale+Math.fround(.01));
 if(g.stage==='accept'&&!m.despawning){m.despawning=true;m.timeLeft=Math.min(m.timeLeft,90);audio.stopMinion('maelstromDrone');}
 m.opacity=m.timeLeft<90?clamp01(m.timeLeft/90):clamp01(1-(m.timeLeft-35910)/90);
 m.r=170*m.scale;
 if(m.speedAdd<m.speedLimit)m.speedAdd=Math.fround(m.speedAdd+Math.fround(.04));
 if(m.scale>=1.9)m.sitStill--;
 const dx=p.x-m.x,dy=p.y-m.y,dist=Math.hypot(dx,dy);
 if(m.sitStill<=0){
  const revenge=g.difficulty==='revenge'||g.difficulty==='death',helpers=g.hearts?.some(h=>h.hp>0)||g.seekers?.some(h=>h.hp>0);
  let inertia=(revenge?5:5.5)+m.speedAdd,speed=(revenge?2.9:2.2)+m.speedAdd*.25;
  if(helpers){inertia*=1.5;speed*=.8;}
  if(dist>160){m.vx=(m.vx*(inertia-1)+dx/dist*speed*60)/inertia;m.vy=(m.vy*(inertia-1)+dy/dist*speed*60)/inertia;}
  if(g.difficulty==='death')m.speedLimit=15;
 }
 m.x+=m.vx/60;m.y+=m.vy/60;
 if(m.opacity===1&&!m.despawning&&p.iframes<=0&&!p.godMode){
  const x=Math.max(0,Math.abs(m.x-p.x)-movementConfig.halfWidth),y=Math.max(0,Math.abs(m.y-p.y)-movementConfig.halfHeight);
  if(x*x+y*y<=m.r*m.r){
   const radiusRatio=((m.x-p.x)**2+(m.y-p.y)**2)/(m.r*m.r),speedRatio=((p.vx||0)**2+(p.vy||0)**2)/(1500*1500);
   const loss=Math.max(4,Math.trunc(14-10*Math.max(radiusRatio,speedRatio))),actual=Math.min(p.hp,loss);p.hp=Math.max(0,p.hp-loss);p.lastHit=g.t;g.lastCause='Whispering Maelstrom';applyPlayerHex(g,6);
   if(g.rippers)g.rippers.adrenaline*=.96;
   if(g.floaters.length<140)g.floaters.push({x:p.x,y:p.y-12,life:.6,text:'-'+actual,col:'#e56d83',dot:true});
   if(m.ticks%6===0)audio.minion('maelstromBurn',g,{volume:.25,pitch:.4});
   if(p.hp<=0)finish(false);
  }
 }
 m.timeLeft--;
}
export function updateMaelstrom(dt){
 const g=state.game;if(!g||g.mode!=='playing'||g.ritual)return;const m=g.maelstrom;
 if(!m){audio.stopMinion('maelstromDrone');return;}
 // Compatible with old controlled fixtures; new encounters use spawnMaelstrom.
 m.scale??=.1;m.ticks??=0;m.timeLeft??=36000;m.sitStill??=90;m.speedAdd??=0;m.speedLimit??=23;m.remainder??=0;
 m.remainder+=Math.max(0,dt);while(m.remainder+1e-10>=1/60&&m.timeLeft>0&&g.mode==='playing'){m.remainder=Math.max(0,m.remainder-1/60);step(g,m);}
 if(m.timeLeft<=0){g.maelstrom=null;audio.stopMinion('maelstromDrone');return;}
 if(m.despawning)audio.stopMinion('maelstromDrone');
 if(!m.despawning){const distance=Math.hypot(g.player.x-m.x,g.player.y-m.y),pitch=clamp01((1400-distance)/700);audio.minion('maelstromDrone',g,{volume:.3+.5*pitch,pitch:.7*pitch});}
}
