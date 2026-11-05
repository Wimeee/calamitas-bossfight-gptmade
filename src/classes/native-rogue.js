import {rogueConfig as C} from '../../config/rogue.js?v=30.0.0';
import {kit,beginAttack} from './shared.js?v=30.0.0';
import {state} from '../core/state.js?v=30.0.0';
import {audio} from '../core/audio.js?v=30.0.0';
import {getSepulcherBlockers} from '../combat/sepulcher-blocking.js?v=30.0.0';
import {possibleTargets} from '../combat/targets.js?v=30.0.0';
import {updateMageDebuffs} from '../combat/mage-debuffs.js?v=30.0.0';
import {rogueHoming,rogueSweep,updateRogueAuxiliary} from './rogue-combat.js?v=30.0.0';
export function rogueState(){return kit().rogue??={clock:0,ticks:0,step:0,stealthStep:0,itemTicks:0,acceleration:1,shots:[],heals:[],effects:[],sparkHits:new Map(),chargeMode:false,ready:false,raiderUntil:0,flareUntil:0,minisSpawned:0,lifeSteal:C.lifeStealCap};}
export function initializeRogue(g){if(g.player.weapon!==4)return;g.player.stealth=0;rogueState();}
export function rogueStrikeAvailable(){return state.game.player.stealth+1e-9>=C.strikeCost;}
export function rogueThrowDamage(g=state.game){const p=g.player,stealth=p.stealth*C.maxStealth,use=.75+.75*Math.log(24)/Math.log(4),gen=Math.max(4**(2/3),1.5);return Math.floor(C.damage*(C.damageBonus+(p.hp>=p.maxHp?.1:0)+stealth*.42*use*gen)*(rogueStrikeAvailable()?.8:1));}
export function throwCelestus(w,a){const g=state.game,p=g.player,k=rogueState();if(kit().blades.length>=C.maxBlades)return false;
 const charged=rogueStrikeAvailable(),damage=rogueThrowDamage(g);p.stealth=charged?Math.max(0,p.stealth-C.strikeCost):0;k.acceleration=1;k.itemTicks=22;k.ready=false;
 kit().blades.push({kind:'blade',x:p.x,y:p.y,vx:Math.cos(a)*C.velocity,vy:Math.sin(a)*C.velocity,r:66,age:0,phase:0,returning:false,charged,damage,dmg:damage,speed:C.velocity,left:3600,rotation:0,hits:new Map(),trail:[]});audio.fx('rogueThrow');return true;
}
export function attackRogue(w){const g=state.game,k=rogueState();if(k.chargeMode&&g.player.stealth<1-1e-9||kit().blades.length>=C.maxBlades)return;if(!beginAttack(w))return;const p=g.player;if(throwCelestus(w,Math.atan2(state.pointer.y-p.y,state.pointer.x-p.x)))p.fireCd=C.useTime;}
export function activateRogue(){rogueState().chargeMode=!rogueState().chargeMode;}
export function updateRogue(dt){const g=state.game;if(g.player.weapon!==4||g.mode!=='playing'||g.ritual&&g.ritual.phase!=='preparation')return;const p=g.player,k=rogueState();k.stealthStep+=dt*60;
 while(k.stealthStep+1e-9>=1){k.stealthStep=Math.max(0,k.stealthStep-1);if(k.itemTicks>0){k.itemTicks--;continue;}k.acceleration=Math.min(1.5,k.acceleration+.005);const standstill=Math.abs(p.vx||0)<=.1&&Math.abs(p.vy||0)<=.1,rate=standstill?1:.5*k.acceleration;p.stealth=Math.min(1,p.stealth+rate/120);if(p.stealth>=1-1e-9&&!k.ready){p.stealth=1;k.ready=true;audio.fx('rogueReady');}}
}
function approach(v,target){if(v<target){v+=5;if(v<0&&target>0)v+=5;}else if(v>target){v-=5;if(v>0&&target<0)v-=5;}return v;}
function bladeStep(g,k,q,blockers){
 if(q.dead)return;q.age++;q.rotation+=1;
 if(q.phase===0){q.outbound=(q.outbound||0)+1;if(q.outbound>=40){q.phase=1;q.returning=true;}}
 else if(q.phase===1){const dx=g.player.x-q.x,dy=g.player.y-q.y,d=Math.hypot(dx,dy)||1;if(d>4000){q.dead=true;return;}q.vx=approach(q.vx,dx/d*25);q.vy=approach(q.vy,dy/d*25);
  if(Math.abs(dx)<76&&Math.abs(dy)<87){if(q.charged){q.vx*=-1;q.vy*=-1;q.phase=2;q.left=600;q.penetration=1;}else{q.dead=true;return;}}
 }else rogueHoming(q,250,q.speed,20);
 const x=q.x,y=q.y;q.x+=q.vx;q.y+=q.vy;rogueSweep(g,k,q,x,y,blockers);q.left--;if(q.left<=0)q.dead=true;q.trail.push({x,y});if(q.trail.length>8)q.trail.shift();
}
export function updateRogueCombat(dt){const g=state.game;if(g.player.weapon!==4||g.mode!=='playing'||g.ritual)return;const k=rogueState();k.step+=dt*60;
 while(k.step+1e-9>=1){k.step=Math.max(0,k.step-1);k.clock+=1/60;k.ticks++;k.lifeSteal=Math.min(C.lifeStealCap,k.lifeSteal+C.lifeStealRecovery/60);const blockers=getSepulcherBlockers(g);
  for(const q of kit().blades){for(let i=0;i<4&&!q.dead;i++)bladeStep(g,k,q,blockers);if(!q.dead&&k.ticks%8===0)audio.fx('rogueSpin');
   if(!q.dead&&k.ticks%30===0&&k.shots.filter(s=>s.kind==='nano'&&!s.dead).length<5)k.shots.push({kind:'nano',x:q.x,y:q.y,vx:0,vy:0,r:13,left:3600,age:0,rotation:0,damage:60*C.damageBonus,hits:new Map(),trail:[]});}
  kit().blades=kit().blades.filter(q=>!q.dead);updateRogueAuxiliary(g,k);
  const hosts=[...new Set([g.boss,...g.hearts,...g.brothers,...g.seekers])];updateMageDebuffs(1/60,g,hosts,new Set(possibleTargets()),C.outgoingMultiplier);
 }
}
