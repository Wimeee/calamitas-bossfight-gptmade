const {test} = require('node:test');
const assert = require('node:assert/strict');
const {loadGame} = require('./helpers/fixture.cjs');

test('debug threshold transition', async () => {
  const {t} = await loadGame();
  t.start();
  let g = t.getGame();

  console.log('Initial:', g.stage, g.phaseN, g.marker, g.boss.hp, g.boss.max);

  // Run BH1 for 15s
  for (let i = 0; i < 900; i++) t.update(1/60);
  g = t.getGame();
  console.log('After BH1:', g.stage, g.marker, g.hearts?.length);

  // Destroy hearts
  for (const heart of g.hearts) t.hitTarget(heart, heart.hp, heart.x, heart.y, '#ff0000');
  t.update(1/60);
  g = t.getGame();
  console.log('After Sepulcher I:', g.stage, g.marker, 'thresholds:', [...g.thresholds], 'done:', [...g.done]);

  // Damage to 74%
  const dmg = g.boss.hp - Math.round(g.boss.max * 0.74);
  console.log('Dealing damage:', dmg);
  t.hitTarget(g.boss, dmg, g.boss.x, g.boss.y, '#ff0000');
  g = t.getGame();
  console.log('After damage:', g.boss.hp, g.boss.max, 'pct:', g.boss.hp/g.boss.max);

  // Run update
  t.update(1/60);
  g = t.getGame();
  console.log('After update:', g.stage, g.phaseN, g.marker, 'thresholds:', [...g.thresholds]);
});