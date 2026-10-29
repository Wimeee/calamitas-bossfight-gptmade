export const difficultyConfig = Object.freeze({
  normal: Object.freeze({incomingDamage: 1, arenaHalfWidth: 443, arenaHalfHeight: 265}),
  revenge: Object.freeze({incomingDamage: 1.09, arenaHalfWidth: 443, arenaHalfHeight: 265}),
  death: Object.freeze({incomingDamage: 1.22, arenaHalfWidth: 355, arenaHalfHeight: 212})
});

export function getDifficulty(id) {
  return difficultyConfig[id] || difficultyConfig.normal;
}
