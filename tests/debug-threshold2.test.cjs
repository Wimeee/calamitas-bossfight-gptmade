const {test} = require('node:test');
const assert = require('node:assert/strict');
const {loadGame} = require('./helpers/fixture.cjs');

test('debug 50% threshold', async () => {
  const {t} = await loadGame();
  t.start();
  let g = t.getGame();

  // Run BH1
  for (let i = 0; i < 900; i++) t.update(1/60);

  // Sepulcher I
  for (const heart of g.hearts) t.hitTarget(heart, heart.hp, heart.x, heart.y, '#ff0000');
  t.update(1/60);

  // Damage to 74% -> BH2
  const dmg1 = Math.ceil((g.boss.hp - Math.round(g.boss.max * 0.74)) / 0.72);
  t.hitTarget(g.boss, dmg1, g.boss.x, g.boss.y, '#ff0000');
  t.update(1/60);
  g = t.getGame();
  console.log('After 75% dmg:', g.stage, g.phaseN, g.marker, g.boss.hp/g.boss.max);

  // Run BH2
  for (let i = 0; i < 900; i++) t.update(1/60);
  g = t.getGame();
  console.log('After BH2:', g.stage, g.phaseN, g.marker, g.boss.hp/g.boss.max);

  // Damage to 49%
  const dmg2 = Math.ceil((g.boss.hp - Math.round(g.boss.max * 0.49)) / 0.72);
  console.log('Dealing dmg2:', dmg2, 'current hp:', g.boss.hp, 'target:', Math.round(g.boss.max * 0.49));
  t.hitTarget(g.boss, dmg2, g.boss.x, g.boss.y, '#ff0000');
  t.update(1/60); // First update: triggers transitionCalamitas, sets up castDelayState
  g = t.getGame();
  console.log('After 1st update:', g.stage, g.phaseN, g.marker, 'castDelayState:', g.castDelayState);
  t.update(1/60); // Second update: resolves cast delay via updatePhaseTransitions
  g = t.getGame();
  console.log('After 2nd update:', g.stage, g.phaseN, g.marker, g.boss.hp/g.boss.max, 'thresholds:', [...g.thresholds]);
});