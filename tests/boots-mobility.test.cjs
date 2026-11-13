const test=require('node:test'),assert=require('node:assert/strict');
const {loadGame}=require('./helpers/fixture.cjs');
test('all classes run on platforms with boots-only Seraph Tracers and retain Rebirth flight',async()=>{
 const {t}=await loadGame();const positions=[];
 assert.equal(t.movementConfig.runSpeed,9*(1+.18*.16)*60);
 assert.equal(t.movementConfig.flightTime,396/60);
 for(const rate of [30,60,120,180])for(let weapon=0;weapon<5;weapon++){
  t.start();const g=t.getGame();g.player.weapon=weapon;t.spawnNearAltar(g,400);
  const p=g.player,y=p.y;t.setKeys({d:true});
  for(let i=0;i<rate;i++)t.updatePlayerMovement(g,1/rate);
  assert.equal(p.y,y);assert.equal(p.grounded,true);assert.ok(p.x-400>460);
  assert.equal(p.vx,t.movementConfig.runSpeed);positions.push(p.x);
  t.setKeys({});for(let i=0;i<rate/2;i++)t.updatePlayerMovement(g,1/rate);
  assert.equal(p.vx,0);assert.equal(p.flightRemaining,396/60);
 }
 assert.ok(Math.max(...positions)-Math.min(...positions)<2,'platform speed is refresh-rate independent');
});
