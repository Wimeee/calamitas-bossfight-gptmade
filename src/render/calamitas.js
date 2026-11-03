import { calamitasSprites as spec } from '../../config/calamitas-sprites.js?v=26.0.4';
import { seq, TAU } from '../core/config.js?v=26.0.4';
import { ctx } from '../core/dom.js?v=26.0.4';
import { settings } from '../core/settings.js?v=26.0.4';
import { clamp } from '../core/math.js?v=26.0.4';
import { calamitasImage, paintCalamitasFrame } from './calamitas-atlas.js?v=26.0.4';
import {
  computeChargeShieldGeometry,
  computeForcefieldGeometry,
  interpolateFieldRadius,
  interpolateAngle,
  lerpShieldRotation
} from './calamitas-math.js?v=26.0.4';

const clocks = new WeakMap(), effects = new Map();

/**
 * Frame Animation Types from source (SupremeCalamitas.cs FrameAnimationType):
 * 0 = UpwardDraft (idle floating up)
 * 1 = FasterUpwardDraft (phase 2 idle)
 * 2 = Casting (phase transition cast)
 * 3 = BlastCast (giga blast windup)
 * 4 = BlastPunchCast (giga blast release)
 * 5 = OutwardHandCast (hellblast windup)
 * 6 = PunchHandCast (hellblast release)
 */
const FRAME_TYPES = {
  UPWARD_DRAFT: 0,
  FASTER_UPWARD_DRAFT: 1,
  CASTING: 2,
  BLAST_CAST: 3,
  BLAST_PUNCH_CAST: 4,
  OUTWARD_HAND_CAST: 5,
  PUNCH_HAND_CAST: 6
};

/**
 * Map frame type to sprite clip
 * Source uses 7 clips x 6 frames in 2x21 atlas (calamitas-sprites.js)
 */
function frameTypeToClip(frameType, second) {
  switch (frameType) {
    case FRAME_TYPES.UPWARD_DRAFT: return 'idle';
    case FRAME_TYPES.FASTER_UPWARD_DRAFT: return 'dash';
    case FRAME_TYPES.CASTING: return 'casting';
    case FRAME_TYPES.BLAST_CAST: return 'blast';
    case FRAME_TYPES.BLAST_PUNCH_CAST: return 'blastPunch';
    case FRAME_TYPES.OUTWARD_HAND_CAST: return 'handCast';
    case FRAME_TYPES.PUNCH_HAND_CAST: return 'handPunch';
    default: return 'idle';
  }
}

