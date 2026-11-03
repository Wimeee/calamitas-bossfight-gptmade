const test=require('node:test'),assert=require('node:assert/strict');
const {loadGame}=require('./helpers/fixture.cjs');
class LoadedImage{set src(value){this.url=String(value);this.width=this.naturalWidth=64;this.height=this.naturalHeight=64;this.onload?.();}}

test('Sepulcher naturally spawns after opening Bullet Hell and remains visibly drawn after fading in',async()=>{
 const calls=[],stack=[];
 const {t}=await loadGame({Image:LoadedImage,canvasContext:{globalAlpha:1,
  save(){stack.push(Object.getOwnPropertyDescriptor(this,'globalAlpha').value);},restore(){this.globalAlpha=stack.pop();},
  drawImage(image){if(image.url?.includes('Sepulcher'))calls.push({url:image.url,opacity:Object.getOwnPropertyDescriptor(this,'globalAlpha').value});}
 }});
 await t.initializeMinionAtlas();t.start();const g=t.getGame();
 g.player.hp=g.player.maxHp=1e12;g.player.iframes=999;
 for(let frame=0;frame<60*24;frame++)t.update(1/60);
 assert.equal(g.stage,'hearts');assert.equal(g.hearts.length,10);assert.ok(g.sepulcher);
 assert.equal(g.sepulcher.alpha,0);assert.equal(g.sepulcher.nodes.length,52);
 calls.length=0;t.drawSepulcher(g);
 assert.ok(calls.some(c=>c.url.includes('SepulcherHead')),'head must be rendered');
 assert.ok(calls.some(c=>c.url.includes('SepulcherHand')),'hands must be rendered');
 assert.ok(calls.length>53,'full chain and arms must be rendered');
 assert.ok(calls.every(c=>c.opacity===1),'alpha=0 must draw fully opaque head, body and arms');

 // Clear interpolation snapshots so manual alpha changes affect renderer fallback
 const w = g.sepulcher;
 w._renderPrev = null;
 w._renderCurr = null;

 for(const alpha of [255,128]){
  g.sepulcher.alpha=alpha;for(const node of g.sepulcher.nodes)node.alpha=alpha;
  calls.length=0;t.drawSepulcher(g);
  assert.ok(calls.every(c=>Math.abs(c.opacity-(1-alpha/255))<1e-10),`native alpha ${alpha} must be inverted for canvas opacity`);
 }
});