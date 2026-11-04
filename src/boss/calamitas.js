import {tryAsgardianSlam} from '../combat/asgardian.js?v=29.0.1';
import {emitCalamitasCast,emitCalamitasAmbient} from '../systems/calamitas-effects.js?v=29.0.1';
import { audio } from '../core/audio.js?v=29.0.1';
import { hurt } from '../combat/damage.js?v=29.0.1';
import { enemyBullet, spawnBrimstoneBarrageFan } from '../combat/projectiles.js?v=29.0.1';
import { seq } from '../core/config.js?v=29.0.1';
import { clamp, norm, segmentDistance } from '../core/math.js?v=29.0.1';
import { state } from '../core/state.js?v=29.0.1';

// Base Calamity, pinned 1a8cebd: SupremeCalamitas.cs 2090-2545, 2660-3100.
// Source velocities are px/tick; public browser velocities are px/second.
const TICK = 1 / 60;
const chargeNext = new Set([2, 7, 13, 17]);

// CalamityUtils.SmoothMovement(NPC, 0, delta, speed, acceleration, true).
function smoothCalamitasMovement(b, tx, ty, speed, acceleration) {
  const dx = tx - b.x, dy = ty - b.y, length = Math.hypot(dx, dy);
  const direction = length > 0 ? {x: dx / length, y: dy / length} : {x: 0, y: 0};
  const lerp = clamp(length / 2400, 0, 1);
  const desired = Math.min(length, speed) * (1 - lerp) + Math.min(length / 24, speed * 3) * lerp;
  // Terraria NPC.SimpleFlyMovement: component acceleration, doubled when reversing.
  for (const axis of ['x', 'y']) {
    let velocity = (b['v' + axis] || 0) / 60;
    const target = direction[axis] * desired;
    if (velocity < target) {
      velocity += acceleration;
      if (velocity < 0 && target > 0) velocity += acceleration;
    } else if (velocity > target) {
      velocity -= acceleration;
      if (velocity > 0 && target < 0) velocity -= acceleration;
    }
    b['v' + axis] = velocity * 60;
  }
}

function cast(g, act, kind, speed, offset = 8) {
  const b = g.boss, p = g.player, d = norm(p.x - b.x, p.y - b.y);
  const q = enemyBullet(b.x + d.x * offset, b.y + d.y * offset, d.x, d.y, speed, kind === 'hellblast' ? 20 : kind === 'giga' ? 25 : 18, kind, kind === 'giga' ? 72 : kind === 'fire' ? 54 : 36);
  if(q)Object.assign(q,{sourceCalamitas:true,opacity:kind==='fire'?0:1,life:kind==='fire'?2.5:kind==='giga'?2:4.25});
  if (q && kind === 'hellblast') Object.assign(q, {life: 4.25, maxSpeed: 1080, accelMult: 1.03, fadeStart: 3.4, frame: 0, frameTimer: 0});
  b.castAt = g.t; b.castKind = act; b.castSecond = g.thresholds.has('40');
  audio.calamitas(kind === 'giga' ? 'bigCast' : kind === 'hellblast' ? 'hellblast' : 'cast', g);
  emitCalamitasCast(g,kind);
  g.attackTick++;
}

function newAttack(g, previous) {
  return {index: g.attackIndex, stage: g.stage, marker: g.marker, second: g.thresholds.has('40'),
    ticks: 0, shot: 0, localShot: previous?.localShot || 0, charges: 0,
    firstFire: previous?.firstFire ?? true, canSplit: previous?.canSplit ?? true,
    remainder: previous?.remainder || 0};
}

function nextAttack(g, ai) {
  if (seq[g.attackIndex % seq.length] === 'darts') ai.firstFire = true;
  g.attackIndex++; g.attackTick = 0; g.dashActive = 0; g.dashWind = 0;
  g.calamitasAI = newAttack(g, ai);
}

