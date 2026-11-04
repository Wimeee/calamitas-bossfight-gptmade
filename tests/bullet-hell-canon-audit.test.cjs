const test=require('node:test'),assert=require('node:assert/strict');
const {loadGame}=require('./helpers/fixture.cjs');
async function setup(n=1,difficulty='normal'){
 const {t}=await loadGame();t.start();const g=t.getGame();g.difficulty=difficulty;g.phaseN=n;g.stageT=0;g.projectiles=[];
 return {t,g};
}
test('Expert BH streams start at native 9/10/13/15/17 tick gates; Revengeance and Death use 8/9/12/14/16',async()=>{
 for(const difficulty of ['normal','revenge','death'])for(let n=1;n<=5;n++){
  const {t,g}=await setup(n,difficulty),gate=(difficulty==='normal'?9:8)+[0,1,4,6,8][n-1];
  t.bulletHell((gate-1)/60);assert.equal(g.projectiles.filter(q=>q.kind==='hellblast2').length,0,`${difficulty} BH${n} before gate`);
  t.bulletHell(1/60);assert.equal(g.projectiles.filter(q=>q.kind==='hellblast2').length,1,`${difficulty} BH${n} at gate`);
 }
});
test('BH3 final horizontal streams retain native 420px/s, independently of frame rate',async()=>{
 for(const hz of [30,60,120]){
  const {t,g}=await setup(3,'revenge');let seen=0,late=[];
  for(let i=1;i<=hz*11;i++){g.stageT=i/hz;t.bulletHell(1/hz);const added=g.projectiles.slice(seen);seen=g.projectiles.length;
   if(i/hz>10+1/hz)late.push(...added.filter(q=>q.kind==='hellblast2'&&Math.abs(q.vx)!==480));
  }
  assert.ok(late.length>0);assert.ok(late.every(q=>Math.hypot(q.vx,q.vy)===420),`${hz}Hz late horizontal speed`);
 }
});
test('BH5 paired native waves enter within 500px vertically from the player',async()=>{
 const {t,g}=await setup(5);let seen=0;const waves=[];
 for(let tick=1;tick<=840;tick++){g.stageT=tick/60;t.bulletHell(1/60);waves.push(...g.projectiles.slice(seen).filter(q=>q.kind==='skull'));seen=g.projectiles.length;}
 assert.equal(waves.length,56);
 for(let i=0;i<waves.length;i+=2){const a=waves[i],b=waves[i+1];assert.ok(Math.abs(a.y-(g.player.y-18))<=500);assert.ok(Math.abs(b.y-(g.player.y-18))<=500);assert.equal(a.y+b.y,2*(g.player.y-18));}
});
test('Revengeance shared edge counter survives BH1 and cast, making BH2 first stream tick5 rather than tick9',async()=>{
 for(const hz of [30,60,120]){
  const {t,g}=await setup(1,'revenge');
  for(let frame=1;frame<=15*hz;frame++){g.stageT=frame/hz;t.bulletHell(1/hz);}
  assert.equal(g.castDelayState.type,'sepulcher');
  t.getEncounter().update(75/60);g.hearts.forEach(h=>h.hp=0);t.updateBullets(0);
  assert.equal(g.stage,'normal');g.boss.hp=g.boss.max*.75;t.transitionCalamitas(g);assert.equal(g.phaseN,2);
  t.bulletHell(4/60);assert.equal(g.projectiles.length,0);t.bulletHell(1/60);
  assert.equal(g.projectiles.filter(q=>q.kind==='hellblast2').length,1,`${hz}Hz retained remainder`);
 }
});
