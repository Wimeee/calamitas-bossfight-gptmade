import {updateSeekers} from './seekers.js?v=26.0.0';
import {updateBrothers} from './brothers.js?v=26.0.0';
import { enemyBullet } from '../combat/projectiles.js?v=26.0.0';
import { arena } from '../core/arena.js?v=26.0.0';
import { TAU } from '../core/config.js?v=26.0.0';
import { clamp, lerp, norm } from '../core/math.js?v=26.0.0';
import { state } from '../core/state.js?v=26.0.0';
import { calamitasConfig as config } from '../../config/calamitas.js?v=26.0.0';

// Sepulcher constants from source (SepulcherHead.cs, SepulcherBody.cs, SepulcherBodyEnergyBall.cs, SepulcherArm.cs)
const SEPULCHER = {
  // Segment counts (SepulcherHead.cs:22-23)
  MIN_LENGTH: 51,
  MAX_LENGTH: 52,
  // Spacing (SepulcherBody.cs:120, SepulcherBodyEnergyBall.cs:109)
  BODY_SPACING: 52,
  ENERGY_BALL_SPACING: 34,
  // Movement (SepulcherHead.cs:202-327)
  // Source values are per-tick at 60Hz. Convert to px/s: *60 for velocity, *3600 for acceleration.
  // User-requested slower browser tempo; original C# speed remains the reference below.
  MOVEMENT_TEMPO: 0.75,
  MAX_SPEED: 20 * 60,           // 1200 px/s
  BASE_ACCEL: 0.175 * 3600,     // 630 px/s²
  // Acceleration formula: 0.175f + (0.37f - AttackCooldown * 0.0015f)
  // AttackCooldown in source is ticks (150..0). Our attackCooldown is seconds (2.5..0).
  // So: BASE_ACCEL + (0.37 * 3600 - attackCooldown * 60 * 0.0015 * 3600)
  ACCEL_ATTACK_FACTOR: 0.37 * 3600,              // 1332 px/s²
  ACCEL_PER_COOLDOWN: 0.0015 * 3600 * 60,        // 324 px/s² per second of cooldown
  FASTER_SPEED_MULT: 1.3,
  SLOWER_SPEED_MULT: 0.7,
  // Attack (SepulcherHead.cs:330-358)
  ATTACK_COOLDOWN_MAX: 150 / 60, // 2.5 seconds at 60Hz (stored in seconds)
  ATTACK_RANGE: 110,
  DART_COUNT: 30,
  DART_SPEED: 15 * 60,          // 900 px/s (source ai[2] = 15f, converted *60)
  DART_LIFETIME: 690 / 60,      // 11.5 seconds (source timeLeft = 690 ticks)
  // Arm attachment (SepulcherHead.cs:138-161)
  ARM_START_INDEX: 3,
  ARM_INTERVAL: 4,
  // Arm limb lengths (SepulcherArm.cs:176, 181)
  ARM_LIMB_1_LENGTH: 92,   // offsetFromSegment length (forearm)
  ARM_LIMB_2_LENGTH: 84,   // upper arm to hand
  ARM_OFFSET_X: 60,
  ARM_OFFSET_Y: 55,
  ARM_ROT_MULT: 1.7,
  ARM_ROT_ADD: 0.77,
  // Arm rotation oscillation (SepulcherArm.cs:141-152)
  ARM_ROT_MIN: -0.55,
  ARM_ROT_MAX: 0.77,
  ARM_ROT_SPEED_OUT: 0.029,
  ARM_ROT_SPEED_IN: -0.066,
  // Opacity cascade (SepulcherBody.cs:94-113, SepulcherBodyEnergyBall.cs:83-102)
  OPACITY_FADE_RATE: 42 * 60,  // per second (source: alpha -= 42 per tick at 60Hz)
  OPACITY_THRESHOLD: 128,      // ahead segment alpha < 128 triggers fade-in
  // Scales (from SetDefaults in each class, expert=1.35/normal=1.2, head extra *1.25)
  // All selectable difficulties are Expert-based; legacy 'normal' key means Expert.
  SCALE_EXPERT: 1.35,
  SCALE_NORMAL: 1.2,
  HEAD_EXTRA_SCALE: 1.25,
  // Dart damage (from SupremeCalamitas.cs DartDamage)
  DART_DAMAGE: 29,
};

