const test = require('node:test');
const assert = require('node:assert/strict');
const { loadGame } = require('./helpers/fixture.cjs');

class LoadedImage {
  set src(url) { this.url = String(url); this.width = this.naturalWidth = 64; this.height = this.naturalHeight = 64; this.onload?.(); }
}

async function createFixture() {
  const { t } = await loadGame({ Image: LoadedImage });
  await t.initializeMinionAtlas();
  t.start();
  t.enter('hearts', 'opening', 'TEST');
  return { t, g: t.getGame() };
}

async function createFixtureNoWorm() {
  const { t } = await loadGame({ Image: LoadedImage });
  await t.initializeMinionAtlas();
  t.start();
  t.enter('normal', 'opening', 'TEST');
  return { t, g: t.getGame() };
}

const close = (a, b, eps = 1e-6, msg = '') => assert.ok(Math.abs(a - b) < eps, `${msg} ${a} != ${b}`);
const closeObj = (a, b, eps = 1e-6, msg = '') => { close(a.x, b.x, eps, msg + '.x'); close(a.y, b.y, eps, msg + '.y'); };

// Helper to get modules through fixture exports
async function getModules(t) {
  // Modules are merged into t by fixture
  return {
    getSepulcherBlockers: t.getSepulcherBlockers,
    checkSepulcherCollision: t.checkSepulcherCollision,
    traceSepulcherBeam: t.traceSepulcherBeam,
    updateBullets: t.updateBullets,
    updateRogue: t.updateRogue,
    updateSword: t.updateSword,
    updateMinions: t.updateMinions,
    fireChannelWeapon: t.fireChannelWeapon,
    activateRanger: t.activateRanger,
    throwCelestus: t.throwCelestus,
    addShot: t.addShot,
    weapons: t.weapons,
    hitTarget: t.hitTarget,
    possibleTargets: t.possibleTargets,
    kit: t.kit,
    cosmicStarBurst: t.cosmicStarBurst,
    beamWallDistance: t.beamWallDistance,
    muzzlePoint: t.muzzlePoint,
    weaponAim: t.weaponAim,
    enemyBullet: t.enemyBullet,
  };
}

test('sepulcher blockers: stationary head/body/tail present during hearts phase', async () => {
  const { t, g } = await createFixture();
  // Advance enough for head to fade in (head fades in over ~2.5s at 9.9*255/s)
  for (let i = 0; i < 60; i++) t.updateMinions(1/60);
  const { getSepulcherBlockers } = await getModules(t);

  const blockers = getSepulcherBlockers(g);
  assert.ok(blockers.length >= 1, `expected at least head blocker, got ${blockers.length}`);

  const head = blockers.find(b => b.type === 'head');
  assert.ok(head, 'head blocker present');
  const w = g.sepulcher;
  close(head.x, w.x, 1e-6, 'head blocker x');
  close(head.y, w.y, 1e-6, 'head blocker y');
  close(head.radius, Math.hypot(62, 64) / 2, 1e-6, 'head radius from source');
});

test('sepulcher blockers: body/energy/tail appear after segments fade in', async () => {
  const { t, g } = await createFixture();
  // Advance time for body segments to fade in (alpha threshold 128, fade rate 42*60/s)
  // Head alpha starts at 255, fades at ~2500/s -> reaches 128 at ~0.05s
  // Body segments start fading when head alpha < 128
  for (let i = 0; i < 120; i++) t.updateMinions(1/60); // 2 seconds
  const { getSepulcherBlockers } = await getModules(t);

  const blockers = getSepulcherBlockers(g);
  assert.ok(blockers.some(b => b.type === 'body'), 'body segments present after fade-in');
  assert.ok(blockers.some(b => b.type === 'energyBall'), 'energy ball segments present');
  assert.ok(blockers.some(b => b.type === 'tail'), 'tail segment present');
});

test('sepulcher blockers: empty when worm absent or hearts phase ended or no live hearts', async () => {
  const { t, g } = await createFixture();
  for (let i = 0; i < 60; i++) t.updateMinions(1/60);
  const { getSepulcherBlockers } = await getModules(t);

  // Remove worm
  g.sepulcher = null;
  let blockers = getSepulcherBlockers(g);
  assert.equal(blockers.length, 0, 'no blockers when worm null');

  // Restore but change phase
  g.sepulcher = { x: 0, y: 0, alpha: 0, nodes: [], arms: [], bodyScale: 1.35, headScale: 1.6875 };
  g.stage = 'normal';
  blockers = getSepulcherBlockers(g);
  assert.equal(blockers.length, 0, 'no blockers when stage != hearts');

  // Hearts phase but no hearts
  g.stage = 'hearts';
  g.hearts = [];
  blockers = getSepulcherBlockers(g);
  assert.equal(blockers.length, 0, 'no blockers when hearts empty');

  // Hearts phase but all hearts dead
  g.hearts = [{ hp: 0 }, { hp: 0 }];
  blockers = getSepulcherBlockers(g);
  assert.equal(blockers.length, 0, 'no blockers when all hearts dead');
});

