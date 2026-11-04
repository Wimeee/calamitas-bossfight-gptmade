import {emitArkProjectileSmoke} from '../systems/ark-effects.js?v=28.1.0';
import {movingPlayerDistance,projectileMotionPosition} from './motion-collision.js?v=28.1.0';
import {emitProjectileMagic} from '../systems/projectile-effects.js?v=28.1.0';
import {emitSeekerDeath} from '../systems/summon-effects.js?v=28.1.0';
import {emitBrotherDeath} from '../systems/helper-effects.js?v=28.1.0';
import {updateBrotherProjectile} from './brother-projectiles.js?v=28.1.0';
import {breakHeartTendrils} from '../world/arena-state.js?v=28.1.0';
import { projectileHexDuration } from './debuffs.js?v=28.1.0';
import { spawnPickup } from '../game/pickups.js?v=28.1.0';
import { encounterBalance as c } from '../../config/encounter-balance.js?v=28.1.0';
import { cosmicStarBurst } from '../classes/summoner.js?v=28.1.0';
import { hitTarget, hurt } from './damage.js?v=28.1.0';
import { nearestForHoming, possibleTargets } from './targets.js?v=28.1.0';
import { arena } from '../core/arena.js?v=28.1.0';
import { audio } from '../core/audio.js?v=28.1.0';
import { TAU } from '../core/config.js?v=28.1.0';
import { clamp, lerp, norm, rnd, segmentDistance } from '../core/math.js?v=28.1.0';
import { state } from '../core/state.js?v=28.1.0';
import { enter } from '../game/phases.js?v=28.1.0';
import { getSepulcherBlockers, checkSepulcherCollision } from './sepulcher-blocking.js?v=28.1.0';



// Original OnKill rules: BrimstoneHeart/SoulSeekerSupreme 1/4 when injured;
// SupremeCataclysm/SupremeCatastrophe 3..5 hearts regardless of current HP.
function dropHealingHearts(g, enemies, brothers=false){
  for(const enemy of enemies){
    if(enemy.hp>0||enemy.heartLootDropped)continue;
    enemy.heartLootDropped=true;
    const count=brothers?3+Math.floor(Math.random()*3):
      (g.player.hp<g.player.maxHp&&Math.random()<.25?1:0);
    for(let i=0;i<count;i++)spawnPickup(g,'heart',enemy.x,enemy.y);
  }
}

