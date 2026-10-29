const {test} = require('node:test');
const assert = require('node:assert/strict');
const {loadGame} = require('./helpers/fixture.cjs');

test('native module graph initializes once and preserves all class registrations', async () => {
  const {t, el} = await loadGame();
  assert.equal(t.weapons.length, 5);
  assert.equal(Object.keys(t.classRegistry).length, 5);
  assert.equal(Object.keys(t.pixelArt).length, 30);
  assert.equal(el('scal-game').dataset.ready, 'yes');
  const listeners = el('game').listeners.pointerdown.length;
  t.initializeGame();
  assert.equal(el('game').listeners.pointerdown.length, listeners);
  for (const id of ['melee', 'ranger', 'mage', 'summon', 'rogue']) {
    el('class').value = id;
    t.start();
    t.enter('normal', 'opening', 'TEST');
    const game = t.getGame();
    game.player.iframes = 999;
    t.setPointer({x: game.boss.x, y: game.boss.y, fire: true});
    for (let i = 0; i < 60; i++) t.update(1 / 60);
    t.draw(game);
    assert.equal(t.weapons[game.player.weapon].id, id);
  }
});
