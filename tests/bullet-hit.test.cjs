const test=require('node:test'),assert=require('node:assert/strict');
const {loadGame}=require('./helpers/fixture.cjs');
async function setup(){const {t}=await loadGame();t.start();const g=t.getGame();g.player.hp=g.player.maxHp=1000;g.player.iframes=0;return {t,g};}
test('long-lived Bullet Hell shots still damage after 3.4s without invalid opacity',async()=>{
 const {t,g}=await setup();const p=g.player,q=t.enemyBullet(p.x,p.y,0,0,0,6.3,'hellblast',35);
 Object.assign(q,{straight:true,t:4,life:16});t.updateBullets(1/60);
 assert.ok(p.hp<1000);assert.ok(!g.projectiles.includes(q));assert.ok(Number.isFinite(q.opacity));
});
test('normal and long-lived hellblasts fade at their own lifetime and stop damaging during fade',async()=>{
 for(const straight of [false,true]){
  const {t,g}=await setup();const p=g.player,q=t.enemyBullet(p.x,p.y,0,0,0,6.3,'hellblast',35);
  Object.assign(q,{straight,t:straight?19.5:3.6,life:straight?.5:.65});
  t.updateBullets(1/60);assert.equal(p.hp,1000);assert.ok(q.opacity>0&&q.opacity<1);
 }
});
test('fast projectiles crossing the player between frames hit, while near misses and i-frames remain safe',async()=>{
 for(const hz of [30,60,120]){
  const {t,g}=await setup();const p=g.player;
  const q=t.enemyBullet(p.x-18,p.y,1,0,1080,6.3,'hellblast',35);q.straight=true;q.life=20;
  for(let i=0;i<Math.ceil(hz/30);i++)t.updateBullets(1/hz);
  assert.ok(p.hp<1000,`crossing must hit at ${hz}FPS`);
 }
 for(const immune of [false,true]){
  const {t,g}=await setup();const p=g.player;if(immune)p.iframes=.5;
  const q=t.enemyBullet(p.x-18,p.y+(immune?0:30),1,0,1080,6.3,'hellblast',35);q.straight=true;q.life=20;
  t.updateBullets(1/30);assert.equal(p.hp,1000);
 }
});
