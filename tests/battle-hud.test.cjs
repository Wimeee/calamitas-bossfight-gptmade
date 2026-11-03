const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs');
const {fileURLToPath}=require('node:url');const {loadGame}=require('./helpers/fixture.cjs');
async function ready(){const pending=[],draws=[];class Image{set src(url){this.srcUrl=url;pending.push(this);}}
 const a=await loadGame({Image,canvasContext:{globalAlpha:1,drawImage(image,...args){draws.push({image,args});}}});
 assert.equal(typeof a.t.initializeHUDAtlas,'function');const done=a.t.initializeHUDAtlas();for(const image of pending){try{const b=fs.readFileSync(fileURLToPath(image.srcUrl));image.width=b.readUInt32BE(16);image.height=b.readUInt32BE(20);image.onload?.();}catch{image.onerror?.();}}await done;
 a.t.start();const g=a.t.getGame();g.ritual=null;g.stage='normal';return{...a,g,draws};}
test('native HUD loads actual resource assets and fonts; HP/MP and boss use real ratios',async()=>{
 const {t,g,draws}=await ready();assert.equal(t.hudAssetStatus.failed,0);g.player.hp=150;g.player.maxHp=600;g.player.weapon=0;g.player.mana=50;
 const before=JSON.stringify(g);t.drawBattleHUD(g);assert.equal(JSON.stringify(g),before,'rendering is pure');
 assert.ok(draws.some(d=>d.image.srcUrl?.endsWith('/HP_Fill.png')));assert.equal(draws.some(d=>d.image.srcUrl?.endsWith('/MP_Fill.png')),false);
 g.player.weapon=2;draws.length=0;t.drawBattleHUD(g);assert.ok(draws.some(d=>d.image.srcUrl?.endsWith('/MP_Fill.png')));
 assert.ok(draws.some(d=>d.image.srcUrl?.endsWith('/bossMain.png')));
 for(const d of draws)if(d.args.length===8){const [x,y,w,h]=d.args;assert.ok(x>=0&&y>=0&&w>=0&&h>=0&&x+w<=d.image.width+.001&&y+h<=d.image.height+.001,'source crop is inside native asset');}
});
test('HUD geometry stays on screen and player debuff follows camera zoom',async()=>{
 const {t,g}=await ready();assert.equal(typeof t.battleHUDLayout,'function');const first=t.battleHUDLayout(g);
 Object.assign(g.camera,{x:1000,y:1000,zoom:.5});const next=t.battleHUDLayout(g);assert.deepEqual(next.hp,first.hp);assert.deepEqual(next.boss,first.boss);
 for(const box of [next.hp,next.boss,next.rage,next.adrenaline])assert.ok(box.x>=0&&box.y>=0&&box.x+box.w<=t.W&&box.y+box.h<=t.H);
 g.player.debuffs={hex:{remaining:3,max:6}};Object.assign(g.player,{x:1000,y:1000});const point=t.playerDebuffPoint(g);assert.ok(Math.abs(point.x-t.W/2)<.001);assert.ok(point.y>t.H/2);
 g.camera.x+=100;assert.ok(t.playerDebuffPoint(g).x<point.x);
});
test('Hex timer and damage refresh, expire and pause without fake hit sounds or hit counts',async()=>{
 const {t}=await loadGame();t.start();const g=t.getGame();g.ritual=null;g.stage='normal';g.player.iframes=0;
 assert.equal(typeof t.applyPlayerHex,'function');t.applyPlayerHex(g,3);const p=g.player,hp=p.hp,hits=p.hits;
 for(let i=0;i<60;i++)t.updatePlayerDebuffs(g,1/60);assert.equal(p.hp,hp-15);assert.equal(p.hits,hits);assert.ok(p.debuffs.hex.remaining>1.99&&p.debuffs.hex.remaining<2.01);
 t.applyPlayerHex(g,5);assert.equal(p.debuffs.hex.remaining,5);t.applyPlayerHex(g,2);assert.equal(p.debuffs.hex.remaining,5);
 g.mode='paused';t.updatePlayerDebuffs(g,3);assert.equal(p.debuffs.hex.remaining,5);g.mode='playing';t.updatePlayerDebuffs(g,5);assert.equal(p.debuffs.hex,undefined);
 t.start();assert.equal(Object.keys(t.getGame().player.debuffs||{}).length,0);
});
test('projectile debuff requires an accepted hit and uses distinct source durations',async()=>{
 const {t}=await loadGame();t.start();const g=t.getGame();g.ritual=null;g.stage='normal';g.player.iframes=0;
 assert.equal(typeof t.projectileHexDuration,'function');assert.equal(t.projectileHexDuration({sourceCalamitas:true,kind:'fire'}),4);assert.equal(t.projectileHexDuration({sourceCalamitas:true,kind:'giga'}),5);assert.equal(t.projectileHexDuration({sourceCalamitas:true,kind:'hellblast'}),3);assert.equal(t.projectileHexDuration({kind:'sepulcherDart'}),0);
 t.hurt(10,'projectile','test',4);assert.equal(g.player.debuffs.hex.remaining,4);t.hurt(10,'projectile','blocked',6);assert.equal(g.player.debuffs.hex.remaining,4);
});
