import { playerConfig } from './player.js?v=21.1.1';

export const movementConfig=Object.freeze({
  halfWidth:10,halfHeight:18,runSpeed:playerConfig.movementSpeed,acceleration:3400,braking:4200,airBraking:2200,
  gravity:1800,jumpSpeed:690,jumpCut:.48,jumpGrace:.1,jumpBuffer:.12,jumpSustain:.16,
  fallSpeed:620,fastFallSpeed:950,flightSpeed:420,flightAcceleration:2600,flightTime:2.4,
  platformSpacing:120,dropTime:.24,doubleTapMs:260,substep:1/120
});
