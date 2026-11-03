const test=require('node:test'),assert=require('node:assert/strict');
const {loadGame}=require('./helpers/fixture.cjs');
test('coarse-pointer phones launch touch controls and reset held actions on menu return',async()=>{
 const {t,el,sandbox}=await loadGame();sandbox.navigator.maxTouchPoints=5;sandbox.window.matchMedia=q=>({matches:q==='(pointer:coarse)'});t.updateSettings({device:'auto'});await t.launchBattle();
 assert.equal(t.state.deviceMode,'mobile');assert.equal(el('touchcontrols').hidden,false);assert.equal(el('mobile-settings').hidden,false);
 t.takeAction('jump');assert.equal(t.state.mobileJump,true);assert.equal(t.state.mobileFlight,true);t.showMenu();assert.equal(t.state.mobileJump,false);assert.equal(t.state.mobileFlight,false);
});
test('fine-pointer desktops keep touch controls hidden even with a touchscreen',async()=>{
 const {t,el,sandbox}=await loadGame();sandbox.navigator.maxTouchPoints=5;sandbox.window.matchMedia=()=>({matches:false});t.updateSettings({device:'auto'});await t.launchBattle();assert.equal(t.state.deviceMode,'desktop');assert.equal(el('touchcontrols').hidden,true);
});
test('brothers get20percent less HP while other encounter health stays unchanged',async()=>{
 const {t}=await loadGame();t.start();t.enter('brothers','bros');const g=t.getGame();assert.equal(g.brothers.length,2);for(const b of g.brothers){assert.equal(b.max,156000);assert.equal(b.hp,b.max);}assert.equal(t.calamitasConfig.heartHP,32400);assert.equal(t.calamitasConfig.seekerHP,14700);
});
