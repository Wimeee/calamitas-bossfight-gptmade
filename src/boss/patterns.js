import { enemyBullet } from '../combat/projectiles.js?v=26.0.0';
import { arena } from '../core/arena.js?v=26.0.0';
import { TAU } from '../core/config.js?v=26.0.0';
import { clamp } from '../core/math.js?v=26.0.0';
import { state } from '../core/state.js?v=26.0.0';


function updateExtraPatterns(dt){
  const g=state.game;
  if(!['hell','normal','hearts','brothers','seekers'].includes(g.stage))return;
  g.patternTimer-=dt;
  for(let i=g.patternWarnings.length-1;i>=0;i--){
    const w=g.patternWarnings[i];
    w.left-=dt;
    if(w.left<=0){
      releaseExtraPattern(w);
      g.patternWarnings.splice(i,1)
    }
  }
  if(g.patternTimer>0||g.stageT<1.5)return;
  const index=g.patternIndex++%3,kind=index===0?'spiral':index===1?'cross':'pincer';
  // Ring spokes have a deliberately open sector toward the player's snapshot.
  const cx=500,cy=300,aim=Math.atan2(g.player.y-cy,g.player.x-cx);
  const w={kind,x:cx,y:cy,angle:aim,left:.9,max:.9,phase:g.stage==='hell'?g.phaseN:2};
  if(kind==='cross'){
    w.x=clamp(g.player.x,arena.l+90,arena.r-90);
    w.y=clamp(g.player.y,arena.t+90,arena.b-90);
  }
  if(kind==='pincer'){
    w.y=clamp(g.player.y,arena.t+65,arena.b-65);
    w.angle=Math.atan2(g.player.y-300,g.player.x-500);
  }
  g.patternWarnings.push(w);
  g.patternTimer=g.stage==='hell'?(g.difficulty==='death'?3.6:4.4):6.2;
}


function releaseExtraPattern(w){
  const g=state.game,scale=g.difficulty==='death'?1.13:g.difficulty==='revenge'?1.05:1;
  if(w.kind==='spiral'){
    const N=16+w.phase*2;
    for(let i=0;i<N;i++){
      const a=w.angle+i*TAU/N,delta=Math.atan2(Math.sin(a-w.angle),Math.cos(a-w.angle));
      if(Math.abs(delta)<.38)continue;
      const q=enemyBullet(w.x,w.y,Math.cos(a),Math.sin(a),145*scale,5,'dart',28);
      if(q){
        q.pattern='spiral';
        q.curve=.22;
        q.life=9;
      }
    }
  }else
  if(w.kind==='cross'){
    // Crossing ladders stop at a broad gap around the marked crossing.
    for(let i=-4;i<=4;i++){
      if(Math.abs(i)<=1)continue;
      const offset=i*35;
      for(const side of [-1,1]){
        const q=enemyBullet(w.x+offset,side<0?arena.t-16:arena.b+16,0,-side,190*scale,6,'hellblast',30);
        if(q){
          q.straight=true;
          q.pattern='cross';
          q.life=9;
        }
        const h=enemyBullet(side<0?arena.l-16:arena.r+16,w.y+offset,-side,0,190*scale,6,'hellblast',30);
        if(h){
          h.straight=true;
          h.pattern='cross';
          h.life=9;
        }
      }
    }
  }else
  {
    for(const side of [-1,1])for(let i=-1;i<=1;i++){
      const x=side<0?arena.l-20:arena.r+20,y=w.y+i*45;
      const a=Math.atan2(300-y,500-x)+i*.08;
      const q=enemyBullet(x,y,Math.cos(a),Math.sin(a),180*scale,7,'skull',31);
      if(q){
        q.straight=true;
        q.pattern='pincer';
        q.life=9;
      }
    }
  }
}


export { updateExtraPatterns, releaseExtraPattern };
