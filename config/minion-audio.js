// Encounter SFX for minions and boss projectiles.
// Uses existing sample-audio adapter. Only includes sounds that actually exist in the manifest.
export const minionAudio = Object.freeze({
  // Brothers (Cataclysm/Catastrophe)
  brothersSpawn: { file: 'Sounds/Custom/SCalSounds/BrimstoneMonsterSpawn.ogg', gain: 0.55, interval: 1 },
  brothersDeath1: { file: 'Sounds/Custom/SCalSounds/BrothersDeath1.ogg', gain: 0.65, interval: 1 },
  brothersDeath2: { file: 'Sounds/Custom/SCalSounds/BrothersDeath2.ogg', gain: 0.65, interval: 1 },
  brothersHurt1: { file: 'Sounds/Custom/SCalSounds/BrothersHurt1.ogg', gain: 0.50, interval: 0.15 },
  brothersHurt2: { file: 'Sounds/Custom/SCalSounds/BrothersHurt2.ogg', gain: 0.50, interval: 0.15 },

  // Sepulcher
  sepulcherSpawn: { file: 'Sounds/Custom/SCalSounds/SepulcherSpawn.ogg', gain: 0.60, interval: 1 },
  sepulcherDeath: { file: 'Sounds/NPCKilled/SepulcherDeath.ogg', gain: 0.60, interval: 1 },

  // Soul Seekers - no dedicated spawn/death sounds in manifest, reuse brothers or skip

  // Boss projectiles impacts
  fireblastImpact: { file: 'Sounds/Custom/SCalSounds/BrimstoneFireblastImpact.ogg', gain: 0.45, interval: 0.12 },
  gigablastImpact: { file: 'Sounds/Custom/SCalSounds/BrimstoneGigablastImpact.ogg', gain: 0.50, interval: 0.15 },
  hellblastSound: { file: 'Sounds/Custom/SCalSounds/BrimstoneHellblastSound.ogg', gain: 0.40, interval: 0.10 },
  brimstoneShoot: { file: 'Sounds/Custom/SCalSounds/BrimstoneShoot.ogg', gain: 0.35, interval: 0.08 },
  brimstoneBigShoot: { file: 'Sounds/Custom/SCalSounds/BrimstoneBigShoot.ogg', gain: 0.45, interval: 0.20 },

  // Catastrophe slash
  catastropheSlash: { file: 'Sounds/Custom/SCalSounds/CatastropheResonanceSlash.ogg', gain: 0.50, interval: 0.15 },

  // Maelstrom drone (looped, handled specially)
  maelstromDrone: { file: 'Sounds/Custom/SCalSounds/BrimstoneMonsterDrone.ogg', gain: 0.25, interval: 0, loop: true },
  gfbDrone: { file: 'Sounds/Custom/SCalSounds/GFBDrone.ogg', gain: 0.20, interval: 0, loop: true },

  // SCal dash/rumble/end
  scaldash: { file: 'Sounds/Custom/SCalSounds/SCalDash.ogg', gain: 0.50, interval: 0.15 },
  scralumble: { file: 'Sounds/Custom/SCalSounds/SCalRumble.ogg', gain: 0.40, interval: 0.5 },
  scaendbh: { file: 'Sounds/Custom/SCalSounds/SCalEndBH.ogg', gain: 0.55, interval: 1 },
  scalgiveup: { file: 'Sounds/Custom/SCalSounds/SupremeCalamitasGiveUp.ogg', gain: 0.60, interval: 1 }
});