const test=require('node:test'),assert=require('node:assert/strict');
const {loadGame}=require('./helpers/fixture.cjs');
async function setup(){const {t}=await loadGame();t.start();t.enter('normal','opening','BOUNDARY');const g=t.getGame();g.player.iframes=999;return {t,g};}
test('player projectiles can damage Calamitas when she flies outside the arena boundary',async()=>{
 const {t,g}=await setup();Object.assign(g.boss,{x:t.arena.l-100,y:300});Object.assign(g.player,{x:t.arena.l+25,y:300});
 const hp=g.boss.hp;t.addShot(t.arena.l-10,300,-1,0,{...t.weapons[0],id:'boundary-test',dmg:500,speed:600,rad:4,pierce:0,homing:false});
 t.updateBullets(.2);assert.ok(g.boss.hp<hp,'arena decoration must not delete the shot before the boss hit');
});
test('a beam can reach an off-arena Calamitas while its normal arena endpoint remains bounded',async()=>{
 const {t,g}=await setup();Object.assign(g.boss,{x:t.arena.l-100,y:300});Object.assign(g.player,{x:t.arena.l+25,y:300});
 const ray=t.traceWeaponBeam(g.player.x,300,Math.PI,4);assert.ok(ray.hit);assert.ok(ray.ex<t.arena.l);
 g.boss.x=500;const empty=t.traceWeaponBeam(g.player.x,300,Math.PI,4);assert.equal(empty.hit,null);assert.ok(Math.abs(empty.ex-t.arena.l)<1e-8);
});
test('native skull travel and animation agree exactly at 30/60/120 FPS',async()=>{
 const samples=[];
 for(const hz of [30,60,120]){
  const {t,g}=await setup();g.player.y=1200;
  const q=t.enemyBullet(500,300,1,0,600,20,'hellblast',36);Object.assign(q,{sourceCalamitas:true,life:4.25,maxSpeed:1080,accelMult:1.03,fadeStart:3.4});
  for(let i=0;i<hz;i++)t.updateBullets(1/hz);samples.push({x:q.x,frame:q.frame});
 }
 assert.ok(Math.max(...samples.map(q=>q.x))-Math.min(...samples.map(q=>q.x))<1e-8);assert.ok(samples.every(q=>q.frame===2));
});
