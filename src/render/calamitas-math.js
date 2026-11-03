// Source-based charge shield geometry and presentation interpolation only.
// Source: SupremeCalamitas.cs DrawShield, DrawForcefield, Calamity NPC frame logic

import { calamitasConfig as cfg } from '../../config/calamitas.js?v=25.0.0';

/**
 * Compute charge shield geometry matching source exactly
 * Source: SupremeCalamitas.cs DrawShield method
 * - Shield center: NPC.Center + shieldRotation * 24
 * - Jaw position: perpendicular offset 42 from shield center
 * - FlipVertically when cos(shieldRotation) <= 0
 * - Jaw rotation offset: -0.71 during active dash, lerp(0.04, -0.82, sin(time*17.2)*0.5+0.5) during wind-up
 * - Top rotation = shieldRotation, Bottom rotation = shieldRotation ± jawRotationOffset (sign depends on flip)
 */
export function computeChargeShieldGeometry(shieldRotation, dashWind, dashActive, time) {
  const cosRot = Math.cos(shieldRotation);
  const sinRot = Math.sin(shieldRotation);

  // Shield center: NPC.Center + shieldRotation * 24
  const shieldCenterX = cosRot * 24;
  const shieldCenterY = sinRot * 24;

  // FlipVertically when cos(shieldRotation) <= 0 (left-facing)
  const flipVertically = cosRot <= 0;

  // Jaw rotation offset
  let jawRotationOffset = 0;
  if (dashActive > 0) {
    // Active dash - agape mouth (source: -0.71f)
    jawRotationOffset = -0.71;
  } else if (dashWind > 0) {
    // Wind-up - laugh animation (source: Lerp(0.04f, -0.82f, sin(time*17.2)*0.5+0.5))
    jawRotationOffset = lerp(0.04, -0.82, Math.sin(time * 17.2) * 0.5 + 0.5);
  }

  // Perpendicular vector (shieldRotation + Pi/2)
  const perpX = -sinRot;
  const perpY = cosRot;

  let jawDrawX = shieldCenterX;
  let jawDrawY = shieldCenterY;
  let bottomRot;

  if (flipVertically) {
    // C#: jawDrawPosition += (shieldRotation - Pi/2) * 42 = (sinR, -cosR) * 42 = -perp * 42
    jawDrawX -= perpX * 42;
    jawDrawY -= perpY * 42;
    // C#: no negation of jawRotationOffset for flipped
    bottomRot = shieldRotation + jawRotationOffset;
  } else {
    // C#: jawDrawPosition += (shieldRotation + Pi/2) * 42 = perp * 42
    jawDrawX += perpX * 42;
    jawDrawY += perpY * 42;
    // C#: jawRotationOffset *= -1 for non-flipped
    bottomRot = shieldRotation - jawRotationOffset;
  }

  // Top (skull) rotation = shieldRotation
  const topRot = shieldRotation;

  return {
    shieldCenterX,
    shieldCenterY,
    jawDrawX,
    jawDrawY,
    flipVertically,
    topRot,
    bottomRot
  };
}

/**
 * Compute forcefield geometry matching source
 * Source: SupremeCalamitas.cs DrawForcefield
 * - Forcefield scale lerps to forcefieldChargeScale (0.45) during charge
 * - Opacity lerps with forcefieldLerp (0.08)
 */
export function computeForcefieldGeometry(chargeFrame, forcefieldOpacity, time) {
  // Forcefield scale: lerps to forcefieldChargeScale when charging
  const targetScale = chargeFrame > 0 ? cfg.forcefieldChargeScale : 1.0;
  const scale = forcefieldOpacity + (targetScale - forcefieldOpacity) * (1 - Math.exp(-cfg.forcefieldLerp * (1/60)));

  // Forcefield pulse
  const pulse = 1 + Math.sin(time * 3) * 0.05;

  return {
    scale: scale * pulse,
    opacity: Math.min(1, forcefieldOpacity + chargeFrame * 0.3)
  };
}

/**
 * MathHelper.Lerp equivalent
 */
function lerp(a, b, t) {
  return a + (b - a) * t;
}

/**
 * Field radius interpolation (preserved from original)
 * @param {number} current - current radius
 * @param {number} target - target radius
 * @param {number} dt - delta time
 * @param {number} response - fieldResponse (5)
 * @returns {number} new radius
 */
export function interpolateFieldRadius(current, target, dt, response) {
  return current + (target - current) * (1 - Math.exp(-response * dt));
}

/**
 * Angle interpolation (preserved from original)
 * @param {number} current - current angle
 * @param {number} target - target angle
 * @param {number} dt - delta time
 * @returns {number} new angle
 */
export function interpolateAngle(current, target, dt) {
  return current + (target - current) * (1 - Math.exp(-15 * dt));
}

/**
 * Shield rotation lerp towards target (source: shieldRotationLerp=0.125, shieldRotationTowards=0.18)
 * @param {number} current - current rotation
 * @param {number} target - target rotation
 * @param {number} dt - delta time
 * @returns {number} new rotation
 */
export function lerpShieldRotation(current, target, dt) {
  const diff = wrapAngle(target - current);
  // Lerp with angular speed limit
  if (Math.abs(diff) <= cfg.shieldRotationTowards) {
    return target;
  }
  return current + diff * cfg.shieldRotationLerp * dt * 60; // Convert to per-tick equivalent
}

/**
 * Wrap angle to [-PI, PI]
 */
function wrapAngle(a) {
  return ((a + Math.PI) % (Math.PI * 2)) - Math.PI;
}