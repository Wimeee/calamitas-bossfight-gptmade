import {drawCalamitasEffects} from './calamitas-effects.js?v=29.1.0';
import {drawHelperEffects} from './helper-effects.js?v=29.1.0';
import { calamitasImage } from './calamitas-atlas.js?v=29.1.0';
import { hellDirections, hellPlan, hellSymbols } from '../boss/bullet-hell.js?v=29.1.0';
import { arena } from '../core/arena.js?v=29.1.0';
import { H, TAU, VIEW_X, VIEW_Y, W } from '../core/config.js?v=29.1.0';
import { ctx } from '../core/dom.js?v=29.1.0';
import { clamp, norm } from '../core/math.js?v=29.1.0';
import { drawBrother, drawCalamitas, drawMaelstrom, drawSepulcher, drawSeeker, drawHeart } from './enemies.js?v=29.1.0';
import { hpMini, line, pixel, round, text } from './primitives.js?v=29.1.0';

export function drawCalamitasEncounter(g){const b=g.boss,p=g.player;
  drawMaelstrom(g);
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
    // Anticipation for the *next* strict horizontal/vertical laser rows.
    if(g.hellTimer>0&&g.hellTimer<.38){
      ctx.save();
      ctx.globalAlpha=(.38-g.hellTimer)/.38*.74;
      const slots=hellPlan(g,g.hellWave+1).slots;
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
    if(!calamitasImage('shield')){
    ctx.strokeStyle='#a93f5577';
    ctx.lineWidth=24;
    ctx.beginPath();
    ctx.arc(b.x,b.y,66+Math.sin(g.t*3)*6,0,TAU);
    ctx.stroke();
    }
    g.hearts.forEach(h=>drawHeart(h,g))
  }
  if(g.stage==='brothers')g.brothers.forEach(br=>drawBrother(br,g));
  if(g.stage==='seekers')g.seekers.forEach(s=>drawSeeker(s,g));
  drawHelperEffects(g);
  if(!b.departed)drawCalamitas(g);
  drawCalamitasEffects(g);
}
