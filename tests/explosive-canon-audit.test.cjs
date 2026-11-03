const test=require('node:test'),assert=require('node:assert/strict');
const {loadGame}=require('./helpers/fixture.cjs');
test('native sphere rings use Expert/Revengeance/Death counts and start upwards at original speeds',async()=>{
 for(const [difficulty,fireCount,gigaCount]of [['normal',12,28],['revenge',14,32],['death',16,36]])for(const [kind,count,speed]of [['fire',fireCount,480],['giga',gigaCount,390]]){
  const {t}=await loadGame();t.start();t.enter('normal','opening');const g=t.getGame();g.difficulty=difficulty;g.player.iframes=999;
  const q=t.enemyBullet(900,300,0,0,0,18,kind,54);Object.assign(q,{sourceCalamitas:true,detonating:true,nativeLife:1,opacity:0});
  t.updateBullets(1/60);const ring=g.projectiles.filter(p=>p.kind==='dart');
  assert.equal(ring.length,count,`${difficulty} ${kind}`);
  assert.ok(Math.abs(ring[0].vx)<1e-8);assert.equal(ring[0].vy,-speed);
  for(let i=0;i<count;i++){const p=ring[i],angle=-Math.PI/2+Math.PI*2*i/count;assert.ok(Math.abs(p.vx-Math.cos(angle)*speed)<1e-8);assert.ok(Math.abs(p.vy-Math.sin(angle)*speed)<1e-8);assert.equal(p.ai2,speed*1.5);}
 }
});
