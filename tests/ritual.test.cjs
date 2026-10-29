const test=require('node:test');
const assert=require('node:assert/strict');
const {loadGame}=require('./helpers/fixture.cjs');

test('idle preparation does not rewrite DOM attributes each frame',async()=>{
  const {t,el}=await loadGame();t.start({ritual:true});
  let writes=0;
  for(const id of ['ritual-controls','ritual-summon','ritual-skip']){
    const element=el(id);
    for(const property of ['hidden','disabled','textContent']){
      let value=element[property];
      Object.defineProperty(element,property,{get:()=>value,set:next=>{writes++;value=next;}});
    }
  }
  for(let i=0;i<120;i++)t.update(.016);
  assert.equal(writes,0,'unchanged controls must not trigger style invalidation');
  t.getGame().player.x=500;t.syncRitualControls();
  assert.equal(el('ritual-summon').disabled,false);
  assert.ok(writes>0,'real control changes must still reach the DOM');
});

test('ritual gates combat, freezes resources and enters original opening once for every class/difficulty',async()=>{
  const {t,el}=await loadGame();
  for(const difficulty of ['normal','revenge','death'])for(const weapon of t.weapons){
    el('diff').value=difficulty;el('class').value=weapon.id;
    t.start({ritual:true});const g=t.getGame(),p=g.player;
    const mana=p.mana,potions=p.potions,regen=p.regenPotions;
    assert.equal(g.phaseN,0);assert.equal(g.stage,'preparation');
    assert.equal(t.beginRitual(),false,'must approach altar');
    t.setKeys({d:true});t.update(.2);t.setKeys({});
    assert.equal(t.nearAltar(),true);assert.equal(t.beginRitual(),true);
    assert.equal(t.skipRitual(),false,'brief skip guard');
    t.shoot();t.classAbility();t.dash();t.heal();t.drinkRegeneration();
    for(let i=0;i<50;i++)t.update(.02);
    assert.equal(g.t,0);assert.equal(g.totalTime,0);assert.equal(g.stageT,0);
    assert.equal(p.mana,mana);assert.equal(p.potions,potions);assert.equal(p.regenPotions,regen);
    assert.equal(p.dashes,0);assert.equal(g.projectiles.length,0);assert.equal(g.shots.length,0);
    t.draw(g);
    assert.equal(t.skipRitual(),true);assert.equal(t.skipRitual(),false);
    assert.equal(g.phaseN,1);assert.equal(g.stage,'hell');assert.equal(g.marker,'opening');
    assert.equal(p.x,500);assert.equal(p.y,t.getTerrain().floorY-18);assert.equal(g.totalTime,0);
    assert.equal(el('ritual-controls').hidden,true);
  }
});

test('ritual natural completion, pause/menu lifecycle and touch controls',async()=>{
  const {t,el}=await loadGame();
  t.state.deviceMode='mobile';
  t.start({ritual:true});const g=t.getGame();
  t.setAxis({x:1,y:0});t.update(.2);t.setAxis({x:0,y:0});
  el('ritual-summon').listeners.click[0]();
  assert.equal(g.ritual.phase,'summoning');
  t.update(3.4);t.draw(g);
  t.togglePause();const elapsed=g.ritual.elapsed;t.updateRitual(1);
  assert.equal(g.ritual.elapsed,elapsed);assert.equal(el('ritual-skip').disabled,true);t.draw(g);
  t.showMenu();assert.equal(t.state.screen,'menu');assert.equal(g.mode,'paused');
  await t.resumeBattle();assert.equal(t.state.game,g);assert.equal(g.mode,'playing');
  t.update(1.9);t.draw(g);assert.equal(g.stage,'ritual');
  t.update(1.2);assert.equal(g.stage,'hell');assert.equal(g.phaseN,1);assert.equal(g.t,0);
  t.update(.02);assert.equal(g.totalTime,.02);
  t.start({ritual:true});t.getGame().player.x=500;
  el('ritual-summon').listeners.click[0]();t.update(1);
  el('ritual-skip').listeners.click[0]();assert.equal(t.getGame().phaseN,1);
});

test('keyboard interaction works with physical keys and UI starts use ritual',async()=>{
  const {t,el}=await loadGame();
  el('start').listeners.click[0]();const g=t.getGame();g.player.x=500;
  const event=code=>({code,target:{tagName:'CANVAS'},preventDefault(){}});
  t.kd(event('KeyE'));assert.equal(g.ritual.phase,'summoning');
  t.update(1);t.kd(event('Space'));assert.equal(g.stage,'hell');
  t.kd(event('KeyR'));assert.equal(t.getGame().stage,'preparation');
  t.showMenu();await t.launchBattle();assert.equal(t.getGame().stage,'preparation');
});
