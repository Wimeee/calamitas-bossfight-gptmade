import { enemyBullet, fan } from '../combat/projectiles.js?v=21.0.0';
import { arena } from '../core/arena.js?v=21.0.0';
import { TAU } from '../core/config.js?v=21.0.0';
import { clamp, lerp, norm } from '../core/math.js?v=21.0.0';
import { state } from '../core/state.js?v=21.0.0';


function updateMinions(dt){
  let g=state.game,p=g.player,b=g.boss;
  if(g.stage==='hearts'&&Math.floor((g.stageT-dt)/2.8)!==Math.floor(g.stageT/2.8)){
    // Visible Sepulcher attacks while the ten hearts defend it.
    for(let i=0;i<6;i++){
      let a=TAU*i/6+g.stageT;
      enemyBullet(b.x,b.y,Math.cos(a),Math.sin(a),185,6,'dart',29)
    }
  }
  if(g.stage==='brothers')g.brothers.forEach((br,i)=>{
      br.x=lerp(br.x,clamp(p.x+(i===0?-225:225),arena.l+40,arena.r-40),dt*.92);
      br.y=lerp(br.y,clamp(p.y+Math.sin(g.t*1.7+i*2)*105,arena.t+60,arena.b-60),dt*.92);
      if(Math.floor((g.stageT-dt-i*.65)/1.35)!==Math.floor((g.stageT-i*.65)/1.35))fan(br.x,br.y,p.x,p.y,i===0?3:4,.50,228,i===0?'dart':'hellblast');
  });
  if(g.stage==='seekers'){
    g.seekers.forEach(s=>{
        s.angle+=dt*.38;
        s.x=b.x+Math.cos(s.angle)*126;
        s.y=b.y+Math.sin(s.angle)*126
    });
    if(Math.floor((g.stageT-dt)/2.2)!==Math.floor(g.stageT/2.2))g.seekers.forEach((s,i)=>{
        if(i%2===0){
          let d=norm(p.x-s.x,p.y-s.y);
          enemyBullet(s.x,s.y,d.x,d.y,218,5,'dart',30)
        }
    });
  }
}


export { updateMinions };
