import { updateCamera } from '../world/camera.js?v=22.1.0';
import { getTerrain } from '../world/terrain.js?v=22.1.0';
import { updatePlayerMovement } from './movement.js?v=22.1.0';
import { updateRitual } from './ritual.js?v=22.1.0';
import { playerConfig } from '../../config/player.js?v=22.1.0';
import { getEncounter } from '../boss/registry.js?v=22.1.0';
import { classRegistry, weapons } from '../classes/registry.js?v=22.1.0';
import { updateClassKit } from '../classes/shared.js?v=22.1.0';
import { shoot } from '../combat/attacks.js?v=22.1.0';
import { updateBullets } from '../combat/projectiles.js?v=22.1.0';
import { possibleTargets } from '../combat/targets.js?v=22.1.0';
import { arena } from '../core/arena.js?v=22.1.0';
import { audio } from '../core/audio.js?v=22.1.0';
import { TAU } from '../core/config.js?v=22.1.0';
import { clamp, rnd } from '../core/math.js?v=22.1.0';
import { state } from '../core/state.js?v=22.1.0';
import { updateSystems } from '../systems/index.js?v=22.1.0';
import { ui } from '../ui/hud.js?v=22.1.0';


function update(dt){
  let g=state.game,p=g.player;
  if(g.mode!=='playing')return;
  if(g.ritual){updateRitual(dt);return;}
  g.t+=dt;
  g.totalTime+=dt;
  updateSystems(dt,g);
  audio.tick(g);
  g.stageT+=dt;
  g.dialogT=Math.max(0,g.dialogT-dt);
  p.fireCd=Math.max(0,p.fireCd-dt);
  p.weaponKick=Math.max(0,(p.weaponKick||0)-dt);
  if(p.beamPulse){
    p.beamPulse.life=Math.max(0,p.beamPulse.life-dt);
    if(!p.beamPulse.life)p.beamPulse=null;
  }
  p.channelCharge=clamp((p.channelCharge||0)+(g.t-(p.lastChannelAt??-99)<.2?dt*1.25:-dt*2),0,1);
  if(p.whip){
    p.whip.time=Math.max(0,p.whip.time-dt);
    if(p.whip.time<=0)p.whip=null;
  }
  p.iframes=Math.max(0,p.iframes-dt);
  p.dashCd=Math.max(0,p.dashCd-dt);
  p.contactGuard=Math.max(0,p.contactGuard-dt);
  p.potionCd=Math.max(0,p.potionCd-dt);
  p.mana=Math.min(p.maxMana,p.mana+playerConfig.manaRegeneration*dt);
  updateClassKit(dt);
  p.regenPotionT=Math.max(0,p.regenPotionT-dt);
  // Natural healing builds while not recently hit, with local Terraria-inspired buffs.
  const calmTime=Math.max(0,g.t-p.lastHit),naturalRegen=2.5+Math.min(4.5,calmTime*.45);
  const campfireBonus=Math.hypot(p.x-230,p.y-(getTerrain().platforms[0].y-17))<195?2:0;
  const lanternBonus=Math.hypot(p.x-750,p.y-getTerrain().lantern.y)<205?2:0;
  p.regenRate=naturalRegen+campfireBonus+lanternBonus+(p.regenPotionT>0?4:0);
  p.hp=Math.min(p.maxHp,p.hp+p.regenRate*dt);
  g.pickupTimer-=dt;
  if(g.pickupTimer<=0&&g.pickups.length<4&&g.stage!=='accept'){
    const kind=Math.random()<.63?'heart':'star';
    g.pickups.push({kind,x:rnd(arena.l+55,arena.r-55),y:rnd(arena.t+75,arena.b-65),life:17,phase:rnd(0,TAU)});
    g.pickupTimer=rnd(12,17);
  }
  for(let i=g.pickups.length-1;i>=0;i--){
    const drop=g.pickups[i];
    drop.life-=dt;
    if(Math.hypot(drop.x-p.x,drop.y-p.y)<24){
      if(drop.kind==='heart'){
        p.hp=Math.min(p.maxHp,p.hp+70);
        g.floaters.push({x:p.x,y:p.y-20,life:1.3,text:'+70 HP',col:'#ffb5ad'})
      }
      else
      {
        p.mana=Math.min(p.maxMana,p.mana+90);
        g.floaters.push({x:p.x,y:p.y-20,life:1.3,text:'+90 MANA',col:'#a4c9ff'})
      }
      p.pickupsTaken++;
      audio.fx('pickup');
      g.pickups.splice(i,1);
    }else
    if(drop.life<=0)g.pickups.splice(i,1);
  }
  
  updatePlayerMovement(g,dt);
  updateCamera(g,dt);
  if(state.deviceMode==='mobile'&&state.aimHeld){
    state.pointer.x=clamp(p.x+state.aimAxis.x*300,arena.l,arena.r);
    state.pointer.y=clamp(p.y+state.aimAxis.y*300,arena.t,arena.b)
  }
  else
  if(state.deviceMode==='mobile'&&state.mobileAutoAim){
    const targets=possibleTargets();
    if(targets.length){
      const tar=targets.reduce((best,t)=>Math.hypot(t.x-p.x,t.y-p.y)<Math.hypot(best.x-p.x,best.y-p.y)?t:best,targets[0]);
      state.pointer.x=tar.x;
      state.pointer.y=tar.y;
    }
  }
  const autoShoot=state.deviceMode==='mobile'&&state.mobileAutoAim&&p.weapon!==3&&possibleTargets().length>0;
  if(state.pointer.fire||state.mobileFire||state.aimHeld||state.keys.j||autoShoot)shoot();
  classRegistry[weapons[p.weapon].id].updateCombat?.(dt);
  const encounter=getEncounter(g);
  encounter.update(dt);
  encounter.updateHazards(dt);
  updateBullets(dt);
  encounter.afterProjectiles();
  g.impacts=g.impacts.filter(f=>(f.life-=dt)>0);
  g.dashGhosts=g.dashGhosts.filter(v=>(v.life-=dt)>0);
  g.sparks=g.sparks.filter(s=>(s.life-=dt)>0);
  g.sparks.forEach(s=>{
      s.x+=s.vx*dt;
      s.y+=s.vy*dt
  });
  g.floaters=g.floaters.filter(s=>(s.life-=dt)>0);
  g.floaters.forEach(s=>s.y-=30*dt);
  if(g.t-(g.lastUI||0)>.095){
    ui();
    g.lastUI=g.t;
  }
}


export { update };