export function calamitasPoseState(g) {
  const b = g.boss;
  // In acceptance phase, second phase visuals are disabled
  const second = g.stage === 'accept' ? false : g.thresholds.has('40');
  const act = seq[g.attackIndex % seq.length];
  const inTransition = g.ritual?.phase === 'summoning' || g.stage === 'hell' || g.phase2Intro > 0 || !!g.castDelayState;

  const ai=g.calamitasAI;
  if(ai&&ai.index===g.attackIndex&&['normal','hearts','seekers'].includes(g.stage)&&!inTransition&&!g.castDelayState){
    let clip='idle',fps=9,frameType=second?1:0,customFrame=null;
    if(act.startsWith('dash')||g.dashWind>0||g.dashActive>0)clip='dash';
    else if(act==='hellblast'){clip=second?'handPunch':'handCast';frameType=second?6:5;fps=second?14.7:9;}
    else if(act.startsWith('giga')){
      if(!second){clip='blast';fps=10.5;frameType=3;}
      else if(ai.ticks>40){
        const rate=g.stage==='hearts'?200:100;
        if(ai.localShot>rate-18||ai.localShot<=15){
          clip='blastPunch';frameType=4;fps=0;
          customFrame=ai.localShot>rate-18?Math.floor((ai.localShot-(rate-18))/18*3):Math.floor(3+ai.localShot/15*2);
        }
      }
    }
    return {clip,fps,second,frameType,customFrame,customFps:null};
  }
  // Source frame type logic (SupremeCalamitas.cs FrameAnimationType assignment)
  let frameType = FRAME_TYPES.UPWARD_DRAFT;
  let customFrame = null;
  let customFps = null;

  if (inTransition) {
    frameType = FRAME_TYPES.CASTING;
  } else if (g.dashWind > 0 || g.dashActive > 0) {
    // Dash uses dash clip but frame type varies
    frameType = FRAME_TYPES.UPWARD_DRAFT; // Dash animation handled separately
  } else if (g.stage !== 'normal' && g.stage !== 'hearts') {
    frameType = FRAME_TYPES.UPWARD_DRAFT;
  } else {
    // Normal attack phase - determine frame type from attack
    const age = g.t - (b.castAt ?? -99);
    const recent = age >= 0 && b.castSecond !== false;
    // Use castKind for release/recovery animations (completes even after attackIndex advances)
    // Use current act for windup animations (upcoming attack)
    const castKind = b.castKind;

    // RELEASE/RECOVERY animations - based on castKind (the attack that was actually fired)
    if (second && recent && castKind?.startsWith('giga') && age < 0.25) {
      // BlastPunchCast - release frames (completes based on castKind)
      frameType = FRAME_TYPES.BLAST_PUNCH_CAST;
      customFrame = Math.min(5, 3 + Math.floor(age / 0.25 * 3));
    } else if (second && recent && castKind === 'hellblast' && age < 0.10) {
      // PunchHandCast - release frames (completes based on castKind)
      frameType = FRAME_TYPES.PUNCH_HAND_CAST;
      customFrame = Math.min(5, 3 + Math.floor(age / 0.10 * 3));
    }
    // WINDUP animations - based on current act (upcoming attack)
    else if (act?.startsWith('giga')) {
      if (!second) {
        frameType = FRAME_TYPES.BLAST_CAST;
      } else if (g.attackTimer > 0 && g.attackTimer <= 0.30) {
        // Windup frames
        frameType = FRAME_TYPES.BLAST_PUNCH_CAST;
        customFrame = Math.min(2, Math.floor((1 - g.attackTimer / 0.30) * 3));
      } else {
        frameType = FRAME_TYPES.UPWARD_DRAFT;
      }
    } else if (act === 'hellblast') {
      if (!second) {
        frameType = FRAME_TYPES.OUTWARD_HAND_CAST;
      } else if (g.attackTimer > 0 && g.attackTimer <= 0.10) {
        // Windup frames
        frameType = FRAME_TYPES.PUNCH_HAND_CAST;
        customFrame = Math.min(2, Math.floor((1 - g.attackTimer / 0.10) * 3));
      } else {
        frameType = FRAME_TYPES.UPWARD_DRAFT;
      }
    } else if (act === 'darts') {
      // Darts use idle or dash clip depending on phase
      frameType = FRAME_TYPES.UPWARD_DRAFT;
    } else {
      frameType = FRAME_TYPES.UPWARD_DRAFT;
    }
  }

  // For dash, we use a special clip
  if (g.dashWind > 0 || g.dashActive > 0) {
    return { clip: 'dash', fps: 15, second, frameType, customFrame: null };
  }

  const clip = frameTypeToClip(frameType, second);
  const fps = clip === 'casting' ? 9 : clip === 'blastPunch' || clip === 'handPunch' ? 0 : 9;

  return { clip, fps, second, frameType, customFrame, customFps };
}

