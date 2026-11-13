// Shared endgame loadout; Seraph Tracers are equipped in boots-only mode.
export const playerConfig = Object.freeze({
  hp: 600, mana: 200, potions: 7, regenerationPotions: 3,
  // SeraphTracers.accRunSpeed=9, moveSpeed+=.18; Calamity applies16% of that bonus.
  movementSpeed: 9*(1+.18*.16)*60, dashSpeed: 900, dashCooldown: 2.15,
  dashDuration: .19, contactGuardDuration: .43, spawnInvulnerability: 1.5,
  manaRegeneration: 55, healingAmount: 300, healingCooldown: 60,
  regenerationDuration: 28
});
