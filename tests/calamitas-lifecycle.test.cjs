const test=require('node:test'),assert=require('node:assert/strict');
const {loadGame}=require('./helpers/fixture.cjs');
async function setup(n=1){const {t}=await loadGame();t.start();const g=t.getGame();g.phaseN=n;g.projectiles=[];g.stageT=0;return {t,g};}
function bh(t,g,seconds,hz=60){for(let i=0;i<Math.round(seconds*hz);i++){g.t+=1/hz;g.stageT+=1/hz;t.bulletHell(1/hz);}}
test('BH1 opens with only top shots at native gate/speed and adds the guaranteed side shot every sixth gate',async()=>{
 for(const hz of [30,60,120]){
  const {t,g}=await setup();bh(t,g,1,hz);
  assert.equal(g.projectiles.length,7);assert.equal(g.projectiles.filter(q=>q.vy===240).length,6);
  const side=g.projectiles.filter(q=>q.vy===0);assert.equal(side.length,1);assert.equal(Math.abs(side[0].vx),240);
 }
});
test('BH5 wave emits a mirrored pair every half second and never creates a second Maelstrom',async()=>{
 const {t,g}=await setup(5);bh(t,g,1);const waves=g.projectiles.filter(q=>q.kind==='skull');
 assert.equal(waves.length,4);assert.deepEqual(waves.map(q=>q.vx),[-300,300,-300,300]);
 bh(t,g,6);assert.equal(g.maelstrom,null);assert.equal(g.projectiles.filter(q=>q.kind==='maelstrom').length,0);
});
test('BH4 creates the real moving Maelstrom only after seven seconds',async()=>{
 const {t,g}=await setup(4);bh(t,g,6);assert.equal(g.maelstrom,null);bh(t,g,1);assert.ok(g.maelstrom);
 assert.equal(g.projectiles.filter(q=>q.kind==='maelstrom').length,0,'no inert duplicate projectile');
 const m=g.maelstrom;g.player.x=m.x+500;g.player.y=m.y;t.updateMaelstrom(2);assert.equal(m.vx,0,'native growth/wait remains harmless and stationary');t.updateMaelstrom(3);assert.notEqual(m.vx,0);
});
test('worm and brothers spawn casts complete once and cannot be skipped by empty entity arrays',async()=>{
 for(const [n,stage,delay]of [[1,'hearts',1.25],[3,'brothers',2.5],[5,'hearts',1.25]]){
  const {t,g}=await setup(n);g.stageT=15;t.bulletHell(0);
  assert.ok(g.castDelayState);assert.equal(g.castDelayState.remaining,delay);
  t.updateBullets(0);assert.ok(g.castDelayState);assert.equal(g.stage,stage);
  t.getEncounter().update(delay-1/60);assert.ok(g.castDelayState);
  t.getEncounter().update(1/60+1e-8);assert.equal(g.castDelayState,null);assert.equal(g.stage,stage);
  assert.equal(stage==='hearts'?g.hearts.length:g.brothers.length,stage==='hearts'?10:2);
 }
});
test('cast drift agrees across FPS and a phase-II transition cannot fire or contact',async()=>{
 const positions=[];
 for(const hz of [30,60,120]){const {t,g}=await setup();Object.assign(g.boss,{vx:600,vy:-300});
  t.startCastDelay(g,'hearts','opening','WORM',1.25,'sepulcher');
  for(let i=0;i<hz;i++)t.updateCastDelay(1/hz,g);positions.push(g.boss.x);
 }
 assert.ok(positions[0]>600,'cast velocity must move the boss, not just decay invisibly');
 assert.ok(Math.max(...positions)-Math.min(...positions)<1e-8);
 const {t,g}=await setup();t.enter('normal','h40','PHASE II');g.phase2Intro=200/60;g.thresholds.add('40');
 for(let i=0;i<199;i++)t.bossAttack(1/60);assert.equal(g.projectiles.length,0);assert.equal(g.boss.contactDamage,0);
});
test('source explosive shots slow before burst, use native fan speeds/counts and respect fade opacity',async()=>{
 const {t,g}=await setup();t.enter('normal','opening','BLAST');g.projectiles=[];g.player.iframes=999;
 const q=t.enemyBullet(g.player.x+200,g.player.y,0,0,0,18,'fire',54);q.sourceCalamitas=true;
 for(let i=0;i<25;i++)t.updateBullets(1/60);
 assert.ok(q.detonating,'after 20-tick fade-in proximity triggers the one-second windup');
 for(let i=0;i<70&&g.projectiles.includes(q);i++)t.updateBullets(1/60);
 const darts=g.projectiles.filter(s=>s.kind==='dart');assert.equal(darts.length,12);
 assert.ok(darts.every(s=>s.ai1===2&&Math.hypot(s.vx,s.vy)>=480-1e-8&&s.ai2===720));
});
