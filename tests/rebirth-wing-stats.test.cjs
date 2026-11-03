const test=require('node:test'),assert=require('node:assert/strict');
const {loadGame}=require('./helpers/fixture.cjs');
test('all classes share source-baseline Rebirth flight reserve and airborne motion',async()=>{
 const {t}=await loadGame();
 assert.equal(t.movementConfig.flightTime,6);
 assert.equal(t.movementConfig.airSpeed,11.5*60);
 assert.equal(t.movementConfig.airAcceleration,.08*2.9*60*60);
 t.start();const g=t.getGame();g.ritual=null;g.mode='playing';
 for(let weapon=0;weapon<5;weapon++){
 g.player.weapon=weapon;t.resetMovement(g);assert.equal(g.player.flightRemaining,6);
 Object.assign(g.player,{x:400,y:400,grounded:false,support:null,jumpWasHeld:true,jumpSustain:0,vy:0});
 t.setKeys({jump:true,d:true});t.updatePlayerMovement(g,.1);
 assert.ok(Math.abs(g.player.flightRemaining-5.9)<1e-8);
 assert.ok(Math.abs(g.player.vx-t.movementConfig.airAcceleration*.1)<1e-6);
 assert.ok(g.player.vy<0);
 }
});
test('source ascent uses falling/rising bonuses and caps at source jump baseline',async()=>{
 const {t}=await loadGame();
 assert.equal(t.rebirthWingVelocity(300,1/60),300-(.15+1)*60);
 assert.equal(t.rebirthWingVelocity(-60,1/60),-60-(.15+.17)*60);
 assert.equal(t.rebirthWingVelocity(-600,1/60),-609);
 assert.equal(t.rebirthWingVelocity(-1170,1),-(5.01+1)*3.25*60);
});