// Brothers constants from source (SupremeCataclysm.cs, SupremeCatastrophe.cs)
const BROTHERS = {
  // Orbit parameters (source: SupremeCataclysm.cs AI)
  ORBIT_HORIZONTAL: 750,
  ORBIT_VERTICAL: 400,
  ORBIT_SPEED: 0.18, // rad/s
  // Phase 2 threshold (source: SupremeCataclysm.cs BigAttackLimit = 29)
  BIG_ATTACK_LIMIT: 29,
  // Fire intervals (ticks converted to seconds)
  CATACLYSM_FIRE_INTERVAL: 18 / 60,      // 0.3s empowered, 0.42s normal
  CATACLYSM_FIRE_INTERVAL_NORMAL: 25 / 60,
  CATASTROPHE_FIRE_INTERVAL: 39 / 60,    // 0.65s empowered, 0.85s normal
  CATASTROPHE_FIRE_INTERVAL_NORMAL: 51 / 60,
  // Empowerment HP threshold
  EMPOWER_HP_PCT: 0.4,
  // Projectile speeds
  FIST_SPEED: 210,
  SLASH_SPEED: 180,
  FIST_ACCEL: 35,
  SLASH_ACCEL: 15,
  MAX_SPEED: 260,
};

// Seekers constants from source (SoulSeekerSupreme.cs)
const SEEKERS = {
  COUNT: 10,
  ORBIT_RADIUS: 225,           // Source: 225f distance from boss
  ROTATION_SPEED: 0.5 * Math.PI / 180, // 0.5 degrees per tick = 30 deg/s = 0.5236 rad/s
  DART_INITIAL_SPEED: 2.5 * 60,  // Source initial projectile velocity:5*.5px/tick =150px/s
  DART_MAX_SPEED: 15 * 60,     // Native barrageai[2] max:15px/tick =900px/s
  DART_ACCEL: 0,      // No invented acceleration of successive salvos
  DART_DAMAGE: 29,
  SALVO_INTERVAL: 181 / 60,    // timer>180, so181 native ticks
  WARNING_TICKS: 35,           // Warning particles 35 ticks before firing
  WARNING_TIME: 35 / 60,       // 0.583 seconds
  // Native Seeker sprite scale
  SCALE: 1,
};

