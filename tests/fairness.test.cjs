const test=require('node:test'),assert=require('node:assert/strict');
const {loadGame}=require('./helpers/fixture.cjs');
test('five canonical edge direction sequences are sparse, preview-stable and contain no snipers',async()=>{
  const {t,el}=await loadGame();
  for(const difficulty of ['normal','revenge','death'])for(let phase=1;phase<=5;phase++){
    el('diff').value=difficulty;t.start();const g=t.getGame();g.phaseN=phase;
    for(let segment=0;segment<3;segment++){
      g.stageT=segment*5+1;
      const a=t.hellPlan(g,8),b=t.hellPlan(g,8);
      assert.equal(JSON.stringify(a),JSON.stringify(b));assert.ok(a.slots.length<=3);
      assert.equal(a.slots.length,t.hellDirections[phase-1][segment].length);
      g.hellTimer=0;t.bulletHell(.01);
      assert.equal(g.huntWarning,null);
    }
    assert.ok(g.projectiles.filter(q=>q.kind==='hellblast').every(q=>q.straight&&q.spawnDelay>0));
    t.getEncounter().updateHazards(.1);assert.equal(g.patternWarnings.length,0);
  }
});
test('fire and gigablast stop before even radial explosions, with original difficulty counts',async()=>{
 const {t,el}=await loadGame();
 for(const difficulty of ['normal','revenge','death'])for(const kind of ['fire','giga']){
  el('diff').value=difficulty;t.start();const g=t.getGame();g.projectiles=[];
  const q=t.enemyBullet(500,300,1,0,100,10,kind,30);q.t=4;g.player.x=800;g.player.y=500;
  t.updateBullets(.01);assert.equal(q.detonating,true);assert.equal(q.vx,0);assert.equal(q.vy,0);
  t.updateBullets(.3);assert.equal(g.projectiles.length,1);
  t.updateBullets(.36);
  const counts=kind==='fire'?[12,14,16]:[28,32,36];
  assert.equal(g.projectiles.length,counts[['normal','revenge','death'].indexOf(difficulty)]);
  assert.ok(g.projectiles.every(q=>q.kind==='dart'&&q.acceleration>0));
 }
});
test('dart arc spacing, dash target lock, phase II after brothers, altar and letterbox aim',async()=>{
 const {t,el}=await loadGame();t.start();t.enter('normal','opening','TEST');const g=t.getGame();
 g.attackIndex=0;g.attackTimer=0;t.bossAttack(182/60);
 const darts=g.projectiles.filter(q=>q.kind==='dart');assert.equal(darts.length,8);
 const angles=darts.map(q=>Math.atan2(q.vy,q.vx));
 for(let i=1;i<angles.length;i++)assert.ok(Math.abs(angles[i]-angles[i-1]-(40*Math.PI/180)/7)<1e-9);
 g.attackIndex=3;g.attackTimer=0;t.bossAttack(1/60);const target={...g.dashVector};g.player.x+=150;t.bossAttack(.8);
 assert.equal(g.dashVector.x,target.x);assert.equal(g.dashVector.y,target.y);
 t.enter('brothers','bros','TEST');g.brothers.forEach(b=>b.hp=0);t.updateBullets(0);
 assert.equal(g.stage,'normal');assert.ok(g.thresholds.has('40'));assert.equal(g.phase2Intro,200/60);
 const terrain=t.getTerrain();assert.equal(terrain.altar.x,500);assert.equal(terrain.altar.y,terrain.platforms[1].y);
 const point=t.canvasPointToWorld(200,100,{left:0,top:0,width:1200,height:600},true);
 const zoom=0.765*.85;
 assert.ok(Math.abs(point.x-(g.camera.x-480/zoom))<1e-9);assert.ok(Math.abs(point.y-(g.camera.y-240/zoom))<1e-9);
 assert.ok(el('scal-game').classList.contains('focus-mode'),'battle starts in full-window mode');await t.toggleFullscreen();assert.equal(el('scal-game').classList.contains('focus-mode'),false);await t.toggleFullscreen();assert.ok(el('scal-game').classList.contains('focus-mode'));
});
