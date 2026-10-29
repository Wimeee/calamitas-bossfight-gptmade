const {test} = require('node:test');
const assert = require('node:assert/strict');
const {loadGame} = require('./helpers/fixture.cjs');

test('an encounter can provide its own lifecycle and drawing without changing the game loop', async () => {
  const {t} = await loadGame();
  const trace = [];
  t.encounterRegistry.fixture = {
    config: {id: 'fixture', name: 'FIXTURE', opening: {stage: 'intro', marker: 'intro', label: 'FIXTURE'}},
    createBoss: () => ({x: 500, y: 150, hp: 1234, max: 1234, r: 20, alpha: 1}),
    enter(stage) { trace.push('enter'); t.getGame().stage = stage; },
    update() { trace.push('update'); },
    updateHazards() { trace.push('hazards'); },
    afterProjectiles() { trace.push('after'); },
    draw() { trace.push('draw'); }
  };
  const game = t.makeGame('fixture');
  assert.equal(game.encounterId, 'fixture');
  assert.equal(game.boss.hp, 1234);
  t.setGame(game);
  t.enter('intro', 'intro', 'FIXTURE');
  t.update(1 / 60);
  t.draw(game);
  assert.deepEqual(trace, ['enter', 'update', 'hazards', 'after', 'draw']);
  assert.throws(() => t.makeGame('missing'), /Unknown encounter/);
});
