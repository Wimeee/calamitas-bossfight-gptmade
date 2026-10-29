import { playerConfig } from '../../config/player.js?v=17.0.1';
import { getEncounter } from '../boss/registry.js?v=17.0.1';
import { classRegistry, weapons } from '../classes/registry.js?v=17.0.1';
import { updateClassKit } from '../classes/shared.js?v=17.0.1';
import { shoot } from '../combat/attacks.js?v=17.0.1';
import { updateBullets } from '../combat/projectiles.js?v=17.0.1';
import { possibleTargets } from '../combat/targets.js?v=17.0.1';
import { arena } from '../core/arena.js?v=17.0.1';
import { audio } from '../core/audio.js?v=17.0.1';
import { TAU } from '../core/config.js?v=17.0.1';
import { clamp, norm, rnd } from '../core/math.js?v=17.0.1';
import { state } from '../core/state.js?v=17.0.1';
import { updateSystems } from '../systems/index.js?v=17.0.1';
import { ui } from '../ui/hud.js?v=17.0.1';


function update(dt){
  let g=state.game,p=g.player;
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
  const campfireBonus=Math.hypot(p.x-230,p.y-505)<195?2:0;
  const lanternBonus=Math.hypot(p.x-750,p.y-105)<205?2:0;
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
  
  const dx=(state.keys.d||state.keys.ArrowRight?1:0)-(state.keys.a||state.keys.ArrowLeft?1:0)+state.moveAxis.x,dy=(state.keys.s||state.keys.ArrowDown?1:0)-(state.keys.w||state.keys.ArrowUp?1:0)+state.moveAxis.y,m=norm(dx,dy),moving=!!(dx||dy);
  if(p.dashT>0){
    p.dashT=Math.max(0,p.dashT-dt);
    p.x+=p.dashX*playerConfig.dashSpeed*dt;
    p.y+=p.dashY*playerConfig.dashSpeed*dt;
    if(Math.floor(g.t*42)!==Math.floor((g.t-dt)*42))g.dashGhosts.push({x:p.x,y:p.y,life:.32,max:.32})
  }else
  if(moving){
    p.x+=m.x*playerConfig.movementSpeed*dt;
    p.y+=m.y*playerConfig.movementSpeed*dt
  }
  p.x=clamp(p.x,arena.l+11,arena.r-11);
  p.y=clamp(p.y,arena.t+11,arena.b-11);
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
