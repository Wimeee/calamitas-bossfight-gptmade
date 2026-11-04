import {photoGeometry} from './photo-geometry.js?v=29.1.0';
import {rangerConfig as C} from '../../config/ranger.js?v=29.1.0';
import {state} from '../core/state.js?v=29.1.0';
import {kit} from './shared.js?v=29.1.0';
import {audio} from '../core/audio.js?v=29.1.0';
import {possibleTargets} from '../combat/targets.js?v=29.1.0';
import {hitTarget} from '../combat/damage.js?v=29.1.0';
import {getSepulcherBlockers,checkSepulcherCollision} from '../combat/sepulcher-blocking.js?v=29.1.0';
import {damageSepulcherArea} from '../combat/sepulcher-damage.js?v=29.1.0';
import {updateMageDebuffs} from '../combat/mage-debuffs.js?v=29.1.0';
import {getTerrain} from '../world/terrain.js?v=29.1.0';
export function initializeRanger(g){if(g.player.weapon===1)g.player.gel=C.gel;}
export function rangerState(){const k=kit();return k.photo??={clock:0,step:0,ticks:0,active:false,photoTimer:0,flames:[],lights:[],clusters:[],pulses:[],effects:[],effectId:0,fireHits:new Map(),fireFrames:0,emittedLights:0,altUntil:0,forced:0};}
function effect(k,kind,x,y,r=1,angle=0){k.effects.push({kind,x,y,r,angle,at:k.clock,id:++k.effectId});if(k.effects.length>48)k.effects.shift();}
const origin=g=>photoGeometry(g).primary;
function ammo(g,secondary=false){if(!(g.player.gel>0))return false;if(Math.random()<(secondary?C.secondaryAmmoChance:C.primaryAmmoChance))g.player.gel--;return true;}
function hit(g,q,t,duration=20){hitTarget(t,q.damage*(Math.random()<C.crit?2:1),t.x,t.y,'#a7ffcf','ranger',false);t.miracleBlight=Math.max(t.miracleBlight||0,duration);const k=g.player.kit.photo;if(k){if(q.kind!=='light'&&k.clock>=(k.hitAudioUntil??0)){audio.fx('photoHit');k.hitAudioUntil=k.clock+(q.kind==='cluster'?10:16)/60;}effect(k,'hit',t.x,t.y,q.kind==='cluster'?1.8:1);}}
function activate(k){if(!k.active){k.active=true;k.age=0;k.fireFrames=0;}}
function primary(g,k){
 if(!ammo(g))return false;const o=origin(g);if(k.photoTimer===1){effect(k,'warm',o.x,o.y,1,o.a);audio.fx('photoWarm');}audio.pitchRanger?.(k.photoTimer);const damage=C.damage*C.damageBonus*Math.max(0,1-k.photoTimer/59.9);
 k.flames.push({...o,front:0,age:0,damage,life:240/(180*60)});k.visual={...o,range:0,age:0};k.fireFrames++;
 if(k.age===0||k.age%55===0)audio.fx('photoUse');
 if(k.fireFrames>=C.lightGate&&k.photoTimer===0){k.fireFrames=0;const s=photoGeometry(g).light,t=nearest(s.x,s.y,25000,true);
  for(const side of [-1,1]){const a=o.a+side*.2;k.lights.push({kind:'light',x:s.x,y:s.y,ox:s.x,oy:s.y,dx:Math.cos(a),dy:Math.sin(a),tx:t?t.x+(t.vx||0)*5/60:null,ty:t?t.y+(t.vy||0)*5/60:null,ticks:0,left:210,side,damage:C.damage*C.damageBonus,trail:[]});k.emittedLights++;}audio.fx('photoLight');
 }
 return true;
}
export function attackRanger(){const g=state.game,k=rangerState();if(g.player.weapon!==1||!(g.player.gel>0)||state.pointer.altFire)return;kit().lastFire=g.t;g.player.fireCd=1/60;if(!k.active){activate(k);primary(g,k);k.skipFirst=true;}}
export function activateRanger(){const g=state.game,k=rangerState();if(g.player.weapon!==1||g.mode!=='playing'||g.ritual||k.clock<k.altUntil-1e-8||!ammo(g,true))return;activate(k);const o=origin(g);k.clusters.push({...o,kind:'cluster',vx:o.dx*6*2.5*120,vy:o.dy*6*2.5*120,damage:C.damage*C.damageBonus*C.secondaryDamage,left:420,hits:new Map(),pierce:5,trail:[]});k.altUntil=k.clock+C.secondaryCooldown;k.forced=25;kit().abilityCd=C.secondaryCooldown;audio.stopRanger?.();effect(k,'alternate',o.x,o.y,1,o.a);audio.fx('photoAlt');}
export function updateRanger(){}
function nearest(x,y,range=600,predict=false){let best=null;for(const t of possibleTargets()){if(t.hp<=0)continue;const d=Math.hypot(t.x+(predict?(t.vx||0)*5/60:0)-x,t.y+(predict?(t.vy||0)*5/60:0)-y);if(d<range){range=d;best=t;}}return best;}
function burst(g,k,q,timeout){const radius=65*(timeout?3.4+Math.random()*.8:.8+Math.random()*.8);for(const t of possibleTargets())if(t.hp>0&&Math.hypot(t.x-q.x,t.y-q.y)<radius+t.r)hit(g,q,t,6);damageSepulcherArea(g,q.x,q.y,radius,q.damage);k.pulses.push({x:q.x,y:q.y,r:radius,life:.3,max:.3});effect(k,'burst',q.x,q.y,radius);audio.fx('photoExplosion');}
function collisions(g,k,q,x,y,nx,ny,r,blockers){
 const wall=checkSepulcherCollision(x,y,nx,ny,r,blockers),end=wall.hit?wall.t:1,targets=[];
 for(const t of possibleTargets()){if(t.hp<=0)continue;const h=checkSepulcherCollision(x,y,nx,ny,r,[{x:t.x,y:t.y,radius:t.r}]);if(h.hit&&h.t<=end)targets.push({t,at:h.t});}
 targets.sort((a,b)=>a.at-b.at);return {wall,targets};
}
function projectiles(g,k,blockers){
 let visual=null;
 for(const f of k.flames){const old=f.front;f.front=Math.min(C.range,f.front+C.fireSpeed/120);f.life-=1/120;const nx=f.x+f.dx*f.front,ny=f.y+f.dy*f.front,h=collisions(g,k,f,f.x+f.dx*old,f.y+f.dy*old,nx,ny,15,blockers);
  for(const {t}of h.targets)if(f.damage>0&&(k.fireHits.get(t)??-Infinity)<=k.clock+1e-9){hit(g,f,t);k.fireHits.set(t,k.clock+C.npcCooldown);}
  if(h.wall.hit){f.front=old+(f.front-old)*h.wall.t;f.life=0;}if(!visual||f.front>visual.range)visual={x:f.x,y:f.y,a:f.a,range:f.front,age:0};
 }k.flames=k.flames.filter(f=>f.life>1e-9);
 for(const q of k.lights){const x=q.x,y=q.y,time=q.ticks;
  if(q.tx!==null&&time===120){q.dead=true;burst(g,k,q,true);continue;}
  if(q.tx===null){q.x+=q.dx*6;q.y+=q.dy*6;}
  else if(time<=60){q.x=q.ox+(q.tx-q.ox)*time/60-q.dy*Math.sin(time/70*Math.PI*2)*75*q.side+q.dx*6;q.y=q.oy+(q.ty-q.oy)*time/60+q.dx*Math.sin(time/70*Math.PI*2)*75*q.side+q.dy*6;}
  else{const radius=Math.max(5,90*Math.min(1,(time-60)/15)*Math.min(1,(120-time)/15)*(1+Math.cos(g.t/24)*.25)),a=(time-60)/60*Math.PI*4+(q.side===-1?Math.PI:0);q.x=q.tx+Math.cos(a)*radius+q.dx*6;q.y=q.ty+Math.sin(a)*radius+q.dy*6;}
  const h=collisions(g,k,q,x,y,q.x,q.y,10*(.001+.999*Math.min(1,time/25)),blockers);
  if(h.targets.length){const t=h.targets[0];q.x=x+(q.x-x)*t.at;q.y=y+(q.y-y)*t.at;hit(g,q,t.t,6);q.dead=true;burst(g,k,q,false);}
  else if(h.wall.hit)q.dead=true;
  if(q.tx!==null)q.ticks++;q.left--;if(!q.dead&&q.left<=0){q.dead=true;burst(g,k,q,false);}q.trail.push({x:q.x,y:q.y});if(q.trail.length>36)q.trail.shift();
 }k.lights=k.lights.filter(q=>!q.dead);
 for(const q of k.clusters){const x=q.x,y=q.y,t=nearest(x,y);if(t){const a=Math.atan2(t.y-y,t.x-x);q.vx=(q.vx*19+Math.cos(a)*12*120)/20;q.vy=(q.vy*19+Math.sin(a)*12*120)/20;}
  q.x+=q.vx/120;q.y+=q.vy/120;const h=collisions(g,k,q,x,y,q.x,q.y,25,blockers);
  for(const {t,at}of h.targets)if((q.hits.get(t)??-Infinity)<=k.clock+1e-9){hit(g,q,t);q.hits.set(t,k.clock+22/120);q.pierce--;if(q.pierce<=0){q.x=x+(q.x-x)*at;q.y=y+(q.y-y)*at;break;}}
  if(h.wall.hit)q.left=0;
  // Existing world floor/platforms stand in for native solid tiles, not arena forcefields.
  if(!q.hits.size&&q.vy>0){const terrain=getTerrain();let floor=terrain.floorY;for(const p of terrain.platforms)if(x>=p.l&&x<=p.r&&y+25<=p.y&&q.y+25>=p.y)floor=Math.min(floor,p.y);if(y+25<=floor&&q.y+25>=floor){q.y=floor-25;q.vy=-q.vy;if(!q.postTileHit){effect(k,'bounce',q.x,q.y);audio.fx('photoBounce');q.postTileHit=true;}}}
  q.left--;q.trail.push({x:q.x,y:q.y});if(q.trail.length>24)q.trail.shift();
 }k.clusters=k.clusters.filter(q=>q.left>0&&q.pierce>0);
 for(const p of k.pulses)p.life-=1/120;k.pulses=k.pulses.filter(p=>p.life>0).slice(-24);
 k.effects=k.effects.filter(e=>k.clock-e.at<1);
 if(visual)k.visual=visual;else if(k.visual)k.visual.age+=1/120;
}
export function updateRangerCombat(dt){
 const g=state.game;if(g.player.weapon!==1||g.mode!=='playing'||g.ritual)return;const k=rangerState();k.step+=dt*120;const hosts=[...new Set([g.boss,...g.hearts,...g.brothers,...g.seekers])],vulnerable=new Set(possibleTargets());
 while(k.step+1e-9>=1){k.step=Math.max(0,k.step-1);k.clock+=1/120;updateMageDebuffs(1/120,g,hosts,vulnerable);
  if(Math.round(k.clock*120)%2===0){k.ticks++;const alt=!!state.pointer.altFire,primaryHeld=!alt&&(state.pointer.fire||state.mobileFire||state.aimHeld||state.keys.j||state.deviceMode==='mobile'&&state.mobileAutoAim&&possibleTargets().length>0);
   if((primaryHeld||alt)&&g.player.gel>0){activate(k);if(k.photoTimer>0)k.photoTimer--;if(alt){audio.stopRanger?.();if(k.clock>=k.altUntil-1e-9)activateRanger();}else if(k.skipFirst)k.skipFirst=false;else primary(g,k);k.age++;}
   else if(k.forced>0){k.forced--;if(k.photoTimer>0)k.photoTimer--;}
   else if(k.active){k.active=false;k.photoTimer=90;audio.stopRanger?.();}
  }
  projectiles(g,k,getSepulcherBlockers(g));
 }kit().abilityCd=Math.max(0,k.altUntil-k.clock);
}
