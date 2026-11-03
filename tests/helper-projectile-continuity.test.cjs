const test=require('node:test'),assert=require('node:assert/strict');
const {loadGame}=require('./helpers/fixture.cjs');
test('destroying last hearts, brothers or Seekers preserves unrelated bullets and their natural lifetime',async()=>{
 for(const stage of ['hearts','brothers','seekers'])for(const hz of [30,60,120]){
  const {t}=await loadGame();t.start();t.enter(stage,stage==='hearts'?'opening':stage==='brothers'?'bros':'seek');const g=t.getGame();g.player.iframes=999;
  const q=t.enemyBullet(g.player.x+100,g.player.y,1,0,60,8.5,'sepulcherDart',29);
  Object.assign(q,{ai0:0,ai1:3,ai2:900,opacity:1,scale:.85,life:2});
  const list=stage==='hearts'?g.hearts:stage==='brothers'?g.brothers:g.seekers;list.forEach(x=>x.hp=0);
  t.updateBullets(0);assert.equal(g.stage,'normal');assert.ok(g.projectiles.includes(q),`${stage} ${hz}Hz retained`);assert.equal(q.life,2);
  t.updateBullets(2/hz);assert.ok(g.projectiles.includes(q));assert.ok(q.x>g.player.x+100);assert.ok(q.life>1);
  t.updateBullets(2.1);assert.ok(!g.projectiles.includes(q),'expires naturally');
 }
});
test('last Seeker death does not erase a scheduled sphere explosion',async()=>{
 const {t}=await loadGame();t.start();t.enter('seekers','seek');const g=t.getGame();g.player.iframes=999;
 const q=t.enemyBullet(g.player.x+200,g.player.y,0,0,0,18,'fire',54);Object.assign(q,{sourceCalamitas:true,detonating:true,nativeLife:30,opacity:0});
 g.seekers.forEach(x=>x.hp=0);t.updateBullets(0);assert.equal(g.stage,'normal');assert.ok(g.projectiles.includes(q));
 for(let i=0;i<30;i++)t.updateBullets(1/60);
 assert.ok(!g.projectiles.includes(q));assert.equal(g.projectiles.filter(x=>x.kind==='dart').length,12);
});

test('last brother death retires owned fists/slashes without erasing an unrelated pending explosion',async()=>{
 const {t}=await loadGame();t.start();t.enter('brothers','bros');const g=t.getGame();g.player.iframes=999;
 const fist=t.spawnBrotherProjectile(g,'fist',g.player.x+500,g.player.y,1,0,2),slash=t.spawnBrotherProjectile(g,'slash',g.player.x+500,g.player.y,1,0,2);
 const q=t.enemyBullet(g.player.x+200,g.player.y,0,0,0,18,'fire',54);Object.assign(q,{sourceCalamitas:true,detonating:true,nativeLife:30,opacity:0});
 g.brothers.forEach(b=>b.hp=0);t.updateBullets(0);assert.equal(g.stage,'normal');assert.ok(g.projectiles.includes(q));
 t.updateBullets(1/60);assert.ok(!g.projectiles.includes(fist)&&!g.projectiles.includes(slash),'native owner-death rules still retire owned attacks');
 for(let i=1;i<30;i++)t.updateBullets(1/60);assert.ok(!g.projectiles.includes(q));assert.equal(g.projectiles.filter(x=>x.kind==='dart').length,12,'unrelated source fireblast finishes its scheduled burst');
});