export function sampleCalamitasPose(g) {
  const time = g.ritual ? g.ritual.ambient : g.t;
  const next = calamitasPoseState(g);
  const b = g.boss;

  let clock = clocks.get(g);
  if (!clock) {
    clock = {
      clip: next.clip,
      entered: time,
      last: time,
      facing: -1,
      angle: 0,
      trail: [],
      fieldRadius: spec.fieldRadius,
      frameCounter: 0,
      forcefieldOpacity: 0
    };
    clocks.set(g, clock);
  }

  if (next.clip !== clock.clip || time < clock.last) {
    clock.clip = next.clip;
    clock.entered = time;
    if(time < clock.last){clock.frameCounter=0;clock.trail.length=0;}
  }

  const chargeAttack=seq[g.attackIndex % seq.length]?.startsWith('dash');
  if(g.dashActive>0&&Math.abs(b.vx||0)>0)clock.facing=b.vx>0?-1:1;
  else if(!chargeAttack&&Math.abs(g.player.x-b.x)>16)clock.facing=g.player.x>b.x?-1:1;

  const charge = g.dashWind > 0 || g.dashActive > 0;
  const immune = g.stage !== 'normal' || g.phase2Intro > 0 || !!g.castDelayState;
  const targetField = (immune ? spec.immuneRadius : spec.fieldRadius) * (charge ? spec.chargeScale : 1);

  if (clock.fieldRadius === undefined || time < clock.last) clock.fieldRadius = targetField;

  const dt = Math.max(0,time-clock.last);
  if(next.customFrame===null)clock.frameCounter=(clock.frameCounter+dt*next.fps)%6;
  const desired = g.dashActive > 0 ? clamp((g.dashVector?.y || 0) * clock.facing * -0.35, -0.35, 0.35) : 0;

  if (dt > 0) {
    clock.fieldRadius += (targetField-clock.fieldRadius)*(1-Math.pow(.92,dt*60));
    clock.angle = 0; // Native NPC.rotation is not tilted toward the charge vector.

    // Update forcefield opacity (lerps with forcefieldLerp = 0.08)
    const targetForcefield = charge ? 1 : 0;
    clock.forcefieldOpacity += (targetForcefield - clock.forcefieldOpacity) * (1 - Math.pow(.92, dt * 60));

    if (g.dashActive > 0) {
      clock.trail.unshift({ x: b.x, y: b.y });
      if (clock.trail.length > 6) clock.trail.pop();
    } else {
      clock.trail.length = 0;
    }
  }
  clock.last = time;

  // Frame calculation with custom frames for punch casts
  let frame;
  if (next.customFrame !== null) {
    frame = next.customFrame;
  } else {
    frame = Math.floor(clock.frameCounter+1e-8)%6;
  }

  return {
    ...next,
    frame,
    fieldRadius: clock.fieldRadius,
    facing: clock.facing,
    angle: clock.angle,
    skin: b.skin === 'unhooded' ? 'unhooded' : 'hooded',
    trail: clock.trail,
    forcefieldOpacity: clock.forcefieldOpacity,
    chargeFrame: b.chargeFrame ?? 0,
    shieldRotation: b.shieldRotation ?? 0
  };
}

function tintSurface(skin, clip, frame) {
  const key = skin + '|' + clip + '|' + frame;
  if (effects.has(key)) return effects.get(key);
  const c = document.createElement('canvas'); c.width = 110; c.height = 110;
  const gc = c.getContext('2d'); paintCalamitasFrame(gc, { skin, clip, frame, facing: 1 }, 55, 55, spec.scale*1.1);
  gc.globalCompositeOperation = 'source-in'; gc.fillStyle = '#ff244f'; gc.fillRect(0, 0, 110, 110);
  effects.set(key, c); return c;
}

export function drawCalamitasAura(g, pose, x = g.boss.x, y = g.boss.y) {
  if(g.stage === 'accept') return;
  const source = calamitasImage('shield');
  if(!source) return;
  const time = g.ritual ? g.ritual.ambient : g.t;
  const immune = g.stage !== 'normal' || g.phase2Intro > 0 || !!g.castDelayState;
  const radius = (pose.fieldRadius ?? (immune ? spec.immuneRadius : spec.fieldRadius)) * (1 + Math.sin(time * 2) * 0.012);

  // The approved PNG supplies all artwork. Only transform/composite its existing pixels.
  ctx.save(); ctx.translate(x, y); ctx.rotate(time * 0.10);
  ctx.globalAlpha *= immune ? 0.88 : 0.76;
  ctx.drawImage(source, -radius, -radius, radius * 2, radius * 2);
  ctx.restore();

  // Move a faint inner copy of the same texture; clip away its rim to avoid doubled borders.
  ctx.save(); ctx.translate(x, y); ctx.beginPath(); ctx.arc(0, 0, radius * 0.76, 0, TAU); ctx.clip();
  ctx.rotate(-time * 0.28); ctx.globalAlpha *= 0.18 * (0.8 + 0.2 * Math.sin(time * 1.7));
  ctx.drawImage(source, -radius, -radius, radius * 2, radius * 2);
  ctx.restore();
}

