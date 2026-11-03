import { playerConfig } from './player.js?v=26.0.3';

export const movementConfig=Object.freeze({
  halfWidth:10,halfHeight:18,runSpeed:playerConfig.movementSpeed,acceleration:3400,braking:4200,airBraking:2200,
  gravity:1800,jumpSpeed:690,jumpCut:.48,jumpGrace:.1,jumpBuffer:.12,jumpSustain:.16,
  // Wings of Rebirth, pinned Calamity 2.2.2 baseline (native art 2.2.4).
  // Terraria ticks -> seconds; vanilla FasterJumpSpeed off: base jump 5.01 + 1.
  fallSpeed:620,fastFallSpeed:950,flightSpeed:(5.01+1)*3.25*60,
  flightAcceleration:.15*60*60,flightTime:360/60,
  airSpeed:11.5*60,airAcceleration:.08*2.9*60*60,
  wingRisingThreshold:(5.01+1)*1.2*60,wingRisingBonus:.17*60*60,wingFallingBonus:1*60*60,
  platformSpacing:240,dropTime:.24,doubleTapMs:260,substep:1/120
});
