const test=require('node:test'),assert=require('node:assert/strict');const {loadGame}=require('./helpers/fixture.cjs');
test('smoke uploads only its native cell and keeps the79px final atlas column',async()=>{
 class Image{constructor(){this.width=559;this.height=480;}set src(v){this.onload?.();}}const {t}=await loadGame({Image});await t.initializeNativeArk();assert.equal(typeof t.arkFrameTexture,'function');const frame=t.arkFrameTexture('heavy-smoke','#1e90ff',[480,400,79,80]);assert.equal(frame.width,79);assert.equal(frame.height,80);assert.equal(t.arkFrameTexture('heavy-smoke','#1e90ff',[480,400,79,80]),frame);
});
