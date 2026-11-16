const test=require('node:test'),assert=require('node:assert/strict');
const {loadGame}=require('./helpers/fixture.cjs');
test('platform starts, reversals and release react promptly without increasing top speed',async()=>{
 const {t}=await loadGame();
 for(const hz of [30,60,120,180])for(const sign of [-1,1]){
  t.start();const g=t.getGame(),p=g.player;t.spawnNearAltar(g,900);
  const step=1/hz,advance=seconds=>{for(let i=0;i<Math.round(seconds*hz);i++)t.updatePlayerMovement(g,step);};
  t.setKeys(sign>0?{d:true}:{a:true});advance(.1);
  assert.ok(Math.abs(p.vx)>=500,`start at${hz}Hz: ${p.vx}`);
  advance(.3);assert.ok(Math.abs(Math.abs(p.vx)-555.552)<1e-6);assert.equal(p.grounded,true);
  t.setKeys(sign>0?{a:true}:{d:true});advance(2/30);
  assert.ok(p.vx*sign<0,`reverse at${hz}Hz: ${p.vx}`);
  advance(.3);t.setKeys({});advance(2/30);
  assert.equal(p.vx,0,`stop at${hz}Hz`);assert.equal(p.grounded,true);
  assert.equal(p.flightRemaining,6.6);
 }
});
