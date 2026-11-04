const test=require('node:test'),assert=require('node:assert/strict');
const {loadGame}=require('./helpers/fixture.cjs');
async function setup(n=1){const {t}=await loadGame();t.start();const g=t.getGame();g.phaseN=n;g.stageT=15;g.projectiles=[];g.player.iframes=999;return {t,g};}
test('all five BH endings retain native shots for their bounded fade instead of deleting them',async()=>{
 for(let n=1;n<=5;n++){
  const {t,g}=await setup(n),q=t.enemyBullet(g.player.x+100,g.player.y,1,0,60,6,'hellblast2',35);Object.assign(q,{sourceCalamitas:true,opacity:1,sourceTicks:100,life:20});
  t.bulletHell(0);assert.ok(g.projectiles.includes(q),`BH${n}`);assert.equal(q.life,.5);
  t.updateBullets(.25);assert.ok(g.projectiles.includes(q));assert.ok(q.opacity>0&&q.opacity<1);
  t.updateBullets(.3);assert.ok(!g.projectiles.includes(q));
 }
});
test('retiring fire and giga spheres fade within15ticks without damage, warning blooms or radial bursts at30/60/120Hz',async()=>{
 for(const hz of [30,60,120])for(const kind of ['fire','giga'])for(const detonating of [false,true]){
  const {t,g}=await setup(2);g.player.iframes=0;
  const q=t.enemyBullet(g.player.x,g.player.y,0,0,0,18,kind,54);Object.assign(q,{sourceCalamitas:true,opacity:1,nativeLife:90,detonating});
  const hp=g.player.hp;t.bulletHell(0);assert.ok(g.projectiles.includes(q));assert.equal(q.ai2,1);assert.equal(q.nativeLife,15);
  for(let i=0;i<hz*.5;i++)t.updateBullets(1/hz);
  assert.ok(!g.projectiles.includes(q));assert.equal(g.player.hp,hp);assert.equal(g.projectiles.filter(p=>p.kind==='dart').length,0);assert.equal((g.calamitasEffects||[]).filter(p=>p.kind==='bloom').length,0);
 }
});
test('native barrage and waves shorten to1s; short lifetimes and ordinary attack skull remain intact',async()=>{
 const {t,g}=await setup(2),shots=[];
 for(const [kind,life]of [['dart',5],['skull',20],['hellblast2',.2],['hellblast',4]]){
  const q=t.enemyBullet(g.player.x+100,g.player.y,1,0,60,6,kind,35);Object.assign(q,{sourceCalamitas:true,opacity:1,ai1:kind==='dart'?2:undefined,life});shots.push(q);
 }
 t.bulletHell(0);assert.deepEqual(shots.map(q=>q.life),[1,1,.2,4]);assert.ok(shots.every(q=>g.projectiles.includes(q)));
});
