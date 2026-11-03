const test=require('node:test'),assert=require('node:assert/strict');
const {loadGame}=require('./helpers/fixture.cjs');

test('player-follow camera and desktop/mobile aim share world coordinates',async()=>{
 const {t,el}=await loadGame();
 for(const diff of ['normal','revenge','death']){
  el('diff').value=diff;t.start();const g=t.getGame(),size=diff==='death'?2000:2500;
  assert.equal(t.arena.r-t.arena.l,size);assert.equal(t.arena.b-t.arena.t,size);
  assert.ok(t.getTerrain().platforms.length>=7);
  const before=g.camera.y;g.player.y+=200;t.updateCamera(g,.5);
  assert.ok(g.camera.y>before+150,'vertical camera follows the player');
  const view=t.cameraView(g);assert.equal(view.zoom,t.ZOOM_DEFAULT,'arena dimensions must not shrink the player');g.player.x+=200;t.updateCamera(g,0,true);assert.equal(g.camera.x,g.player.x);assert.equal(g.camera.y,g.player.y);
  const center=t.screenToWorld(t.W/2,t.H/2);assert.equal(center.x,g.camera.x);assert.equal(center.y,g.camera.y);
  t.eventPos({clientX:500,clientY:300});assert.ok(Math.abs(t.state.pointer.x-g.camera.x)<1e-8);
  t.aimCanvas({clientX:500,clientY:300});assert.ok(Math.abs(t.state.pointer.x-g.camera.x)<1e-8);
  const aimBefore=t.state.pointer.y;g.player.y+=100;t.updateCamera(g,.5);
  assert.ok(t.state.pointer.y>aimBefore+40,'stationary mouse follows vertical scrolling');
  g.stageT=1;g.hellSegment=-1;t.bulletHell(.01);
  for(const q of t.hellPlan(g,5).slots)assert.ok(Number.isFinite(q.x)&&Number.isFinite(q.y));
 }
});

test('Rage uses the source proximity curve, manual activation, damage and nine-second duration',async()=>{
  const {t,el}=await loadGame();el('diff').value='revenge';t.start();const g=t.getGame(),r=g.rippers;
  assert.equal(t.proximityRage(160),1);assert.equal(t.proximityRage(801),0);assert.ok(t.proximityRage(500)>0&&t.proximityRage(500)<1);
  Object.assign(g.boss,{x:g.player.x+100,y:g.player.y});t.updateRippers(15,g);assert.equal(r.rage,1);
  assert.equal(t.activateRipper('rage'),true);assert.equal(t.activateRipper('rage'),false);
  g.player.weapon=1;const target={hp:1000};t.hitTarget(target,100,0,0,'#fff','ranger',false);assert.equal(target.hp,865);
  t.updateRippers(9,g);assert.equal(r.rageTime,0);assert.equal(r.rage,0);
  g.boss.x=g.player.x+1500;r.rage=1;r.combat=10;t.updateRippers(10,g);t.updateRippers(15,g);assert.ok(Math.abs(r.rage-.5)<1e-9);
});
test('Adrenaline fills in 30s; real hits, full-meter DR, i-frames and active use follow Calamity rules',async()=>{
  const {t,el}=await loadGame();el('diff').value='death';t.start();const g=t.getGame(),p=g.player,r=g.rippers;
  t.updateRippers(30,g);assert.equal(r.adrenaline,1);p.iframes=0;const hp=p.hp;t.hurt(100/g.scale);
  assert.equal(hp-p.hp,50);assert.equal(r.adrenaline,0);assert.equal(r.pause,1);
  r.adrenaline=.8;p.iframes=1;t.hurt(100);assert.equal(r.adrenaline,.8,'invulnerability is not an accepted hit');
  p.iframes=0;t.hurt(1/g.scale);assert.ok(r.adrenaline>0&&r.adrenaline<.6,'tiny hit loses a proportional part, minimum 25%');
  const partial=r.adrenaline;t.updateRippers(.5,g);assert.equal(r.adrenaline,partial);
  p.iframes=0;t.hurt(40/g.scale);assert.equal(r.adrenaline,0,'at least 5% max HP loses all unspent adrenaline');
  r.adrenaline=1;r.pause=0;assert.equal(t.activateRipper('adrenaline'),true);
  p.iframes=0;t.hurt(10);assert.equal(r.adrenalineTime,5,'active adrenaline is not cancelled by a hit');
  assert.equal(t.ripperDamage(g),2.5);t.updateRippers(5,g);assert.equal(t.ripperDamage(g),1);
});
test('rippers respect Expert, ritual, pause, acceptance, death, restart and keyboard/mobile activation',async()=>{
  const {t,el}=await loadGame();el('diff').value='normal';t.start();assert.equal(t.getGame().rippers.enabled,false);assert.equal(t.activateRipper('rage'),false);
  el('diff').value='revenge';t.start({ritual:true});let g=t.getGame();t.updateRippers(60,g);assert.equal(g.rippers.adrenaline,0);
  t.start();g=t.getGame();g.rippers.rage=1;g.mode='paused';t.updateRippers(30,g);assert.equal(g.rippers.adrenaline,0);assert.equal(t.activateRipper('rage'),false);
  g.mode='playing';t.kd({code:'KeyC',target:{tagName:'CANVAS'},preventDefault(){}});assert.equal(g.rippers.rageTime,9);
  g.rippers.adrenaline=1;t.takeAction('adrenaline');assert.equal(g.rippers.adrenalineTime,5);
  g.mode='dead';assert.equal(t.activateRipper('adrenaline'),false);
  t.start();g=t.getGame();assert.equal(g.rippers.rage,0);assert.equal(g.rippers.adrenaline,0);
  g.rippers.rage=1;g.stage='accept';t.updateRippers(.1,g);assert.equal(g.rippers.rage,0);
  const migrated=t.cleanSettings({bindings:{dash:'KeyC',heal:'KeyV'}});
  assert.notEqual(migrated.bindings.rage,'KeyC');assert.notEqual(migrated.bindings.adrenaline,'KeyV');
  assert.equal(new Set(Object.values(migrated.bindings)).size,Object.keys(migrated.bindings).length);
  assert.equal(t.bindKey('rage','KeyF'),true);assert.equal(t.gameKey({code:'KeyF'}),'rage');
});
