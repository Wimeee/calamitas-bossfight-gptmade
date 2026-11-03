/**
 * Sepulcher combat blocking - projectile/beam absorption by worm segments
 *
 * Hitbox geometry sourced from Calamity Mod C# (work/research-scal-2026-10-30/):
 * - SepulcherHead.cs:47-48: NPC.width = 62, NPC.height = 64
 * - SepulcherBody.cs:37: NPC.width = NPC.height = 48
 * - SepulcherBodyEnergyBall.cs:30-31: NPC.width = 20, NPC.height = 20
 * - SepulcherTail.cs:28-29: NPC.width = 20, NPC.height = 20
 * - SepulcherArm.cs:81-82: NPC.width = 34, NPC.height = 48 (NPC.dontTakeDamage = true)
 *
 * NOTE: NPC.scale in C# is visual only; hitboxes use raw width/height.
 * We approximate rectangular hitboxes with bounding circles: radius = hypot(w,h)/2
 * Segments with alpha >= 128 (still spawning/invisible) are not blocking per
 * source opacity cascade (SepulcherBody.cs:94, SepulcherBodyEnergyBall.cs:83).
 */

// Bounding circle radii from source NPC width/height (no scale applied to hitbox)
// Head: hypot(62,64)/2 = sqrt(3844+4096)/2 = sqrt(7940)/2 ≈ 44.55
// Body: hypot(48,48)/2 = 48*sqrt(2)/2 = 24*sqrt(2) ≈ 33.94
// EnergyBall: hypot(20,20)/2 = 20*sqrt(2)/2 = 10*sqrt(2) ≈ 14.14
// Tail: same as EnergyBall ≈ 14.14
// Arm NPC: hypot(34,48)/2 = sqrt(1156+2304)/2 = sqrt(3460)/2 ≈ 29.41
const BLOCKER_RADIUS = {
  head: Math.hypot(62, 64) / 2,           // ~44.55
  body: Math.hypot(48, 48) / 2,           // ~33.94
  energyBall: Math.hypot(20, 20) / 2,     // ~14.14
  tail: Math.hypot(20, 20) / 2,           // ~14.14
  arm: Math.hypot(34, 48) / 2,            // ~29.41
};

// Opacity threshold from source (SepulcherBody.cs:94, SepulcherBodyEnergyBall.cs:83)
// Segments fade in when ahead segment alpha < 128. Alpha 255 = fully invisible.
const OPACITY_THRESHOLD = 128;

// Per-frame blocker cache to avoid rebuilding multiple times per tick
// Keyed by game object identity, worm reference, and tick to prevent cross-game/restart leakage
let _blockerCache = { game: null, worm: null, frame: -1, blockers: null };

/**
 * Get all active blocking segments from the Sepulcher worm.
 * Returns array of {x, y, radius, type, segmentIndex}
 * Only includes segments that have faded in (alpha < OPACITY_THRESHOLD).
 * Requires: active hearts phase, live hearts array (hp>0), existing worm.
 * Cache validated against current game identity, worm reference, phase, and live hearts before return.
 */
export function getSepulcherBlockers(g) {
  const worm = g?.sepulcher;
  const frameKey = g?.t ?? -1;

  // Validate cache: same game object, same worm reference, same tick, still in hearts phase with live hearts
  const cacheValid = _blockerCache.game === g &&
                     _blockerCache.worm === worm &&
                     _blockerCache.frame === frameKey &&
                     _blockerCache.blockers !== null &&
                     g?.stage === 'hearts' &&
                     g?.hearts?.some(h => h.hp > 0);

  if (cacheValid) {
    return _blockerCache.blockers;
  }

  const blockers = [];

  // Must be in hearts phase with live hearts (hp>0) and an active worm
  if (!worm || g?.stage !== 'hearts' || !g?.hearts?.some(h => h.hp > 0)) {
    _blockerCache = { game: g, worm, frame: frameKey, blockers };
    return blockers;
  }

  // Head blocker
  if (worm.alpha < OPACITY_THRESHOLD) {
    blockers.push({
      x: worm.x,
      y: worm.y,
      radius: BLOCKER_RADIUS.head,
      type: 'head',
      segmentIndex: -1,
    });
  }

  // Body segments
  for (const node of worm.nodes) {
    if (node.alpha >= OPACITY_THRESHOLD) continue; // Still invisible/spawning

    let radius;
    if (node.isTail) radius = BLOCKER_RADIUS.tail;
    else if (node.isEnergyBall) radius = BLOCKER_RADIUS.energyBall;
    else radius = BLOCKER_RADIUS.body;

    blockers.push({
      x: node.x,
      y: node.y,
      radius,
      type: node.isTail ? 'tail' : node.isEnergyBall ? 'energyBall' : 'body',
      segmentIndex: node.index,
    });
  }

  // Arm NPCs (SepulcherArm.cs:78-100) - use arm NPC center with its hitbox
  // Arm NPCs have dontTakeDamage=true but physically exist and should block projectiles
  for (const arm of worm.arms) {
    const segment = worm.nodes[arm.segmentIndex];
    if (!segment || segment.alpha >= OPACITY_THRESHOLD) continue;

    // Arm NPC position (pose center from simulation)
    const armX = arm.poseX ?? arm.x;
    const armY = arm.poseY ?? arm.y;
    if (armX === undefined || armY === undefined) continue;

    blockers.push({
      x: armX,
      y: armY,
      radius: BLOCKER_RADIUS.arm,
      type: 'arm',
      segmentIndex: arm.segmentIndex,
    });
  }

  _blockerCache = { game: g, worm, frame: frameKey, blockers };
  return blockers;
}

