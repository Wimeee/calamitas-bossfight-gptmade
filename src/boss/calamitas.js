import { hurt } from '../combat/damage.js?v=19.1.1';
import { enemyBullet, fan } from '../combat/projectiles.js?v=19.1.1';
import { arena } from '../core/arena.js?v=19.1.1';
import { audio } from '../core/audio.js?v=19.1.1';
import { seq } from '../core/config.js?v=19.1.1';
import { clamp, dist, lerp, norm } from '../core/math.js?v=19.1.1';
import { state } from '../core/state.js?v=19.1.1';


function bossAttack(dt){
  let g=state.game,b=g.boss,p=g.player;
  let speedup=g.thresholds.has('40')?1.19:1;
  g.attackTimer-=dt;
  let act=seq[g.attackIndex%seq.length];
  if(act.startsWith('dash')){
    if(g.dashWind>0){
      g.dashWind-=dt;
      if(g.dashWind<=0){
        g.dashVector=norm(p.x-b.x,p.y-b.y);
        g.dashActive=.97/(g.thresholds.has('40')?1.04:1);
        g.dashCount++;
        g.attackTick=.24/speedup
      }
    }else
    if(g.dashActive>0){
      g.dashActive-=dt;
      b.x+=g.dashVector.x*515*dt*(g.thresholds.has('40')?1.08:1);
      b.y+=g.dashVector.y*515*dt*(g.thresholds.has('40')?1.08:1);
      if(dist(b,p)<b.r+11)hurt(94,'contact','Ривок Calamitas');
      if(g.dashActive<=0)g.attackTick=.23/speedup
    }else
    if(g.attackTick>0){
      g.attackTick-=dt
    }else
    {
      let needed=parseInt(act.slice(4),10);
      if(g.thresholds.has('40'))needed=Math.ceil(needed/2);
      if(g.dashCount>=needed){
        g.attackIndex++;
        g.dashCount=0;
        g.attackTimer=.5/speedup
      }else
      {
        g.dashWind=.68/speedup;
        audio.fx('enemy');
        g.dialogT=Math.max(g.dialogT,.15)
      }
    }
  }else
  {
    let offsetX=act==='darts'?0:(g.attackIndex%2?240:-240),offsetY=act==='darts'?-200:0;
    let tx=clamp(p.x+offsetX,arena.l+70,arena.r-70),ty=clamp(p.y+offsetY,arena.t+85,arena.b-85),step=Math.min(1,dt*(act==='darts'?1.6:2));
    b.x=lerp(b.x,tx,step);
    b.y=lerp(b.y,ty,step);
    if(g.attackTimer<=0){
      let n=act==='giga2'?2:act==='giga4'?4:act==='darts'?1:1;
      if(act==='darts'){
        // Calamitas hovers above and casts readable, evenly spaced dart bursts with gaps.
        const count=g.stage==='hearts'?4:8;
        fan(b.x,b.y,p.x,p.y,count,1.34,258*speedup,'dart');
        if(g.attackTick===2&&g.stage!=='hearts'&&g.thresholds.has('75')){
          const d=norm(p.x-b.x,p.y-b.y);
          enemyBullet(b.x,b.y,d.x,d.y,162,10,'fire',43);
        }
      }
      if(act==='hellblast'){
        // Level Brimstone Hellblast rows (not random vertical spray).
        const side=p.x>b.x?1:-1;
        for(let i=-2;i<=2;i++){
          const pr=enemyBullet(b.x,b.y+i*23,side,0,247*speedup,7,'hellblast',36);
          if(pr){
            pr.straight=true;
            pr.life=5.5;
          }
        }
      }
      if(act.startsWith('giga')){
        fan(b.x,b.y,p.x,p.y,1,0,205*speedup,g.attackTick%2?'giga':'fire');
      }
      g.attackTick++;
      let maxTick=act==='darts'?5:act==='hellblast'?4:n;
      if(g.attackTick>=maxTick){
        g.attackIndex++;
        g.attackTick=0;
        g.attackTimer=.65/speedup
      }else
      {
        g.attackTimer=(act==='darts'?.48:act==='hellblast'?.49:.78)/speedup
      }
    }
  }
  b.x=clamp(b.x,arena.l+33,arena.r-33);
  b.y=clamp(b.y,arena.t+33,arena.b-33);
}


export { bossAttack };
