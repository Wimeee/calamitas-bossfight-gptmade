import {drawAsgardianShield,drawAsgardianEffects} from './asgardian.js?v=26.0.1';
import {drawArkEffects} from './ark-effect-render.js?v=26.0.1';
import {drawCalamitasDialogue} from './dialogue.js?v=26.0.1';
import {drawArenaDebris} from './arena-debris.js?v=26.0.1';
import { drawRipperPlayerEffects } from './ripper-effects.js?v=26.0.1';
import { drawBattleHUD } from './battle-hud.js?v=26.0.1';
import { nativeText } from './hud-atlas.js?v=26.0.1';
import { paintWorldDecoration } from './world-decorations.js?v=26.0.1';
import { cameraView } from '../world/camera.js?v=26.0.1';
import { drawWorldHUD } from './world-hud.js?v=26.0.1';
import { getTerrain } from '../world/terrain.js?v=26.0.1';
import { drawFlightWings,drawFlightGauge } from './mobility.js?v=26.0.1';
import { drawEnemyProjectiles } from './projectiles.js?v=26.0.1';
import { drawWarriorBody } from './warrior.js?v=26.0.1';
import { drawRitualWorld, drawRitualOverlay } from './ritual.js?v=26.0.1';
import { settings,shakeOffset,keyLabel } from '../core/settings.js?v=26.0.1';
import { getEncounter } from '../boss/registry.js?v=26.0.1';
import { possibleTargets } from '../combat/targets.js?v=26.0.1';
import { arena } from '../core/arena.js?v=26.0.1';
import { H, TAU, VIEW_X, VIEW_Y, W } from '../core/config.js?v=26.0.1';
import { ctx } from '../core/dom.js?v=26.0.1';
import { clamp, norm } from '../core/math.js?v=26.0.1';
import { state } from '../core/state.js?v=26.0.1';
import { drawBackdrop } from './background.js?v=26.0.1';
import { drawClassKit } from './class-effects.js?v=26.0.1';
import { drawPatternWarnings, drawWeaponImpacts } from './effects.js?v=26.0.1';
import { drawSword } from './melee.js?v=26.0.1';
import { hpMini, line, pixel, round, text } from './primitives.js?v=26.0.1';
import { drawChannelBeam, drawHeldWeapon, drawPixelWhip, drawPlayerShot } from './weapons.js?v=26.0.1';