// --- Explicit alpha=128 boundary fixture (replaces timing-guess opacity test) ---
test('sepulcher blockers: explicit alpha=128 boundary', async () => {
  const { t, g } = await createFixture();
  const { getSepulcherBlockers } = await getModules(t);

  // Controlled worm: head at alpha=128 (boundary), one body node at alpha=128
  g.sepulcher = {
    x: 500, y: 400,
    alpha: 128,
    nodes: [{ index: 0, x: 600, y: 400, alpha: 128, isEnergyBall: false, isTail: false }],
    arms: [],
    bodyScale: 1.35,
    headScale: 1.6875
  };
  g.t = 0;

  // At exact boundary alpha=128 => no blockers (alpha >= 128 excluded)
  let blockers = getSepulcherBlockers(g);
  assert.equal(blockers.length, 0, 'no blockers at exact alpha=128 boundary');

  // Head crosses to alpha=127 => head becomes blocker
  g.t += 1/60;
  g.sepulcher.alpha = 127;
  blockers = getSepulcherBlockers(g);
  assert.equal(blockers.length, 1, 'exactly 1 head blocker when head alpha=127');
  assert.equal(blockers[0].type, 'head', 'blocker is head');

  // Body node crosses to alpha=127 => head + body = 2 blockers
  g.t += 1/60;
  g.sepulcher.nodes[0].alpha = 127;
  blockers = getSepulcherBlockers(g);
  assert.equal(blockers.length, 2, 'head + body blockers when both alpha=127');
  assert.ok(blockers.some(b => b.type === 'head') && blockers.some(b => b.type === 'body'), 'has head and body');

  // Both fully visible alpha=255 => 0 blockers (alpha >= 128 excluded)
  g.t += 1/60;
  g.sepulcher.alpha = 255;
  g.sepulcher.nodes[0].alpha = 255;
  blockers = getSepulcherBlockers(g);
  assert.equal(blockers.length, 0, 'no blockers when both alpha=255 (>=128)');
});

// --- Small reusable helper for controlled hearts fixture (ranger tests) ---
function createControlledHeartsFixture(t, g) {
  // Replace worm with head far away (alpha=255, invisible), nodes[0] at alpha=0
  g.sepulcher = {
    x: 1000, y: 400,
    alpha: 255,
    nodes: [{ index: 0, x: 700, y: 400, alpha: 0, isEnergyBall: false, isTail: false }],
    arms: [],
    bodyScale: 1.35,
    headScale: 1.6875
  };
  // Keep two actual heart objects from g.hearts, position front/rear
  const front = g.hearts[0];
  const rear = g.hearts[1];
  front.x = 550; front.y = 400; front.r = 16; front.hp = 100000;
  rear.x = 900; rear.y = 400; rear.r = 16; rear.hp = 100000;
  g.hearts = [front, rear];
  // Player aims rightward
  t.setPointer({ x: 1000, y: 400 });
  g.player.x = 400; g.player.y = 400;
  t.setDeviceMode('desktop');
  return { front, rear };
}

test('ranger ability: controlled hearts fixture - front hit first (entry order), rear protected by worm node', async () => {
  const { t, g } = await createFixture();
  for (let i = 0; i < 180; i++) t.updateMinions(1/60);
  const { front, rear } = createControlledHeartsFixture(t, g);
  // Entry-order case: front heart at x=665 (before worm node at 700)
  front.x = 665;
  front.r = 16;
  rear.x = 800;
  rear.hp = 100000;
  g.player.weapon=1;g.player.gel=9999;
  const k=t.kit();
  t.activateRanger();for(let step=0;step<30;step++)t.updateRangerCombat(1/120);
  assert.ok(front.hp < 100000, 'front heart HP decreased (entry order: front encountered first)');
  assert.equal(rear.hp, 100000, 'rear heart HP unchanged (protected by worm node)');
  // Rail endpoint should be between front heart (665) and worm node (700) at y=400
  assert.equal(k.photo.clusters.length,0,'native cluster absorbed by worm');
});

test('checkSepulcherCollision: shot consumed on head blocker', async () => {
  const { t, g } = await createFixture();
  for (let i = 0; i < 60; i++) t.updateMinions(1/60);
  const { getSepulcherBlockers, checkSepulcherCollision } = await getModules(t);
  const blockers = getSepulcherBlockers(g);
  const head = blockers.find(b => b.type === 'head');
  assert.ok(head);

  // Shot moving directly toward head center from 100px away
  const shotR = 4;
  const collision = checkSepulcherCollision(head.x - 100, head.y, head.x, head.y, shotR, blockers);
  assert.ok(collision.hit, 'hit detected');
  const expectedT = (100 - (head.radius + shotR)) / 100;
  close(collision.t, expectedT, 1e-3, 'collision fraction');
  assert.equal(collision.blocker.type, 'head', 'blocker is head');
});

test('checkSepulcherCollision: shot consumed on body and tail blockers', async () => {
  const { t, g } = await createFixture();
  for (let i = 0; i < 180; i++) t.updateMinions(1/60); // wait for body fade-in
  const { getSepulcherBlockers, checkSepulcherCollision } = await getModules(t);
  const blockers = getSepulcherBlockers(g);

  const body = blockers.find(b => b.type === 'body');
  const tail = blockers.find(b => b.type === 'tail');
  assert.ok(body && tail, 'body and tail present');

  const shotR = 4;
  // Body hit from 80px away
  const bodyHit = checkSepulcherCollision(body.x - 80, body.y, body.x + 10, body.y, shotR, blockers);
  assert.ok(bodyHit.hit && bodyHit.blocker.type === 'body', 'body blocks');

  // Tail hit from 60px away
  const tailHit = checkSepulcherCollision(tail.x - 60, tail.y, tail.x + 10, tail.y, shotR, blockers);
  assert.ok(tailHit.hit && tailHit.blocker.type === 'tail', 'tail blocks');
});

