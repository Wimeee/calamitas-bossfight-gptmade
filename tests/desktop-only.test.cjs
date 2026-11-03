const test=require('node:test'),assert=require('node:assert/strict');
const {loadGame}=require('./helpers/fixture.cjs');
test('desktop-only build ignores old mobile preferences and coarse-pointer detection',async()=>{
 const {t,el,sandbox}=await loadGame();
 sandbox.navigator.maxTouchPoints=5;sandbox.window.matchMedia=()=>({matches:true});
 sandbox.localStorage.setItem('calamitas_device_mode','mobile');
 t.updateSettings({device:'mobile'});t.setDeviceMode('mobile');
 assert.equal(t.state.deviceMode,'desktop');assert.equal(t.settings.device,'desktop');
 assert.equal(el('scal-game').classList.contains('mobile'),false);assert.equal(el('touchcontrols').hidden,true);
 assert.equal(el('mobile-settings').hidden,true);assert.equal(el('setting-device').disabled,true);
 await t.launchBattle();assert.equal(t.state.deviceMode,'desktop');
 t.state.mobileFire=true;t.state.mobileJump=true;t.setDeviceMode('mobile');
 assert.equal(t.state.mobileFire,false);assert.equal(t.state.mobileJump,false);
 assert.equal(t.gameKey({code:'Space'}),'jump');
});
