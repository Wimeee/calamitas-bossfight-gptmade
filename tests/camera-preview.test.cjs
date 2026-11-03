const test=require('node:test'),assert=require('node:assert/strict');const {loadGame}=require('./helpers/fixture.cjs');
test('pre-fight slider changes the visible camera immediately and persists the selected device profile',async()=>{
 const {t,el,sandbox}=await loadGame();t.start({ritual:true});const g=t.getGame();assert.equal(el('camera-preview').hidden,false);assert.equal(el('camera-zoom').value,'85');const p={...g.player};
 el('camera-zoom').value='110';for(const fn of el('camera-zoom').listeners.input||[])fn();assert.ok(Math.abs(t.cameraView(g).zoom-.765*1.1)<1e-10);assert.equal(el('camera-zoom-value').textContent,'110%');assert.equal(g.player.x,p.x);assert.equal(g.player.y,p.y);assert.equal(g.totalTime,0);
 const stored=JSON.parse(sandbox.localStorage.getItem('utbg_settings_v1'));assert.equal(stored.cameraZoomDesktop,1.1);t.setDeviceMode('mobile');t.start({ritual:true});assert.equal(el('camera-zoom').value,'125');el('camera-zoom').value='150';for(const fn of el('camera-zoom').listeners.input||[])fn();assert.ok(Math.abs(t.cameraView(t.getGame()).zoom-.765*1.5)<1e-10);assert.equal(t.settings.cameraZoomDesktop,1.1);
 t.setDeviceMode('desktop');t.start({ritual:true});assert.equal(el('camera-zoom').value,'110');
});
test('camera control hides after summoning and cannot be changed through its hidden input',async()=>{
 const {t,el}=await loadGame();t.start({ritual:true});const g=t.getGame();t.spawnNearAltar(g,500);assert.equal(t.beginRitual(),true);assert.equal(el('camera-preview').hidden,true);const zoom=g.camera.zoom;el('camera-zoom').value='50';for(const fn of el('camera-zoom').listeners.input||[])fn();assert.equal(g.camera.zoom,zoom);
});
test('camera preferences validate range and device reset only affects the active profile',async()=>{
 const {t,el}=await loadGame();const clean=t.cleanSettings({cameraZoomDesktop:Infinity,cameraZoomMobile:99});assert.equal(clean.cameraZoomDesktop,.85);assert.equal(clean.cameraZoomMobile,1.75);t.updateSettings({cameraZoomDesktop:1.2,cameraZoomMobile:1.6});t.start({ritual:true});for(const fn of el('camera-zoom-reset').listeners.click||[])fn();assert.equal(t.settings.cameraZoomDesktop,.85);assert.equal(t.settings.cameraZoomMobile,1.6);
});
