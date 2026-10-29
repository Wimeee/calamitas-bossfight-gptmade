import { hurt } from '../combat/damage.js?v=21.1.1';
import { enemyBullet, fan } from '../combat/projectiles.js?v=21.1.1';
import { arena } from '../core/arena.js?v=21.1.1';
import { seq } from '../core/config.js?v=21.1.1';
import { clamp, dist, lerp, norm } from '../core/math.js?v=21.1.1';
import { state } from '../core/state.js?v=21.1.1';
import { encounterBalance as c } from '../../config/encounter-balance.js?v=21.1.1';

function bossAttack(dt){
  const g=state.game,b=g.boss,p=g.player,second=g.thresholds.has('40'),hearts=g.stage==='hearts';
  const tempo=(second?1.12:1)*(hearts?.72:1);
  const act=g.phase2Intro>0?'darts':seq[g.attackIndex%seq.length];
  g.attackTimer-=dt*tempo;
  if(act.startsWith('dash')){
    if(g.dashWind>0){
      g.dashWind-=dt;
      if(g.dashWind<=0){g.dashActive=c.dashDuration;g.dashCount++;}
    }else if(g.dashActive>0){
      g.dashActive-=dt;
      b.x+=g.dashVector.x*c.dashSpeed*(second?1.08:1)*dt;
      b.y+=g.dashVector.y*c.dashSpeed*(second?1.08:1)*dt;
      if(dist(b,p)<b.r+11)hurt(94,'contact','Ривок Calamitas');
      if(g.dashActive<=0)g.attackTimer=c.dashRecovery;
    }else if(g.attackTimer<=0){
      const needed=Number(act.slice(4))/(second?2:1);
      if(g.dashCount>=needed){g.attackIndex++;g.dashCount=0;g.attackTick=0;g.attackTimer=c.attackBreath;}
      else{g.dashVector=norm(p.x-b.x,p.y-b.y);g.dashWind=c.dashWarning/(second?1.1:1);}
    }
  }else{
    const above=act==='darts',side=g.attackIndex%2?1:-1;
    const tx=clamp(p.x+(above?0:side*260),arena.l+55,arena.r-55);
    const ty=clamp(p.y+(above?-230:0),arena.t+70,arena.b-65);
    b.x=lerp(b.x,tx,Math.min(1,dt*1.5));b.y=lerp(b.y,ty,Math.min(1,dt*1.5));
    if(g.attackTimer<=0){
      const d=norm(p.x-b.x,p.y-b.y);
      if(above){
        // fan spread is the spacing BETWEEN darts, not the full arc.
        if(!hearts&&!g.phase2Intro&&g.attackTick===2&&g.thresholds.has('75')){
          enemyBullet(b.x,b.y,d.x,d.y,125,second?13:10,second?'giga':'fire',54);
        }else fan(b.x,b.y,p.x,p.y,hearts?4:8,c.dartSpacing,second?218:200,'dart');
      }else if(act==='hellblast'){
        const q=enemyBullet(b.x,b.y,d.x,d.y,180,7,'hellblast',36);
        if(q){q.straight=true;q.acceleration=28;q.maxSpeed=260;}
      }else enemyBullet(b.x,b.y,d.x,d.y,125,13,'giga',72);
      g.attackTick++;
      const count=above?(g.phase2Intro>0?3:hearts?3:4):act==='hellblast'?(hearts?5:c.hellblastCount):Number(act.slice(4));
      if(g.attackTick>=count){
        if(g.phase2Intro>0)g.phase2Intro=0;else g.attackIndex++;
        g.attackTick=0;g.attackTimer=c.attackBreath;
      }else g.attackTimer=above?c.dartInterval:act==='hellblast'?c.hellblastInterval:c.blastInterval;
    }
  }
  b.x=clamp(b.x,arena.l+33,arena.r-33);b.y=clamp(b.y,arena.t+33,arena.b-33);
}
export { bossAttack };