function draw(g){
  ctx.save();
  ctx.fillStyle='#0c0710';
  ctx.fillRect(0,0,W,H);
  const shake=shakeOffset(g);
  const view=cameraView(g);
  const zoom = view.zoom || 1;
  const cam = state.game?.camera || {x:500, y:300};
  // Standard camera transform: screen = (world - cam) * zoom + (W/2, H/2)
  ctx.translate(W/2, H/2);
  ctx.scale(zoom, zoom);
  ctx.translate(-cam.x, -cam.y);
  // Screen shake in canvas pixels (post-scale)
  ctx.translate(shake.x / zoom, shake.y / zoom);
  drawBackdrop(g);
  if(g)drawArenaDebris(g);
  if(!g){
    text('ALTAR OF THE ACCURSED',500,300,27,'#a74e60');
    ctx.restore();
    return
  }
  if(g.ritual){
    drawRitualWorld(g);ctx.restore();drawRitualOverlay(g);return;
  }
  let b=g.boss,p=g.player;
  drawPatternWarnings(g);
  for(const drop of g.pickups){
    if(drop.kind==='star'&&p.weapon!==2)continue;
    const name=drop.kind==='heart'?'heartPickup':'manaPickup';
    paintWorldDecoration(ctx,name,drop.x,drop.y+9,1,1);
  }
  getEncounter(g).draw(g);
  drawEnemyProjectiles(g);
  drawChannelBeam(g);
  for(const s of g.shots)drawPlayerShot(s,g);
  drawFlightWings(g);
  drawArkEffects(g,'smoke');
  drawSword(g);
  if(Array.isArray(p.cosmic)&&p.cosmic.length){
    p.cosmic.forEach((m,i)=>pixel('spirit'+i,m.x,m.y,1.05,Math.sin(g.t*3+i)*.12));
    const targets=possibleTargets();
    if(p.cosmicMark&&targets.includes(p.cosmicMark)){
      const t=p.cosmicMark,r=t.r+18;
      ctx.strokeStyle=t.whipMarkedUntil>g.t?'#ffdd80':'#bdfb9d';
      ctx.setLineDash([6,4]);
      ctx.lineWidth=2.5;
      ctx.beginPath();
      ctx.arc(t.x,t.y,r+Math.sin(g.t*11)*2,0,TAU);
      ctx.stroke();
      ctx.setLineDash([]);
      if(t.whipMarkedUntil>g.t)text('✴ +35%',t.x,t.y-r-10,11,'#ffe3a3');
    }
  }
  drawPixelWhip(g);
  for(const ghost of g.dashGhosts){
    if(drawWarriorBody(g,ghost.x,ghost.y,true,clamp(ghost.life/ghost.max,0,1)))continue;
    ctx.globalAlpha=.33*clamp(ghost.life/ghost.max,0,1);
    round(ghost.x,ghost.y,11,'#9af8ed','#ffe4ad',2)
  }
  ctx.globalAlpha=1;
  if(p.contactGuard>0){
    ctx.save();
    ctx.strokeStyle=p.dashT>0?'#b7fff6':'#86e4cd9c';
    ctx.lineWidth=p.dashT>0?3:2;
    ctx.setLineDash([5,5]);
    ctx.beginPath();
    ctx.arc(p.x,p.y,20+Math.sin(g.t*14)*2,0,TAU);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.restore()
  }
  drawRipperPlayerEffects(g);
  if((p.weapon===0&&g.mode==='dead')||p.iframes<=0||Math.floor(g.t*20)%2===0){
    if(!drawWarriorBody(g)){
      ctx.save();
      ctx.translate(p.x,p.y);
      let a=Math.atan2(state.pointer.y-p.y,state.pointer.x-p.x);
      ctx.rotate(a);
      ctx.shadowColor=p.dashT>0?'#fff6a1':'#79e9fc';
      ctx.shadowBlur=12;
      round(0,0,10,'#78cdd5','#fff3df',2);
      ctx.fillStyle='#eaf7eb';
      ctx.beginPath();
      ctx.moveTo(12,0);
      ctx.lineTo(0,-5);
      ctx.lineTo(0,5);
      ctx.fill();
      round(-2,0,3,'#1e4157');
      ctx.restore()
    }
  }
  drawAsgardianShield(g);
  drawHeldWeapon(g);
  drawAsgardianEffects(g);
  drawArkEffects(g,'front');
  drawRipperPlayerEffects(g,true);
  drawWeaponImpacts(g);
  drawClassKit(g);
  drawFlightGauge(g);
  for(let sparkIndex=0;sparkIndex<Math.min(g.sparks.length,settings.quality==='low'?40:Infinity);sparkIndex++){
    const s=g.sparks[sparkIndex];
    ctx.globalAlpha=clamp(s.life/s.max,0,1);
    round(s.x,s.y,3,s.c)
  }
  ctx.globalAlpha=1;
  for(let f of g.floaters){
    ctx.globalAlpha=clamp(f.life,0,1);
    nativeText(ctx,f.text,f.x,f.y,{font:'combat',scale:f.dot?.55:.75,align:'center',color:f.col})
  }
  ctx.globalAlpha=1;
  ctx.restore();
  drawWorldHUD(g);
  drawBattleHUD(g);
  if(g.dialogT>0&&!g.nativeDialogue){
    ctx.globalAlpha=clamp(g.dialogT*1.5,0,1);
    text(g.dialog,W/2,80,27,'#f5a9a8');
    ctx.globalAlpha=1
  }
  drawCalamitasDialogue(g);
  if(g.mode==='paused'){
    ctx.fillStyle='#09080bd9';
    ctx.fillRect(0,0,W,H);
    text('⏸ ПАУЗА',W/2,H/2-10,43,'#ffcfbf');
    text('Натисни '+keyLabel(settings.bindings.pause)+' для продовження',W/2,H/2+33,16,'#d0b8bf')
  }
}


export { draw };
