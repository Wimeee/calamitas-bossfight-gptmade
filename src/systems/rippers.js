import { updateRipperVisuals } from './ripper-visuals.js?v=26.0.2';
export { updateRipperVisuals };
import { rippersConfig as c } from '../../config/rippers.js?v=26.0.2';
import { state } from '../core/state.js?v=26.0.2';
import { audio } from '../core/audio.js?v=26.0.2';
import { clamp } from '../core/math.js?v=26.0.2';

export function makeRippers(difficulty){return {enabled:difficulty==='revenge'||difficulty==='death',rage:0,adrenaline:0,rageTime:0,adrenalineTime:0,rageReadyAt:null,adrenalineReadyAt:null,rageSoundCooldown:0,pause:0,combat:0};}
export function proximityRage(distance){
  if(distance>c.rageFar)return 0;
  const d=Math.max(0,distance-c.rageNear);
  return clamp(1/(.034*d+2)+(590.5-d)/1181,0,1);
}
export function updateRippers(dt,g){
  const r=g.rippers;if(!r?.enabled||g.mode!=='playing'||g.ritual)return;
  if(g.stage==='accept'){r.rage=0;r.adrenaline=0;r.rageTime=0;r.adrenalineTime=0;return;}
  const oldRage=r.rage,oldAdrenaline=r.adrenaline,oldRageTime=r.rageTime;
  r.rageSoundCooldown=Math.max(0,(r.rageSoundCooldown||0)-dt);
  const fadeTime=Math.max(0,dt-r.combat);
  r.combat=Math.max(0,r.combat-dt);
  if(r.rageTime>0){r.rageTime=Math.max(0,r.rageTime-dt);r.rage=r.rageTime/c.rageDuration;}
  else{
    // Boss-sized targets grant triple the ordinary enemy rate. Segments never stack.
    const targets=[g.boss,...g.brothers,...g.seekers,...g.hearts];
    // Minions are ordinary NPCs; only Calamitas gets the 3x boss rate.
    // Native NPC hitbox half-sizes (not the larger rendered sprite sizes).
    if(g.stage==='hearts'&&g.sepulcher){const w=g.sepulcher;
      targets.push({x:w.x,y:w.y,r:32,hp:1});
      for(const n of w.nodes||[])targets.push({x:n.x,y:n.y,r:n.isTail||n.isEnergyBall?10:24,hp:1});
      for(const arm of w.arms||[])targets.push({x:arm.poseX??arm.x,y:arm.poseY??arm.y,r:24,hp:1});
    }
    let gain=0;
    for(const target of targets)if(target.hp>0&&Number.isFinite(target.x)&&Number.isFinite(target.y)){
      const d=Math.hypot(target.x-g.player.x,target.y-g.player.y)-(target.r||0);
      const rate=proximityRage(d)/(target===g.boss?c.rageBossCharge:c.rageEnemyCharge);
      gain=Math.max(gain,rate);
    }
    if(gain>0){r.combat=Math.max(r.combat,3/60);r.rage=Math.min(1,r.rage+gain*dt);}
    else if(r.combat===0)r.rage=Math.max(0,r.rage-fadeTime/c.rageFadeTime);
  }
  if(r.adrenalineTime>0){r.adrenalineTime=Math.max(0,r.adrenalineTime-dt);r.adrenaline=r.adrenalineTime/c.adrenalineDuration;}
  else{
    const chargeTime=Math.max(0,dt-r.pause);r.pause=Math.max(0,r.pause-dt);
    r.adrenaline=Math.min(1,r.adrenaline+chargeTime/c.adrenalineCharge);
  }
  if(r.rage>1-1e-9)r.rage=1;
  if(r.adrenaline>1-1e-9)r.adrenaline=1;
  if(r.rageTime<1e-9)r.rageTime=0;
  if(r.adrenalineTime<1e-9)r.adrenalineTime=0;
  if(oldRage<1&&r.rage>=1){r.rageReadyAt=g.t;if(!r.rageSoundCooldown){audio.fx('rageReady');r.rageSoundCooldown=5;}}
  if(oldAdrenaline<1&&r.adrenaline>=1){r.adrenalineReadyAt=g.t;audio.fx('adrenalineReady');}
  if(oldRageTime>0&&r.rageTime===0)audio.fx('rageEnd');
  updateRipperVisuals(g,dt);
}
export function activateRipper(kind){
  const g=state.game,r=g?.rippers;
  if(!r?.enabled||g.mode!=='playing'||g.ritual||g.stage==='accept')return false;
  if(kind!=='rage'&&kind!=='adrenaline')return false;
  const time=kind+'Time';if(r[kind]<1||r[time]>0)return false;
  r[time]=kind==='rage'?c.rageDuration:c.adrenalineDuration;
  audio.fx(kind==='rage'?'rageActivate':'adrenalineActivate');return true;
}
export function ripperDamage(g=state.game){
  const r=g?.rippers;if(!r?.enabled)return 1;
  return 1+(r.rageTime>0?c.rageMultiplier-1:0)+(r.adrenalineTime>0?c.adrenalineMultiplier-1:0);
}
export function ripperHit(g,damage){
  const r=g.rippers;if(!r?.enabled||damage<=0)return damage;
  r.combat=c.rageFadeDelay;
  if(r.adrenalineTime>0)return damage;
  const full=r.adrenaline>=1;
  r.pause+=c.adrenalinePause;
  if(full)audio.fx('adrenalineLost');
  const loss=c.adrenalineMinLoss+(1-c.adrenalineMinLoss)*clamp(damage/g.player.maxHp/c.adrenalineFullLossHP,0,1);
  r.adrenaline=full?0:r.adrenaline*(1-loss);
  return full?Math.max(1,Math.round(damage*(1-c.fullAdrenalineDR))):damage;
}
export function ripperCombat(g=state.game){if(g?.rippers?.enabled)g.rippers.combat=c.rageFadeDelay;}
