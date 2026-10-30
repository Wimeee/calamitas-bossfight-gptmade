import { cameraView } from '../world/camera.js?v=22.0.0';
import { drawWorldHUD } from './world-hud.js?v=22.0.0';
import { getTerrain } from '../world/terrain.js?v=22.0.0';
import { drawFlightWings,drawFlightGauge } from './mobility.js?v=22.0.0';
import { drawEnemyProjectiles } from './projectiles.js?v=22.0.0';
import { drawWarriorBody } from './warrior.js?v=22.0.0';
import { drawRitualWorld, drawRitualOverlay } from './ritual.js?v=22.0.0';
import { settings,shakeOffset,keyLabel } from '../core/settings.js?v=22.0.0';
import { getEncounter } from '../boss/registry.js?v=22.0.0';
import { possibleTargets } from '../combat/targets.js?v=22.0.0';
import { arena } from '../core/arena.js?v=22.0.0';
import { H, TAU, VIEW_X, VIEW_Y, W } from '../core/config.js?v=22.0.0';
import { ctx } from '../core/dom.js?v=22.0.0';
import { clamp, norm } from '../core/math.js?v=22.0.0';
import { state } from '../core/state.js?v=22.0.0';
import { drawBackdrop } from './background.js?v=22.0.0';
import { drawClassKit } from './class-effects.js?v=22.0.0';
import { drawPatternWarnings, drawWeaponImpacts } from './effects.js?v=22.0.0';
import { drawSword } from './melee.js?v=22.0.0';
import { hpMini, line, pixel, round, text } from './primitives.js?v=22.0.0';
import { drawChannelBeam, drawHeldWeapon, drawPixelWhip, drawPlayerShot } from './weapons.js?v=22.0.0';


function draw(g){
  ctx.save();
  ctx.fillStyle='#0c0710';
  ctx.fillRect(0,0,W,H);
  const shake=shakeOffset(g);
  const view=cameraView(g);
  ctx.translate(-view.x+shake.x,-view.y+shake.y);
  drawBackdrop(g);
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
  // Terraria-inspired permanent arena fixtures: move near them for regeneration buffs.
  ctx.shadowBlur=12;
  const campfireY=getTerrain().platforms[0].y-17;
  ctx.shadowColor='#ffa847';
  round(230,campfireY,17,'#51301d','#ffab50',2);
  ctx.shadowBlur=0;
  text('🔥',230,campfireY+7,23);
  text('CAMPFIRE',230,campfireY+31,9,'#e6ac6f');
  ctx.shadowColor='#ff7777';
  ctx.shadowBlur=12;
  line(750,getTerrain().lantern.y-45,750,getTerrain().lantern.y-9,'#b79b95',2);
  round(750,getTerrain().lantern.y,16,'#6a293b','#ef979b',2);
  ctx.shadowBlur=0;
  text('❤',750,getTerrain().lantern.y+7,19,'#ffb8a8');
  for(const drop of g.pickups){
    let bob=Math.sin(g.t*4+drop.phase)*4;
    ctx.shadowColor=drop.kind==='heart'?'#ff6479':'#73b7ff';
    ctx.shadowBlur=16;
    round(drop.x,drop.y+bob,15,drop.kind==='heart'?'#661b36':'#234b88',drop.kind==='heart'?'#ff8da3':'#a2caff',2);
    ctx.shadowBlur=0;
    text(drop.kind==='heart'?'❤':'✦',drop.x,drop.y+bob+6,20,drop.kind==='heart'?'#ffb1be':'#bedcff')
  }
  getEncounter(g).draw(g);
  drawEnemyProjectiles(g);
  drawChannelBeam(g);
  for(const s of g.shots)drawPlayerShot(s,g);
  drawFlightWings(g);
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
  drawHeldWeapon(g);
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
    text(f.text,f.x,f.y,15,f.col)
  }
  ctx.globalAlpha=1;
  ctx.restore();
  drawWorldHUD(g);
  // boss health at top
  ctx.fillStyle='#230f1a';
  ctx.fillRect(W/2-320,11,640,11);
  ctx.fillStyle='#cf4561';
  ctx.fillRect(W/2-320,11,640*(b.hp/b.max),11);
  ctx.strokeStyle='#e6abb0';
  ctx.strokeRect(W/2-320,11,640,11);
  text(getEncounter(g).config.name,W/2,8,11,'#ffd0c5');
  if(g.dialogT>0){
    ctx.globalAlpha=clamp(g.dialogT*1.5,0,1);
    text(g.dialog,W/2,80,27,'#f5a9a8');
    ctx.globalAlpha=1
  }
  if(g.stage==='accept'){
    let sentences=['You have bested me...','The flames are fading.','The battle is over.','ACCEPTANCE'];
    text(sentences[Math.min(3,Math.floor(g.acceptT/2.25))],W/2,H/2+95,20,'#ffe9d3');
  }
  if(g.mode==='paused'){
    ctx.fillStyle='#09080bd9';
    ctx.fillRect(0,0,W,H);
    text('⏸ ПАУЗА',W/2,H/2-10,43,'#ffcfbf');
    text('Натисни '+keyLabel(settings.bindings.pause)+' для продовження',W/2,H/2+33,16,'#d0b8bf')
  }
}


export { draw };