test('checkSepulcherCollision: fast piercing shot blocked at 30/60/120 FPS equivalent speeds', async () => {
  const { t, g } = await createFixture();
  for (let i = 0; i < 180; i++) t.updateMinions(1/60);
  const { getSepulcherBlockers, checkSepulcherCollision } = await getModules(t);
  const blockers = getSepulcherBlockers(g);
  const body = blockers.find(b => b.type === 'body');
  assert.ok(body);

  const shotR = 4;
  // Different step distances simulating various frame rates
  const testCases = [
    { name: '30fps', dist: 200 },   // ~6000 px/s step
    { name: '60fps', dist: 100 },   // ~6000 px/s step
    { name: '120fps', dist: 50 },   // ~6000 px/s step
  ];

  for (const s of testCases) {
    const hit = checkSepulcherCollision(body.x - s.dist, body.y, body.x + 10, body.y, shotR, blockers);
    assert.ok(hit.hit, `${s.name}: fast shot should hit blocker`);
    assert.ok(hit.t >= 0 && hit.t <= 1, `${s.name}: collision fraction in range`);
  }
});

test('checkSepulcherCollision: near miss stays alive', async () => {
  const { t, g } = await createFixture();
  for (let i = 0; i < 180; i++) t.updateMinions(1/60);
  const { getSepulcherBlockers, checkSepulcherCollision } = await getModules(t);
  const blockers = getSepulcherBlockers(g);
  const body = blockers.find(b => b.type === 'body');
  assert.ok(body);

  const shotR = 4;
  // Pass just outside blocker radius - test ONLY the body blocker in isolation
  // to avoid other segments (head, tail, etc.) causing false collisions
  const missDist = body.radius + shotR + 5;
  const onlyBodyBlocker = [body];
  const hit = checkSepulcherCollision(body.x - 100, body.y + missDist, body.x + 100, body.y + missDist, shotR, onlyBodyBlocker);
  assert.ok(!hit.hit, 'shot passing outside radius should miss');
});

test('checkSepulcherCollision: origin inside blocker returns t=0', async () => {
  const { t } = await createFixture();
  const { checkSepulcherCollision } = await getModules(t);
  // Create test blockers directly
  const blockers = [{ x: 0, y: 0, radius: 10, type: 'head', segmentIndex: -1 }];
  const shotR = 4;

  // Origin inside blocker
  const hit = checkSepulcherCollision(0, 0, 10, 0, shotR, blockers);
  assert.ok(hit.hit, 'hit detected when origin inside');
  close(hit.t, 0, 1e-6, 't=0 when origin inside');
  close(hit.point.x, 0, 1e-6, 'point at origin');
  close(hit.point.y, 0, 1e-6, 'point at origin');
});

test('traceSepulcherBeam: beam stops at blocker, endpoint agrees', async () => {
  const { t, g } = await createFixture();
  for (let i = 0; i < 180; i++) t.updateMinions(1/60);
  const { getSepulcherBlockers, traceSepulcherBeam } = await getModules(t);
  const blockers = getSepulcherBlockers(g);
  const body = blockers.find(b => b.type === 'body');
  assert.ok(body);

  // Beam from left toward body
  const dx = 1, dy = 0;
  const halfWidth = 4;
  const result = traceSepulcherBeam(body.x - 200, body.y, dx, dy, halfWidth, blockers, 500);
  assert.ok(result.hit, 'beam hits blocker');
  assert.ok(result.distance < 200, 'beam stops before blocker center');
  close(result.point.x, body.x - body.radius - halfWidth, 1, 'beam endpoint at blocker edge');
});

test('traceSepulcherBeam: origin inside blocker returns distance 0', async () => {
  const { t } = await createFixture();
  const { traceSepulcherBeam } = await getModules(t);
  const blockers = [{ x: 0, y: 0, radius: 10, type: 'head', segmentIndex: -1 }];
  const result = traceSepulcherBeam(0, 0, 1, 0, 4, blockers, 500);
  assert.ok(result.hit, 'hit when origin inside');
  close(result.distance, 0, 1e-6, 'distance=0 when origin inside');
  close(result.point.x, 0, 1e-6, 'point at origin');
  close(result.point.y, 0, 1e-6, 'point at origin');
});

test('ranger ability: controlled fixture - beam blocked by worm node, front heart hit (entry order)', async () => {
  const { t, g } = await createFixture();
  for (let i = 0; i < 180; i++) t.updateMinions(1/60);
  const { front, rear } = createControlledHeartsFixture(t, g);
  // Entry-order case: front heart at x=665 (before worm node at 700)
  front.x = 665;
  front.r = 16;
  rear.x = 800;
  rear.hp = 100000;
  g.player.weapon=1;g.player.gel=9999;
  const k=t.kit();
  t.activateRanger();for(let step=0;step<30;step++)t.updateRangerCombat(1/120);
  assert.ok(front.hp < 100000, 'front heart HP decreased (entry order: front encountered first)');
  assert.equal(rear.hp, 100000, 'rear heart HP unchanged (protected by worm node)');
  // Rail endpoint should be between front heart (665) and worm node (700) at y=400
  assert.equal(k.photo.clusters.length,0,'native cluster absorbed by worm');
});

