const test=require('node:test'),assert=require('node:assert/strict');const {loadGame}=require('./helpers/fixture.cjs');
class Image{constructor(){this.width=this.height=72;}set src(v){this.onload?.();}}
test('recurring native sword palette fits without re-rasterizing every attack cycle',async()=>{
 const {t}=await loadGame({Image});await t.initializeNativeArk();const names=['light','bloom-circle','thin-sparkle','swing-smear','swirl-smoke'];for(let cycle=0;cycle<2;cycle++){const before=t.arkLightCacheStats().tints;for(const name of names)for(let hue=0;hue<360;hue+=15)t.arkEffectTexture(name,hue);if(cycle)assert.equal(t.arkLightCacheStats().tints,before,'working palette must remain resident');}
});
test('a full particle-cache reuses retired canvas surfaces rather than allocating forever',async()=>{
 const {t,sandbox}=await loadGame({Image});await t.initializeNativeArk();for(let i=0;i<230;i++)t.drawNativeArkLight(0,0,1,1,0,(i%100+1)/100,'#'+i.toString(16).padStart(6,'0'));let created=0;const old=sandbox.document.createElement;sandbox.document.createElement=(...args)=>{created++;return old(...args);};
 try{for(let i=230;i<430;i++)t.drawNativeArkLight(0,0,1,1,0,(i%100+1)/100,'#'+i.toString(16).padStart(6,'0'));}finally{sandbox.document.createElement=old;}assert.ok(created<30,'bounded caches must not churn hundreds of new canvases');
});
test('prepared tints become immutable bitmaps and evicted snapshots are released safely',async()=>{
 const {t,sandbox}=await loadGame({Image});await t.initializeNativeArk();let closed=0;sandbox.createImageBitmap=async canvas=>({width:canvas.width,height:canvas.height,close(){closed++;}});
 const first=t.arkEffectTexture('light','#112233');await new Promise(setImmediate);const snapshot=t.arkEffectTexture('light','#112233');assert.notEqual(snapshot,first);assert.equal(typeof snapshot.close,'function');
 for(let i=0;i<300;i++)t.arkEffectTexture('light','#'+i.toString(16).padStart(6,'0'));await new Promise(setImmediate);assert.ok(closed>0);assert.ok(t.arkLightCacheStats().tintEntries<=256);
});
