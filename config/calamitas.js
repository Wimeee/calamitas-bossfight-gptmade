export const calamitasConfig = Object.freeze({
  id: 'supreme-calamitas', name: 'SUPREME CALAMITAS',
  hp: 750000, radius: 30, spawnX: 500, spawnY: 150,
  // Local helper durability tuning: 3x HP to match the browser build's stronger attacks.
  // This is a pacing adaptation, not an original Calamity NPC stat.
  heartHP: 32400, brotherHP: 195000, seekerHP: 14700,
  thresholds: Object.freeze({hell2: .75, hell3: .50, phase2: .40, maelstrom: .30, seekers: .20, hell5: .10}),
  opening: Object.freeze({stage: 'hell', marker: 'opening', label: 'BULLET HELL I'}),
  attackSequence: Object.freeze(['darts','hellblast','giga2','dash2','dash2','giga2','hellblast','darts','dash2','darts','hellblast','giga2','giga2','hellblast','dash2','darts','giga2','giga2','dash2','dash2','darts','dash2','darts','dash2']),

  // Source-based timing constants (ticks at 60Hz)
  bulletHellDuration: 900,        // 15s per bullet hell
  sepulcherSpawnCastTime: 75,     // 1.25s cast before Sepulcher spawn
  brothersSpawnCastTime: 150,     // 2.5s cast before Brothers spawn

  // Normal attack phase state machine (source NPC.ai[0]/[1]/[2])
  // Phase 1 (ai[0]=0): ai[1]=0(darts)=300t, ai[1]=2(dash)=70t, ai[1]=3(hellblast)=480t, ai[1]=4(giga)=300t
  // Phase 2 (ai[0]=3): ai[1]=0(darts)=240t, ai[1]=2(dash)=70t, ai[1]=3(hellblast)=300t, ai[1]=4(giga)=240t
  attackLengths: Object.freeze({
    phase1: {darts: 300, dash: 70, hellblast: 480, giga: 300},
    phase2: {darts: 240, dash: 70, hellblast: 300, giga: 240}
  }),

  // Shield/Forcefield constants
  shieldWindupTime: 30,           // Shield appears 30 ticks before dash
  shieldRotationLerp: 0.125,      // Shield rotation lerp speed
  shieldRotationTowards: 0.18,    // Shield rotation angle towards
  forcefieldChargeScale: 0.45,    // Forcefield scale during charge
  forcefieldLerp: 0.08,           // Forcefield/shield opacity lerp speed

  // Dash constants
  dashSpeed: 20,                  // Source: 20 tiles/tick = 1200 px/s
  dashDuration: 0.64,             // ~38 ticks
  dashRecovery: 0.13,             // ~8 ticks

  // Acceptance phase
  giveUpCounterMax: 1200,         // 20 seconds
  acceptanceDialogueTimers: [900, 600, 300], // Dialogue triggers

  // Arena sizes (pixels, source uses tiles*16)
  arenaSizeNormal: 2500,          // 1250*2
  arenaSizeDeath: 2000,           // 1000*2
  arenaSizeAcceptance: {w: 800, h: 1000}, // 400*2, 500*2

  // Projectile damages (source values before DR scaling)
  dartDamage: 80,
  skullDamage: 85,
  hellblastDamage: 95,
  fireblastDamage: 95,
  gigablastDamage: 105
});
