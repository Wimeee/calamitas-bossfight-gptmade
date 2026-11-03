const test=require('node:test'),assert=require('node:assert/strict');const {loadGame}=require('./helpers/fixture.cjs');
test('phone renders fewer pixels while camera view and pointer coordinates keep logical dimensions',async()=>{
 const {t,el}=await loadGame();t.start();const g=t.getGame();t.setDeviceMode('mobile');t.updateCamera(g,0,true);t.resizeViewport();const view=t.cameraView(g),point=t.canvasPointToWorld(600,300,{left:0,top:0,width:1000,height:600}),w=t.canvas.width,h=t.canvas.height;
 assert.ok(w*h<1200*720*.5,'mobile backing surface should contain less than half the desktop pixels');assert.equal(view.w,1200/view.zoom);assert.equal(view.h,720/view.zoom);assert.ok(Math.abs(point.x-(view.x+view.w*.6))<1e-8);assert.equal(t.renderQuality(),'low');
 t.updateSettings({quality:'ultra'});assert.equal(t.renderQuality(),'low');assert.equal(t.settings.quality,'ultra');t.setDeviceMode('desktop');t.resizeViewport();assert.equal(t.canvas.width,1200);assert.equal(t.canvas.height,720);assert.equal(t.renderQuality(),'ultra');
});
test('desktop camera zoom is15percent further out, phone keeps its previous zoom',async()=>{const {t}=await loadGame();t.start();assert.ok(Math.abs(t.cameraView(t.getGame()).zoom-.765*.85)<1e-10);t.setDeviceMode('mobile');t.start();assert.ok(Math.abs(t.cameraView(t.getGame()).zoom-.765)<1e-10);});
test('mobile draw pacing targets60 on120Hz callbacks while desktop keeps every frame',async()=>{
 const {t}=await loadGame();t.setDeviceMode('mobile');t.start();t.getGame().mode='paused';let frames=0;const original=t.ctx.fillRect;t.ctx.fillRect=function(...args){if(this.fillStyle==='#0c0710')frames++;return original(...args);};
 for(let i=0;i<=120;i++)t.loop(1000+i*1000/120);assert.ok(frames>=59&&frames<=62,'120Hz phone should submit about60frames');
 t.setDeviceMode('desktop');frames=0;for(let i=0;i<120;i++)t.loop(3000+i*1000/120);assert.equal(frames,120);
});
