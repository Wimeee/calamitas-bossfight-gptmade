const test=require('node:test'),assert=require('node:assert/strict');
const {loadGame}=require('./helpers/fixture.cjs');

test('all native practice presets start cleanly for every class and difficulty',async()=>{
 const {t,el}=await loadGame();assert.ok(t.practicePhases?.length>=14);
 for(const difficulty of ['normal','revenge','death'])for(const weapon of t.weapons)for(const phase of t.practicePhases){
  el('class').value=weapon.id;el('diff').value=difficulty;t.start({practice:{id:phase.id,invincible:true}});
  const g=t.getGame();assert.equal(g.practice.id,phase.id);assert.equal(g.stage,phase.stage);
  assert.equal(g.player.weapon,t.weapons.indexOf(weapon));assert.equal(g.difficulty,difficulty);
  assert.equal(g.ritual,undefined);assert.equal(g.phaseN,phase.phaseN);
  assert.equal(g.boss.hp,g.boss.max*phase.hp);assert.equal(g.practice.invincible,true);
  g.player.iframes=0;t.update(1/180);assert.equal(g.mode,'playing');
 }
});

test('practice completes at natural phase boundaries and retries the same setup without awarding victory',async()=>{
 const {t,el,sandbox}=await loadGame();el('class').value='rogue';el('diff').value='death';
 t.start({practice:{id:'bh1',invincible:true}});let g=t.getGame();g.player.iframes=999;
 for(let i=0;i<901&&g.mode==='playing';i++)t.update(1/60);
 assert.equal(g.mode,'won');assert.equal(g.stage,'hell');assert.equal(g.practice.completed,true);
 assert.equal(sandbox.localStorage.getItem('utbg_calamitas_victory_v1'),null);
 assert.match(el('overlaytitle').textContent,/Фазу пройдено/);
 const previous=g;t.restartBattle();g=t.getGame();assert.notEqual(g,previous);
 assert.equal(g.practice.id,'bh1');assert.equal(g.practice.invincible,true);assert.equal(g.totalTime,0);
 assert.equal(g.player.hits,0);assert.equal(g.difficulty,'death');assert.equal(g.player.weapon,4);
 t.start({ritual:true});assert.equal(t.getGame().practice,undefined);assert.ok(t.getGame().ritual);
});

test('assisted practice counts hits and debuffs while unassisted practice can die',async()=>{
 const {t,sandbox}=await loadGame();t.start({practice:{id:'normal1',invincible:true}});let g=t.getGame();
 g.player.iframes=0;g.player.hp=10;t.hurt(1000,'projectile','TEST',3);
 assert.equal(g.mode,'playing');assert.equal(g.player.hp,1);assert.equal(g.player.hits,1);
 t.updatePlayerDebuffs(g,1);assert.equal(g.mode,'playing');assert.equal(g.player.hp,1);
 t.start({practice:{id:'normal1',invincible:false}});g=t.getGame();g.player.iframes=0;g.player.hp=10;
 t.hurt(1000,'projectile','TEST');assert.equal(g.mode,'dead');
 assert.equal(sandbox.localStorage.getItem('utbg_calamitas_victory_v1'),null);
});

test('a chosen real attack finishes once its native attack index advances',async()=>{
 const {t}=await loadGame();t.start({practice:{id:'normal2',attackIndex:3,invincible:true}});
 const g=t.getGame();g.player.iframes=999;assert.equal(g.attackIndex,3);
 for(let i=0;i<1200&&g.mode==='playing';i++)t.update(1/60);
 assert.equal(g.mode,'won');assert.equal(g.practice.completed,true);
 t.start({practice:{id:'missing'}});assert.equal(t.getGame().practice,undefined);
});

test('public menu launch, result retry, pause and normal launch preserve mode isolation',async()=>{
 const {t,el}=await loadGame();t.selectBattleMode('practice');t.selectPracticePhase('brothers');
 t.selectPracticeAttack(null);t.model.practiceInvincible=true;t.showPanel('setup');await t.launchBattle();
 let g=t.getGame();assert.equal(g.stage,'brothers');assert.equal(el('practice-toolbar').hidden,false);
 t.showMenu();const time=g.totalTime;t.update(1);assert.equal(g.totalTime,time);await t.resumeBattle();
 t.finish(false);el('overlaybtn').listeners.click[0]();g=t.getGame();assert.equal(g.practice.id,'brothers');
 t.showMenu();t.selectBattleMode('trial');await t.launchBattle();assert.ok(t.getGame().ritual);
 assert.equal(t.getGame().practice,undefined);assert.equal(el('practice-toolbar').hidden,true);
});

test('R retries practice, phase selection restores its controls and bilingual labels translate',async()=>{
 const {t,el}=await loadGame();t.start({practice:{id:'seekers',invincible:true}});
 const previous=t.getGame();t.kd({code:'KeyR',target:{tagName:'BODY'},preventDefault(){}});
 assert.notEqual(t.getGame(),previous);assert.equal(t.getGame().practice.id,'seekers');
 t.model.battleMode='trial';el('practice-choose').listeners.click[0]();
 assert.equal(t.model.panel,'setup');assert.equal(t.model.battleMode,'practice');assert.equal(t.model.practicePhase,'seekers');
 assert.equal(t.translate('Безсмертя з підрахунком влучань','en'),'Immortality with hit counting');
 for(const phase of t.practicePhases)assert.doesNotMatch(t.translate(phase.label,'en'),/[А-Яа-яІіЇїЄє]/);
 for(const attack of t.practiceAttacks)assert.doesNotMatch(t.translate(attack.label,'en'),/[А-Яа-яІіЇїЄє]/);
});

test('late-phase practice preserves the persistent black hole and immortality covers its drain',async()=>{
 const {t}=await loadGame();
 for(const id of ['maelstrom','seekers','bh5','sep2','desperation']){
  t.start({practice:{id,invincible:true}});const g=t.getGame();
  assert.ok(g.maelstrom,id);assert.ok(g.maelstrom.ticks>=480,id+' retains a grown hazard');
  Object.assign(g.maelstrom,{x:g.player.x,y:g.player.y,vx:0,vy:0,sitStill:90});
  g.player.iframes=0;g.player.hp=1;t.updateMaelstrom(1/60);
  assert.equal(g.mode,'playing',id);assert.equal(g.player.hp,1,id);
 }
});
