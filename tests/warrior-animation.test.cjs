const test=require('node:test');
const assert=require('node:assert/strict');
const {loadGame}=require('./helpers/fixture.cjs');

test('body clips start on entry and use frames per second rather than cycles per second',async()=>{
  const {t}=await loadGame();t.start();const g=t.getGame();g.t=100;
  t.setKeys({d:true});assert.equal(t.warriorPose(g).index,0);
  g.t=100.09;assert.equal(t.warriorPose(g).index,0);
  g.t=100.11;assert.equal(t.warriorPose(g).index,1);
  g.t=100.21;assert.equal(t.warriorPose(g).index,2);
  t.setKeys({});assert.equal(t.warriorPose(g).index,0);
  g.t=100.42;const pose=t.warriorPose(g);assert.equal(pose.index,1);
  g.mode='paused';g.t+=1;assert.deepEqual(t.warriorPose(g),pose);
});

test('facing is stable near vertical aim and dash frames do not cycle',async()=>{
  const {t}=await loadGame();t.start();const g=t.getGame(),p=g.player;
  t.setPointer({x:p.x+40});assert.equal(t.warriorPose(g).flip,false);
  t.setPointer({x:p.x-4});assert.equal(t.warriorPose(g).flip,false);
  t.setPointer({x:p.x-20});assert.equal(t.warriorPose(g).flip,true);
  t.setPointer({x:p.x+4});assert.equal(t.warriorPose(g).flip,true);
  p.dashX=1;p.dashT=.19;assert.equal(t.warriorPose(g).index,0);
  p.dashT=.15;assert.equal(t.warriorPose(g).index,1);
  p.dashT=.01;assert.equal(t.warriorPose(g).index,5);
});

test('registered visor landmarks stay steady across idle and run silhouettes',async()=>{
  const {t}=await loadGame();
  const landmarks={idle:[[71.6,50.1],[70.4,49.1],[71.7,48.6],[73.8,50.6]],run:[[114.5,44.1],[114.1,44.4],[106.8,41.9],[110.1,43.2],[104.7,40.9],[112.6,38.7]]};
  for(const [name,points]of Object.entries(landmarks))for(let i=0;i<points.length;i++){
    const frame=t.meleeSpriteConfig.body[name][i],x=(points[i][0]-frame.ax)*.38,y=(points[i][1]-frame.ay)*.38;
    assert.ok(Math.abs(x-6.84)<.5);assert.ok(Math.abs(y+9.5)<.5);
  }
});

test('new in-between effect poses include endpoints and a seamless spin wrap',async()=>{
  const {t}=await loadGame();
  const parry=t.transitionSamples(4),spin=t.transitionSamples(6,3,true);
  assert.equal(parry.length,10);assert.equal(parry[0].a,0);assert.equal(parry.at(-1).a,3);
  assert.equal(spin.length,18);assert.equal(spin.at(-1).b,0);
});

test('weapon wind-up/recovery is continuous and survives the ritual clock reset',async()=>{
  const {t}=await loadGame();t.start();const g=t.getGame();
  t.warriorWeaponPose(g,0,null,.42);g.t=.1;
  const attack={max:.25};const start=t.warriorWeaponPose(g,1.2,attack,.7);
  assert.equal(start.angle,0);assert.equal(start.scale,.42);
  g.t=.16;assert.equal(t.warriorWeaponPose(g,1.2,attack,.7).angle,1.2);
  g.t=.18;assert.equal(t.warriorWeaponPose(g,0,null,.42).angle,1.2);
  g.t=.28;assert.equal(t.warriorWeaponPose(g,0,null,.42).angle,0);
  g.ritual={ambient:12};t.warriorWeaponPose(g,.4,null,.42);delete g.ritual;g.t=0;
  assert.equal(t.warriorWeaponPose(g,.7,null,.42).angle,.4);
  g.t=.1;assert.equal(t.warriorWeaponPose(g,.7,null,.42).angle,.7);
});
