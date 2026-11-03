const {test} = require('node:test');
const assert = require('node:assert/strict');
const {loadGame} = require('./helpers/fixture.cjs');

// Integration test for complete Supreme Calamitas phase transition route
// Tests: HP thresholds, FPS independence (30/60/120), restart during cast, no NaN values

const FPS_VALUES = [30, 60, 120];

// Helper to set up game state after specific bullet hells have completed
// bhCompleted: number of bullet hells fully completed (1=BH1, 2=BH2, etc.)
// thresholds in the set are the ones ALREADY crossed (so next threshold can trigger)
function setupGameAfterBH(t, bhCompleted) {
  const game = t.makeGame('supreme-calamitas');
  t.setGame(game);
  const g = t.getGame();

  // Base: after BH1 (opening) completion
  g.phaseN = 1;
  // No thresholds crossed yet (75% is next)

  if (bhCompleted >= 2) {
    // BH2 (75%) completed
    g.phaseN = 2;
    g.thresholds.add('75');
    g.done.add('h75');
  }
  if (bhCompleted >= 3) {
    // BH3 (50%) completed
    g.phaseN = 3;
    g.thresholds.add('50');
    g.done.add('h50');
    g.done.add('bros');
  }
  if (bhCompleted >= 4) {
    // Phase 2 (40%) + BH4 (30%) completed
    g.phaseN = 4;
    g.thresholds.add('40');
    g.thresholds.add('30');
    g.done.add('h40');
    g.done.add('h30');
  }
  if (bhCompleted >= 5) {
    // BH5 (10%) completed (includes Seekers 20%)
    g.phaseN = 5;
    g.thresholds.add('20');
    g.thresholds.add('10');
    g.done.add('seek');
    g.done.add('h10');
  }

  // Always start in normal stage for threshold checks
  t.enter('normal', 'test', 'TEST');
  return g;
}

// Helper for state after Phase 2 (40%) but before BH4 (30%)
function setupGameAfterPhase2(t) {
  const game = t.makeGame('supreme-calamitas');
  t.setGame(game);
  const g = t.getGame();

  // After BH3 (50%) and Phase 2 (40%)
  g.phaseN = 3;
  g.thresholds.add('75');
  g.thresholds.add('50');
  g.thresholds.add('40');
  g.done.add('h75');
  g.done.add('h50');
  g.done.add('bros');
  g.done.add('h40');

  t.enter('normal', 'test', 'TEST');
  return g;
}

// Helper for state after Seekers (20%) but before BH5 (10%)
function setupGameAfterSeekers(t) {
  const game = t.makeGame('supreme-calamitas');
  t.setGame(game);
  const g = t.getGame();

  // After BH4 (30%) and Seekers (20%)
  g.phaseN = 4;
  g.thresholds.add('75');
  g.thresholds.add('50');
  g.thresholds.add('40');
  g.thresholds.add('30');
  g.thresholds.add('20');
  g.done.add('h75');
  g.done.add('h50');
  g.done.add('bros');
  g.done.add('h40');
  g.done.add('h30');
  g.done.add('seek');

  t.enter('normal', 'test', 'TEST');
  return g;
}

test('Phase thresholds - 75% triggers BH2 (hell), not Sepulcher I (hearts)', async () => {
  const {t} = await loadGame();
  const g = setupGameAfterBH(t, 1); // After BH1, phaseN=1, no thresholds crossed

  // Set HP to 75% and trigger transition
  g.boss.hp = Math.floor(g.boss.max * 0.75);
  t.transitionCalamitas(g);

  // Should enter BH2 (hell), not hearts
  assert.equal(g.stage, 'hell', '75% HP should trigger Bullet Hell II (hell stage)');
  assert.equal(g.marker, 'h75', 'Marker should be h75 for BH2');
  assert.equal(g.phaseN, 2, 'PhaseN should be 2 for BH2');
});