function stepSepulcher(dt, g) {
  const b = g.boss, headScale = 1.6875, bodyScale = 1.35;
  let worm = g.sepulcher;
  if (!worm) {
    // Initialize with full segment chain per source (SepulcherHead.cs:120-168)
    worm = g.sepulcher = {
      hp:g.difficulty==='revenge'||g.difficulty==='death'?345000:300000,
      maxHp:g.difficulty==='revenge'||g.difficulty==='death'?345000:300000,
      x: arena.l - 35,
      y: arena.b - 50,
      vx: 0,
      vy: 0,
      attackCooldown: 0, // Stored in seconds, source uses ticks (150)
      rotation: 0,
      nodes: [],
      headScale,
      bodyScale,
      alpha: 255, // Head alpha (0-255), starts at 255 (invisible) and fades in
      // Arm NPCs: each arm is a simulated entity with position, rotation, direction, attached segment index
      arms: [],
    };
    // Create 52 segments: indices 0-50 are body/energyBall alternating, 51 is tail
    for (let i = 0; i < SEPULCHER.MAX_LENGTH; i++) {
      const isEnergyBall = (i < SEPULCHER.MIN_LENGTH && i % 2 === 1);
      const isTail = (i >= SEPULCHER.MIN_LENGTH);
      worm.nodes.push({
        x: worm.x,
        y: worm.y,
        vx: 0,
        vy: 0,
        rotation: 0,
        index: i,
        isEnergyBall,
        isTail,
        isBody: !isEnergyBall && !isTail,
        // Arms attach to every 4th segment starting at index 3 (SepulcherHead.cs:138)
        hasArms: (i >= SEPULCHER.ARM_START_INDEX && i % SEPULCHER.ARM_INTERVAL === 0 && !isTail),
        // Base rotationalOffset for this segment's first arm (second arm gets +Pi)
        // Source: rotationalOffset increments by Pi/6 per arm, wrapped with WrapAngle
        armRotationOffset: 0,
        alpha: 255, // Segment alpha (0-255), starts at 255
        setAlpha: false, // Whether this segment has completed fade-in
      });
    }
    // Set arm rotation offsets matching source (SepulcherHead.cs:138-161)
    let rotationalOffset = 0;
    const armCount = worm.nodes.filter(n => n.hasArms).length * 2; // 2 arms per segment
    for (let i = 0; i < worm.nodes.length; i++) {
      if (worm.nodes[i].hasArms) {
        // Two arms per segment, each gets Pi/6 increment
        // First arm: rotation = rotationalOffset, direction = 1
        // Second arm: rotation = rotationalOffset + Pi, direction = -1
        worm.nodes[i].armRotationOffset = rotationalOffset;

        // Create arm NPC objects for simulation (not just rendering)
        // Arm 1 (direction = 1)
        worm.arms.push({
          segmentIndex: i,
          direction: 1,
          rotation: rotationalOffset,
          reelingBack: true, // Source: ReelingBack = (localAI[1] == 0), defaults to true
          time: 0,
        });
        rotationalOffset += Math.PI / 6;

        // Arm 2 (direction = -1)
        worm.arms.push({
          segmentIndex: i,
          direction: -1,
          rotation: rotationalOffset + Math.PI,
          reelingBack: true, // Source: ReelingBack = (localAI[1] == 0), defaults to true
          time: 0,
        });
        rotationalOffset += Math.PI / 6;

        rotationalOffset = ((rotationalOffset + Math.PI) % (Math.PI * 2)) - Math.PI; // WrapAngle
      }
    }
  }

  // Decrement attack cooldown (stored in seconds)
  worm.attackCooldown = Math.max(0, worm.attackCooldown - dt);

  // Head opacity fade-in (SepulcherHead.cs:197)
  // NPC.Opacity = MathHelper.Clamp(NPC.Opacity + 0.165f, 0f, 1f)
  // 0.165 per tick at 60Hz = 9.9 per second
  worm.alpha = Math.max(0, worm.alpha - 9.9 * dt * 255); // Convert to 0-255 scale

  // Target: Calamitas position (source: SepulcherHead.cs:200-201 targets SCal NPC)
  const tx = b.x - 12; // Source boss left + player width/2 (44 and 20px).
  const ty = b.y - 1;  // Source boss top + player height/2 (44 and 42px).

  // Head movement (adapted from SepulcherHead.cs:199-327)
  worm.movementAge=(worm.movementAge||0)+dt;
  const tempo=SEPULCHER.MOVEMENT_TEMPO;
  const sepMaxSpeed = SEPULCHER.MAX_SPEED * tempo;
  // Acceleration formula from source: 0.175f + (0.37f - AttackCooldown * 0.0015f)
  // AttackCooldown in source is ticks (150..0). Our attackCooldown is seconds (2.5..0).
  // Multiply by 60 to get tick-equivalent for the formula.
  const sepAcceleration = (SEPULCHER.BASE_ACCEL + SEPULCHER.ACCEL_ATTACK_FACTOR - worm.attackCooldown * SEPULCHER.ACCEL_PER_COOLDOWN) * tempo * tempo;

  const fasterMaxSpeed = sepMaxSpeed * SEPULCHER.FASTER_SPEED_MULT;
  const slowerMaxSpeed = sepMaxSpeed * SEPULCHER.SLOWER_SPEED_MULT;

  // Current speed
  const currentSpeed = Math.hypot(worm.vx, worm.vy);
  if (currentSpeed > 0) {
    if (currentSpeed > fasterMaxSpeed) {
      const factor = fasterMaxSpeed / currentSpeed;
      worm.vx *= factor; worm.vy *= factor;
    } else if (currentSpeed < slowerMaxSpeed && worm.movementAge >= .5) {
      const factor = slowerMaxSpeed / currentSpeed;
      worm.vx *= factor; worm.vy *= factor;
    }
  }

  // Target vector (snapped to 16px grid per source)
  let targetX = Math.trunc(tx / 16) * 16 - Math.trunc(worm.x / 16) * 16;
  let targetY = Math.trunc(ty / 16) * 16 - Math.trunc(worm.y / 16) * 16;
  const targetDistance = Math.hypot(targetX, targetY);
  if (targetDistance > 0) {
    const timeToReach = sepMaxSpeed / targetDistance;
    targetX *= timeToReach;
    targetY *= timeToReach;
  }

  // Accelerate toward target (SepulcherHead.cs:234-327)
  const velAlignedX = (worm.vx > 0 && targetX > 0) || (worm.vx < 0 && targetX < 0);
  const velAlignedY = (worm.vy > 0 && targetY > 0) || (worm.vy < 0 && targetY < 0);
  if (velAlignedX || velAlignedY) {
    if (worm.vx < targetX) worm.vx += sepAcceleration * dt;
    else if (worm.vx > targetX) worm.vx -= sepAcceleration * dt;
    if (worm.vy < targetY) worm.vy += sepAcceleration * dt;
    else if (worm.vy > targetY) worm.vy -= sepAcceleration * dt;

    // Cross-axis correction (SepulcherHead.cs:258-279)
    if (Math.abs(targetY) < sepMaxSpeed * 0.2 && ((worm.vx > 0 && targetX < 0) || (worm.vx < 0 && targetX > 0))) {
      if (worm.vy > 0) worm.vy += sepAcceleration * 2 * dt;
      else worm.vy -= sepAcceleration * 2 * dt;
    }
    if (Math.abs(targetX) < sepMaxSpeed * 0.2 && ((worm.vy > 0 && targetY < 0) || (worm.vy < 0 && targetY > 0))) {
      if (worm.vx > 0) worm.vx += sepAcceleration * 2 * dt;
      else worm.vx -= sepAcceleration * 2 * dt;
    }
  } else {
    if (Math.abs(targetX) > Math.abs(targetY)) {
      if (worm.vx < targetX) worm.vx += sepAcceleration * 1.1 * dt;
      else if (worm.vx > targetX) worm.vx -= sepAcceleration * 1.1 * dt;
      if (Math.abs(worm.vx) + Math.abs(worm.vy) < sepMaxSpeed * 0.5) {
        if (worm.vy > 0) worm.vy += sepAcceleration * dt;
        else worm.vy -= sepAcceleration * dt;
      }
    } else {
      if (worm.vy < targetY) worm.vy += sepAcceleration * 1.1 * dt;
      else if (worm.vy > targetY) worm.vy -= sepAcceleration * 1.1 * dt;
      if (Math.abs(worm.vx) + Math.abs(worm.vy) < sepMaxSpeed * 0.5) {
        if (worm.vx > 0) worm.vx += sepAcceleration * dt;
        else worm.vx -= sepAcceleration * dt;
      }
    }
  }

  worm.x += worm.vx * dt;
  worm.y += worm.vy * dt;
  worm.rotation = Math.atan2(worm.vy, worm.vx) + Math.PI / 2;

  // Attack: dart ring when near Calamitas (SepulcherHead.cs:330-358)
  // Source checks distance to SCal NPC (Calamitas), not player
  const targetDist = Math.hypot(worm.x - b.x, worm.y - b.y);
  if (targetDist <= SEPULCHER.ATTACK_RANGE && worm.attackCooldown <= 0) {
    worm.attackCooldown = SEPULCHER.ATTACK_COOLDOWN_MAX;
    // Spawn dart ring (source: BrimstoneBarrage projectiles with ai[0]=0, ai[1]=3, ai[2]=15)
    for (let i = 0; i < SEPULCHER.DART_COUNT; i++) {
      const a = -3 * Math.PI / 4 + i * TAU / SEPULCHER.DART_COUNT;
      // Initial velocity is a normalized vector (length 1 in source, we use 1 * DART_SPEED/15 = 60 px/s initial)
      // Source: spinningPoint = Vector2.Normalize(new Vector2(-1, -1)) = (-0.707, -0.707), then rotated
      // So initial velocity magnitude is 1. In our units: 1 * 60 = 60 px/s
      // But the projectile accelerates to ai[2] = 15 * 60 = 900 px/s
      const initialSpeed = 60; // 1 * 60 (source velocity = 1f per tick)
      // C# BrimstoneBarrage: hitbox radius = 10 * scale = 8.5 (Sepulcher variant scale=0.85)
      const q = enemyBullet(worm.x, worm.y, Math.cos(a), Math.sin(a), initialSpeed, 8.5, 'sepulcherDart', SEPULCHER.DART_DAMAGE);
      if (q) {
        // Store AI parameters for BrimstoneBarrage behavior
        q.ai0 = 0;    // SCal projectile type
        q.ai1 = 3;    // Sepulcher projectile (triggers acceleration + scale in BrimstoneBarrage AI)
        q.ai2 = SEPULCHER.DART_SPEED; // Max speed 900 px/s (source 15f * 60)
        q.life = SEPULCHER.DART_LIFETIME; // 11.5 seconds
        q.frame = 0;
        q.frameCounter = 0;
        q.scale = 0.85; // Source sets scale = 0.85f for ai[1] == 3
        q.opacity = 1;
        q.sourceTicks = 0;
      }
    }
    // Source does NOT set a timer after attack - worm continues tracking Calamitas
    // No worm.timer = 3.8 or similar
  }

  // Update segment chain (SepulcherBody.cs:115-122, SepulcherBodyEnergyBall.cs:104-111)
  // Each segment follows the one ahead at fixed spacing
  for (let i = 0; i < worm.nodes.length; i++) {
    const node = worm.nodes[i];
    const ahead = i === 0 ? worm : worm.nodes[i - 1];
    const spacing = node.isEnergyBall ? SEPULCHER.ENERGY_BALL_SPACING : SEPULCHER.BODY_SPACING;
    const dx = ahead.x - node.x;
    const dy = ahead.y - node.y;
    const dist = Math.hypot(dx, dy);
    if (dist > 0) {
      node.rotation = Math.atan2(dy, dx) + Math.PI / 2;
      if (dist > 0) {
        const factor = (dist - spacing) / dist;
        node.x += dx * factor;
        node.y += dy * factor;
      }
    }
    // Velocity for visual continuity
    node.vx = 0;
    node.vy = 0;
  }

  // Opacity cascade: segments fade in when ahead segment alpha < 128 (SepulcherBody.cs:94-113)
  // Head fades in continuously (already handled above)
  for (let i = 0; i < worm.nodes.length; i++) {
    const node = worm.nodes[i];
    const ahead = i === 0 ? worm : worm.nodes[i - 1];
    const aheadAlpha = ahead.alpha || 0;
    if (aheadAlpha < SEPULCHER.OPACITY_THRESHOLD && !node.setAlpha) {
      // Fade in: alpha -= 42 per tick at 60Hz = 2520 per second
      node.alpha = Math.max(0, node.alpha - SEPULCHER.OPACITY_FADE_RATE * dt);
      if (node.alpha <= 0) {
        node.alpha = 0;
        node.setAlpha = true;
      }
    } else {
      node.alpha = aheadAlpha;
    }
  }

  // Update arm NPCs (SepulcherArm.cs:119-182)
  // Each arm NPC updates its position and limb positions based on attached segment
  // Source order: 1) Calculate idealMovePosition, 2) UpdateLimbs, 3) Update rotation oscillation
  for (const arm of worm.arms) {
    const segment = worm.nodes[arm.segmentIndex];
    if (!segment) continue;

    // Arm NPC opacity follows segment (SepulcherArm.cs:130)
    // NPC.Opacity = SegmentToAttachTo.Opacity
    // We store alpha 0-255, convert from segment alpha
    // arm.alpha = segment.alpha;

    // Calculate idealMovePosition (SepulcherArm.cs:133-138)
    // This uses the arm's CURRENT rotation before oscillation update
    const segRot = segment.rotation;
    const armRot = arm.rotation;
    const dir = arm.direction;
    const scale = bodyScale;

    const lerpFactor = clamp((armRot + 0.51) / 0.45, 0, 1);
    // Source (SepulcherArm.cs:134-135): sideFactor = Lerp(200, 18, ...), aheadFactor = Lerp(284, 680, ...)
    // These were SWAPPED in the original implementation
    const sideFactor = lerp(200, 18, lerpFactor);
    const aheadFactor = lerp(284, 680, lerpFactor);

    const angle1 = segRot + armRot * dir - Math.PI / 2;
    const angle2 = segRot + armRot * dir - Math.PI / 2 + Math.PI / 2 * dir;

    const idealX = segment.x + Math.cos(angle1) * scale * aheadFactor + Math.cos(angle2) * scale * sideFactor;
    const idealY = segment.y + Math.sin(angle1) * scale * aheadFactor + Math.sin(angle2) * scale * sideFactor;

    // Arm NPC Center = idealMovePosition (SepulcherArm.cs:138)
    arm.x = idealX;
    arm.y = idealY;

    // Store the pose rotation used for limb computation (BEFORE oscillation advance)
    // This ensures simulation and render use the same limb geometry for this tick
    arm.poseRotation = armRot;
    arm.poseX = idealX;
    arm.poseY = idealY;

    // Arm rotation oscillation (SepulcherArm.cs:141-152) - happens AFTER position/limb calculation
    // ReelingBack: rotation -= 0.066f, until < -0.55
    // Not ReelingBack: rotation += 0.029f, until > 0.77
    if (arm.reelingBack) {
      arm.rotation += SEPULCHER.ARM_ROT_SPEED_IN * dt * 60; // Convert per-tick to per-second
      if (arm.rotation < SEPULCHER.ARM_ROT_MIN) {
        arm.reelingBack = false;
      }
    } else {
      arm.rotation += SEPULCHER.ARM_ROT_SPEED_OUT * dt * 60;
      if (arm.rotation > SEPULCHER.ARM_ROT_MAX) {
        arm.reelingBack = true;
      }
    }
    arm.time += dt;
  }
}

