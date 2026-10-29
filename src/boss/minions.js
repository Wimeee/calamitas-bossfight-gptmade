import { enemyBullet, fan } from '../combat/projectiles.js?v=21.1.1';
import { arena } from '../core/arena.js?v=21.1.1';
import { TAU } from '../core/config.js?v=21.1.1';
import { clamp, lerp, norm } from '../core/math.js?v=21.1.1';
import { state } from '../core/state.js?v=21.1.1';

function updateMinions(dt){
  const g=state.game,p=g.player,b=g.boss;
  if(g.stage==='hearts'){
    // Sepulcher approaches the witch, releases a dart ring, then circles away.
    const worm=g.sepulcher||(g.sepulcher={x:arena.l-35,y:arena.b-50,timer:1,nodes:[]});
    worm.timer-=dt;
    const rush=worm.timer<=0;
    const tx=rush?b.x:b.x+Math.cos(g.stageT*.8)*230,ty=rush?b.y:b.y+Math.sin(g.stageT*.8)*160;
    const d=norm(tx-worm.x,ty-worm.y),speed=rush?310:150;
    worm.x+=d.x*speed*dt;worm.y+=d.y*speed*dt;
    if(rush&&Math.hypot(worm.x-b.x,worm.y-b.y)<25){
      for(let i=0;i<16;i++){
        const a=i*TAU/16,q=enemyBullet(worm.x,worm.y,Math.cos(a),Math.sin(a),90,5,'dart',29);
        if(q){q.acceleration=35;q.maxSpeed=210;}
      }
      worm.timer=3.8;
    }
    for(let i=0;i<30;i++){
      const prev=i?worm.nodes[i-1]:worm,node=worm.nodes[i]||(worm.nodes[i]={x:prev.x,y:prev.y});
      const d=norm(prev.x-node.x,prev.y-node.y),distance=Math.hypot(prev.x-node.x,prev.y-node.y);
      if(distance>11){node.x+=d.x*(distance-11);node.y+=d.y*(distance-11);}
    }
  }else g.sepulcher=null;
  if(g.stage==='brothers'){
    const cycle=Math.floor(g.stageT/6.4),time=g.stageT%6.4;
    for(const br of g.brothers){
      const right=(br.kind===0)!==Boolean(cycle%2),side=right?1:-1;
      const empowered=br.hp/br.max<(g.difficulty==='death'?.6:.4)||g.brothers.length===1;
      const tx=clamp(p.x+side*280,arena.l+50,arena.r-50),ty=clamp(p.y+Math.sin(g.stageT*1.2+br.kind)*65,arena.t+70,arena.b-70);
      // Travel and swap between barrages; hold position while firing.
      if(time<1.3||time>4.4){br.x=lerp(br.x,tx,Math.min(1,dt*2));br.y=lerp(br.y,ty,Math.min(1,dt*2));}
      const interval=br.kind===0?(empowered?.3:.42):(empowered?.65:.85);
      br.fireTimer=(br.fireTimer||0)-dt;
      br.warning=time<1.3||time>5.9;
      if(time>=1.3&&time<4.4&&br.fireTimer<=0){
        const d=norm(p.x-br.x,p.y-br.y);
        const q=enemyBullet(br.x,br.y,d.x,d.y,br.kind===0?210:180,br.kind===0?7:9,br.kind===0?'fist':'slash',35);
        if(q){q.acceleration=empowered?35:15;q.maxSpeed=260;}
        br.fireTimer=interval;
      }
    }
  }
  if(g.stage==='seekers'){
    for(const s of g.seekers){s.angle+=dt*.25;s.x=b.x+Math.cos(s.angle)*126;s.y=b.y+Math.sin(s.angle)*126;}
    const period=3;
    g.seekerWarning=g.stageT%period>period-.65;
    if(Math.floor((g.stageT-dt)/period)!==Math.floor(g.stageT/period)){
      for(const s of g.seekers){
        const d=norm(p.x-s.x,p.y-s.y);
        enemyBullet(s.x,s.y,d.x,d.y,190,5,'dart',30);
      }
    }
  }
}
export { updateMinions };