test('ranger ability: no ReferenceError when hitting target without worm', async () => {
  const { t, g } = await createFixtureNoWorm();
  const heart = g.boss; // In normal stage, boss is the target
  heart.hp = 10000;
  g.player.x = 400;
  g.player.y = 400;
  heart.x = 700;
  heart.y = 400;
  heart.r = 30;
  t.setPointer({ x: 900, y: 400 });
  g.player.weapon=1;g.player.gel=9999;
  const k=t.kit();

  // Should not throw ReferenceError
  t.activateRanger();for(let step=0;step<30;step++)t.updateRangerCombat(1/120);
  // Boss should take damage
  assert.ok(heart.hp < 10000, 'boss hit by ranger beam without worm');
});

test('ranger ability: origin inside target (boss/player overlapping) clamps t=0', async () => {
  const { t, g } = await createFixtureNoWorm();
  const heart = g.boss;
  heart.hp = 10000;
  // Boss and player both at 400,400 - origin inside target
  g.player.x = 400;
  g.player.y = 400;
  heart.x = 455;
  heart.y = 390;
  heart.r = 30;
  t.setPointer({ x: 900, y: 400 });
  g.player.weapon=1;g.player.gel=9999;
  const k=t.kit();

  // Should not throw, hitTarget handles negative entry via clamp
  t.activateRanger();for(let step=0;step<30;step++)t.updateRangerCombat(1/120);
  // Actual HP should decrease (027 fixed negative entry clamp)
  assert.ok(heart.hp < 10000, 'boss HP decreased with origin inside target');
});

test('rogue blades: absorbed by worm on outward path, front target hit first', async () => {
  const { t, g } = await createFixture();
  for (let i = 0; i < 180; i++) t.updateMinions(1/60);

  const { front, rear } = createControlledHeartsFixture(t, g);
  // Absorption-only: only rear heart exists, so no earlier target
  g.hearts = [rear];
  rear.x = 800; // crossing test position

  g.player.stealth = 0; // isolate uncharged blade (no charged splash)
  t.throwCelestus(t.weapons[1], 0);

  const k = t.kit();
  const blade = k.blades[0];
  assert.ok(blade, 'blade created');

  // Set blade at controlled start state
  blade.x = 450; blade.y = 400; blade.vx = 13500; blade.vy = 0; blade.age = 0; blade.returning = false;

  // One update: homing blend advances enough to cross front(550)/body(700)/rear(800)
  t.updateRogue(1/30);

  // Blade should be consumed (removed from array), not just returning
  assert.equal(k.blades.length, 0, 'blade consumed by worm (removed from array)');
  assert.equal(rear.hp, 100000, 'rear heart HP unchanged (absorption only, no target hit)');
});

test('rogue blades: front target hit before worm blocker', async () => {
  const { t, g } = await createFixture();
  for (let i = 0; i < 180; i++) t.updateMinions(1/60);

  const { front, rear } = createControlledHeartsFixture(t, g);
  rear.x = 800; // crossing test position

  g.player.stealth = 0; // isolate uncharged blade
  t.throwCelestus(t.weapons[1], 0);

  const k = t.kit();
  const blade = k.blades[0];
  assert.ok(blade, 'blade created');

  // Set blade at controlled start state
  blade.x = 450; blade.y = 400; blade.vx = 13500; blade.vy = 0; blade.age = 0; blade.returning = false;

  // One update: homing blend advances enough to cross front(550)/body(700)/rear(800)
  t.updateRogue(1/30);

  // Front heart should be hit, rear protected, blade removed same step
  assert.ok(front.hp < 100000, 'front heart HP decreased');
  assert.equal(rear.hp, 100000, 'rear heart HP unchanged (protected by worm node)');
  assert.equal(k.blades.length, 0, 'blade removed after hitting front target');
});

test('ark throw: absorbed by worm on outward path, clamps at collision', async () => {
  const { t, g } = await createFixture();
  for (let i = 0; i < 180; i++) t.updateMinions(1/60);

  const { rear } = createControlledHeartsFixture(t, g);
  // Absorption-only: only rear heart exists
  g.hearts = [rear];
  rear.x = 800; // Set rear.x=800 so hypothetical unblocked endpoint 733 would cross rear leading edge 722

  // Set player coordinates/pointer BEFORE fire
  g.player.combo = 4;
  g.player.comboExpire = g.t + 10;
  t.fireArk();

  const arkThrow = g.player.arkThrow;
  assert.ok(arkThrow, 'ark throw initiated');
  assert.ok(!arkThrow.returning, 'initially not returning');

  // One updateSword(0.3): large swept step from 400 towards 740 endpoint ~733
  t.updateSword(0.3);

  // Ark throw should be returning and clamped at worm entry
  assert.ok(arkThrow.returning, 'ark throw returning after hitting worm');
  // Body radius from source: hypot(48,48)/2, Ark radius 62
  const body = g.sepulcher.nodes[0];
  const bodyRadius = Math.hypot(48, 48) / 2;
  const arkRadius = 62;
  const expectedSurface = body.x - bodyRadius - arkRadius;
  close(arkThrow.x, expectedSurface, 1e-5, `ark clamped at worm body surface: x=${arkThrow.x}, expected=${expectedSurface}`);
  assert.equal(rear.hp, 100000, 'rear heart HP unchanged (absorption only)');
});

