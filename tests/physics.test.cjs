const test=require('node:test');
const assert=require('node:assert/strict');
const {loadGame}=require('./helpers/fixture.cjs');
const advance=(t,g,seconds,rate=120)=>{for(let i=0;i<Math.round(seconds*rate);i++){g.t+=1/rate;t.updatePlayerMovement(g,1/rate);}};

test('ground, variable jump, one-way platforms and drop-through',async()=>{
  const {t}=await loadGame();t.start();let g=t.getGame(),p=g.player;
  const terrain=t.getTerrain(),floor=p.y;advance(t,g,.2);assert.equal(p.y,floor);assert.equal(p.grounded,true);
  t.setKeys({jump:true});t.queueJump();advance(t,g,.1);assert.ok(p.y<floor-40);assert.ok(p.vy<0);
  t.setKeys({});advance(t,g,.025);assert.ok(p.vy> -400,'release shortens the initial jump');
  t.start();g=t.getGame();p=g.player;const platform=t.getTerrain().platforms[0];
  Object.assign(p,{x:500,y:platform.y+35,vy:-500,grounded:false,jumpGrace:0});
  advance(t,g,.35);assert.ok(p.y+18<platform.y,'ascending player passes through underside');
  advance(t,g,.3);assert.equal(p.support,'lower');assert.equal(p.y,platform.y-18);
  t.setKeys({s:true,jump:true});t.queueJump();advance(t,g,.1);
  assert.ok(p.y+18>platform.y+4);assert.ok(p.vy>0);assert.notEqual(p.support,'lower');
  const upper=terrain.platforms.at(-1);Object.assign(p,{x:500,y:upper.y-18,vy:0,grounded:true,support:upper.id,jumpWasHeld:false});
  t.queueJump();advance(t,g,.65);assert.equal(p.support,'ground','held down+jump passes all platform rows');
});

test('wings are finite, refill only on landing, fast fall is faster and pause freezes movement',async()=>{
  const {t}=await loadGame();t.start();const g=t.getGame(),p=g.player;
  Object.assign(p,{x:t.arena.l+25,y:t.arena.t+40,grounded:false,jumpGrace:0});
  t.setKeys({jump:true});advance(t,g,.5);assert.ok(p.flightRemaining<2&&p.flightRemaining>1.8);assert.equal(p.flying,true);
  advance(t,g,1.95);assert.equal(p.flightRemaining,0);assert.equal(p.grounded,false);
  t.setKeys({});advance(t,g,2);assert.equal(p.grounded,true);assert.equal(p.flightRemaining,2.4);
  Object.assign(p,{y:t.arena.t+90,vy:0,grounded:false});advance(t,g,.2);const normal=p.vy;
  Object.assign(p,{y:t.arena.t+90,vy:0,grounded:false});t.setKeys({s:true});advance(t,g,.2);assert.ok(p.vy>normal);
  const before=[p.x,p.y,p.vx,p.vy,p.flightRemaining];g.mode='paused';advance(t,g,.2);assert.deepEqual([p.x,p.y,p.vx,p.vy,p.flightRemaining],before);
});

test('horizontal movement is consistent at 30, 60 and 120 FPS and platforms exist on each difficulty',async()=>{
  const {t,el}=await loadGame();const results=[];
  for(const rate of [30,60,120]){t.start();const g=t.getGame();t.setKeys({d:true});advance(t,g,1,rate);results.push(g.player.x);}
  assert.ok(Math.max(...results)-Math.min(...results)<1.5);
  for(const difficulty of ['normal','revenge','death']){el('diff').value=difficulty;t.start();const terrain=t.getTerrain();assert.equal(terrain.platforms.length,3);for(const p of terrain.platforms){assert.ok(p.l<p.r&&p.y>t.arena.t&&p.y<terrain.floorY);}}
});

test('double-tap, mouse dash, Space migration and mobile jump keep their separate actions',async()=>{
  const {t,el}=await loadGame();t.start();let g=t.getGame();
  t.directionTap('a',1000);assert.equal(g.player.dashes,0);t.directionTap('a',1200);assert.equal(g.player.dashes,1);assert.equal(g.player.dashX,-1);assert.equal(g.player.dashY,0);
  t.updateSettings({doubleTapDash:false});g.player.dashCd=0;t.directionTap('d',1400);t.directionTap('d',1500);assert.equal(g.player.dashes,1);
  assert.equal(t.cleanSettings({bindings:{dash:'Space'}}).bindings.dash,'ShiftLeft');assert.equal(t.gameKey({code:'Space'}),'jump');
  assert.equal(t.bindKey('dash','MouseMiddle'),true);assert.equal(t.bindKey('dash','Space'),false);
  t.start();g=t.getGame();for(const fn of el('game').listeners.pointerdown)fn({button:1,preventDefault(){}});assert.equal(g.player.dashes,1);
  t.start();g=t.getGame();t.enter('normal','opening','INPUT');
  for(const fn of el('game').listeners.pointerdown)fn({button:2,clientX:600,clientY:300,preventDefault(){}});
  assert.ok(g.player.arkParry);assert.equal(t.getPointer().fire,false,'right click activates ability without holding primary');
  t.start();g=t.getGame();t.setDeviceMode('mobile');t.takeAction('jump');advance(t,g,.1);assert.ok(g.player.vy<0);
  advance(t,g,.2);assert.equal(g.player.flightRemaining,2.4,'jump button does not consume wings');
  t.resetTouchInput();assert.equal(t.state.mobileJump,false);t.takeAction('flight');advance(t,g,.1);assert.ok(g.player.flightRemaining<2.4);
});

test('Maelstrom displacement respects the floor and the ritual uses the same physics',async()=>{
  const {t}=await loadGame();t.start({ritual:true});const g=t.getGame(),p=g.player;
  const total=g.totalTime;t.setKeys({d:true});for(let i=0;i<20;i++)t.update(1/60);
  assert.ok(p.x>430);assert.equal(p.grounded,true);assert.equal(g.totalTime,total);assert.equal(t.nearAltar(),true);
  t.resetMovement(g);t.movePlayerWithTerrain(g,0,1000);assert.equal(p.y,t.getTerrain().floorY-18);t.spawnNearAltar(g,500);
  assert.equal(t.beginRitual(),true);const position=[p.x,p.y];t.update(1);assert.deepEqual([p.x,p.y],position);
  t.skipRitual();assert.equal(p.grounded,true);assert.equal(p.flightRemaining,2.4);assert.equal(g.stage,'hell');
});
