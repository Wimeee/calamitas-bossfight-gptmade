import { hellDirections, hellPlan, hellSymbols } from '../boss/bullet-hell.js?v=21.0.0';
import { arena } from '../core/arena.js?v=21.0.0';
import { H, TAU, VIEW_X, VIEW_Y, W } from '../core/config.js?v=21.0.0';
import { ctx } from '../core/dom.js?v=21.0.0';
import { clamp, norm } from '../core/math.js?v=21.0.0';
import { drawBrother, drawCalamitas, drawMaelstrom, drawSepulcher } from './enemies.js?v=21.0.0';
import { hpMini, line, pixel, round, text } from './primitives.js?v=21.0.0';

export function drawCalamitasEncounter(g){const b=g.boss,p=g.player;
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
}