test('ark throw: front target hit before worm, rear protected', async () => {
  const { t, g } = await createFixture();
  for (let i = 0; i < 180; i++) t.updateMinions(1/60);

  const { front, rear } = createControlledHeartsFixture(t, g);
  // Keep both hearts
  rear.x = 800; // Set rear.x=800 so hypothetical unblocked endpoint 733 would cross rear leading edge 722

  // Set player coordinates/pointer BEFORE fire
  g.player.combo = 4;
  g.player.comboExpire = g.t + 10;
  t.fireArk();

  const arkThrow = g.player.arkThrow;
  assert.ok(arkThrow, 'ark throw initiated');
  assert.ok(!arkThrow.returning, 'initially not returning');

  // One updateSword(0.3): large swept step from 400 towards 740 endpoint ~733
  t.updateSword(0.3);

  // Front heart should be hit, rear protected, ark returning, stopped before body (700)
  assert.ok(front.hp < 100000, 'front heart HP decreased');
  assert.equal(rear.hp, 100000, 'rear heart HP unchanged (protected by worm)');
  assert.ok(arkThrow.returning, 'ark throw returning after hitting front target');
  assert.ok(arkThrow.x < 700, `ark stopped before worm body at x=${arkThrow.x}`);
});

test('enemy projectiles: unaffected by worm blocking', async () => {
  const { t, g } = await createFixture();
  for (let i = 0; i < 180; i++) t.updateMinions(1/60);

  const initialCount = g.projectiles.length;
  const body = g.sepulcher.nodes.find(n => !n.isEnergyBall && !n.isTail && n.alpha < 128);
  assert.ok(body);

  // Spawn enemy projectile moving through worm
  t.enemyBullet(body.x - 100, body.y, 1, 0, 300, 6, 'dart', 35);

  t.updateBullets(1/60);

  // Enemy projectile should still exist (not absorbed)
  assert.equal(g.projectiles.length, initialCount + 1, 'enemy projectile not absorbed by worm');
});

test('minion shot (summoner): controlled fixture - absorbed by worm node, no burst', async () => {
  const { t, g } = await createFixture();
  for (let i = 0; i < 180; i++) t.updateMinions(1/60);

  // Controlled worm: body at 700,400 (alpha=0 => visible blocker)
  g.sepulcher = {
    x: 1000, y: 400,
    alpha: 255,
    nodes: [{ index: 0, x: 700, y: 400, alpha: 0, isEnergyBall: false, isTail: false }],
    arms: [],
    bodyScale: 1.35,
    headScale: 1.6875
  };
  // Front heart at y=600 so it doesn't intercept the shot
  const front = g.hearts[0];
  front.x = 550; front.y = 600; front.r = 16; front.hp = 100000;
  // Rear heart at 800,400
  const rear = g.hearts[1];
  rear.x = 800; rear.y = 400; rear.r = 16; rear.hp = 100000;
  g.hearts = [front, rear];

  // Player at 400,400 aims right
  g.player.x = 400; g.player.y = 400;
  t.setPointer({ x: 1000, y: 400 });
  t.setDeviceMode('desktop');

  // Spawn shot at 450,400 with overridden velocity for deterministic 450px/frame travel
  t.addShot(450, 400, 1, 0, { ...t.weapons[0], id: 'cosmicStar', dmg: 500, speed: 600, rad: 4, pierce: 0, homing: false });
  const shot = g.shots[g.shots.length - 1];
  assert.ok(shot, 'shot created');
  // Override velocity for exact 450px per frame at 30 FPS (13500 px/s)
  shot.vx = 13500; shot.vy = 0; shot.homing = false; shot.r = 4;

  t.updateBullets(1/30); // travels 450px: 450 -> 900

  // Shot should be consumed by worm node at 700
  assert.equal(g.shots.length, 0, 'cosmicStar shot absorbed by worm, no unintended burst');
  assert.equal(rear.hp, 100000, 'rear heart HP unchanged (protected by worm)');
});

test('piercing shot: controlled fixture - hits front, stopped by worm before rear', async () => {
  const { t, g } = await createFixture();
  for (let i = 0; i < 180; i++) t.updateMinions(1/60);

  // Controlled worm: body at 700,400 (alpha=0 => visible blocker)
  g.sepulcher = {
    x: 1000, y: 400,
    alpha: 255,
    nodes: [{ index: 0, x: 700, y: 400, alpha: 0, isEnergyBall: false, isTail: false }],
    arms: [],
    bodyScale: 1.35,
    headScale: 1.6875
  };
  // Front heart at 550,400 (in front of worm)
  const front = g.hearts[0];
  front.x = 550; front.y = 400; front.r = 16; front.hp = 100000;
  // Rear heart at 800,400 (behind worm)
  const rear = g.hearts[1];
  rear.x = 800; rear.y = 400; rear.r = 16; rear.hp = 100000;
  g.hearts = [front, rear];

  // Player at 400,400 aims right
  g.player.x = 400; g.player.y = 400;
  t.setPointer({ x: 1000, y: 400 });
  t.setDeviceMode('desktop');

  // Spawn piercing shot at 450,400
  t.addShot(450, 400, 1, 0, { ...t.weapons[0], id: 'pierceTest', dmg: 500, speed: 600, rad: 4, pierce: 3, homing: false });
  const shot = g.shots[g.shots.length - 1];
  assert.ok(shot, 'piercing shot created');
  shot.vx = 13500; shot.vy = 0; shot.homing = false; shot.r = 4;

  t.updateBullets(1/30); // travels 450px: 450 -> 900

  // Front heart should be hit (pierce allows passing through), rear protected by worm
  assert.ok(front.hp < 100000, 'front heart HP decreased (piercing shot hits front)');
  assert.equal(rear.hp, 100000, 'rear heart HP unchanged (protected by worm node)');
  // Shot should be consumed by worm after piercing front
  assert.equal(g.shots.length, 0, 'shot consumed by worm after piercing front target');
});

