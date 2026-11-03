const test=require('node:test'),assert=require('node:assert/strict');
const {loadGame}=require('./helpers/fixture.cjs');
test('native music is enabled by default and old settings migrate only once',async()=>{
 const storage=new Map([['utbg_settings_v1',JSON.stringify({musicEnabled:false,musicVolume:.2})]]);
 const first=await loadGame({storage});assert.equal(first.t.settings.musicEnabled,true);assert.equal(first.t.settings.musicVolume,.2);
 first.t.updateSettings({musicEnabled:false});
 const second=await loadGame({storage});assert.equal(second.t.settings.musicEnabled,false,'a later explicit mute survives reload');
 second.t.resetSettings();assert.equal(second.t.settings.musicEnabled,true,'reset restores the enabled default');
 assert.equal(second.t.cleanSettings({musicEnabled:false}).musicEnabled,false);
});
