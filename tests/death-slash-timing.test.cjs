const test=require('node:test'),assert=require('node:assert/strict');
const {loadGame}=require('./helpers/fixture.cjs');

test('native heavy slash starts with delayed variant4 and all emitted trails share their explosion tick',async()=>{
 for(const [diff,fuse]of [['revenge',45],['death',35]]){
  const {t,el}=await loadGame();el('diff').value=diff;t.start();t.enter('brothers','bros');const g=t.getGame();
  const parent=t.spawnBrotherProjectile(g,'slash',g.player.x+700,g.player.y,90,0,50,5,120);
  const trails=[];
  for(let tick=1;tick<=30;tick++){
   t.updateBrotherProjectile(parent,g,1/60);
   const q=g.projectiles.at(-1);assert.notEqual(q,parent);
   assert.equal(q.variant,3+tick,'Time increments before emitting in the native AI');
   t.updateBrotherProjectile(q,g,1/60);
   assert.equal(q.canHit,false,'new trails are harmless before their scheduled burst');
   trails.push({q,born:tick});
  }
  assert.equal(trails.length,30);
  // First update already consumed one life tick. All fuse endpoints align.
  for(const {q,born}of trails)assert.equal(born+q.nativeLife,fuse);
 }
});

test('accelerating slash starts its native speed increase on update31',async()=>{
 const {t}=await loadGame();t.start();t.enter('brothers','bros');const g=t.getGame();
 const q=t.spawnBrotherProjectile(g,'slash',g.player.x+800,g.player.y,1,0,3);
 q.nativeTime=30;const initial=q.vx;t.updateBrotherProjectile(q,g,1/60);
 assert.ok(Math.abs(q.vx-initial*1.015**6)<1e-8,'six native updates31through36 accelerate');
});

test('the natural Death brother sequence emits heavy slashes while Revengeance does not',async()=>{
 const counts=[];
 for(const difficulty of ['revenge','death']){
  const {t,el}=await loadGame();el('diff').value=difficulty;t.start();t.enter('brothers','bros');const g=t.getGame();
  for(let tick=0;tick<1200;tick++)t.updateBrothers(1/60,g);
  counts.push(g.projectiles.filter(q=>q.kind==='slash'&&q.variant===50).length);
 }
 assert.equal(counts[0],0);assert.ok(counts[1]>0);
});

test('Death resurrection and65percent cap occur through native AI without test-injected flags',async()=>{
 const {t,el}=await loadGame();el('diff').value='death';t.start();t.enter('brothers','bros');const g=t.getGame();
 t.updateBrothers(1/60,g);g.brothers[0].hp=0;t.updateBullets(0);
 const survivor=g.brothers[0];
 for(let tick=0;tick<800&&survivor.nativeAI.broAlive;tick++)t.updateBrothers(1/60,g);
 assert.equal(survivor.nativeAI.broAlive,false);survivor.hp=0;t.updateBullets(0);
 assert.equal(g.brothers.length,1);assert.equal(g.brothers[0].kind,1-survivor.kind);
 const returned=g.brothers[0];
 for(let tick=0;tick<800&&returned.hp>returned.max*.65;tick++)t.updateBrothers(1/60,g);
 assert.equal(returned.hp,returned.max*.65);assert.equal(g.brotherRespawnAvailable,false);
});
