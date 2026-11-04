import {summonerConfig as C} from '../../config/summoner.js?v=29.1.1';
import {state} from '../core/state.js?v=29.1.1';
import {audio} from '../core/audio.js?v=29.1.1';
import {possibleTargets} from '../combat/targets.js?v=29.1.1';
import {checkSepulcherCollision} from '../combat/sepulcher-blocking.js?v=29.1.1';
import {damageSepulcherArea,damageSepulcherWhere} from '../combat/sepulcher-damage.js?v=29.1.1';
import {nativeWhipPoints} from './whip-motion.js?v=29.1.1';
import {summonTarget,summonPulse,summonHit,updateSummonShots,updateSummonDebuffs} from './summoner-combat.js?v=29.1.1';
export function summonerState(){return state.game.player.summonState??={clock:0,step:0,ticks:0,potionTime:C.potionDuration,shots:[],pulses:[],effectId:0,volleys:0,emittedBolts:0,emittedStars:0};}
export function summonerCapacity(g=state.game){return C.baseSlots+(g.player.summonState?.potionTime>0?C.potionSlots:0);}
export function summonSquad(){
 const g=state.game,p=g.player;if(p.cosmic?.length&&p.summonState)return;const k=summonerState();if(p.mana<20)return;p.mana-=20;p.maxMinions=summonerCapacity(g);
 p.cosmic=[{kind:'cosmic',slots:10,x:p.x,y:p.y-60,vx:0,vy:0,cooldown:100,damage:C.cosmicDamage*C.damageBonus,rotation:0},{kind:'draconid',slots:5,x:p.x-80,y:p.y-80,vx:0,vy:0,attack:0,ram:0,rebound:0,frame:0,side:1,damage:C.draconidDamage*C.damageBonus,hits:new Map()}];audio.fx('summonNative');summonPulse(k,'summon',p.x,p.y,65);
}
export function lashWhip(){const g=state.game,p=g.player;if(p.fireCd>0||g.mode!=='playing'||g.ritual||g.stage==='accept')return;const angle=Math.atan2(state.pointer.y-p.y,state.pointer.x-p.x);p.fireCd=C.whipTime;p.whip={age:0,time:C.whipTime,max:C.whipTime,angle,side:Math.cos(angle)<0?-1:1,hits:new Set(),wormHits:new Set(),damage:C.whipDamage*C.damageBonus};audio.fx('summonWhip');}
export function markCosmicTarget(x,y){const g=state.game;if(!g||g.mode!=='playing'||g.ritual)return;let nearest=null,best=Infinity;for(const t of possibleTargets())if(t.hp>0){const d=Math.hypot(t.x-x,t.y-y);if(d<best){best=d;nearest=t;}}g.player.cosmicMark=nearest;}
export function commandVolley(target){state.game.player.cosmicMark=target;}
export function activateSummoner(){markCosmicTarget(state.pointer.x,state.pointer.y);}
export function attackSummoner(){const p=state.game.player;if(!p.cosmic?.length){summonSquad();return;}lashWhip();}
function whipStep(g,k){const w=g.player.whip;if(!w)return;w.age+=1/120;w.time=Math.max(0,w.max-w.age);w.points=nativeWhipPoints(g,w);
 if(!w.cracked&&w.age>=w.max/2){w.cracked=true;audio.fx('summonCrack');summonPulse(k,'crack',w.points.at(-1).x,w.points.at(-1).y,20);}
 const touches=t=>{for(let i=1;i<w.points.length;i++)if(checkSepulcherCollision(w.points[i-1].x,w.points[i-1].y,w.points[i].x,w.points[i].y,9,[{x:t.x,y:t.y,radius:t.r}]).hit)return true;return false;};
 for(const t of possibleTargets())if(t.hp>0&&!w.hits.has(t)&&touches(t)){summonHit(g,k,{kind:'whip',damage:w.damage,x:t.x,y:t.y},t,false);w.hits.add(t);w.damage*=.9;t.whipMarkedUntil=g.t+C.tagTime;t.summonTagUntil=k.clock+C.tagTime;g.player.cosmicMark=t;}
 damageSepulcherWhere(g,t=>{const id=t.ref;if(w.wormHits.has(id)||!touches(t))return false;w.wormHits.add(id);return true;},w.damage);if(w.age>=w.max-1e-9)g.player.whip=null;
}
function cosmicStep(g,k,m){const target=summonTarget(g,m.x,m.y,1400),distPlayer=Math.hypot(m.x-g.player.x,m.y-g.player.y);m.rotation+=m.vx*.1;if(distPlayer>(target?2400:1600))m.returning=true;
 let tx,ty,speed;if(target&&!m.returning){tx=target.x-m.x;ty=target.y-m.y;const d=Math.hypot(tx,ty);speed=d>200?6:-4;}else{tx=g.player.x-m.x;ty=g.player.y-60-m.y;const d=Math.hypot(tx,ty);speed=m.returning?15:d>200?8:6;if(d<800)m.returning=false;if(d<70)speed=0;if(d>2000){m.x=g.player.x;m.y=g.player.y;}}
 const d=Math.hypot(tx,ty)||1;if(speed){m.vx=(m.vx*40+tx/d*speed)/41;m.vy=(m.vy*40+ty/d*speed)/41;}else if(m.vx===0&&m.vy===0){m.vx=-.15;m.vy=-.05;}m.x+=m.vx;m.y+=m.vy;
 if(m.cooldown>0){m.cooldown--;return;}const shoot=summonTarget(g,m.x,m.y,1200,true);if(!shoot)return;const count=5+Math.floor(Math.random()*3);for(let i=0;i<count;i++){let x=Math.random()*2-1,y=Math.random()*2-1;if(x===0&&y===0)x=1;const d=Math.hypot(x,y),s=7+Math.random()*3;k.shots.push({kind:'bolt',x:m.x,y:m.y,vx:x/d*s,vy:y/d*s,r:9,left:300,age:0,damage:m.damage*.5});}const a=Math.atan2(shoot.y-m.y,shoot.x-m.x);k.shots.push({kind:'star',x:m.x,y:m.y,vx:Math.cos(a)*15,vy:Math.sin(a)*15,r:12,left:600,age:0,damage:m.damage});k.volleys++;k.emittedBolts+=count;k.emittedStars++;m.cooldown=100;audio.fx('summonVolley');}