function updateMinions(dt) {
  const g = state.game;
  const p = g.player;
  const b = g.boss;
  const isExpert = true; // All selectable modes are Expert-based; legacy 'normal' key means Expert.
  const baseScale = isExpert ? SEPULCHER.SCALE_EXPERT : SEPULCHER.SCALE_NORMAL;
  const headScale = baseScale * SEPULCHER.HEAD_EXTRA_SCALE;
  const bodyScale = baseScale;

  // Sepulcher (Soul of the Sepulcher)
  if (g.stage === 'hearts' && g.hearts.length && p.hp > 0 && !g.sepulcherDefeated) {
    if (!g.sepulcher) stepSepulcher(0, g);
    g.sepulcherStepRemainder = (g.sepulcherStepRemainder || 0) + dt;
    while (g.sepulcherStepRemainder + 1e-10 >= 1/60) {
      // Capture previous simulation state for rendering interpolation (BEFORE advancing tick)
      const w = g.sepulcher;
      if (w) {
        w._renderPrev = {
          head: { x: w.x, y: w.y, rotation: w.rotation, alpha: w.alpha },
          nodes: w.nodes.map(n => ({ x: n.x, y: n.y, rotation: n.rotation, alpha: n.alpha })),
          arms: w.arms.map(a => ({ x: a.poseX ?? a.x, y: a.poseY ?? a.y, rotation: a.poseRotation ?? a.rotation, direction: a.direction })),
        };
      }
      stepSepulcher(1/60, g);
      g.sepulcherStepRemainder = Math.max(0, g.sepulcherStepRemainder - 1/60);
      // Capture current simulation state for rendering interpolation (AFTER advancing tick)
      if (w) {
        w._renderCurr = {
          head: { x: w.x, y: w.y, rotation: w.rotation, alpha: w.alpha },
          nodes: w.nodes.map(n => ({ x: n.x, y: n.y, rotation: n.rotation, alpha: n.alpha })),
          arms: w.arms.map(a => ({ x: a.poseX ?? a.x, y: a.poseY ?? a.y, rotation: a.poseRotation ?? a.rotation, direction: a.direction })),
        };
      }
    }
  } else { g.sepulcher = null; g.sepulcherStepRemainder = 0; }

  updateBrothers(dt,g);

  updateSeekers(dt,g);
}

export { updateMinions, SEPULCHER, BROTHERS, SEEKERS };