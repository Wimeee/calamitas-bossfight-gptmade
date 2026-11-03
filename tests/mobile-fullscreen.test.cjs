const test=require('node:test'),assert=require('node:assert/strict');const {loadGame}=require('./helpers/fixture.cjs');
test('mobile fullscreen retry enters native fullscreen instead of leaving viewport mode',async()=>{
 const {t,sandbox,el}=await loadGame();let calls=0;const doc=sandbox.document;doc.documentElement={requestFullscreen(){calls++;assert.equal(arguments.length,0);doc.fullscreenElement=this;return Promise.resolve();}};
 t.setDeviceMode('mobile');t.setFocusMode(true);await t.toggleFullscreen();assert.equal(calls,1);assert.equal(doc.fullscreenElement,doc.documentElement);assert.equal(el('scal-game').classList.contains('focus-mode'),true);assert.equal(el('scal-game').classList.contains('native-fullscreen'),true);
});
test('native rejection is recorded and the retry stays available in mobile viewport mode',async()=>{
 const {t,sandbox,el}=await loadGame();sandbox.document.documentElement={requestFullscreen(){return Promise.reject(new Error('Permission denied'));}};t.setDeviceMode('mobile');t.setFocusMode(true);await t.toggleFullscreen();assert.equal(el('scal-game').classList.contains('focus-mode'),true);assert.equal(el('scal-game').classList.contains('native-fullscreen'),false);assert.equal(t.nativeFullscreenState.phase,'denied');
});
test('resuming mobile battle requests native fullscreen in the resume tap',async()=>{
 const {t,sandbox}=await loadGame();t.updateSettings({device:'mobile'});await t.launchBattle();t.showMenu();let calls=0;sandbox.document.documentElement={requestFullscreen(){calls++;return Promise.resolve();}};const resumed=t.resumeBattle();assert.equal(calls,1);await resumed;assert.equal(t.state.screen,'game');
});