test('Phase thresholds - 50% triggers BH3 (hell) + Brothers cast delay', async () => {
  const {t} = await loadGame();
  const g = setupGameAfterBH(t, 2); // After BH2, phaseN=2, 75% crossed

  // Set HP to 50% and trigger transition
  g.boss.hp = Math.floor(g.boss.max * 0.50);
  t.transitionCalamitas(g);

  // 50% uses cast delay (0 time), need to process it
  t.updatePhaseTransitions(1/60, g);

  // Should trigger BH3
  assert.equal(g.stage, 'hell', '50% HP should trigger Bullet Hell III (hell stage)');
  assert.equal(g.marker, 'h50', 'Marker should be h50 for BH3');
  assert.equal(g.phaseN, 3, 'PhaseN should be 3 for BH3');
});

test('Phase thresholds - 40% triggers Phase 2', async () => {
  const {t} = await loadGame();
  const g = setupGameAfterBH(t, 3); // After BH3, phaseN=3, 75% and 50% crossed

  // Set HP to 40% and trigger transition
  g.boss.hp = Math.floor(g.boss.max * 0.40);
  t.transitionCalamitas(g);

  // 40% stays in normal stage (Phase 2), no cast delay
  assert.equal(g.stage, 'normal', '40% HP should stay in normal (Phase 2)');
  assert.equal(g.marker, 'h40', 'Marker should be h40 for Phase 2');
  assert.equal(g.phaseN, 3, 'PhaseN should remain 3 (Phase 2 starts at phaseN=3)');
});

test('Phase thresholds - 30% triggers BH4 (hell) + Maelstrom', async () => {
  const {t} = await loadGame();
  const g = setupGameAfterPhase2(t); // After Phase 2 (40%), phaseN=3

  // Set HP to 30% and trigger transition
  g.boss.hp = Math.floor(g.boss.max * 0.30);
  t.transitionCalamitas(g);

  // 30% uses cast delay (0 time), need to process it
  t.updatePhaseTransitions(1/60, g);

  assert.equal(g.stage, 'hell', '30% HP should trigger Bullet Hell IV (hell stage)');
  assert.equal(g.marker, 'h30', 'Marker should be h30 for BH4');
  assert.equal(g.phaseN, 4, 'PhaseN should be 4 for BH4');
  // Source creates Maelstrom at tick 420 of BH4.
  assert.equal(g.maelstrom, null, 'Maelstrom waits for BH4 tick 420');
});

test('Phase thresholds - 20% triggers Seekers', async () => {
  const {t} = await loadGame();
  const g = setupGameAfterBH(t, 4); // After Phase 2 + BH4, phaseN=4, 75%, 50%, 40%, 30% crossed

  // Set HP to 20% and trigger transition
  g.boss.hp = Math.floor(g.boss.max * 0.20);
  t.transitionCalamitas(g);

  // 20% triggers Seekers directly (no cast delay)
  assert.equal(g.stage, 'seekers', '20% HP should trigger Seekers phase');
  assert.equal(g.marker, 'seek', 'Marker should be seek');
  assert.equal(g.phaseN, 4, 'PhaseN should remain 4 (Seekers doesn\'t increment phaseN)');
});

test('Phase thresholds - 10% triggers BH5 (hell)', async () => {
  const {t} = await loadGame();
  const g = setupGameAfterSeekers(t); // After Seekers (20%), phaseN=4

  // Set HP to 10% and trigger transition
  g.boss.hp = Math.floor(g.boss.max * 0.10);
  t.transitionCalamitas(g);

  // 10% triggers Final Bullet Hell directly (no cast delay)
  assert.equal(g.stage, 'hell', '10% HP should trigger Bullet Hell V (hell stage)');
  assert.equal(g.marker, 'h10', 'Marker should be h10 for BH5');
  assert.equal(g.phaseN, 5, 'PhaseN should be 5 for BH5');
});

