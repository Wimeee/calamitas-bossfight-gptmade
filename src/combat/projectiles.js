import { cosmicStarBurst } from '../classes/summoner.js?v=18.0.0';
import { hitTarget, hurt } from './damage.js?v=18.0.0';
import { nearestForHoming, possibleTargets } from './targets.js?v=18.0.0';
import { arena } from '../core/arena.js?v=18.0.0';
import { audio } from '../core/audio.js?v=18.0.0';
import { TAU } from '../core/config.js?v=18.0.0';
import { lerp, norm, rnd } from '../core/math.js?v=18.0.0';
import { state } from '../core/state.js?v=18.0.0';
import { enter } from '../game/phases.js?v=18.0.0';


function enemyBullet(x,y,dx,dy,speed,r,kind='dart',damage=42){
  const g=state.game;
  if(g.projectiles.length>650)return;
  const q={x,y,vx:dx*speed,vy:dy*speed,r,kind,damage,life:9,t:0,wave:rnd(0,6),v0:speed,turn:0};
  g.projectiles.push(q);
  return q
}


function fan(x,y,tx,ty,num,spread,speed,kind='dart'){
  let a=Math.atan2(ty-y,tx-x);
  for(let i=0;i<num;i++){
    let q=a+spread*(i-(num-1)/2);
    enemyBullet(x,y,Math.cos(q),Math.sin(q),speed,kind==='giga'?13:kind==='fire'?10:6,kind,kind==='giga'?72:kind==='fire'?54:35)
  }
}


function explosion(b){
  audio.fx('big');
  let g=state.game,num=b.kind==='giga'?(g.difficulty==='death'?28:g.difficulty==='revenge'?22:17):(g.difficulty==='death'?16:12),sp=b.kind==='giga'?245:205;
  for(let i=0;i<num;i++){
    let a=TAU*i/num+Math.sin(i)*.08;
    enemyBullet(b.x,b.y,Math.cos(a),Math.sin(a),sp,5,'dart',b.kind==='giga'?31:27)
  }
  for(let i=0;i<18;i++)g.sparks.push({x:b.x,y:b.y,vx:rnd(-180,180),vy:rnd(-180,180),life:rnd(.22,.7),max:.7,c:'#ff755f'})
}


function updateBullets(dt){
  let g=state.game,p=g.player;
  for(let i=g.projectiles.length-1;i>=0;i--){
    const q=g.projectiles[i];
    q.life-=dt;
    q.t+=dt;
    if(q.curve){
      const a=q.curve*dt,c=Math.cos(a),sn=Math.sin(a),vx=q.vx;
      q.vx=vx*c-q.vy*sn;
      q.vy=vx*sn+q.vy*c;
    }
    if(q.kind==='hellblast'&&!q.straight){
      const a=(q.turn||0)*dt,c=Math.cos(a),si=Math.sin(a),vx=q.vx,vy=q.vy;
      q.vx=(vx*c-vy*si)*(1+dt*.025);
      q.vy=(vx*si+vy*c)*(1+dt*.025)
    }
    if(q.kind==='skull'&&!q.straight){
      q.y+=Math.sin(q.t*8+q.wave)*85*dt
    }
    q.x+=q.vx*dt;
    q.y+=q.vy*dt;
    if(q.kind==='fire'&&q.t>2.3||q.kind==='giga'&&q.t>2.4){
      g.projectiles.splice(i,1);
      explosion(q);
      continue
    }
    if(q.life<=0||q.x<arena.l-70||q.x>arena.r+70||q.y<arena.t-70||q.y>arena.b+70){
      g.projectiles.splice(i,1);
      continue
    }
    if(Math.hypot(q.x-p.x,q.y-p.y)<q.r+9){
      hurt(q.arkWeakenedUntil>g.t?Math.max(0,q.damage-120):q.damage,'projectile',q.kind==='hellblast'?'Brimstone Hellblast':q.kind==='giga'?'Brimstone Gigablast':q.kind==='fire'?'Brimstone Fireblast':q.kind==='skull'?'Brimstone Flame Skull':'Brimstone Dart');
      g.projectiles.splice(i,1)
    }
  }
  for(let i=g.shots.length-1;i>=0;i--){
    let s=g.shots[i];
    s.life-=dt;
    if(s.homing){
      let tar=nearestForHoming(s.x,s.y),d=norm(tar.x-s.x,tar.y-s.y),len=Math.hypot(s.vx,s.vy);
      s.vx=lerp(s.vx,d.x*len,dt*4);
      s.vy=lerp(s.vy,d.y*len,dt*4)
    }
    s.x+=s.vx*dt;
    s.y+=s.vy*dt;
    if(s.life<=0||s.x<arena.l-30||s.x>arena.r+30||s.y<arena.t-30||s.y>arena.b+30){
      g.shots.splice(i,1);
      continue
    }
    const targets=possibleTargets();
    let dead=false;
    for(let t of targets){
      if(!s.hitIds.has(t)&&Math.hypot(t.x-s.x,t.y-s.y)<t.r+s.r){
        s.hitIds.add(t);
        hitTarget(t,s.dmg,s.x,s.y,s.col,s.id);
        if(s.pierce>0){
          s.pierce--;
          s.dmg*=.63
        }else
        {
          dead=true
        }
        break
      }
    }
    if(dead){
      if(s.id==='cosmicStar')cosmicStarBurst(s,s.hitIds.values().next().value);
      g.shots.splice(i,1)
    }
  }
  if(g.stage==='hearts'){
    let before=g.hearts.length;
    g.hearts=g.hearts.filter(x=>x.hp>0);
    g.hint='SEPULCHER: '+g.hearts.length+'/10 сердець — бос невразливий';
    if(before&&!g.hearts.length){
      g.projectiles=[];
      g.done.add(g.marker);
      enter('normal',g.marker==='sep2'?'sep2':'opening','CALAMITAS');
      g.hint='АТАКУЙ CALAMITAS'
    }
  }
  if(g.stage==='brothers'){
    g.brothers=g.brothers.filter(x=>x.hp>0);
    if(!g.brothers.length){
      g.projectiles=[];
      g.done.add('bros');
      enter('normal','h40','CALAMITAS');
      g.hint='АТАКУЙ CALAMITAS'
    }
  }
  if(g.stage==='seekers'){
    g.seekers=g.seekers.filter(x=>x.hp>0);
    if(!g.seekers.length){
      g.projectiles=[];
      g.done.add('seek');
      enter('normal','seek','CALAMITAS');
      g.hint='АТАКУЙ CALAMITAS'
    }
  }
}


export { enemyBullet, fan, explosion, updateBullets };
