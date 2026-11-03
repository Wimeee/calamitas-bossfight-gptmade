const test=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),{fileURLToPath}=require('node:url');
const {loadGame}=require('./helpers/fixture.cjs');
const close=(a,b)=>assert.ok(Math.abs(a-b)<1e-7,`${a} != ${b}`);
test('Sepulcher has native chain scales, spacing and identical static-target paths at 30/60/120Hz',async()=>{
 const paths=[];
 for(const hz of [30,60,120]){
  const {t}=await loadGame();t.start();t.enter('hearts','opening','TEST');const g=t.getGame();
  for(let i=0;i<hz;i++)t.updateMinions(1/hz);
  const w=g.sepulcher;assert.equal(w.nodes.length,52);assert.equal(w.headScale,1.6875);assert.equal(w.bodyScale,1.35);
  assert.equal(w.nodes.filter(n=>n.hasArms).length,12);
  for(let i=0;i<52;i++){const n=w.nodes[i],ahead=i?w.nodes[i-1]:w;close(Math.hypot(n.x-ahead.x,n.y-ahead.y),n.isEnergyBall?34:52);}
  paths.push([w.x,w.y,w.vx,w.vy,...w.nodes.flatMap(n=>[n.x,n.y])]);
  g.hearts=[];t.updateMinions(1/hz);assert.equal(g.sepulcher,null);
 }
 for(let j=1;j<paths.length;j++)paths[0].forEach((v,i)=>close(v,paths[j][i]));
});
test('Sepulcher ring uses native direction, slow initial speed and guarded cooldown',async()=>{
 const {t}=await loadGame();t.start();t.enter('hearts','opening','TEST');const g=t.getGame();
 t.updateMinions(0);Object.assign(g.sepulcher,{x:g.boss.x,y:g.boss.y,vx:0,vy:0});
 t.updateMinions(1/60);assert.equal(g.projectiles.length,30);
 const q=g.projectiles[0];assert.equal(q.kind,'sepulcherDart');close(Math.hypot(q.vx,q.vy),60);close(Math.atan2(q.vy,q.vx),-3*Math.PI/4);
 assert.equal(q.damage,29);assert.equal(q.life,11.5);assert.equal(q.ai2,900);
 t.updateMinions(1/60);assert.equal(g.projectiles.length,30);
});
test('real dart update applies both source accelerations, five-tick frames, fade safety and dt-invariant paths',async()=>{
 const paths=[];
 for(const hz of [30,60,120]){
  const {t}=await loadGame();t.start();const g=t.getGame();g.projectiles=[];g.player.x=-100000;g.player.y=-100000;
  const q=t.enemyBullet(100,100,1,0,60,5,'sepulcherDart',29);Object.assign(q,{ai2:900,life:11.5});
  for(let i=0;i<hz*2;i++)t.updateBullets(1/hz);
  paths.push([q.x,q.y,q.vx,q.vy,q.life,q.frame]);assert.equal(q.frame,0);assert.ok(q.vx>500,'base acceleration continues after the first 90 ticks');
  for(let i=0;i<hz*9;i++)t.updateBullets(1/hz);
  assert.ok(q.opacity<1);assert.ok(g.projectiles.includes(q),'source lifetime persists beyond arena bounds');
  for(let i=0;i<hz;i++)t.updateBullets(1/hz);assert.ok(!g.projectiles.includes(q));
 }
 for(let j=1;j<paths.length;j++)paths[0].forEach((v,i)=>close(v,paths[j][i]));
 const {t}=await loadGame();t.start();const g=t.getGame();g.player.x=-100000;const q=t.enemyBullet(100,100,1,0,60,5,'sepulcherDart',29);Object.assign(q,{ai2:900,life:11.5});
 t.updateBullets(1/60);close(q.vx,61.509);assert.equal(q.frame,0);
 for(let i=0;i<4;i++)t.updateBullets(1/60);assert.equal(q.frame,1);
});
test('energy sprite uses five native 22x24 cells centered on the segment',async()=>{
 class NativeImage{set src(url){const b=fs.readFileSync(fileURLToPath(url));this.width=this.naturalWidth=b.readUInt32BE(16);this.height=this.naturalHeight=b.readUInt32BE(20);this.onload();}}
 const calls=[];const {t}=await loadGame({Image:NativeImage,canvasContext:{drawImage:(...a)=>calls.push(a)}});
 await t.initializeMinionAtlas();assert.equal(t.minionSprites.sepulcher.energyBall.frames,5);
 for(let f=0;f<5;f++){calls.length=0;t.paintSepulcherSegment(t.ctx,'energyBall',200,300,0,1.35,1,f);const a=calls[0];assert.deepEqual(a.slice(1,5),[0,f*24,22,24]);close(a[6],-12*1.35);}
});
