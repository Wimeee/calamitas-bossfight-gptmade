const test=require('node:test'),assert=require('node:assert/strict');const {loadGame}=require('./helpers/fixture.cjs');
test('native Ark lights reuse opacity-aware sprites without mutating simulation',async()=>{
 class Image{constructor(){this.width=this.height=72;}set src(v){this.url=v;this.onload?.();}}
 const {t}=await loadGame({Image});await t.initializeNativeArk();t.start();const g=t.getGame();g.stage='normal';for(let i=0;i<20;i++)t.emitArkHit(g,500,300);g.t+=.2;t.drawArkEffects(g,'front');const before=JSON.stringify(g),old=t.ctx.drawImage,save=t.ctx.save;let draws=0,saves=0;t.ctx.drawImage=()=>draws++;t.ctx.save=()=>saves++;
 try{t.drawArkEffects(g,'front');}finally{t.ctx.drawImage=old;t.ctx.save=save;}assert.equal(draws,g.arkEffects.length);assert.equal(saves,g.arkEffects.length*2);assert.equal(JSON.stringify(g),before);
});
test('brightness is baked separately for different opacities and the native sprite cache is bounded',async()=>{
 class Image{constructor(){this.width=this.height=72;}set src(v){this.onload?.();}}
 const {t}=await loadGame({Image});await t.initializeNativeArk();t.ctx.globalAlpha=1;for(const alpha of [.2,.8])t.drawNativeArkLight(0,0,1,1,0,alpha,'#ff4500');const images=[],old=t.ctx.drawImage;t.ctx.drawImage=image=>images.push(image);
 try{for(const alpha of [.2,.8,.2])t.drawNativeArkLight(0,0,1,1,0,alpha,'#ff4500');assert.notEqual(images[0],images[1]);assert.equal(images[0],images[2]);for(let i=0;i<400;i++)t.drawNativeArkLight(0,0,1,1,0,.5,'#'+i.toString(16).padStart(6,'0'));assert.ok(t.arkLightCacheStats().entries<=192);}finally{t.ctx.drawImage=old;}
});
