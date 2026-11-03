const test=require('node:test'),assert=require('node:assert/strict');const {loadGame}=require('./helpers/fixture.cjs');
class Image{constructor(){this.width=this.height=72;}set src(v){this.onload?.();}}
test('offscreen native Ark lights do not allocate opacity sprites; edge overlap remains rendered',async()=>{
 const {t}=await loadGame({Image});await t.initializeNativeArk();t.ctx.getTransform=()=>({a:1,b:0,c:0,d:1,e:0,f:0});t.ctx.canvas={width:1000,height:600};t.ctx.globalAlpha=1;
 const before=t.arkLightCacheStats().lights;for(let i=0;i<100;i++)t.drawNativeArkLight(3000+i,200,1,1,0,.5,'#ff4500');assert.equal(t.arkLightCacheStats().lights,before,'fully invisible lights must not rasterize');
 t.drawNativeArkLight(-10,200,1,1,0,.5,'#ff4500');assert.equal(t.arkLightCacheStats().lights,before+1,'glow overlapping viewport remains visible');
 t.ctx.getTransform=()=>({a:0,b:1,c:-1,d:0,e:1000,f:0});t.drawNativeArkLight(200,3000,1,1,0,.7,'#ff4500');assert.equal(t.arkLightCacheStats().lights,before+1,'rotated cameras use transformed bounds');
});
test('offscreen hostile sprites skip drawing while rotated edge sprites and camera movement work',async()=>{
 const {t}=await loadGame({Image});await t.initializeEncounterProjectileAtlas();t.ctx.getTransform=()=>({a:1,b:0,c:0,d:1,e:0,f:0});t.ctx.canvas={width:1000,height:600};t.ctx.globalAlpha=1;let draws=0;t.ctx.drawImage=()=>draws++;
 assert.equal(t.paintProjectileFrame(t.ctx,'barrage',0,3000,200,1,1,1,0),true);assert.equal(draws,0);
 t.paintProjectileFrame(t.ctx,'barrage',0,-5,200,1,1,1,Math.PI/4);assert.equal(draws,1);
 t.ctx.getTransform=()=>({a:1,b:0,c:0,d:1,e:-2500,f:0});t.paintProjectileFrame(t.ctx,'barrage',0,3000,200,1,1,1,0);assert.equal(draws,2,'camera movement reveals the same projectile');
 t.ctx.getTransform=()=>({a:1,b:0,c:0,d:1,e:0,f:0});draws=0;
 t.drawEnemyProjectiles({t:0,projectiles:[{kind:'hellblast',x:3000,y:200,vx:100,vy:0,opacity:1,nativeTrail:[{x:3000,y:200},{x:990,y:200}]}]});assert.equal(draws,1,'visible trail survives while the head is offscreen');
});
test('visibility uses affine scale/reflection and retains unsupported-transform fallback',async()=>{
 const {t}=await loadGame();const context={canvas:{width:1000,height:600},getTransform:()=>({a:-2,b:0,c:0,d:2,e:1000,f:0})};
 assert.equal(t.circleVisible(context,510,100,20),true);assert.equal(t.circleVisible(context,700,100,20),false);
 context.getTransform=undefined;assert.equal(t.circleVisible(context,9000,9000,20),true);
 context.getTransform=()=>({a:NaN});assert.equal(t.circleVisible(context,9000,9000,20),true);
});