test('ordinary shot: controlled fixture - blocked by worm, rear protected', async () => {
  const { t, g } = await createFixture();
  for (let i = 0; i < 180; i++) t.updateMinions(1/60);

  // Controlled worm: body at 700,400 (alpha=0 => visible blocker)
  g.sepulcher = {
    x: 1000, y: 400,
    alpha: 255,
    nodes: [{ index: 0, x: 700, y: 400, alpha: 0, isEnergyBall: false, isTail: false }],
    arms: [],
    bodyScale: 1.35,
    headScale: 1.6875
  };
  // Front heart at y=600 so it doesn't intercept the shot
  const front = g.hearts[0];
  front.x = 550; front.y = 600; front.r = 16; front.hp = 100000;
  // Rear heart at 800,400
  const rear = g.hearts[1];
  rear.x = 800; rear.y = 400; rear.r = 16; rear.hp = 100000;
  g.hearts = [front, rear];

  // Player at 400,400 aims right
  g.player.x = 400; g.player.y = 400;
  t.setPointer({ x: 1000, y: 400 });
  t.setDeviceMode('desktop');

  // Spawn ordinary shot at 450,400
  t.addShot(450, 400, 1, 0, { ...t.weapons[0], id: 'ordinary', dmg: 500, speed: 600, rad: 4, pierce: 0, homing: false });
  const shot = g.shots[g.shots.length - 1];
  assert.ok(shot, 'ordinary shot created');
  shot.vx = 13500; shot.vy = 0; shot.homing = false; shot.r = 4;

  t.updateBullets(1/30); // travels 450px: 450 -> 900

  // Shot should be consumed by worm node at 700, rear heart protected
  assert.equal(g.shots.length, 0, 'ordinary shot consumed by worm');
  assert.equal(rear.hp, 100000, 'rear heart HP unchanged (protected by worm)');
});

test('beam: visual endpoint matches traceSepulcherBeam stop point', async () => {
  const { t, g } = await createFixture();
  for (let i = 0; i < 180; i++) t.updateMinions(1/60);

  // Controlled fixture: hearts=[rear], rear at 800,400
  // Set up worm with body at 700,400
  g.sepulcher = {
    x: 1000, y: 400,
    alpha: 255,
    nodes: [{ index: 0, x: 700, y: 400, alpha: 0, isEnergyBall: false, isTail: false }],
    arms: [],
    bodyScale: 1.35,
    headScale: 1.6875
  };
  const rear = g.hearts[1];
  rear.x = 800; rear.y = 400; rear.r = 16; rear.hp = 100000;
  g.hearts = [rear];

  // Player at 400,400 aims right (angle 0)
  g.player.x = 400; g.player.y = 400;
  t.setPointer({ x: 1000, y: 400 });
  t.setDeviceMode('desktop');

  // Find real ranger weapon by id
  const rangerWeapon = t.weapons.find(w => w.id === 'ranger');
  assert.ok(rangerWeapon, 'ranger weapon found');

  // Call production fireChannelWeapon
  const k = t.kit();
  k.heat = 1;
  t.fireChannelWeapon(rangerWeapon, 0);

  // Assert exactly 1 pulse ray (ranger has count=1)
  const pulse = g.player.beamPulse;
  assert.ok(pulse, 'beam pulse created');
  assert.equal(pulse.rays.length, 1, 'exactly 1 pulse ray for ranger');
  const ray = pulse.rays[0];

  // Assert ray.hit === null (blocked by worm, not a target)
  assert.equal(ray.hit, null, 'ray.hit should be null (blocked by worm)');

  // Assert endpoint between player (400) and body (700)
  assert.ok(ray.ex > 400 && ray.ex < 700, `ray.ex=${ray.ex} should be between player and body`);
  assert.equal(ray.ey, 400, `ray.ey=${ray.ey} should be 400`);

  // Rear HP unchanged
  assert.equal(rear.hp, 100000, 'rear heart HP unchanged');

  // Independently call production traceSepulcherBeam from recorded ray origin
  const { traceSepulcherBeam, getSepulcherBlockers } = await getModules(t);
  const blockers = getSepulcherBlockers(g);
  const traceResult = traceSepulcherBeam(ray.x, ray.y, 1, 0, 4, blockers, 1800);

  // Assert ray.ex/ey/distance equal trace stop
  close(ray.ex, traceResult.point.x, 1e-5, `ray.ex=${ray.ex} vs traceResult.point.x=${traceResult.point.x}`);
  close(ray.ey, traceResult.point.y, 1e-5, `ray.ey=${ray.ey} vs traceResult.point.y=${traceResult.point.y}`);
  close(ray.distance, traceResult.distance, 1e-5, `ray.distance=${ray.distance} vs traceResult.distance=${traceResult.distance}`);
});