function enemyBullet(x,y,dx,dy,speed,r,kind='dart',damage=42){
  const g=state.game;
  if(g.projectiles.length>650)return;
  const q={x,y,vx:dx*speed,vy:dy*speed,r,kind,damage,life:9,t:0,wave:rnd(0,6),v0:speed,turn:0};
  q.awaitingArenaEntry = x < arena.l-70 || x > arena.r+70 || y < arena.t-70 || y > arena.b+70;
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

// BrimstoneBarrage ai[1]=4 variant - Calamitas's dart attack
// Source: BrimstoneBarrage.cs - ai[0]=0 (SCal), ai[1]=4 (Calamitas darts), ai[2]=maxSpeed
function spawnBrimstoneBarrageFan(x, y, tx, ty, num, spread, initialSpeed) {
  const a = Math.atan2(ty - y, tx - x);
  const maxSpeed = initialSpeed * 1.3; // ai[2] = projectileVelocity.Length() * 1.3f
  for (let i = 0; i < num; i++) {
    const q = a + spread * (i - (num - 1) / 2);
    const vx = Math.cos(q) * initialSpeed;
    const vy = Math.sin(q) * initialSpeed;
    const g = state.game;
    if (g.projectiles.length > 650) return;
    const q_proj = {
      x, y, vx, vy,
      r: 10, // hitbox radius 10 for ai[1]=4 (scale=1)
      kind: 'dart',
      damage: 35,
      life: 11.5, // 690 ticks = 11.5s
      t: 0,
      wave: 0,
      v0: initialSpeed,
      turn: 0,
      sourceCalamitas: true,
      // BrimstoneBarrage ai parameters
      ai0: 0,    // SCal projectile type
      ai1: 4,    // Calamitas dart variant
      ai2: maxSpeed, // max speed
      // Animation & fade
      frame: 0,
      frameTimer: 0,
      opacity: 1,
      // Substepped physics
      stepRemainder: 0,
      sourceTicks: 0
    };
    g.projectiles.push(q_proj);
  }
}


function explosion(b){
  const g=state.game;
  if(b.sourceCalamitas){audio.minion(b.kind==='giga'?'gigablastImpact':'fireblastImpact',g);if(b.ai2===1)return;emitProjectileMagic(g,b,'impact');}else audio.fx('big');
  let num=(b.kind==='giga'?c.gigaDarts:c.fireDarts)[g.difficulty],sp=b.kind==='giga'?175:160;
  if(b.sourceCalamitas){
    num=(b.kind==='giga'?{normal:28,revenge:32,death:36}:{normal:12,revenge:14,death:16})[g.difficulty];
    sp=b.kind==='giga'?390:480;
  }
  for(let i=0;i<num;i++){
    let a=TAU*i/num-(b.sourceCalamitas?Math.PI/2:0);
    const q=enemyBullet(b.x,b.y,Math.cos(a),Math.sin(a),sp,5,'dart',b.kind==='giga'?31:27);
    if(q){
      if(b.sourceCalamitas)Object.assign(q,{sourceCalamitas:true,ai0:0,ai1:2,ai2:sp*1.5,life:11.5,opacity:1,frame:0,sourceTicks:0,stepRemainder:0});
      else {q.acceleration=22;q.maxSpeed=235;}
    }
  }
  if(!b.sourceCalamitas)for(let i=0;i<18;i++)g.sparks.push({x:b.x,y:b.y,vx:rnd(-180,180),vy:rnd(-180,180),life:rnd(.22,.7),max:.7,c:'#ff755f'})
}


// Source SCalBrimstoneFireblast/Gigablast; scoped to Calamitas emissions.
function updateNativeExplosive(q,dt,g,p){
  q.stepRemainder=(q.stepRemainder||0)+dt;
  q.nativeLife??=q.kind==='fire'?150:120;
  while(q.stepRemainder+1e-10>=1/60){
    q.stepRemainder=Math.max(0,q.stepRemainder-1/60);
    q.sourceTicks=(q.sourceTicks||0)+1;q.frame=Math.floor(q.sourceTicks/5)%(q.kind==='fire'?5:6);
    emitProjectileMagic(g,q,'trail');
    if(q.ai2===1)q.opacity=clamp(q.nativeLife/60,0,1);
    if(!q.detonating){
      if(q.ai2!==1)q.opacity=clamp(1-(q.nativeLife-130)/20,0,1);
      const distance=Math.hypot(p.x-q.x,p.y-q.y),d=norm(p.x-q.x,p.y-q.y);
      if(q.kind==='fire'&&distance>40){
        const revenge=g.difficulty!=='normal',inertia=revenge?80:100,speed=(revenge?13:9)*60;
        q.vx=(q.vx*(inertia-1)+d.x*speed)/inertia;q.vy=(q.vy*(inertia-1)+d.y*speed)/inertia;
      }else if(q.kind==='giga'){
        const speed=Math.hypot(q.vx,q.vy),vx=q.vx*24+d.x*speed,vy=q.vy*24+d.y*speed,length=Math.hypot(vx,vy);
        if(length>0){q.vx=vx/length*speed;q.vy=vy/length*speed;}
      }
      if(q.ai2!==1&&(q.nativeLife<=1||(distance<224&&q.opacity===1))){
        q.detonating=true;q.nativeLife=60;q.burstAt=q.t+1;
      }
    }
    if(q.detonating&&q.ai2!==1){
      emitProjectileMagic(g,q,'bloom');
      q.vx*=.9;q.vy*=.9;
      if(q.nativeLife<=40)q.opacity=Math.max(0,q.opacity-.05);
      if(q.nativeLife<=30){q.opacity=0;q.vx=0;q.vy=0;}
    }
    q.x+=q.vx/60;q.y+=q.vy/60;q.t+=1/60;q.nativeLife--;
    q.life=q.nativeLife/60;
    if(q.nativeLife<=0)return true;
  }
  return false;
}


// EonBolt.cs: acquire within 812px, then AngleTowards at constant per-tick strength.
function updateEonBolt(s,dt){
  s.eonRemainder=(s.eonRemainder||0)+dt;
  while(s.eonRemainder+1e-10>=1/60){
    s.eonRemainder=Math.max(0,s.eonRemainder-1/60);
    const targets=possibleTargets().filter(target=>target.hp>0);
    if(s.eonTarget&&!targets.includes(s.eonTarget))s.eonTarget=null;
    if(!s.eonTarget){
      let closest=812;
      for(const target of targets){const distance=Math.hypot(target.x-s.x,target.y-s.y);if(distance<closest){closest=distance;s.eonTarget=target;}}
    }else{
      const current=Math.atan2(s.vy,s.vx),ideal=Math.atan2(s.eonTarget.y-s.y,s.eonTarget.x-s.x);
      const difference=Math.atan2(Math.sin(ideal-current),Math.cos(ideal-current));
      if(Math.abs(difference)<Math.PI){
        const angle=current+clamp(difference,-s.eonTurn,s.eonTurn),speed=Math.hypot(s.vx,s.vy)*.995;
        s.vx=Math.cos(angle)*speed;s.vy=Math.sin(angle)*speed;
      }
    }
    s.x+=s.vx/60;s.y+=s.vy/60;
    s.nativeTrail??=[];s.nativeTrail.push({x:s.x,y:s.y});if(s.nativeTrail.length>20)s.nativeTrail.shift();
    emitArkProjectileSmoke(state.game,s,s.x,s.y,state.game.t-s.eonRemainder);
    s.eonTicks=(s.eonTicks||0)+1;s.life=((s.eonLifetime||100)-s.eonTicks)/60;
    if(s.life<=0)break;
  }
}

function updateBullets(dt,motion=null){
  let g=state.game,p=g.player;
  for(let i=g.projectiles.length-1;i>=0;i--){
    const q=g.projectiles[i];
    const previousX=q.x,previousY=q.y;
    const motionStart=motion?.projectiles.has(q)?projectileMotionPosition(q):null;
    if(q.kind==='hellblast'&&!Number.isFinite(q.fadeStart)){
      q.fadeStart=q.straight?Math.max(0,q.t+q.life-.85):3.4;
    }
    if(q.spawnDelay>0){q.spawnDelay=Math.max(0,q.spawnDelay-dt);continue;}
    const nativeSkull=q.sourceCalamitas&&(q.kind==='hellblast'||q.kind==='hellblast2');
    const nativeExplosive=q.sourceCalamitas&&(q.kind==='fire'||q.kind==='giga');
    if(q.nativeBrother){updateBrotherProjectile(q,g,dt);}
    else if(nativeExplosive){
      if(updateNativeExplosive(q,dt,g,p)){g.projectiles.splice(i,1);explosion(q);continue;}
    }else if(nativeSkull){
      const step=q.kind==='hellblast2'?1/120:1/60;
      q.stepRemainder=(q.stepRemainder||0)+dt;
      while(q.stepRemainder+1e-10>=step){
        q.stepRemainder=Math.max(0,q.stepRemainder-step);q.sourceTicks=(q.sourceTicks||0)+1;
        if(q.kind==='hellblast'){
          q.nativeTrail??=[];q.nativeTrail.unshift({x:q.x,y:q.y});if(q.nativeTrail.length>2)q.nativeTrail.pop();
          emitProjectileMagic(g,q,'skull');
          const speed=Math.hypot(q.vx,q.vy),next=Math.min(q.maxSpeed||1080,speed*1.03);
          if(speed>0&&speed<1080){q.vx*=next/speed;q.vy*=next/speed;}
          q.opacity=q.sourceTicks>204?Math.max(0,1-(q.sourceTicks-204)*.02):1;
        }else q.opacity=q.life<.5?clamp(q.life*2,0,1):clamp((q.sourceTicks-1)/60,0,1);
        q.frame=Math.floor(q.sourceTicks/10)%4;q.x+=q.vx*step;q.y+=q.vy*step;q.t+=step;q.life-=step;
      }
    }else if(q.sourceCalamitas&&q.kind==='skull'){

      q.stepRemainder=(q.stepRemainder||0)+dt;
      while(q.stepRemainder+1e-10>=1/60){
        q.stepRemainder=Math.max(0,q.stepRemainder-1/60);q.sourceTicks=(q.sourceTicks||0)+1;
        q.vy=300*Math.sin(q.sourceTicks/5);q.x+=q.vx/60;q.y+=q.vy/60;q.t+=1/60;q.life-=1/60;
        q.frame=Math.floor(q.sourceTicks/13)%4;q.opacity=q.life<1?Math.max(0,q.life):clamp((q.sourceTicks-30)/30,0,1);
      }
    }else if(q.kind === 'sepulcherDart'){

      q.stepRemainder = (q.stepRemainder || 0) + dt;
      while(q.stepRemainder + 1e-10 >= 1/60){
        // BrimstoneBarrage.cs:45-52 then 93-96: both multipliers apply, in order.
        const speed = Math.hypot(q.vx,q.vy);
        if(speed > 0 && speed < q.ai2){
          const next = Math.min(q.ai2,speed*1.01);
          q.vx *= next/speed; q.vy *= next/speed;
        }
        if(q.life > 10){q.vx *= 1.015; q.vy *= 1.015;}
        q.scale = .85;
        q.sourceTicks = (q.sourceTicks || 0) + 1;
        q.frame = Math.floor(q.sourceTicks/5)%4; // frameCounter > 4: five ticks, 12fps.
        q.opacity = q.life < 1 ? Math.max(0,q.life) : 1;
        q.x += q.vx/60; q.y += q.vy/60;
        q.life -= 1/60; q.t += 1/60;
        q.stepRemainder = Math.max(0,q.stepRemainder-1/60);
      }
    }else if(q.kind === 'dart' && (q.ai1 === 4 || q.ai1 === 2 && q.sourceCalamitas)){
      // BrimstoneBarrage ai[1]=4 - Calamitas's dart attack
      // Substepped 60Hz physics matching C# source
      q.stepRemainder = (q.stepRemainder || 0) + dt;
      while(q.stepRemainder + 1e-10 >= 1/60){
        // Exponential acceleration 1.01x per tick until maxSpeed (ai2)
        const speed = Math.hypot(q.vx, q.vy);
        if (speed > 0 && speed < q.ai2) {
          const next = Math.min(q.ai2, speed * 1.01);
          q.vx *= next / speed; q.vy *= next / speed;
        }
        // Frame animation: 4 frames, 12fps (5 ticks per frame at 60Hz)
        q.sourceTicks = (q.sourceTicks || 0) + 1;
        q.frame = Math.floor(q.sourceTicks / 5) % 4;
        // Opacity fade: last 1 second (life < 1s)
        q.opacity = q.life < 1 ? Math.max(0, q.life) : 1;
        // Position update
        q.x += q.vx / 60; q.y += q.vy / 60;
        q.life -= 1/60; q.t += 1/60;
        q.stepRemainder = Math.max(0, q.stepRemainder - 1/60);
      }
    }else{q.life-=dt;q.t+=dt;}

    if(q.acceleration && q.kind !== 'sepulcherDart'){
      const v=Math.hypot(q.vx,q.vy),next=Math.min(q.maxSpeed||300,v+q.acceleration*dt);
      if(v>0){q.vx*=next/v;q.vy*=next/v;}
    }
    if(!nativeExplosive&&(q.kind==='fire'||q.kind==='giga')){
      if(q.detonating){
        if(q.t>=q.burstAt){g.projectiles.splice(i,1);explosion(q);continue;}
      }else{
        const distance=Math.hypot(p.x-q.x,p.y-q.y),d=norm(p.x-q.x,p.y-q.y);
        q.vx=lerp(q.vx,d.x*q.v0,dt*.55);q.vy=lerp(q.vy,d.y*q.v0,dt*.55);
        if(distance<(q.kind==='giga'?115:95)||q.t>=(q.kind==='giga'?c.gigaFuse:c.fireFuse)){
          q.detonating=true;q.burstAt=q.t+c.blastPause;q.vx=0;q.vy=0;
        }
      }
    }
    if(q.curve){
      const a=q.curve*dt,c=Math.cos(a),sn=Math.sin(a),vx=q.vx;
      q.vx=vx*c-q.vy*sn;
      q.vy=vx*sn+q.vy*c;
    }
    if(q.kind==='hellblast'&&!nativeSkull){
      q.opacity=1;
      // C# BrimstoneHellblast: exponential acceleration ×1.03/tick to max 1080 px/s
      // 60Hz: accelMult per tick → (1.03)^60 ≈ 5.9/s compound
      const speed = Math.hypot(q.vx, q.vy);
      if (speed > 0 && speed < q.maxSpeed) {
        const next = Math.min(q.maxSpeed, speed * Math.pow(q.accelMult || 1.03, dt * 60));
        q.vx *= next / speed;
        q.vy *= next / speed;
      }
      // Frame animation: 4 frames, 10 ticks/frame = 6 fps
      q.frameTimer = (q.frameTimer || 0) + dt;
      if (q.frameTimer >= 1/6) { q.frame = ((q.frame || 0) + 1) % 4; q.frameTimer = 0; }
      // Fade-out & no-damage after fadeStart (3.4s = 204/60)
      if (q.t > (q.fadeStart || 3.4)) {
        q.opacity = Math.max(0, 1 - (q.t - q.fadeStart) / 0.85); // 0.85s fade (51/60)
      }
    }
    if(q.kind==='skull'&&!q.straight&&!q.sourceCalamitas){
      if(q.baseY===undefined)q.baseY=q.y;
      q.y=q.baseY+Math.sin(q.t*4+q.wave)*28
    }
    if(!q.nativeBrother&&!nativeSkull&&!nativeExplosive&&!(q.sourceCalamitas&&q.kind==='skull')&&q.kind!=='sepulcherDart' && !(q.kind==='dart' && (q.ai1===4||q.ai1===2&&q.sourceCalamitas))){q.x+=q.vx*dt;q.y+=q.vy*dt;}

    if(q.awaitingArenaEntry && q.x>=arena.l-70 && q.x<=arena.r+70 && q.y>=arena.t-70 && q.y<=arena.b+70)q.awaitingArenaEntry=false;
    if(q.life<=0||(!q.nativeBrother&&!q.awaitingArenaEntry && (q.kind!=='sepulcherDart' && !(q.kind==='dart' && (q.ai1===4||q.ai1===2&&q.sourceCalamitas)) && (q.x<arena.l-70||q.x>arena.r+70||q.y<arena.t-70||q.y>arena.b+70)))){
      g.projectiles.splice(i,1);
      continue
    }
    if((!q.nativeBrother||q.canHit)&&(!q.sourceCalamitas||q.opacity===undefined||q.opacity===1)&&(q.kind!=='sepulcherDart' && !(q.kind==='dart' && (q.ai1===4||q.ai1===2&&q.sourceCalamitas)) || q.opacity===1)&&movingPlayerDistance(p,q,previousX,previousY,motion,motionStart)<q.r+9){
      // C#: CanHitPlayer returns false when timeLeft < 51 (last 0.85s)
      if (q.kind === 'hellblast' && q.t > (q.fadeStart || 3.4)) {
        // Past damage window - skip damage but keep projectile for fade-out
      } else {
        hurt(q.arkWeakenedUntil>g.t?Math.max(0,q.damage-120):q.damage,'projectile',q.nativeBrother?(q.kind==='fist'?'Supreme Cataclysm fist':'Supreme Catastrophe slash'):q.kind==='hellblast'?'Brimstone Hellblast':q.kind==='giga'?'Brimstone Gigablast':q.kind==='fire'?'Brimstone Fireblast':q.kind==='skull'?'Brimstone Flame Skull':'Brimstone Dart',projectileHexDuration(q));
        // Native hostile projectiles have penetrate=-1; a hit must not cancel their later burst.
        if(q.sourceCalamitas||q.nativeBrother||q.kind==='sepulcherDart')continue;
        if(q.kind==='fire'||q.kind==='scalfireblast') audio.minion('fireblastImpact', g);
        else if(q.kind==='giga') audio.minion('gigablastImpact', g);
        else if(q.kind==='hellblast'||q.kind==='hellblast2') audio.minion('hellblastImpact', g);
        else if(q.kind==='cataclysmFist') audio.minion('cataclysmFistImpact', g);
        else if(q.kind==='catastropheSlash') audio.minion('catastropheSlashImpact', g);
        g.projectiles.splice(i,1);
      }
    }
  }
  for(let i=g.shots.length-1;i>=0;i--){
    let s=g.shots[i];
    const prevX = s.x, prevY = s.y;
    if(s.id==='arkBeam'||s.id==='arkStar'&&!s.nativeEon){
      s.nativeTrailClock=(s.nativeTrailClock||0)+dt;
      if(s.nativeTrailClock>=1/60){s.nativeTrailClock%=1/60;s.nativeTrail??=[];s.nativeTrail.push({x:s.x,y:s.y});if(s.nativeTrail.length>12)s.nativeTrail.shift();}
    }
    if(s.nativeEon)updateEonBolt(s,dt);
    else {
    s.life-=dt;
    if(s.homing){
      let tar=nearestForHoming(s.x,s.y),d=norm(tar.x-s.x,tar.y-s.y),len=Math.hypot(s.vx,s.vy);
      s.vx=lerp(s.vx,d.x*len,dt*4);
      s.vy=lerp(s.vy,d.y*len,dt*4)
    }
    s.x+=s.vx*dt;
    s.y+=s.vy*dt;
    }
    // The arena border confines players, not attacks; the source boss can fly outside it.
    if(s.life<=0){
      g.shots.splice(i,1);
      continue
    }

    // Sepulcher blocking + target collision: find earliest hit along swept path
    // Compare target entry t vs blocker entry t; nearest wins.
    // Piercing: after hitting target, continue with reduced damage but still stop at any blocker.
    let dead = false;
    let shotX = s.x, shotY = s.y;
    let remainingPierce = s.pierce;
    let currentDmg = s.dmg;
    let currentX = prevX, currentY = prevY;

    while (true) {
      // Find earliest target collision from current position to final position
      const targets = possibleTargets();
      let bestTarget = null;
      let bestTargetT = Infinity;

      for (const t of targets) {
        if (s.hitIds.has(t)) continue;
        // Swept circle-circle for target using helper
        const collision = checkSepulcherCollision(currentX, currentY, shotX, shotY, s.r || 4, [{
          x: t.x, y: t.y, radius: t.r, type: 'target', ref: t
        }]);
        if (collision.hit && collision.t < bestTargetT) {
          bestTargetT = collision.t;
          bestTarget = t;
        }
      }

      // Find earliest blocker collision using helper
      let bestBlocker = null;
      let bestBlockerT = Infinity;
      if (g.sepulcher && g.stage === 'hearts' && g.hearts?.some(h => h.hp > 0)) {
        const blockers = getSepulcherBlockers(g);
        if (blockers.length > 0) {
          const collision = checkSepulcherCollision(currentX, currentY, shotX, shotY, s.r || 4, blockers);
          if (collision.hit) {
            bestBlockerT = collision.t;
            bestBlocker = collision.blocker;
          }
        }
      }

      // Compare earliest collision
      if (bestTargetT <= bestBlockerT) {
        // Target hit first (or simultaneously - target wins)
        if (bestTarget) {
          const hitX = currentX + (shotX - currentX) * bestTargetT;
          const hitY = currentY + (shotY - currentY) * bestTargetT;
          s.hitIds.add(bestTarget);
          hitTarget(bestTarget, currentDmg, hitX, hitY, s.col, s.id);

          // For cosmicStar burst: use collision point as burst origin, not final position
          const isCosmicStar = (s.id === 'cosmicStar');
          const shouldBurst = isCosmicStar && remainingPierce === 0; // burst only on consuming hit

          if (remainingPierce > 0) {
            remainingPierce--;
            currentDmg *= 0.63;
            // Continue from hit point toward final position
            currentX = hitX;
            currentY = hitY;
            continue;
          } else {
            dead = true;
            // Legitimate hit that consumes shot - trigger cosmicStarBurst at collision point
            if (shouldBurst) {
              // Temporarily set shot position to collision point for burst origin
              const oldX = s.x, oldY = s.y;
              s.x = hitX; s.y = hitY;
              cosmicStarBurst(s, bestTarget);
              s.x = oldX; s.y = oldY;
            }
          }
        }
        break;
      } else {
        // Blocker hit first - shot absorbed
        // Clamp visual position to collision point so shot doesn't render past worm for one frame
        s.x = bestBlockerT === 0 ? currentX : currentX + (shotX - currentX) * bestBlockerT;
        s.y = bestBlockerT === 0 ? currentY : currentY + (shotY - currentY) * bestBlockerT;
        if (s.id === 'cosmicStar') {
          // Don't create burst if absorbed by worm
        }
        dead = true; // Remove shot
        break;
      }
    }

    if (dead) {
      g.shots.splice(i, 1);
    } else {
      // Update pierce count
      s.pierce = remainingPierce;
      s.dmg = currentDmg;
    }
  }
  if(g.stage==='hearts'&&!g.castDelayState){
    let before=g.hearts.length;
    for(const h of g.hearts)if(h.hp<=0)breakHeartTendrils(g,h);
    dropHealingHearts(g,g.hearts,false);
    g.hearts=g.hearts.filter(x=>x.hp>0);
    if(before>0&&!g.hearts.length&&g.sepulcher) audio.minion('sepulcherDeath', g);
    g.hint='SEPULCHER: '+g.hearts.length+'/10 сердець — бос невразливий';
    if(before&&!g.hearts.length){
      // Native helper defeat does not cancel already-fired projectiles.
      g.done.add(g.marker);
      enter('normal',g.marker==='sep2'?'sep2':'opening','CALAMITAS');
      g.hint='АТАКУЙ CALAMITAS'
    }
  }
  if(g.stage==='brothers'&&!g.castDelayState){
    let before=g.brothers.length;
    for(const br of g.brothers)if(br.hp<=0&&!br.deathVisualEmitted){emitBrotherDeath(g,br);audio.minion('brotherDeath',g);}
    dropHealingHearts(g,g.brothers,true);
    // Native Death-mode last-brother resurrection happens once, before SCal phase completion.
    if(g.mode==='playing'&&g.difficulty==='death'&&g.brotherRespawnAvailable&&!g.brothers.some(b=>b.hp>0)){
      const dead=g.brothers.find(b=>b.hp<=0&&b.nativeAI?.broAlive===false);
      if(dead){g.brotherRespawnAvailable=false;g.brothers.push({x:dead.x,y:dead.y,hp:dead.max,max:dead.max,r:60,kind:1-dead.kind,movingUp:!dead.nativeAI.movingUp});audio.minion('brotherRespawn',g);}
    }
    g.brothers=g.brothers.filter(x=>x.hp>0);

    if(!g.brothers.length){
      // Owner-death rules retire fists/slashes; unrelated projectiles retain their lifetime.
      g.done.add('bros');
      g.thresholds.add('40');g.done.add('h40');g.phase2Intro=200/60;g.attackIndex=0;
      enter('normal','h40','CALAMITAS');
      g.hint='АТАКУЙ CALAMITAS'
    }
  }
  if(g.stage==='seekers'&&!g.castDelayState){
    let before=g.seekers.length;
    for(const s of g.seekers)if(s.hp<=0)emitSeekerDeath(g,s);
    dropHealingHearts(g,g.seekers,false);
    g.seekers=g.seekers.filter(x=>x.hp>0);
    if(g.seekers.length < before) audio.minion('seekerDeath', g);
    if(!g.seekers.length){
      // Native helper defeat does not cancel already-fired projectiles.
      g.done.add('seek');
      enter('normal','seek','CALAMITAS');
      g.hint='АТАКУЙ CALAMITAS'
    }
  }
}


export { enemyBullet, fan, explosion, updateBullets, spawnBrimstoneBarrageFan };
