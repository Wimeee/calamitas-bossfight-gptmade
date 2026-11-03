const {test} = require('node:test');
const assert = require('node:assert/strict');
const {loadGame} = require('./helpers/fixture.cjs');

test('debug BH4 end transition with error catch', async () => {
  const {t} = await loadGame();
  t.start();
  let g = t.getGame();

  // Quick run through to BH4
  // BH1
  for (let i = 0; i < 900; i++) t.update(1/60);
  for (const heart of g.hearts) t.hitTarget(heart, heart.hp, heart.x, heart.y, '#ff0000');
  t.update(1/60);

  // 75% -> BH2
  let dmg = Math.ceil((g.boss.hp - Math.round(g.boss.max * 0.74)) / 0.72);
  t.hitTarget(g.boss, dmg, g.boss.x, g.boss.y, '#ff0000');
  t.update(1/60); t.update(1/60);

  // BH2
  for (let i = 0; i < 900; i++) t.update(1/60);

  // 50% -> BH3
  dmg = Math.ceil((g.boss.hp - Math.round(g.boss.max * 0.49)) / 0.72);
  t.hitTarget(g.boss, dmg, g.boss.x, g.boss.y, '#ff0000');
  t.update(1/60); t.update(1/60);

  // BH3
  for (let i = 0; i < 900; i++) t.update(1/60);

  // Brothers
  for (const bro of g.brothers) t.hitTarget(bro, bro.hp, bro.x, bro.y, '#ff0000');
  t.update(1/60);

  // Now at normal h40
  g = t.getGame();
  console.log('At normal h40:', g.stage, g.marker, g.phaseN, g.stageT);

  // 30% -> BH4 + Maelstrom
  dmg = Math.ceil((g.boss.hp - Math.round(g.boss.max * 0.29)) / 0.72);
  t.hitTarget(g.boss, dmg, g.boss.x, g.boss.y, '#ff0000');
  t.update(1/60); t.update(1/60);

  g = t.getGame();
  console.log('After 30% transition:', g.stage, g.marker, g.phaseN, g.stageT);

  // Run BH4 for 15s
  for (let i = 0; i < 900; i++) {
    try {
      t.update(1/60);
    } catch (e) {
      console.log(`Error at frame ${i}:`, e.message);
      break;
    }
    if (i % 150 === 0) {
      g = t.getGame();
      console.log(`Frame ${i}: stage=${g.stage}, stageT=${g.stageT.toFixed(2)}, phaseN=${g.phaseN}, mode=${g.mode}`);
    }
  }

  g = t.getGame();
  console.log('Final:', g.stage, g.marker, g.phaseN, g.stageT, g.mode);
});