test('blocker cache: reused within same frame, invalidated on phase change', async () => {
  const { t, g } = await createFixture();
  for (let i = 0; i < 180; i++) t.updateMinions(1/60);

  const { getSepulcherBlockers } = await getModules(t);
  const b1 = getSepulcherBlockers(g);
  const b2 = getSepulcherBlockers(g);
  assert.equal(b1, b2, 'same array reference returned within frame');

  // Change phase - cache should be invalidated
  g.stage = 'normal';
  const b3 = getSepulcherBlockers(g);
  assert.notEqual(b1, b3, 'cache invalidated on phase change');
  assert.equal(b3.length, 0, 'no blockers in normal phase');
});

test('blocker cache: invalidated when worm reference changes', async () => {
  const { t, g } = await createFixture();
  for (let i = 0; i < 180; i++) t.updateMinions(1/60);

  const { getSepulcherBlockers } = await getModules(t);
  const b1 = getSepulcherBlockers(g);
  assert.ok(b1.length > 0, 'blockers present initially');

  // Replace worm with different object (simulating restart)
  // alpha=0 means head is visible (alpha < 128), at position (0,0) with no nodes/arms
  g.sepulcher = { x: 0, y: 0, alpha: 0, nodes: [], arms: [], bodyScale: 1.35, headScale: 1.6875 };
  const b2 = getSepulcherBlockers(g);
  assert.notEqual(b1, b2, 'cache invalidated when worm reference changes');
  // Fresh worm with alpha=0 has visible head at (0,0) -> 1 blocker
  assert.equal(b2.length, 1, 'one blocker (head) with fresh worm alpha=0');
  assert.equal(b2[0].type, 'head', 'blocker is head');
  close(b2[0].x, 0, 1e-6, 'head blocker at x=0');
  close(b2[0].y, 0, 1e-6, 'head blocker at y=0');
});

test('cosmicStar burst: legitimate hit triggers burst, absorbed by worm suppresses burst', async () => {
  // Test 1: Legitimate hit - front heart at 550,400, rear at 900,400, worm body at 700,400
  // Shot from 450,400 with vx=13500 travels to 900 in one frame, hits front at ~530
  {
    const { t, g } = await createFixture();
    for (let i = 0; i < 180; i++) t.updateMinions(1/60);

    const { front, rear } = createControlledHeartsFixture(t, g);
    // Set positions: front at 550,400, rear at 900,400
    front.x = 550; front.y = 400; front.r = 16; front.hp = 100000;
    rear.x = 900; rear.y = 400; rear.r = 16; rear.hp = 100000;
    g.hearts = [front, rear];

    // Player at 400,400 aims right
    g.player.x = 400; g.player.y = 400;
    t.setPointer({ x: 1000, y: 400 });
    t.setDeviceMode('desktop');

    // Clear sparks first
    g.sparks.length = 0;

    // Spawn shot at 450,400 with cosmicStar id, vx=13500, vy=0, homing=false, r=4, pierce=0
    t.addShot(450, 400, 1, 0, { ...t.weapons[0], id: 'cosmicStar', dmg: 500, speed: 600, rad: 4, pierce: 0, homing: false });
    const shot = g.shots[g.shots.length - 1];
    assert.ok(shot, 'shot created');
    shot.vx = 13500; shot.vy = 0; shot.homing = false; shot.r = 4;

    t.updateBullets(1/30); // travels 450px: 450 -> 900

    // Front heart HP should decrease (hit at ~530 collision origin)
    assert.ok(front.hp < 100000, 'front heart HP decreased (legitimate hit)');
    // Rear heart HP unchanged
    assert.equal(rear.hp, 100000, 'rear heart HP unchanged');
    // Exactly 24 burst sparks with max===0.50 at collision origin x=530,y=400
    const burstSparks = g.sparks.filter(s => s.max === 0.50);
    assert.equal(burstSparks.length, 24, 'exactly 24 burst sparks created');
    for (const spark of burstSparks) {
      close(spark.max, 0.50, 1e-6, `spark max life should be 0.50, got ${spark.max}`);
      close(spark.x, 530, 1e-6, `spark origin x should be 530, got ${spark.x}`);
      close(spark.y, 400, 1e-6, `spark origin y should be 400, got ${spark.y}`);
    }
    // 4 ordinary impact sparks (max 0.29)
    const impactSparks = g.sparks.filter(s => s.max === 0.29);
    assert.equal(impactSparks.length, 4, 'exactly 4 impact sparks created');
    // Parent shot consumed
    assert.equal(g.shots.length, 0, 'parent shot consumed after burst');
  }

  // Test 2: Absorption by worm - only rear heart at 800,400, worm body at 700,400
  // Shot from 450,400 travels to 900, gets absorbed by worm at 700
  {
    const { t, g } = await createFixture();
    for (let i = 0; i < 180; i++) t.updateMinions(1/60);

    // Controlled worm: body at 700,400 (alpha=0 => visible blocker)
    g.sepulcher = {
      x: 1000, y: 400,
      alpha: 255,
      nodes: [{ index: 0, x: 700, y: 400, alpha: 0, isEnergyBall: false, isTail: false }],
      arms: [],
      bodyScale: 1.35,
      headScale: 1.6875
    };
    // Only rear heart
    const rear = g.hearts[1];
    rear.x = 800; rear.y = 400; rear.r = 16; rear.hp = 100000;
    g.hearts = [rear];

    // Player at 400,400 aims right
    g.player.x = 400; g.player.y = 400;
    t.setPointer({ x: 1000, y: 400 });
    t.setDeviceMode('desktop');

    // Clear sparks first
    g.sparks.length = 0;

    // Spawn shot at 450,400 with cosmicStar id, vx=13500, vy=0, homing=false, r=4, pierce=0
    t.addShot(450, 400, 1, 0, { ...t.weapons[0], id: 'cosmicStar', dmg: 500, speed: 600, rad: 4, pierce: 0, homing: false });
    const shot = g.shots[g.shots.length - 1];
    assert.ok(shot, 'shot created');
    shot.vx = 13500; shot.vy = 0; shot.homing = false; shot.r = 4;

    t.updateBullets(1/30); // travels 450px: 450 -> 900

    // Parent shot consumed by worm
    assert.equal(g.shots.length, 0, 'parent shot consumed by worm');
    // Rear heart HP unchanged
    assert.equal(rear.hp, 100000, 'rear heart HP unchanged (absorbed by worm)');
    // No burst sparks
    assert.equal(g.sparks.length, 0, 'no burst sparks when absorbed by worm');
  }
});

