const {test}=require('node:test');
const assert=require('node:assert/strict');
const {loadGame}=require('./helpers/fixture.cjs');

test('menu launches every class and returning freezes and resumes the same battle',async()=>{
  const {t,el}=await loadGame();
  assert.equal(t.state.screen,'menu');assert.equal(el('scal-game').hidden,true);assert.equal(t.model.background.active,true);
  for(const id of ['melee','ranger','mage','summon','rogue']){
    assert.equal(t.selectClass(id),true);t.selectDifficulty('death');await t.launchBattle();
    const g=t.getGame();assert.equal(t.weapons[g.player.weapon].id,id);assert.equal(g.difficulty,'death');assert.equal(t.state.screen,'game');assert.equal(t.model.background.active,false);
    t.showMenu();assert.equal(g.mode,'paused');assert.equal(t.state.screen,'menu');assert.equal(el('scal-game').hidden,true);
    const time=g.t;t.loop(1000);assert.equal(g.t,time);assert.equal(t.state.raf,0);
    t.resumeBattle();assert.equal(t.getGame(),g);assert.equal(g.mode,'playing');assert.equal(t.state.screen,'game');assert.equal(el('scal-game').hidden,false);
    t.showMenu();
  }
  assert.equal(t.selectClass('missing'),false);assert.equal(t.selectDifficulty('missing'),false);
});

test('settings validate, persist, reset and support real rebinding without moving reserved keys',async()=>{
  const {t,sandbox}=await loadGame();
  assert.equal(t.settings.musicEnabled,true);t.updateSettings({sfxVolume:.2,musicVolume:.8,quality:'low',autoAim:false});
  const saved=JSON.parse(sandbox.localStorage.getItem('utbg_settings_v1'));assert.equal(saved.sfxVolume,.2);assert.equal(saved.musicVolume,.8);assert.equal(saved.autoAim,false);
  assert.equal(t.model.background.particleCount,35);assert.equal(t.bindKey('dash','KeyG'),true);
  assert.equal(t.gameKey({code:'KeyG'}),' ');assert.equal(t.gameKey({code:'Space'}),'jump');assert.equal(t.gameKey({code:'KeyW'}),'w');assert.equal(t.bindKey('heal','KeyG'),false);assert.equal(t.bindKey('dash','KeyW'),false);
  t.updateSettings({sfxVolume:NaN,musicVolume:99,quality:'broken'});assert.equal(t.settings.sfxVolume,.55);assert.equal(t.settings.musicVolume,1);assert.equal(t.settings.quality,'high');
  t.resetSettings();assert.equal(t.settings.bindings.dash,'ShiftLeft');assert.equal(t.settings.autoAim,true);assert.equal(t.settings.musicEnabled,true);
});

test('menu blocks game hotkeys and retained aiming preferences survive desktop-only battle start',async()=>{
  const {t}=await loadGame();t.selectClass('ranger');t.updateSettings({device:'mobile',autoAim:false});await t.launchBattle();
  assert.equal(t.state.deviceMode,'desktop');assert.equal(t.state.mobileAutoAim,false);
  t.showMenu();const game=t.getGame();t.kd({code:'KeyR',target:{tagName:'BODY'},preventDefault(){throw Error('Menu hotkey was handled by game');}});assert.equal(t.getGame(),game);assert.equal(game.mode,'paused');
});

test('visual settings do not change damage and shake stays opt-in',async()=>{
  const {t}=await loadGame();await t.launchBattle();const game=t.getGame();game.player.hits=1;game.player.lastHit=0;game.t=.04;
  assert.deepEqual(JSON.parse(JSON.stringify(t.shakeOffset(game))),{x:0,y:0});t.updateSettings({screenShake:true});const shake=t.shakeOffset(game);assert.ok(Math.abs(shake.x)>0||Math.abs(shake.y)>0);
  const hp=game.boss.hp;t.updateSettings({quality:'low'});t.draw(game);assert.equal(game.boss.hp,hp);
});
