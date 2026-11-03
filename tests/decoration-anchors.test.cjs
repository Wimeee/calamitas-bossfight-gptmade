const test=require('node:test'),assert=require('node:assert/strict');const {loadGame}=require('./helpers/fixture.cjs');
test('altar and campfire stand on real platforms; lantern hangs directly underneath its support',async()=>{
 const {t}=await loadGame();const terrain=t.getTerrain(),middle=terrain.platforms.find(p=>p.id==='middle'),lower=terrain.platforms.find(p=>p.id==='lower'),upper=terrain.platforms.find(p=>p.id==='upper');
 assert.equal(terrain.altar.y,middle.y);assert.equal(terrain.campfire.y,lower.y);assert.equal(terrain.lantern.y-32,upper.y+16);
 t.start({ritual:true});const g=t.getGame();g.player.x=terrain.altar.x;assert.equal(t.nearAltar(g),true);assert.equal(t.beginRitual(),true,'altar remains usable from its platform');
});
test('decoration render uses terrain anchors and never draws a floating urn',async()=>{
 class Image{constructor(){this.width=80;this.height=48;}set src(value){this.url=value;this.onload?.();}}
 const {t}=await loadGame({Image});await t.initializeWorldDecorationAtlas();t.start({ritual:true});const g=t.getGame(),calls=[];
 const old=t.ctx.drawImage,translate=t.ctx.translate;t.ctx.drawImage=(image,...args)=>calls.push({url:image.url,args});t.ctx.translate=(x,y)=>calls.push({x,y});
 try{t.drawWorldDecorations(g);}finally{t.ctx.drawImage=old;t.ctx.translate=translate;}
 assert.equal(calls.filter(c=>c.url?.includes('CeremonialUrn')).length,0);assert.ok(calls.some(c=>c.x===500&&c.y===335),'actual altar baseline reaches the middle platform');
});
