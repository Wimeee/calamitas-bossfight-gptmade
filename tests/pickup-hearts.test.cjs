const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs');
const {fileURLToPath}=require('node:url');
const {loadGame}=require('./helpers/fixture.cjs');
test('hearts only drop from killed encounter minions with source counts and conditions',async()=>{
 for(const [stage,key,count]of [['brothers','brothers',3],['hearts','hearts',1],['seekers','seekers',1]]){
 const {t,sandbox}=await loadGame();t.start();const g=t.getGame();g.ritual=null;g.stage=stage;g.castDelayState=null;g.player.hp-=100;
 sandbox.Math.random=()=>0;g[key]=[{x:600,y:400,hp:0},{x:650,y:400,hp:100}];
 t.updateBullets(0);assert.equal(g.pickups.filter(d=>d.kind==='heart').length,count,stage);
 t.updateBullets(0);assert.equal(g.pickups.length,count,'no repeated loot');
 }
 const {t,sandbox}=await loadGame();t.start();const g=t.getGame();g.ritual=null;g.stage='seekers';sandbox.Math.random=()=>0;g.seekers=[{x:600,y:400,hp:0},{x:650,y:400,hp:100}];
 t.updateBullets(0);assert.equal(g.pickups.length,0,'no conditional heart at full health');
 g.player.hp-=100;sandbox.Math.random=()=>.9;g.seekers[0].hp=0;t.updateBullets(0);assert.equal(g.pickups.length,0,'25 percent roll can fail');
});
test('ambient pickup timer cannot create hearts',async()=>{
 const {t}=await loadGame({isolatedCombat:true});t.start();const g=t.getGame();g.ritual=null;g.stage='normal';
 for(let i=0;i<20;i++){g.pickupTimer=0;g.pickups=[];t.update(1/60);assert.equal(g.pickups.some(d=>d.kind==='heart'),false);}
});
test('heart pickup loads native transparent PNG and painting does not mutate it',async()=>{
 const pending=[],draws=[];class Image{set src(url){this.srcUrl=url;pending.push(this);}}
 const {t}=await loadGame({Image,canvasContext:{globalAlpha:1,drawImage(image,...args){draws.push({image,args});}}});
 const ready=t.initializeWorldDecorationAtlas();for(const image of pending){try{const b=fs.readFileSync(fileURLToPath(image.srcUrl));image.width=b.readUInt32BE(16);image.height=b.readUInt32BE(20);image.onload?.();}catch{image.onerror?.();}}await ready;
 const image=t.worldDecorationImage('heartPickup');assert.ok(image,'native heart loaded');assert.equal(image.width,18);assert.equal(image.height,18);
 t.start();const g=t.getGame();g.ritual=null;g.pickups=[{kind:'heart',x:500,y:400,life:17,phase:0}];const before=JSON.stringify(g.pickups);t.draw(g);
 assert.ok(draws.some(d=>d.image===image));assert.equal(JSON.stringify(g.pickups),before);
});
test('heart heals twenty and stays on ground at full HP',async()=>{
 const {t}=await loadGame({isolatedCombat:true});t.start();const g=t.getGame();g.ritual=null;g.stage='normal';g.pickupTimer=999;
 const p=g.player;p.hp=p.maxHp-100;p.lastHit=g.t;
 g.pickups=[{kind:'heart',x:p.x,y:p.y,life:17,phase:0}];t.update(0);
 assert.equal(p.hp,p.maxHp-80);assert.equal(g.pickups.length,0);
 p.hp=p.maxHp;g.pickups=[{kind:'heart',x:p.x,y:p.y,life:17,phase:0}];t.update(0);assert.equal(g.pickups.length,1);
});