test('Boss velocity (vx/vy) initialized to 0 in createBoss', async () => {
  const {t} = await loadGame();
  const game = t.makeGame('supreme-calamitas');
  t.setGame(game);

  // Check initial boss state
  assert.equal(game.boss.vx, 0, 'Initial boss.vx should be 0');
  assert.equal(game.boss.vy, 0, 'Initial boss.vy should be 0');
  assert.equal(Number.isNaN(game.boss.vx), false, 'Initial boss.vx should not be NaN');
  assert.equal(Number.isNaN(game.boss.vy), false, 'Initial boss.vy should not be NaN');
});

test('Boss velocity never becomes NaN during cast delay (velocity *= 0.94)', async () => {
  const {t} = await loadGame();
  const game = t.makeGame('supreme-calamitas');
  t.setGame(game);

  // Start cast delay for Sepulcher I (after BH1)
  t.startCastDelay(game, 'hearts', 'opening', 'SEPULCHER I', 75/60, 'sepulcher');

  // Run several frames of cast delay
  for (let i = 0; i < 20; i++) {
    t.updateCastDelay(1/60, game);
    assert.equal(Number.isNaN(game.boss.vx), false, `Frame ${i}: boss.vx should not be NaN`);
    assert.equal(Number.isNaN(game.boss.vy), false, `Frame ${i}: boss.vy should not be NaN`);
    assert.ok(Number.isFinite(game.boss.vx), `Frame ${i}: boss.vx should be finite`);
    assert.ok(Number.isFinite(game.boss.vy), `Frame ${i}: boss.vy should be finite`);
  }

  // After cast delay ends
  t.updateCastDelay(1/60, game);
  assert.equal(Number.isNaN(game.boss.vx), false, 'After cast: boss.vx should not be NaN');
  assert.equal(Number.isNaN(game.boss.vy), false, 'After cast: boss.vy should not be NaN');
});

test('bossAttack is blocked during cast delay (castDelayState check)', async () => {
  const {t} = await loadGame();
  const game = t.makeGame('supreme-calamitas');
  t.setGame(game);

  // Start cast delay
  t.startCastDelay(game, 'hearts', 'opening', 'SEPULCHER I', 75/60, 'sepulcher');

  // Verify castDelayState is set
  assert.ok(game.castDelayState, 'castDelayState should be set during cast delay');
  assert.equal(game.castDelayState.type, 'sepulcher', 'Cast type should be sepulcher');

  // Simulate the encounter update logic (from registry.js)
  // bossAttack should NOT run when castDelayState is set
  const shouldRunBossAttack = (game.stage === 'normal' || game.stage === 'hearts') && !game.castDelayState;
  assert.equal(shouldRunBossAttack, false, 'bossAttack should be blocked during cast delay');

  // After cast delay ends
  t.updateCastDelay(75/60, game); // Complete the cast
  assert.ok(!game.castDelayState, 'castDelayState should be cleared after cast');

  const shouldRunAfter = (game.stage === 'normal' || game.stage === 'hearts') && !game.castDelayState;
  assert.equal(shouldRunAfter, true, 'bossAttack should run after cast delay ends');
});

test('Seekers HP initialized correctly from config.seekerHP (4900) in updateMinions', async () => {
  const {t} = await loadGame();
  const game = t.makeGame('supreme-calamitas');
  t.setGame(game);

  // Enter seekers phase (this calls enterCalamitas which creates seekers array)
  t.enterCalamitas('seekers', 'seek', 'SOUL SEEKERS');

  const g = t.getGame();
  assert.ok(g.seekers && g.seekers.length === 10, 'Should have 10 seekers');

  // Run updateMinions once to initialize seekers (sets ai0, ai2, hp, max)
  t.updateMinions(1/60);

  for (const seeker of g.seekers) {
    assert.equal(seeker.hp, 4900, `Seeker HP should be 4900 (config.seekerHP), got ${seeker.hp}`);
    assert.equal(seeker.max, 4900, `Seeker max HP should be 4900, got ${seeker.max}`);
    assert.ok(Number.isFinite(seeker.hp), 'Seeker HP should be finite');
    assert.ok(!Number.isNaN(seeker.hp), 'Seeker HP should not be NaN');
    // ai0 and ai2 should be initialized
    assert.equal(seeker.nativeTimer,1,'Native attack timer starts at1 after one tick');
    assert.equal(seeker.warning,false,'No warning or instant volley on spawn');
    assert.ok(seeker.initialized === true, 'Seeker should be marked as initialized');
  }
});

