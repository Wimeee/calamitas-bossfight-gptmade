const test=require('node:test'),assert=require('node:assert/strict');
const {loadGame}=require('./helpers/fixture.cjs');
class Image{set src(value){this.srcValue=value;this.width=this.height=value.includes('CalamitasBackground')?1200:32;this.onload?.();}}
test('animated native backdrop scales once and keeps its world placement as camera moves',async()=>{
 const calls=[];const {t}=await loadGame({Image,canvasContext:{drawImage:(image,...args)=>calls.push({image,args})}});await t.initializeArenaAtlas();t.start();const g=t.getGame();t.setViewportSize(1300,720);calls.length=0;
 t.drawBackdropBase();const original=calls.find(c=>c.image.srcValue?.includes('CalamitasBackground')).image;
 const first=calls.find(c=>c.image!==original&&c.image.width>1000);assert.ok(first,'draw a prepared screen-resolution background');
 g.t+=1;g.camera.x+=90;t.drawBackdropBase();
 assert.equal(calls.filter(c=>c.image===original).length,1,'native source must not be rescaled every frame');
 const stamps=calls.filter(c=>c.image===first.image);assert.equal(stamps.length,2);assert.notEqual(stamps[0].args[0],stamps[1].args[0],'camera and ambient motion remain live');
 const view=t.cameraView(g),scale=Math.max(view.w/1200,view.h/1200)*1.12;
 assert.ok(Math.abs(stamps[1].args[0]-(view.x+(view.w-1200*scale)/2+Math.sin(g.t*.11)*24))<1e-8);
 assert.equal(stamps[1].args[2],1200*scale);
 const before=stamps[1].image;t.setZoom(g,.5);calls.length=0;t.drawBackdropBase();assert.equal(calls.find(c=>c.image===before)?.image,before,'zoom must reuse the same pixel-size raster');
 t.setViewportSize(1600,900);calls.length=0;t.drawBackdropBase();assert.equal(calls.filter(c=>c.image===original).length,1,'resize rebuilds once');assert.equal(calls.find(c=>c.image===before)?.image,before,'resize reuses the single bounded surface');
});