function bossTick(g, ai, motion=null, tickTime=0) {
  const b = g.boss, p = g.player, second = ai.second, worm = g.stage === 'hearts' && g.hearts.length > 0;
  const act = seq[g.attackIndex % seq.length];
  const oldX = b.x, oldY = b.y;
  b.contactDamage = 0; g.dashActive = 0; g.dashWind = 0;
  ai.ticks++;

  if (act.startsWith('dash')) {
    if (ai.ticks === 1) {
      const d = norm(p.x - b.x, p.y - b.y);
      const speed = ((worm ? 26 : 30) + (1 - b.hp / b.max) * 8) * 60;
      b.vx = d.x * speed; b.vy = d.y * speed;
      g.dashVector = d; b.shieldRotation = Math.atan2(d.y, d.x);
      audio.calamitas('dash', g);
    }
    if (ai.ticks < 25) { b.contactDamage = 94; g.dashActive = (25 - ai.ticks) / 60; }
    else {
      b.vx *= .96; b.vy *= .96;
      if (Math.abs(b.vx) < 6) b.vx = 0;
      if (Math.abs(b.vy) < 6) b.vy = 0;
    }
    const again = ai.charges + 1 < (second ? 1 : 2);
    if (again && ai.ticks > 50) {
      g.dashWind = (70 - ai.ticks) / 60;
      const ideal = Math.atan2(p.y - b.y, p.x - b.x);
      const diff = Math.atan2(Math.sin(ideal - b.shieldRotation), Math.cos(ideal - b.shieldRotation));
      b.shieldRotation += diff * .125 + clamp(diff * .875, -.18, .18);
    }
    g.attackTimer = Math.max(0, (70 - ai.ticks) / 60);
    if (ai.ticks >= 70) {
      ai.charges++; ai.ticks = 0;
      if (!again) nextAttack(g, ai);
    }
  } else {
    const above = act === 'darts', skull = act === 'hellblast';
    const side = b.x < p.x + 10 ? -1 : 1; // player.position.X + player.width
    smoothCalamitasMovement(b, above ? p.x : p.x + side * (skull ? 600 : 750), above ? p.y - 550 : p.y, above ? 12 : 32, above ? .12 : 1.2);
    const duration = above ? (second ? 240 : 300) : skull ? (second ? 300 : 480) : (second ? 240 : 300);
    if (skull) {
      ai.shot += worm ? .5 : 1;
      const interval = second ? 24 : 20;
      g.attackTimer = Math.max(0, (interval - ai.shot) / 60 / (worm ? .5 : 1));
      // Source ends the attack before the last tick's emission.
      if (ai.ticks < duration && ai.shot >= interval) {
        ai.shot = 0; cast(g, act, 'hellblast', 600, 4);
      }
    } else {
      ai.localShot += above && worm ? .5 : 1;
      const interval = above ? (second ? 60 : 90) : (second ? 100 : 140) * (worm ? 2 : 1);
      g.attackTimer = Math.max(0, (interval + 1 - ai.localShot) / 60 / (above && worm ? .5 : 1));
      if (ai.localShot > interval) {
        ai.localShot = 0;
        if (!above) cast(g, act, 'giga', 300);
        else {
          const random = Math.floor(Math.random() * 6);
          if (random === 0 && ai.canSplit && !ai.firstFire) {
            ai.canSplit = false; cast(g, act, 'giga', 600);
          } else if ((random === 1 && ai.canSplit) || ai.firstFire) {
            ai.canSplit = false; cast(g, act, 'fire', 600);
          } else {
            ai.canSplit = true;
            const d = norm(p.x - b.x, p.y - b.y);
            spawnBrimstoneBarrageFan(b.x + d.x * 8, b.y + d.y * 8, p.x, p.y, 8, (40 * Math.PI / 180) / 7, 600);
            b.castAt = g.t; b.castKind = act; b.castSecond = second;
            audio.calamitas('cast', g); g.attackTick++;
          }
          ai.firstFire = false;
        }
      }
    }
    if (chargeNext.has(g.attackIndex % seq.length) && duration - ai.ticks < 30) {
      g.dashWind = Math.max(TICK, (duration - ai.ticks) / 60);
      const ideal=Math.atan2(p.y-b.y,p.x-b.x),rotation=b.shieldRotation||0;
      const diff=Math.atan2(Math.sin(ideal-rotation),Math.cos(ideal-rotation));
      if(Math.abs(diff)>.04)b.shieldRotation=rotation+diff*.125+clamp(diff*.875,-.18,.18);
    }
    if (ai.ticks >= duration) nextAttack(g, ai);
  }
  b.x += b.vx / 60; b.y += b.vy / 60;
  emitCalamitasAmbient(g,act);
  if(motion){
    const previous=motion.bossLast;
    motion.bossSegments.push({start:previous.time,end:tickTime,from:{x:previous.x,y:previous.y},to:{x:b.x,y:b.y},damage:b.contactDamage});
    motion.bossLast={time:tickTime,x:b.x,y:b.y};
  }else{
    if(b.contactDamage)tryAsgardianSlam(g,b,oldX,oldY);
    if(b.contactDamage&&segmentDistance(p.x,p.y,oldX,oldY,b.x,b.y)<b.r+11)hurt(b.contactDamage,'contact','Ривок Calamitas');
  }
  b.chargeFrame = g.dashActive > 0 ? 1 : g.dashWind > 0 ? clamp(1 - g.dashWind / .5, 0, 1) : 0;
}

function bossAttack(dt, motion=null) {
  const g = state.game;
  if(g.mode!=='playing'||!['normal', 'hearts', 'seekers'].includes(g.stage))return;
  if (g.phase2Intro > 0) {
    g.boss.dontTakeDamage = true;
    g.phase2Intro = Math.max(0, g.phase2Intro - dt);
    g.boss.vx = 0; g.boss.vy = 0; g.boss.contactDamage = 0;
    return;
  }
  g.boss.dontTakeDamage = g.stage !== 'normal';
  let ai = g.calamitasAI;
  if (!ai || ai.index !== g.attackIndex || ai.stage !== g.stage || ai.marker !== g.marker || ai.second !== g.thresholds.has('40')) ai = g.calamitasAI = newAttack(g);
  const initialRemainder=ai.remainder;
  let tickTime=TICK-initialRemainder;
  if(motion){const b=g.boss;motion.bossSegments=[];motion.bossLast={time:0,x:b.x+b.vx*initialRemainder,y:b.y+b.vy*initialRemainder};}
  ai.remainder += dt;
  while (ai.remainder + 1e-10 >= TICK) {
    ai.remainder = Math.max(0, ai.remainder - TICK);
    bossTick(g, ai, motion, Math.min(dt,tickTime)); tickTime+=TICK; ai = g.calamitasAI;
  }
  if(motion&&dt>motion.bossLast.time+1e-10){const b=g.boss,last=motion.bossLast;motion.bossSegments.push({start:last.time,end:dt,from:{x:last.x,y:last.y},to:{x:b.x+b.vx*ai.remainder,y:b.y+b.vy*ai.remainder},damage:b.contactDamage});}
}

export { bossAttack, smoothCalamitasMovement };
