const test=require('node:test'),assert=require('node:assert/strict');
const {loadGame}=require('./helpers/fixture.cjs');
async function setup(){const {t}=await loadGame();t.start();t.enter('normal','opening','EON');const g=t.getGame();g.player.iframes=999;Object.assign(g.boss,{x:600,y:200});return {t,g};}
test('Ark Eon bolts emit at native speed, size and lifetime while the needle stays non-homing',async()=>{
 const {t,g}=await setup();t.arkBolts(0,0,0,1,170);const s=g.shots[0];
 assert.equal(Math.hypot(s.vx,s.vy),1200);assert.equal(s.r,15);assert.equal(s.life,100/60);assert.equal(s.dmg,170);
 t.setPointer({x:g.player.x+400,y:g.player.y});t.fireArk();assert.equal(g.shots.find(s=>s.id==='arkBeam').homing,false);
});
test('target acquisition is followed by native nine-degree turns and .995 speed retention per tick',async()=>{
 const {t,g}=await setup();Object.assign(g.boss,{x:100,y:500});t.arkBolts(0,0,0,1,170);const s=g.shots[0];
 t.updateBullets(1/60);assert.equal(s.vy,0,'source acquires a target on its first update');
 t.updateBullets(1/60);assert.ok(Math.abs(Math.atan2(s.vy,s.vx)-Math.PI*.05)<1e-10);assert.ok(Math.abs(Math.hypot(s.vx,s.vy)-1194)<1e-8);
});
test('native 812px acquisition range is respected and invalid/immune targets are not chased',async()=>{
 const {t,g}=await setup();Object.assign(g.boss,{x:1400,y:400});t.arkBolts(0,0,0,1,170);const s=g.shots[0];
 for(let i=0;i<6;i++)t.updateBullets(1/60);assert.equal(s.vy,0);assert.equal(Math.hypot(s.vx,s.vy),1200);
 Object.assign(g.boss,{x:600,y:400});t.updateBullets(1/60);t.updateBullets(1/60);assert.ok(s.vy>0);
 g.phase2Intro=1;const a=Math.atan2(s.vy,s.vx);t.updateBullets(1/60);assert.ok(Math.abs(Math.atan2(s.vy,s.vx)-a)<1e-10);
});
test('canonical homing star reaches and damages an initially off-axis Calamitas within .9s',async()=>{
 const {t,g}=await setup();t.arkBolts(0,0,Math.PI/2,1,170);const hp=g.boss.hp;
 for(let i=0;i<54;i++){g.t+=1/60;t.updateBullets(1/60);}
 assert.ok(g.boss.hp<hp,'real production target collision, not just a homing flag');
});
test('native star trajectory agrees at 30/60/120Hz and snap stars form the original radial trio',async()=>{
 const samples=[];
 for(const hz of [30,60,120]){const {t,g}=await setup();Object.assign(g.boss,{x:700,y:500});t.arkBolts(0,0,0,1,170);const s=g.shots[0];
  for(let i=0;i<hz/2;i++)t.updateBullets(1/hz);samples.push([s.x,s.y,s.vx,s.vy]);
 }
 for(let axis=0;axis<4;axis++)assert.ok(Math.max(...samples.map(s=>s[axis]))-Math.min(...samples.map(s=>s[axis]))<1e-8);
 const {t,g}=await setup();t.arkBolts(100,100,0,3,170);
 const angles=g.shots.map(s=>Math.atan2(s.vy,s.vx)).sort((a,b)=>a-b);assert.ok(Math.abs(angles[1]-angles[0]-2*Math.PI/3)<1e-8);assert.ok(Math.abs(angles[2]-angles[1]-2*Math.PI/3)<1e-8);
});
