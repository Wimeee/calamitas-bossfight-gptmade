const test=require('node:test'),assert=require('node:assert/strict');
const {loadGame}=require('./helpers/fixture.cjs');
async function spawnRealDart(){
 const {t}=await loadGame();t.start();t.enter('hearts','opening');const g=t.getGame();
 t.updateMinions(0);assert.ok(g.sepulcher);Object.assign(g.sepulcher,{x:g.boss.x,y:g.boss.y,attackCooldown:0});t.updateMinions(1/60);
 const q=g.projectiles.find(x=>x.kind==='sepulcherDart');assert.ok(q,'actual worm attack emits native dart');
 g.projectiles=[q];Object.assign(q,{x:g.player.x,y:g.player.y,vx:60,vy:0});g.player.iframes=0;
 return {t,g,q};
}
test('actual Sepulcher dart survives successful player contact and can hit again after immunity',async()=>{
 const {t,g,q}=await spawnRealDart(),hp=g.player.hp;t.updateBullets(1/60);
 assert.ok(g.player.hp<hp);assert.ok(g.projectiles.includes(q),'native penetrate=-1');
 const after=g.player.hp;t.updateBullets(1/60);assert.equal(g.player.hp,after,'immunity prevents same-frame repeated damage');
 g.player.iframes=0;q.x=g.player.x;q.y=g.player.y;t.updateBullets(1/60);
 assert.ok(g.player.hp<after);assert.ok(g.projectiles.includes(q));
});
test('actual Sepulcher dart successful hit applies native180tick Vulnerability Hex',async()=>{
 const {t,g}=await spawnRealDart();t.updateBullets(1/60);
 assert.equal(g.player.debuffs?.hex?.remaining,3);
});
test('fading Sepulcher dart cannot hurt or apply Hex at30/60/120Hz',async()=>{
 for(const hz of [30,60,120]){
  const {t,g,q}=await spawnRealDart();q.life=.4;const hp=g.player.hp;
  t.updateBullets(2/hz);assert.equal(g.player.hp,hp);assert.equal(g.player.debuffs?.hex,undefined);assert.ok(g.projectiles.includes(q));
 }
});
