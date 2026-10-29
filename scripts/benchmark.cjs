const {performance} = require('node:perf_hooks');
const {loadGame} = require('../tests/helpers/fixture.cjs');

const median = values => values.slice().sort((a, b) => a - b)[Math.floor(values.length / 2)];
async function benchmark(options = {}) {
  const fixture = await loadGame(options);
  const {t, el} = fixture;
  el('class').value = 'summon';
  t.start(); t.enter('hearts', 'opening', 'BENCHMARK');
  const g = t.getGame();
  // Ten simultaneous targets: the actual Sepulcher/Seekers target count.
  g.hearts = Array.from({length: 10}, (_, i) => ({x: 100 + i * 80, y: 150 + (i % 3) * 60, hp: 1e9, max: 1e9, r: 16}));
  const queries = 30000;
  for (let i = 0; i < 5000; i++) t.nearestForHoming(i % 900, 300);
  const targetSamples = [];
  for (let sample = 0; sample < 5; sample++) {
    const begin = performance.now();
    for (let i = 0; i < queries; i++) t.nearestForHoming(i % 900, 300);
    targetSamples.push(performance.now() - begin);
  }
  const simulationSamples = [];
  for (let sample = 0; sample < 5; sample++) {
    t.start(); t.enter('normal', 'opening', 'BENCHMARK');
    const game = t.getGame();
    game.player.hp = game.player.maxHp = 1e9;
    game.player.iframes = 999;
    game.boss.hp = game.boss.max = 1e9;
    t.setPointer({x: 500, y: 150, fire: true});
    const begin = performance.now();
    for (let frame = 0; frame < 1200; frame++) t.update(1 / 60);
    simulationSamples.push(performance.now() - begin);
  }
  return {
    nearestTarget: {queries, targets: 10, medianMs: Number(median(targetSamples).toFixed(2)), samplesMs: targetSamples.map(n => Number(n.toFixed(2)))},
    simulation: {frames: 1200, class: 'summon', medianMs: Number(median(simulationSamples).toFixed(2)), samplesMs: simulationSamples.map(n => Number(n.toFixed(2)))},
    scope: 'Node CPU measurements with a mocked Canvas; not browser FPS or GPU rendering.'
  };
}

module.exports = {benchmark};
if (require.main === module) benchmark().then(result => console.log(JSON.stringify(result, null, 2))).catch(error => {console.error(error); process.exitCode = 1;});
