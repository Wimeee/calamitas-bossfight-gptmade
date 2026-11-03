const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs');
const {fileURLToPath}=require('node:url');
const {loadGame}=require('./helpers/fixture.cjs');
async function fixture(){const a=await loadGame({isolatedCombat:true});a.t.start();const g=a.t.getGame();g.ritual=null;g.stage='normal';g.player.x=-900;g.player.y=-900;return{...a,g};}
test('resource drops fall, land on platforms, slide to a stop and fall off edges',async()=>{
 const {t,g}=await fixture();assert.equal(typeof t.updatePickups,'function');
 const platform=t.getTerrain().platforms[1];const d={kind:'heart',x:500,y:platform.y-100,vx:100,vy:0,life:3600};g.pickups=[d];
 for(let i=0;i<180;i++)t.updatePickups(g,1/60);
 assert.equal(d.y,platform.y-9);assert.equal(d.vy,0);assert.equal(d.vx,0);
 d.x=platform.r+30;const y=d.y;for(let i=0;i<12;i++)t.updatePickups(g,1/60);assert.ok(d.y>y);
 const up={kind:'star',x:600,y:platform.y+40,vx:0,vy:-300,life:3600};g.pickups=[up];for(let i=0;i<12;i++)t.updatePickups(g,1/60);assert.ok(up.y<platform.y-9,'one-way platform permits upward passage');
});
test('floor catches fast drops and all frame rates run identical pickup physics',async()=>{
 const snapshots=[];
 for(const fps of [30,60,120]){const {t,g}=await fixture();assert.equal(typeof t.updatePickups,'function');
 g.pickups=[{kind:'heart',x:20,y:-1000,vx:110,vy:80,life:3600}];for(let i=0;i<fps;i++)t.updatePickups(g,1/fps);const d=g.pickups[0];snapshots.push([d.x,d.y,d.vx,d.vy]);
 d.y=t.getTerrain().floorY-30;d.vy=10000;d.x=0;for(let i=0;i<10;i++)t.updatePickups(g,1/60);assert.equal(d.y,t.getTerrain().floorY-9);assert.equal(d.vy,0);
 }
 assert.deepEqual(snapshots[0],snapshots[1]);assert.deepEqual(snapshots[1],snapshots[2]);
});
test('nearby needed resources attract; full resources and other classes do not take stars',async()=>{
 const {t,g}=await fixture();assert.equal(typeof t.updatePickups,'function');const p=g.player;Object.assign(p,{x:500,y:250,hp:p.maxHp-60,mana:0});
 g.pickups=[{kind:'heart',x:550,y:250,vx:0,vy:0,life:3600}];for(let i=0;i<60;i++)t.updatePickups(g,1/60);assert.equal(g.pickups.length,0);assert.equal(p.hp,p.maxHp-40);
 for(const weapon of [0,1,3,4]){p.weapon=weapon;g.pickups=[{kind:'star',x:p.x,y:p.y,life:3600}];t.updatePickups(g,0);assert.equal(p.mana,0);assert.equal(g.pickups.length,1);}
 p.weapon=2;t.updatePickups(g,0);assert.equal(p.mana,100);assert.equal(g.pickups.length,0);
 p.mana=p.maxMana;g.pickups=[{kind:'star',x:p.x,y:p.y,life:3600}];t.updatePickups(g,0);assert.equal(g.pickups.length,1);
 p.hp=p.maxHp;g.pickups=[{kind:'heart',x:p.x,y:p.y,life:3600}];t.updatePickups(g,0);assert.equal(g.pickups.length,1);
});
test('ambient spawns are removed for every class; pause freezes drops and restart clears them',async()=>{
 const {t,g}=await fixture();for(const weapon of [0,1,2,3,4]){g.player.weapon=weapon;g.pickupTimer=-1;g.pickups=[];t.update(1/60);assert.equal(g.pickups.length,0);}
 g.pickups=[{kind:'heart',x:100,y:100,life:3600}];g.mode='paused';const before=JSON.stringify(g.pickups);t.update(1);assert.equal(JSON.stringify(g.pickups),before);t.start();assert.equal(t.getGame().pickups.length,0);
});
test('both native resource sprites draw at real positions without a cosmetic bob',async()=>{
 const pending=[],draws=[];class Image{set src(url){this.srcUrl=url;pending.push(this);}}
 const {t}=await loadGame({Image,canvasContext:{globalAlpha:1,drawImage(image,...args){draws.push({image,args});}}});
 const ready=t.initializeWorldDecorationAtlas();for(const image of pending){try{const b=fs.readFileSync(fileURLToPath(image.srcUrl));image.width=b.readUInt32BE(16);image.height=b.readUInt32BE(20);image.onload?.();}catch{image.onerror?.();}}await ready;
 assert.ok(t.worldDecorationImage('manaPickup'));t.start();const g=t.getGame();g.ritual=null;g.player.weapon=2;g.pickups=[{kind:'heart',x:510,y:400,phase:1,life:3600},{kind:'star',x:550,y:400,phase:2,life:3600}];const before=JSON.stringify(g.pickups);
 t.draw(g);assert.equal(JSON.stringify(g.pickups),before);for(const name of ['heartPickup','manaPickup'])assert.ok(draws.some(d=>d.image===t.worldDecorationImage(name)));
});