/**
 * Check swept circle-circle collision between a moving projectile and stationary blockers.
 * Returns {hit: true, t: fraction, blocker, point: {x, y}} for earliest collision along path,
 * or {hit: false} if no collision.
 *
 * @param {number} x1 - Start X
 * @param {number} y1 - Start Y
 * @param {number} x2 - End X
 * @param {number} y2 - End Y
 * @param {number} shotRadius - Projectile radius
 * @param {Array} blockers - Array from getSepulcherBlockers()
 */
export function checkSepulcherCollision(x1, y1, x2, y2, shotRadius, blockers) {
  let bestT = Infinity;
  let bestBlocker = null;
  let bestPoint = null;

  const dx = x2 - x1;
  const dy = y2 - y1;
  const segLenSq = dx * dx + dy * dy;

  // Degenerate case: zero-length movement
  if (segLenSq === 0) {
    for (const b of blockers) {
      const distSq = (x1 - b.x) ** 2 + (y1 - b.y) ** 2;
      const combinedR = shotRadius + b.radius;
      if (distSq <= combinedR * combinedR) {
        return { hit: true, t: 0, blocker: b, point: { x: x1, y: y1 } };
      }
    }
    return { hit: false };
  }

  for (const b of blockers) {
    // Swept circle-circle: find earliest t where distance <= combinedRadius
    // Parametric: P(t) = (x1 + dx*t, y1 + dy*t), t in [0, 1]
    // |P(t) - B|^2 = (combinedR)^2
    // Quadratic: (dx^2+dy^2)t^2 + 2(dx*(x1-bx)+dy*(y1-by))t + (x1-bx)^2+(y1-by)^2 - combinedR^2 = 0

    const fx = x1 - b.x;
    const fy = y1 - b.y;
    const combinedR = shotRadius + b.radius;
    const combinedR2 = combinedR * combinedR;

    const a = segLenSq;
    const b_coeff = 2 * (dx * fx + dy * fy);
    const c = fx * fx + fy * fy - combinedR2;

    // If origin already inside blocker (c <= 0), collision is at t=0 (entry point)
    if (c <= 0) {
      if (0 < bestT) {
        bestT = 0;
        bestBlocker = b;
        bestPoint = { x: x1, y: y1 };
      }
      continue;
    }

    const disc = b_coeff * b_coeff - 4 * a * c;
    if (disc < 0) continue;

    const sqrtDisc = Math.sqrt(disc);
    const t1 = (-b_coeff - sqrtDisc) / (2 * a); // Entry root (smaller t)
    const t2 = (-b_coeff + sqrtDisc) / (2 * a); // Exit root (larger t)

    // We want the earliest t in [0, 1] where collision starts (entry)
    if (t1 >= 0 && t1 <= 1) {
      if (t1 < bestT) {
        bestT = t1;
        bestBlocker = b;
        bestPoint = { x: x1 + dx * t1, y: y1 + dy * t1 };
      }
    }
    // If t1 < 0 but t2 in [0,1], origin was inside but we already handled c<=0 case
  }

  if (bestT !== Infinity) {
    return { hit: true, t: bestT, blocker: bestBlocker, point: bestPoint };
  }
  return { hit: false };
}

/**
 * Trace a beam/ray against Sepulcher blockers.
 * Returns {hit: true, distance, point: {x, y}, blocker} or {hit: false, distance: maxDist}.
 *
 * @param {number} x - Ray origin X
 * @param {number} y - Ray origin Y
 * @param {number} dx - Ray direction X (normalized)
 * @param {number} dy - Ray direction Y (normalized)
 * @param {number} halfWidth - Beam half-width (for thickness)
 * @param {Array} blockers - Array from getSepulcherBlockers()
 * @param {number} maxDist - Maximum ray distance
 */
export function traceSepulcherBeam(x, y, dx, dy, halfWidth, blockers, maxDist = 1800) {
  let bestDist = maxDist;
  let bestBlocker = null;
  let bestPoint = null;

  for (const b of blockers) {
    // Ray vs circle with beam thickness: inflate blocker radius by halfWidth
    const r = b.radius + halfWidth;

    // Project blocker center onto ray
    const fx = b.x - x;
    const fy = b.y - y;
    const along = fx * dx + fy * dy;
    const distSq = fx * fx + fy * fy;
    const r2 = r * r;

    // If origin inside blocker, hit at distance 0
    if (distSq <= r2) {
      if (0 < bestDist) {
        bestDist = 0;
        bestBlocker = b;
        bestPoint = { x, y };
      }
      continue;
    }

    if (along < 0) continue; // Blocker center behind ray origin

    // Perpendicular distance squared
    const perpDistSq = distSq - along * along;
    if (perpDistSq > r2) continue; // Miss

    // Distance along ray to entry point
    const offset = Math.sqrt(r2 - perpDistSq);
    const entryDist = along - offset;

    if (entryDist < 0) continue; // Shouldn't happen since we checked origin inside
    if (entryDist < bestDist) {
      bestDist = entryDist;
      bestBlocker = b;
      bestPoint = { x: x + dx * entryDist, y: y + dy * entryDist };
    }
  }

  if (bestBlocker) {
    return { hit: true, distance: bestDist, point: bestPoint, blocker: bestBlocker };
  }
  return { hit: false, distance: maxDist, point: { x: x + dx * maxDist, y: y + dy * maxDist } };
}

