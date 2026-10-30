import { rippersConfig as c } from '../../config/rippers.js?v=22.0.0';
import { state } from '../core/state.js?v=22.0.0';
import { audio } from '../core/audio.js?v=22.0.0';
import { clamp } from '../core/math.js?v=22.0.0';

export function makeRippers(difficulty){return {enabled:difficulty==='revenge'||difficulty==='death',rage:0,adrenaline:0,rageTime:0,adrenalineTime:0,pause:0,combat:0};}
export function proximityRage(distance){
  if(distance>c.rageFar)return 0;
  const d=Math.max(0,distance-c.rageNear);
  return clamp(1/(.034*d+2)+(590.5-d)/1181,0,1);
}
export function updateRippers(dt,g){
  const r=g.rippers;if(!r?.enabled||g.mode!=='playing'||g.ritual)return;
  if(g.stage==='accept'){r.rage=0;r.adrenaline=0;r.rageTime=0;r.adrenalineTime=0;return;}
  const oldRage=r.rage,oldAdrenaline=r.adrenaline;
  const fadeTime=Math.max(0,dt-r.combat);
  r.combat=Math.max(0,r.combat-dt);
  if(r.rageTime>0){r.rageTime=Math.max(0,r.rageTime-dt);r.rage=r.rageTime/c.rageDuration;}
  else{
    // Boss-sized targets grant triple the ordinary enemy rate. Segments never stack.
    const targets=[g.boss,...g.brothers,...g.seekers];
    let gain=0;
    for(const target of targets)if(target.hp>0){
      const d=Math.hypot(target.x-g.player.x,target.y-g.player.y)-(target.r||0)-10;
      const rate=proximityRage(d)/(target===g.boss||g.brothers.includes(target)?c.rageBossCharge:c.rageEnemyCharge);
      gain=Math.max(gain,rate);
    }
    if(gain>0){r.combat=c.rageFadeDelay;r.rage=Math.min(1,r.rage+gain*dt);}
    else if(r.combat===0)r.rage=Math.max(0,r.rage-fadeTime/c.rageFadeTime);
  }
  if(r.adrenalineTime>0){r.adrenalineTime=Math.max(0,r.adrenalineTime-dt);r.adrenaline=r.adrenalineTime/c.adrenalineDuration;}
  else{
    const chargeTime=Math.max(0,dt-r.pause);r.pause=Math.max(0,r.pause-dt);
    r.adrenaline=Math.min(1,r.adrenaline+chargeTime/c.adrenalineCharge);
  }
  if(oldRage<1&&r.rage>=1||oldAdrenaline<1&&r.adrenaline>=1)audio.fx('pickup');
}
export function activateRipper(kind){
  const g=state.game,r=g?.rippers;
  if(!r?.enabled||g.mode!=='playing'||g.ritual||g.stage==='accept')return false;
  if(kind!=='rage'&&kind!=='adrenaline')return false;
  const time=kind+'Time';if(r[kind]<1||r[time]>0)return false;
  r[time]=kind==='rage'?c.rageDuration:c.adrenalineDuration;
  audio.fx('phase');return true;
}
export function ripperDamage(g=state.game){
  const r=g?.rippers;if(!r?.enabled)return 1;
  return (r.rageTime>0?c.rageMultiplier:1)*(r.adrenalineTime>0?c.adrenalineMultiplier:1);
}
export function ripperHit(g,damage){
  const r=g.rippers;if(!r?.enabled)return damage;
  r.combat=c.rageFadeDelay;
  if(r.adrenalineTime>0)return damage;
  const full=r.adrenaline>=1;
  r.pause=c.adrenalinePause;
  const loss=c.adrenalineMinLoss+(1-c.adrenalineMinLoss)*clamp(damage/g.player.maxHp/c.adrenalineFullLossHP,0,1);
  r.adrenaline=full?0:r.adrenaline*(1-loss);
  return full?Math.max(1,Math.round(damage*(1-c.fullAdrenalineDR))):damage;
}
export function ripperCombat(g=state.game){if(g?.rippers?.enabled)g.rippers.combat=c.rageFadeDelay;}