// Draw charge shield pieces per Calamity's DrawShield geometry
// Source: center + shieldRotation*24, jaw offset perpendicular 42, own rotation per piece, native scale=1
// FlipVertically when cos(shieldRotation) <= 0, jawRotationOffset -0.71 during active dash, laugh on wind-up
export function drawCalamitasChargeShield(g, pose, x = g.boss.x, y = g.boss.y) {
  const charge = g.dashWind > 0 || g.dashActive > 0;
  if (!charge && pose.forcefieldOpacity < .01) return;

  const topImg = calamitasImage('shieldTop');
  const bottomImg = calamitasImage('shieldBottom');
  if (!topImg || !bottomImg) return;

  const time = g.ritual ? g.ritual.ambient : g.t;

  // shieldRotation from boss (set in boss AI) - direction of dash
  // Use lerpShieldRotation for smooth rotation towards dash direction
  const shieldRotation = pose.shieldRotation;

  const geom = computeChargeShieldGeometry(shieldRotation, g.dashWind, g.dashActive, time);

  // Apply flip: FlipVertically sprite effect when cos(shieldRotation) <= 0
  ctx.save();
  ctx.globalAlpha *= pose.forcefieldOpacity;
  ctx.translate(x + geom.shieldCenterX, y + geom.shieldCenterY);

  // Shield Bottom (jaw) - drawn at jaw position, rotation = bottomRot
  ctx.save();
  ctx.translate(geom.jawDrawX - geom.shieldCenterX, geom.jawDrawY - geom.shieldCenterY);
  ctx.rotate(geom.bottomRot);
  if (geom.flipVertically) ctx.scale(1, -1);
  ctx.drawImage(bottomImg, -bottomImg.width / 2, -bottomImg.height / 2);
  ctx.restore();

  // Shield Top (skull) - drawn at shield center, rotation = shieldRotation
  ctx.save();
  ctx.rotate(geom.topRot);
  if (geom.flipVertically) ctx.scale(1, -1);
  ctx.drawImage(topImg, -topImg.width / 2, -topImg.height / 2);
  ctx.restore();

  ctx.restore();
}

/**
 * Draw forcefield (source: DrawForcefield in SupremeCalamitas.cs)
 * Forcefield scales to forcefieldChargeScale (0.45) during charge
 */
export function drawCalamitasForcefield(g, pose, x = g.boss.x, y = g.boss.y) {
  if (pose.forcefieldOpacity <= 0) return;

  const source = calamitasImage('forcefield');
  if (!source) return;

  const time = g.ritual ? g.ritual.ambient : g.t;
  const geom = computeForcefieldGeometry(pose.chargeFrame, pose.forcefieldOpacity, time);

  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(time * 0.05);
  ctx.globalAlpha *= pose.forcefieldOpacity * 0.6;
  const radius = spec.fieldRadius * geom.scale;
  ctx.drawImage(source, -radius, -radius, radius * 2, radius * 2);
  ctx.restore();
}

/**
 * Draw shield dust from eye socket during dash wind-up
 * Source: DustID.TheDestroyer at eye position during shield wind-up (30 ticks before dash)
 */
// Eye dust is emitted by the simulation using native particle artwork.
export function drawOfficialCalamitas(g, { x = g.boss.x, y = g.boss.y, aura = true } = {}) {
  if (!calamitasImage(g.boss.skin === 'unhooded' ? 'unhooded' : 'hooded')) return false;
  const pose = sampleCalamitasPose(g);
  const low = settings.quality === 'low';

  if (pose.second) {
    const stamp = tintSurface(pose.skin, pose.clip, pose.frame);
    const count = low ? 3 : 7;
    ctx.save();
    ctx.globalAlpha *= 0.4;
    ctx.translate(x,y);ctx.scale(pose.facing,1);
    for (let i = 0; i < count; i++) {
      const a = i * TAU / count + g.t * 4;
      const r = 3.625 + Math.cos(g.t * 4) * 0.625;
      ctx.drawImage(stamp, -55+Math.cos(a)*r, -55+Math.sin(a)*r);
    }
    ctx.restore();
  }

  if (g.dashActive > 0) {
    for (let i = pose.trail.length - 1; i >= 1; i--) {
      paintCalamitasFrame(ctx, pose, pose.trail[i].x, pose.trail[i].y, spec.scale, (1 - i / 7) * 0.16);
    }
  }

  paintCalamitasFrame(ctx, pose, x, y);

  if (aura) {
    drawCalamitasAura(g, pose, x, y);
    drawCalamitasForcefield(g, pose, x, y);
    drawCalamitasChargeShield(g, pose, x, y);

  }

  return true;
}

export function calamitasVisualCacheSize() { return effects.size; }