function draconidStep(g,k,m){const target=summonTarget(g,m.x,m.y,2000),dPlayer=Math.hypot(m.x-g.player.x,m.y-g.player.y);m.frame=(m.ram>0||m.rebound>0?6:0)+Math.floor(k.clock*60/8)%(m.ram>0||m.rebound>0?4:6);if(dPlayer>4000){m.x=g.player.x;m.y=g.player.y;return;}
 if(m.rebound>0){m.vx*=.97;m.vy*=.97;m.rebound--;}
 else if(!target){const dx=g.player.x-m.x,dy=g.player.y-71-m.y,d=Math.hypot(dx,dy)||1;if(d>60){m.vx=(m.vx*19+dx/d*11)/20;m.vy=(m.vy*19+dy/d*11)/20;}if(Math.abs(dx)>45)m.side=dx<0?1:-1;m.attack=0;}
 else{const dx=target.x-m.x,dy=target.y-m.y,d=Math.hypot(dx,dy)||1;if(d>220){const blend=.05+.25*Math.max(0,Math.min(1,(d-300)/260));m.vx=m.vx*(1-blend)+dx/d*14*blend;m.vy=m.vy*(1-blend)+dy/d*14*blend;m.side=dx<0?1:-1;if(m.attack%20===19){const x=m.x+m.side*10,a=Math.atan2(target.y-m.y,target.x-x),speed=45+(d-220)*.015;k.shots.push({kind:'fireball',x,y:m.y,vx:Math.cos(a)*speed,vy:Math.sin(a)*speed,r:17,initialSpeed:speed,left:300,age:0,damage:m.damage});audio.fx('summonFire');}}
  else if(m.ram<=0){m.ram=60;m.vx=dx/d*23;m.vy=dy/d*23;}m.attack++;
 }
 const x=m.x,y=m.y;m.x+=m.vx;m.y+=m.vy;
 for(const t of possibleTargets())if(t.hp>0&&(m.hits.get(t)??-Infinity)<=k.clock&&checkSepulcherCollision(x,y,m.x,m.y,50,[{x:t.x,y:t.y,radius:t.r}]).hit){summonHit(g,k,{kind:'draconid',damage:m.damage*(m.ram>0?2:1),x:m.x,y:m.y},t);m.hits.set(t,k.clock+18/120);if(m.ram>0){m.ram=0;m.rebound=30;m.vx*= -.6;m.vy*= -.6;summonPulse(k,'ram',m.x,m.y,90);}}
 if(k.clock>=(m.wormAt??0)){damageSepulcherArea(g,m.x,m.y,50,m.damage);m.wormAt=k.clock+18/120;}
}
export function updateCosmic(dt){const g=state.game,p=g.player;if(p.weapon!==3||g.mode!=='playing'||g.ritual||!p.cosmic?.length)return;const k=summonerState();k.step+=dt*120;
 while(k.step+1e-9>=1){k.step=Math.max(0,k.step-1);k.clock+=1/120;k.ticks++;k.potionTime=Math.max(0,k.potionTime-1/120);p.maxMinions=summonerCapacity(g);if(p.maxMinions<15&&p.cosmic.length>1)p.cosmic.splice(1);if(p.cosmicMark&&!possibleTargets().includes(p.cosmicMark))p.cosmicMark=null;
  updateSummonDebuffs(g,k,1/120);whipStep(g,k);for(const m of p.cosmic){if(m.kind==='cosmic')cosmicStep(g,k,m);else draconidStep(g,k,m);}if(k.ticks%2===0)updateSummonShots(g,k);k.pulses=k.pulses.filter(e=>k.clock-e.at<.8);
 }
}