test('Seekers warning precedes first salvo at source145/181ticks',async()=>{
 const {t}=await loadGame();t.start();const g=t.getGame();g.player.x=1200;g.player.y=300;t.enterCalamitas('seekers','seek');t.updateMinions(144/60);assert.equal(g.projectiles.length,0);assert.equal(g.seekers[0].warning,false);t.updateMinions(1/60);assert.equal(g.seekers[0].warning,true);t.updateMinions(36/60);assert.ok(g.projectiles.some(q=>q.nativeSeeker));
});

test('Bullet hell timing uses accumulated timers (FPS independent)', async () => {
  const {t} = await loadGame();
  const game = t.makeGame('supreme-calamitas');
  t.setGame(game);

  // Enter BH2 (phaseN = 2)
  t.enterCalamitas('hell', 'h75', 'BULLET HELL II');
  const g = t.getGame();
  g.phaseN = 2;

  // Run bulletHell for a few frames at different effective FPS
  // The key test: hellTimers should be initialized and used
  t.bulletHell(1/60); // 60 FPS
  assert.ok(g.hellTimers !== undefined, 'hellTimers should be initialized');
  assert.ok(typeof g.hellTimers.passedVar === 'number', 'passedVar should be a number');

  // passedVar should accumulate
  const passedVarBefore = g.hellTimers.passedVar;
  t.bulletHell(1/60);
  assert.ok(g.hellTimers.passedVar >= passedVarBefore, 'passedVar should accumulate');

  // Test at 30 FPS (larger dt)
  const game2 = t.makeGame('supreme-calamitas');
  t.setGame(game2);
  t.enterCalamitas('hell', 'h75', 'BULLET HELL II');
  const g2 = t.getGame();
  g2.phaseN = 2;

  t.bulletHell(1/30); // 30 FPS
  t.bulletHell(1/30);

  const game3 = t.makeGame('supreme-calamitas');
  t.setGame(game3);
  t.enterCalamitas('hell', 'h75', 'BULLET HELL II');
  const g3 = t.getGame();
  g3.phaseN = 2;

  t.bulletHell(1/120); // 120 FPS
  t.bulletHell(1/120);

  // All should have hellTimers initialized and passedVar accumulating
  assert.ok(g2.hellTimers && g3.hellTimers, 'hellTimers should work at all FPS');
});

test('Maelstrom spawns as the real moving entity at BH4 tick 420',async()=>{
 const {t}=await loadGame();const g=t.makeGame('supreme-calamitas');t.setGame(g);t.enterCalamitas('hell','h30','BH4');g.phaseN=4;
 for(let i=0;i<419;i++)t.bulletHell(1/60);assert.equal(g.maelstrom,null);
 t.bulletHell(1/60);assert.ok(g.maelstrom);assert.equal(g.maelstromSpawned,true);
 assert.equal(g.projectiles.some(q=>q.kind==='maelstrom'),false);
});

test('Restart during cast delay - clean state reset, no NaN', async () => {
  const {t} = await loadGame();
  const game = t.makeGame('supreme-calamitas');
  t.setGame(game);

  // Start cast delay for Sepulcher I
  t.startCastDelay(game, 'hearts', 'opening', 'SEPULCHER I', 75/60, 'sepulcher');

  // Run a few frames of cast delay
  for (let i = 0; i < 10; i++) {
    t.updateCastDelay(1/60, game);
  }

  // Verify no NaN during cast
  assert.ok(!Number.isNaN(game.boss.vx), 'During cast: boss.vx should not be NaN');
  assert.ok(!Number.isNaN(game.boss.vy), 'During cast: boss.vy should not be NaN');

  // Simulate restart (new game)
  const newGame = t.makeGame('supreme-calamitas');
  t.setGame(newGame);

  // New boss should have vx/vy = 0
  assert.equal(newGame.boss.vx, 0, 'Restarted boss.vx should be 0');
  assert.equal(newGame.boss.vy, 0, 'Restarted boss.vy should be 0');
  assert.ok(!Number.isNaN(newGame.boss.vx), 'Restarted boss.vx should not be NaN');
  assert.ok(!Number.isNaN(newGame.boss.vy), 'Restarted boss.vy should not be NaN');
});

