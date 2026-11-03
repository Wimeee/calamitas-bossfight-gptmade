// Browser-arena adaptation of the current Calamity encounter, not vanilla pixel speeds.
// Source: SupremeCalamitas.cs, BrimstoneHellblast.cs, BrimstoneHellblast2.cs, BrimstoneWave.cs, BrimstoneBarrage.cs
export const encounterBalance=Object.freeze({
  // Bullet Hell timing (ticks at 60Hz, converted to seconds)
  // BH1=900t(15s), BH2=1800t(30s), BH3=2700t(45s), BH4=3600t(60s), BH5=4500t(75s)
  hellDuration: 15,
  edgeWarning: 0.42,           // Spawn delay for edge projectiles
  segmentBreath: 0.65,         // Breath between direction changes

  // Hellblast projectile settings (source: BrimstoneHellblast - accelerates to 18, helix trail)
  hell: Object.freeze({
    normal: {interval: 0.28, speed: 175, gateValue: 10},
    revenge: {interval: 0.245, speed: 185, gateValue: 9},
    death: {interval: 0.215, speed: 200, gateValue: 8}
  }),

  // Normal attack phase projectiles
  dartSpacing: 0.18,           // Spacing between darts in fan
  dartInterval: 0.7,           // Interval between dart attacks
  hellblastInterval: 0.23,     // Interval between hellblasts
  hellblastCount: 9,           // Count per hellblast attack
  blastInterval: 1.2,          // Interval between blast attacks
  attackBreath: 0.72,          // Breath between attacks

  // Dash settings (source: 20 tiles/tick = 320 px/tick = 19200 px/s, but adapted)
  dashWarning: 0.32,           // 19 ticks at 60Hz
  dashSpeed: 1000,             // Adapted for browser arena
  dashDuration: 0.64,          // ~38 ticks
  dashRecovery: 0.13,          // ~8 ticks

  // Blast projectile settings
  blastPause: 0.65,
  fireFuse: 2.3,
  gigaFuse: 2.9,

  // Difficulty-specific dart counts
  fireDarts: Object.freeze({normal: 12, revenge: 14, death: 16}),
  gigaDarts: Object.freeze({normal: 28, revenge: 32, death: 36}),

  // Seeker & Maelstrom
  seekerInterval: 3,           // 180 ticks = 3s
  maelstromGrace: 1.6,

  // Bullet Hell specific projectile gates per phase
  // Source baseBulletHellProjectileGateValue: revenge=8, expert=9, normal=10
  // Increases by phase: +1 (BH2), +4 (BH3), +6 (BH4), +8 (BH5)
  bulletHellGateValues: Object.freeze({
    normal: [10, 11, 14, 16, 18],
    revenge: [9, 10, 13, 15, 17],
    death: [8, 9, 12, 14, 16]
  }),

  // Phase-specific projectile intervals (ticks)
  bh1: {topInterval: 10, sideInterval: 15},           // BH1: top every 10t, side every 15t (after 300t)
  // Pinned SupremeCalamitas.cs: BH2 1090, BH3 1232-1236, BH4 1417-1421, BH5 1600-1604.
  // Explosive projectiles use 180/240/360 ticks, not the much shorter edge-hellblast gate.
  bh2: {topInterval: 180},
  bh3: {topInterval: 180, gigablastInterval: 240},
  bh4: {topInterval: 180, gigablastInterval: 240, maelstromAt: 420},
  bh5: {topInterval: 240, gigablastInterval: 360, waveInterval: 0.5},

  sources: Object.freeze(['https://calamitymod.wiki.gg/wiki/Supreme_Calamitas','https://calamitymod.wiki.gg/wiki/Guide:Supreme_Witch,_Calamitas_strategies'])
});
