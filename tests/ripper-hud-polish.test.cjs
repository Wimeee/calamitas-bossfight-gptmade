const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs');const {fileURLToPath}=require('node:url');
const {loadGame}=require('./helpers/fixture.cjs');
async function ready(){const images=[],draws=[];class Image{set src(url){this.srcUrl=url;images.push(this);}}
 const a=await loadGame({Image,canvasContext:{globalAlpha:1,drawImage(image,...args){draws.push({image,args});}}});const pending=a.t.initializeHUDAtlas();
 for(const i of images){try{const b=fs.readFileSync(fileURLToPath(i.srcUrl));i.width=b.readUInt32BE(16);i.height=b.readUInt32BE(20);i.onload?.();}catch{i.onerror?.();}}await pending;a.el('diff').value='revenge';a.t.start();const g=a.t.getGame();g.ritual=null;g.stage='normal';return{...a,g,draws};}
test('normal adrenaline keeps original first-frame art; compact meters sit top-left',async()=>{
 const {t,g,draws}=await ready();g.rippers.adrenaline=.5;g.t=.5;t.drawBattleHUD(g);const first=draws.find(d=>d.image.srcUrl?.endsWith('/adrenalineBorder.png'));assert.equal(first.args[1],0);
 const layout=t.battleHUDLayout(g);assert.ok(layout.rage.y<80&&layout.adrenaline.y<130);assert.ok(first.args[6]<=104,'no previous 1.3 enlargement');
 g.t=.8;draws.length=0;t.drawBattleHUD(g);assert.equal(draws.find(d=>d.image.srcUrl?.endsWith('/adrenalineBorder.png')).args[1],0);
});
test('native readiness animations play once and active meters shake without combat RNG',async()=>{
 const {t,g,draws}=await ready();g.t=10;g.boss.x=g.player.x+40;g.boss.y=g.player.y;g.rippers.rage=.999;g.rippers.adrenaline=.999;t.updateRippers(1,g);
 assert.equal(g.rippers.rageReadyAt,10);assert.equal(g.rippers.adrenalineReadyAt,10);
 g.t=10.2;t.drawBattleHUD(g);for(const n of ['rageFull','adrenalineFull'])assert.ok(draws.some(d=>d.image.srcUrl?.endsWith('/'+n+'.png')));
 g.t=12;draws.length=0;t.drawBattleHUD(g);assert.equal(draws.some(d=>/\/(rageFull|adrenalineFull)\.png$/.test(d.image.srcUrl||'')),false);
 t.activateRipper('rage');t.activateRipper('adrenaline');g.t=12.1;draws.length=0;const before=JSON.stringify(g);t.drawBattleHUD(g);const at1=draws.find(d=>d.image.srcUrl?.endsWith('/rageBorder.png')).args.slice(4,6);assert.equal(JSON.stringify(g),before);
 g.t=12.2;draws.length=0;t.drawBattleHUD(g);const at2=draws.find(d=>d.image.srcUrl?.endsWith('/rageBorder.png')).args.slice(4,6);assert.notDeepEqual(at1,at2);
 draws.length=0;t.drawBattleHUD(g);assert.deepEqual(draws.find(d=>d.image.srcUrl?.endsWith('/rageBorder.png')).args.slice(4,6),at2,'same simulation time does not jitter on redraw');
});
test('HP and MP caps use native overlapping panel offsets',async()=>{
 const {t,g,draws}=await ready();g.player.weapon=2;t.drawBattleHUD(g);
 for(const name of ['HP','MP']){const middle=draws.filter(d=>d.image.srcUrl?.endsWith('/'+name+'_Panel_Middle.png'));const cap=draws.find(d=>d.image.srcUrl?.endsWith('/'+name+'_Panel_Right.png'));
 assert.equal(cap.args[4]-middle.at(-1).args[4],-4);assert.equal(cap.args[5]-middle.at(-1).args[5],name==='HP'?-10:-6);}
});
