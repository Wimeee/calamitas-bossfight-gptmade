import { hellDirections, hellPlan, hellSymbols } from '../boss/bullet-hell.js?v=17.0.0';
import { possibleTargets } from '../combat/targets.js?v=17.0.0';
import { arena } from '../core/arena.js?v=17.0.0';
import { H, TAU, VIEW_X, VIEW_Y, W } from '../core/config.js?v=17.0.0';
import { ctx } from '../core/dom.js?v=17.0.0';
import { clamp, norm } from '../core/math.js?v=17.0.0';
import { state } from '../core/state.js?v=17.0.0';
import { drawBackdrop } from './background.js?v=17.0.0';
import { drawClassKit } from './class-effects.js?v=17.0.0';
import { drawPatternWarnings, drawWeaponImpacts } from './effects.js?v=17.0.0';
import { drawBrother, drawCalamitas, drawMaelstrom, drawSepulcher } from './enemies.js?v=17.0.0';
import { drawSword } from './melee.js?v=17.0.0';
import { hpMini, line, pixel, round, text } from './primitives.js?v=17.0.0';
import { drawChannelBeam, drawHeldWeapon, drawPixelWhip, drawPlayerShot } from './weapons.js?v=17.0.0';


function draw(g){
  ctx.save();
  ctx.fillStyle='#0c0710';
  ctx.fillRect(0,0,W,H);
  ctx.translate(VIEW_X,VIEW_Y);
  drawBackdrop(g);
  if(!g){
    text('ALTAR OF THE ACCURSED',500,300,27,'#a74e60');
    ctx.restore();
    return
  }
  let b=g.boss,p=g.player;
  drawPatternWarnings(g);
  // Terraria-inspired permanent arena fixtures: move near them for regeneration buffs.
  ctx.shadowBlur=12;
  ctx.shadowColor='#ffa847';
  round(230,505,17,'#51301d','#ffab50',2);
  ctx.shadowBlur=0;
  text('🔥',230,512,23);
  text('CAMPFIRE',230,536,9,'#e6ac6f');
  ctx.shadowColor='#ff7777';
  ctx.shadowBlur=12;
  line(750,arena.t+3,750,96,'#b79b95',2);
  round(750,105,16,'#6a293b','#ef979b',2);
  ctx.shadowBlur=0;
  text('❤',750,112,19,'#ffb8a8');
  for(const drop of g.pickups){
    let bob=Math.sin(g.t*4+drop.phase)*4;
    ctx.shadowColor=drop.kind==='heart'?'#ff6479':'#73b7ff';
    ctx.shadowBlur=16;
    round(drop.x,drop.y+bob,15,drop.kind==='heart'?'#661b36':'#234b88',drop.kind==='heart'?'#ff8da3':'#a2caff',2);
    ctx.shadowBlur=0;
    text(drop.kind==='heart'?'❤':'✦',drop.x,drop.y+bob+6,20,drop.kind==='heart'?'#ffb1be':'#bedcff')
  }
  if(g.stage==='hell'&&g.huntWarning){
    const w=g.huntWarning;
    ctx.save();
    ctx.globalAlpha=.35+(.7-w.left)*.7;
    ctx.setLineDash([7,9]);
    line(w.x,w.y,w.tx,w.ty,'#ffca8e',2);
    ctx.setLineDash([]);
    ctx.strokeStyle='#ffdfac';
    ctx.lineWidth=2;
    ctx.strokeRect(w.tx-13,w.ty-13,26,26);
    pixel('skull',w.x,w.y,.9);
    ctx.restore();
  }
  if(g.stage==='hell'){
    let remain=Math.max(0,15-g.stageT);
    const phase=Math.min(2,Math.floor(g.stageT/5));
    const dir=hellDirections[g.phaseN-1][phase];
    text('BULLET HELL '+g.phaseN+' · '+Math.ceil(remain)+'s',500,65,19,'#ffb1a1');
    text(dir.map(x=>hellSymbols[x]).join('  '),500,89,25,'#ffdda4');
    // Anticipation for the *next* strict horizontal/vertical laser rows.
    if(g.hellTimer>0&&g.hellTimer<.38){
      ctx.save();
      ctx.globalAlpha=(.38-g.hellTimer)/.38*.74;
      const slots=hellPlan(g,g.hellWave+1).slots;
      const grouped={};
      for(const q of slots){
        (grouped[q.side]??=[]).push(q)
      }
      for(const q of slots){
        const endX=q.x+q.vx*38,endY=q.y+q.vy*38;
        line(q.x,q.y,endX,endY,'#ffdd92',4);
        round(endX,endY,3,'#ffdda1');
      }
      ctx.restore();
    }
  }
  if(g.stage==='hearts'){
    drawSepulcher(g);
    ctx.strokeStyle='#a93f5577';
    ctx.lineWidth=24;
    ctx.beginPath();
    ctx.arc(b.x,b.y,66+Math.sin(g.t*3)*6,0,TAU);
    ctx.stroke();
    g.hearts.forEach(h=>{
        pixel('heart',h.x,h.y,1.5+Math.sin(g.t*5)*.05);
        hpMini(h.x,h.y-27,h.hp,h.max,35)
    })
  }
  if(g.stage==='brothers')g.brothers.forEach(br=>drawBrother(br,g));
  if(g.stage==='seekers')g.seekers.forEach(s=>{
      pixel('seeker',s.x,s.y,1.25);
      hpMini(s.x,s.y-27,s.hp,s.max,27,'#db77a4')
  });
  drawMaelstrom(g);
  if(g.dashWind>0){
    const aim=norm(p.x-b.x,p.y-b.y);
    ctx.setLineDash([11,9]);
    line(b.x,b.y,b.x+aim.x*560,b.y+aim.y*560,'#ffb05e9e',4);
    ctx.setLineDash([]);
    text('!',b.x,b.y-49,23,'#ffd09e')
  }
  if(g.dashActive>0){
    for(let i=1;i<=6;i++){
      ctx.globalAlpha=(7-i)/21;
      round(b.x-g.dashVector.x*i*19,b.y-g.dashVector.y*i*19,23-i*2,'#fa506f');
    }
    ctx.globalAlpha=1
  }
  drawCalamitas(g);
  for(let q of g.projectiles){
    let color=q.kind==='skull'?'#ffbb7b':q.kind==='giga'?'#ffd0b0':q.kind==='fire'?'#ff895b':q.kind==='hellblast'?'#f84c7c':'#dd536c';
    ctx.shadowColor=color;
    ctx.shadowBlur=q.kind==='giga'?19:8;
    line(q.x-q.vx*.030,q.y-q.vy*.030,q.x,q.y,color,q.kind==='giga'?6:2.4);
    round(q.x,q.y,q.r,color,'#6b1a37',1);
    ctx.shadowBlur=0;
    if(q.kind==='giga'){
      ctx.strokeStyle='#ffd0a8a6';
      ctx.lineWidth=2;
      ctx.beginPath();
      ctx.arc(q.x,q.y,q.r+5+Math.sin(g.t*9)*1.5,0,TAU);
      ctx.stroke()
    }
    if(['skull','hellblast','fire','giga'].includes(q.kind))pixel('skull',q.x,q.y,q.kind==='giga'?1.65:q.kind==='fire'?1.25:q.kind==='skull'?1.05:.83,Math.atan2(q.vy,q.vx)+Math.PI/2);
    if(q.kind==='dart'){
      line(q.x-7,q.y,q.x+7,q.y,'#ffc3b4',1);
      line(q.x,q.y-7,q.x,q.y+7,'#ffc3b4',1)
    }
  }
  drawChannelBeam(g);
  for(const s of g.shots)drawPlayerShot(s,g);
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
  if(p.iframes<=0||Math.floor(g.t*20)%2===0){
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
  drawHeldWeapon(g);
  drawWeaponImpacts(g);
  drawClassKit(g);
  for(let s of g.sparks){
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
  // boss health at top
  ctx.fillStyle='#230f1a';
  ctx.fillRect(W/2-320,11,640,11);
  ctx.fillStyle='#cf4561';
  ctx.fillRect(W/2-320,11,640*(b.hp/b.max),11);
  ctx.strokeStyle='#e6abb0';
  ctx.strokeRect(W/2-320,11,640,11);
  text('SUPREME CALAMITAS',W/2,8,11,'#ffd0c5');
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
    text('Натисни P для продовження',W/2,H/2+33,16,'#d0b8bf')
  }
}


export { draw };
