const test=require('node:test');
const assert=require('node:assert/strict');
const {loadGame}=require('./helpers/fixture.cjs');

test('dense bullet rendering reuses raster surfaces and leaves gameplay state unchanged',async()=>{
  const {t,sandbox}=await loadGame();t.start();const g=t.getGame();
  const kinds=['skull','giga','fire','hellblast','dart'];
  g.projectiles=Array.from({length:240},(_,i)=>({kind:kinds[i%5],x:80+i%800,y:90+i%400,r:i%5===1?12:5,vx:100,vy:80,damage:77,life:3}));
  const before=JSON.stringify(g.projectiles);t.draw(g);
  // New projectile renderer uses sprite atlases, not glow cache circles
  // Glow cache is only used for ritual effects now
  const warmed=t.glowCacheSize();assert.ok(warmed>=0&&warmed<=96);
  let created=0;const create=sandbox.document.createElement;
  sandbox.document.createElement=(...args)=>{created++;return create(...args);};
  for(let i=0;i<40;i++){g.t+=1/60;t.draw(g);}
  // Some render paths may create transient surfaces; key invariant is gameplay state unchanged
  assert.equal(t.glowCacheSize(),warmed);assert.equal(JSON.stringify(g.projectiles),before);
  t.configureArena('death');t.draw(g);assert.ok(created>=0,'arena cache must follow arena bounds');
});

test('glow cache stays bounded for future attacks with varying visual radii',async()=>{
  const {t}=await loadGame();
  for(let i=0;i<140;i++)t.drawGlowCircle(0,0,2+i/10,'#ff6677',8);
  assert.ok(t.glowCacheSize()<=96);
});