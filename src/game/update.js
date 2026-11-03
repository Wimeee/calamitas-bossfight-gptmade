import {resolveCalamitasContact} from '../combat/boss-contact.js?v=26.3.0';
import {updateAsgardianCollisions,updateAsgardianInferno} from '../combat/asgardian.js?v=26.3.0';
import {updateAsgardianEffects} from '../systems/asgardian-effects.js?v=26.3.0';
import {updateArkEffects} from '../systems/ark-effects.js?v=26.3.0';
import {beginCombatMotion} from '../combat/motion-collision.js?v=26.3.0';
import {updateCalamitasEffects} from '../systems/calamitas-effects.js?v=26.3.0';
import {updateHelperEffects} from '../systems/helper-effects.js?v=26.3.0';
import { updateArenaState } from '../world/arena-state.js?v=26.3.0';
import { updatePlayerDebuffs } from '../combat/debuffs.js?v=26.3.0';
import { updatePickups } from './pickups.js?v=26.3.0';
import { updateCamera } from '../world/camera.js?v=26.3.0';
import { getTerrain } from '../world/terrain.js?v=26.3.0';
import { updatePlayerMovement } from './movement.js?v=26.3.0';
import { updateRitual } from './ritual.js?v=26.3.0';
import { playerConfig } from '../../config/player.js?v=26.3.0';
import { getEncounter } from '../boss/registry.js?v=26.3.0';
import { classRegistry, weapons } from '../classes/registry.js?v=26.3.0';
import { updateClassKit } from '../classes/shared.js?v=26.3.0';
import { shoot } from '../combat/attacks.js?v=26.3.0';
import { updateBullets } from '../combat/projectiles.js?v=26.3.0';
import { possibleTargets } from '../combat/targets.js?v=26.3.0';
import { arena } from '../core/arena.js?v=26.3.0';
import { audio } from '../core/audio.js?v=26.3.0';
import { TAU } from '../core/config.js?v=26.3.0';
import { clamp, rnd } from '../core/math.js?v=26.3.0';
import { state } from '../core/state.js?v=26.3.0';
import { updateSystems } from '../systems/index.js?v=26.3.0';
import { ui } from '../ui/hud.js?v=26.3.0';


function update(dt){
  let g=state.game,p=g.player;
  if(g.mode!=='playing')return;
  if(g.ritual){updateRitual(dt);return;}
  g.t+=dt;
  updateArenaState(g,dt);
  g.totalTime+=dt;
  updateSystems(dt,g);
  updateArkEffects(dt,g);
  updateAsgardianEffects(dt,g);
  updateAsgardianInferno(dt,g);
  updateHelperEffects(dt,g);
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
  const debuffTime=updatePlayerDebuffs(g,dt);
  if(g.mode!=='playing')return;
  if(debuffTime>0){p.hp=Math.min(p.maxHp,p.hp+p.regenRate*Math.max(0,dt-debuffTime));p.regenRate=0;}
  else p.hp=Math.min(p.maxHp,p.hp+p.regenRate*dt);
  updatePickups(g,dt);

  const motion=beginCombatMotion(g,dt);
  updatePlayerMovement(g,dt,motion);
  if(p.aegisReadyAt>0)p.dashCd=Math.max(0,p.aegisReadyAt-g.t);
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
  encounter.update(dt,motion);
  encounter.updateHazards(dt);
  if(motion.points.at(-1).time<dt)motion.points.push({time:dt,x:p.x,y:p.y});
  updateAsgardianCollisions(g,motion);
  resolveCalamitasContact(g,motion);
  updateBullets(dt,motion);
  encounter.afterProjectiles();
  updateCalamitasEffects(dt,g);
  g.impacts=g.impacts.filter(f=>(f.life-=dt)>0);
  g.dashGhosts=g.dashGhosts.filter(v=>(v.life-=dt)>0);
  g.sparks=g.sparks.filter(s=>(s.life-=dt)>0);
  g.sparks.forEach(s=>{
      s.x+=s.vx*dt;
      s.y+=s.vy*dt
  });
  g.floaters=g.floaters.filter(s=>(s.life-=dt)>0).slice(-140);
  g.floaters.forEach(s=>s.y-=30*dt);
  if(g.t-(g.lastUI||0)>.095){
    ui();
    g.lastUI=g.t;
  }
}


export { update };
