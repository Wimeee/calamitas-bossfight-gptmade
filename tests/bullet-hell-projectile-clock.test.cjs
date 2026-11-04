const test=require('node:test'),assert=require('node:assert/strict'),{loadGame}=require('./helpers/fixture.cjs');
async function setup(){const a=await loadGame();a.t.start();const g=a.t.getGame();g.player.iframes=999;g.phaseN=1;g.stageT=0;g.projectiles=[];return {...a,g};}
test('native BH emitter converts4px per subupdate to480px/s,40px hitbox and12.5sec lifetime',async()=>{
 const {t,g}=await setup();t.bulletHell(9/60);const q=g.projectiles.find(q=>q.kind==='hellblast2');assert.ok(q);assert.equal(Math.hypot(q.vx,q.vy),480);assert.equal(q.r,20);assert.equal(q.life,12.5);
});
test('native extraUpdates1 advances120times/sec, including animation, fade and lifetime at30/60/120FPS',async()=>{
 for(const hz of [30,60,120]){const {t,g}=await setup(),x=(t.arena.l+t.arena.r)/2,y=(t.arena.t+t.arena.b)/2,q=t.enemyBullet(x,y,1,0,480,20,'hellblast2',35);Object.assign(q,{sourceCalamitas:true,life:12.5,opacity:0});for(let i=0;i<hz/2;i++)t.updateBullets(1/hz);
 assert.equal(q.sourceTicks,60);assert.ok(Math.abs(q.x-x-240)<1e-7);assert.ok(Math.abs(q.life-12)<1e-7);assert.equal(q.frame,2);assert.ok(!q.nativeTrail?.length,'sourceBH projectile has no invented afterimages');assert.ok(Math.abs(q.opacity-59/60)<1e-7);t.updateBullets(1/120);assert.equal(q.opacity,1);
 }
});
test('full-size BH hitbox damages near the visible edge; retirement retains only60native updates',async()=>{
 const {t,g}=await setup();t.bulletHell(9/60);const q=g.projectiles[0],p=g.player;Object.assign(q,{x:p.x+25,y:p.y,vx:0,vy:0,sourceTicks:70,life:10,opacity:1});p.iframes=0;const hp=p.hp;t.updateBullets(1/120);assert.ok(p.hp<hp,'visible outer portion must hit');
 p.iframes=999;t.retireBulletHellProjectiles(g);assert.equal(q.life,.5);t.updateBullets(.25);assert.ok(q.opacity>0&&q.opacity<1);t.updateBullets(.3);assert.ok(!g.projectiles.includes(q));
});