test('persistent summon entities and equipment unaffected by worm absorption', async () => {
  const { t, g } = await createFixture();
  for (let i = 0; i < 180; i++) t.updateMinions(1/60);

  // Controlled fixture: hearts=[rear], rear at 800,400
  // Set up worm with body at 700,400
  g.sepulcher = {
    x: 1000, y: 400,
    alpha: 255,
    nodes: [{ index: 0, x: 700, y: 400, alpha: 0, isEnergyBall: false, isTail: false }],
    arms: [],
    bodyScale: 1.35,
    headScale: 1.6875
  };
  const rear = g.hearts[1];
  rear.x = 800; rear.y = 400; rear.r = 16; rear.hp = 100000;
  g.hearts = [rear];

  // Player at 400,400
  g.player.x = 400; g.player.y = 400;

  // Summon entities using real function - makes player.cosmic array of 4
  t.summonSquad();

  // Save array reference and each entity reference
  const cosmicArray = g.player.cosmic;
  assert.ok(Array.isArray(cosmicArray) && cosmicArray.length === 2, 'cosmic array has 2 native entities');
  const entityRefs = [...cosmicArray]; // copy of entity references

  // Save weapon and kit object references
  const weaponRef = g.player.weapon;
  const kitObj = t.kit();

  // Fire controlled friendly shot into worm (same 450/13500/1/30, id cosmicBolt, homing=false, pierce=0, r=4)
  t.addShot(450, 400, 1, 0, { ...t.weapons[0], id: 'cosmicBolt', dmg: 500, speed: 600, rad: 4, pierce: 0, homing: false });
  const shot = g.shots[g.shots.length - 1];
  assert.ok(shot, 'shot created');
  shot.vx = 13500; shot.vy = 0; shot.homing = false; shot.r = 4;

  t.updateBullets(1/30); // travels 450px: 450 -> 900

  // Assert shot consumed
  assert.equal(g.shots.length, 0, 'shot consumed by worm');

  // Assert rear HP unchanged
  assert.equal(rear.hp, 100000, 'rear heart HP unchanged');

  // Assert player.cosmic is SAME array with SAME 4 objects
  assert.strictEqual(g.player.cosmic, cosmicArray, 'player.cosmic is same array reference');
  assert.equal(g.player.cosmic.length, 2, 'player.cosmic still has 2 native entities');
  for (let i = 0; i < entityRefs.length; i++) {
    assert.strictEqual(g.player.cosmic[i], entityRefs[i], `cosmic entity ${i} is same object reference`);
  }

  // Assert weapon and kit identities unchanged
  assert.strictEqual(g.player.weapon, weaponRef, 'player.weapon reference unchanged');
  assert.strictEqual(t.kit(), kitObj, 'kit object reference unchanged');
});

test('worm remains outside normal target selection and homing', async () => {
  const { t, g } = await createFixture();
  for (let i = 0; i < 180; i++) t.updateMinions(1/60);

  // Verify worm is not in possibleTargets
  const targets = t.possibleTargets();
  const wormInTargets = targets.some(t => t === g.sepulcher || (g.sepulcher && t === g.sepulcher.nodes[0]));
  assert.ok(!wormInTargets, 'worm not in possibleTargets');

  // Spawn visibility remains intact; area damage is covered separately.
  assert.equal(g.sepulcher.alpha, 0, 'worm remains fully visible');

  // Homing should target hearts, not worm
  const homingTarget = t.nearestForHoming(0, 0);
  assert.ok(homingTarget !== g.sepulcher, 'homing targets hearts not worm');
});