test('FPS independence - passedVar accumulates correctly at 30/60/120 FPS', async () => {
  const {t} = await loadGame();

  const results = {};
  for (const fps of FPS_VALUES) {
    const dt = 1 / fps;
    const game = t.makeGame('supreme-calamitas');
    t.setGame(game);
    t.enterCalamitas('hell', 'h30', 'BULLET HELL IV');
    const g = t.getGame();
    g.phaseN = 4;

    // Run for 1 second of game time
    const frames = Math.round(1 / dt);
    for (let i = 0; i < frames; i++) {
      t.bulletHell(dt);
    }

    // passedVar should be ~60 ticks (1 second * 60Hz) regardless of FPS
    results[fps] = g.hellTimers.passedVar;
  }

  // At 1 second, passedVar should be ~60 at all FPS (within small tolerance)
  for (const fps of FPS_VALUES) {
    const passedVar = results[fps];
    assert.ok(passedVar >= 55 && passedVar <= 65,
      `${fps}FPS: passedVar should be ~60 after 1 second, got ${passedVar.toFixed(2)}`);
  }
});

test('No NaN values in full phase transition sequence', async () => {
  const {t} = await loadGame();
  const game = t.makeGame('supreme-calamitas');
  t.setGame(game);
  t.enter('hell', 'opening', 'BULLET HELL I');

  // Simulate key phase transitions by manually setting HP and calling transition
  const thresholds = [
    {hp: 0.75, expectedStage: 'hell', expectedMarker: 'h75'},
    {hp: 0.50, expectedStage: 'hell', expectedMarker: 'h50'},
    {hp: 0.40, expectedStage: 'normal', expectedMarker: 'h40'},
    {hp: 0.30, expectedStage: 'hell', expectedMarker: 'h30'},
    {hp: 0.20, expectedStage: 'seekers', expectedMarker: 'seek'},
    {hp: 0.10, expectedStage: 'hell', expectedMarker: 'h10'},
  ];

  for (const thresh of thresholds) {
    const g = t.getGame();
    // Need to be in normal stage for thresholds to trigger
    if (g.stage !== 'normal') {
      t.enter('normal', 'test', 'TEST');
    }
    g.boss.hp = Math.floor(g.boss.max * thresh.hp);
    t.transitionCalamitas(g);

    // Check no NaN in boss
    assert.ok(!Number.isNaN(g.boss.x), `At ${thresh.hp*100}%: boss.x not NaN`);
    assert.ok(!Number.isNaN(g.boss.y), `At ${thresh.hp*100}%: boss.y not NaN`);
    assert.ok(!Number.isNaN(g.boss.vx), `At ${thresh.hp*100}%: boss.vx not NaN`);
    assert.ok(!Number.isNaN(g.boss.vy), `At ${thresh.hp*100}%: boss.vy not NaN`);
    assert.ok(!Number.isNaN(g.boss.hp), `At ${thresh.hp*100}%: boss.hp not NaN`);
  }

  // Test seekers initialization
  t.enterCalamitas('seekers', 'seek', 'SOUL SEEKERS');
  t.updateMinions(1/60);
  const g = t.getGame();
  for (const seeker of g.seekers) {
    assert.ok(!Number.isNaN(seeker.hp), 'Seeker HP not NaN');
    assert.ok(!Number.isNaN(seeker.max), 'Seeker max not NaN');
    assert.ok(!Number.isNaN(seeker.x), 'Seeker x not NaN');
    assert.ok(!Number.isNaN(seeker.y), 'Seeker y not NaN');
  }
});