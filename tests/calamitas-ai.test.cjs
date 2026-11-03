const test=require('node:test'),assert=require('node:assert/strict');
const {loadGame}=require('./helpers/fixture.cjs');
async function setup({index=1,second=false,worm=false}={}){
 const {t}=await loadGame();t.start();t.enter(worm?'hearts':'normal','opening','AI TEST');const g=t.getGame();
 if(second)g.thresholds.add('40');
 Object.assign(g.player,{x:500,y:300,iframes:999});Object.assign(g.boss,{x:-100,y:300,vx:0,vy:0});
 g.attackIndex=index;g.phase2Intro=0;g.projectiles=[];return {t,g};
}
function advance(t,g,seconds,hz=60,onFrame=()=>{}){
 for(let i=0;i<Math.round(seconds*hz);i++){onFrame(i/hz);g.t+=1/hz;t.bossAttack(1/hz);}
}
test('horizontal skull volley uses source phase durations, cadence and 600px/s sampled aim',async()=>{
 for(const hz of [30,60,120])for(const second of [false,true]){
  const {t,g}=await setup({second});const duration=second?5:8,interval=second?.4:1/3;
  advance(t,g,interval-1/hz,hz);assert.equal(g.projectiles.length,0,'no instant untelegraphed first skull');
  advance(t,g,1/hz,hz);const q=g.projectiles[0];assert.ok(q,'first skull at source interval');
  assert.ok(Math.abs(Math.hypot(q.vx,q.vy)-600)<1e-8);assert.equal(q.life,4.25);assert.equal(q.fadeStart,3.4);
  const direction=Math.atan2(q.vy,q.vx);g.player.y+=200;t.updateBullets(1/60);
  assert.ok(Math.abs(Math.atan2(q.vy,q.vx)-direction)<1e-8,'emitted skull never homes');
  // Restart to measure an entire volley without perturbing the timer.
  const fresh=await setup({second});advance(fresh.t,fresh.g,duration,hz);
  assert.equal(fresh.g.projectiles.length,second?12:23);assert.equal(fresh.g.attackIndex,2,'advance by duration, not arbitrary shot count');
 }
});
test('volley keeps the current side, tracks vertical dodges and agrees across frame rates',async()=>{
 const results=[];
 for(const hz of [30,60,120]){
  const {t,g}=await setup();advance(t,g,3,hz,time=>{g.player.y=300+time*240;});
  assert.ok(g.boss.x<g.player.x-580,'does not flip sides from sequence parity');
  assert.ok(Math.abs(g.boss.y-g.player.y)<90,'actively follows vertical movement');results.push({x:g.boss.x,y:g.boss.y});
 }
 assert.ok(Math.max(...results.map(p=>p.y))-Math.min(...results.map(p=>p.y))<10);
});
test('worm halves skull firing frequency without extending the eight-second attack',async()=>{
 const {t,g}=await setup({worm:true});advance(t,g,8);assert.equal(g.projectiles.length,11);assert.equal(g.attackIndex,2);
});
test('off-arena incoming skull survives entry, can hit, and outgoing skull is culled',async()=>{
 const {t,g}=await setup();g.player.iframes=0;g.player.x=t.arena.l+25;g.player.y=300;
 const q=t.enemyBullet(t.arena.l-200,300,1,0,600,20,'hellblast',36);q.life=4.25;q.maxSpeed=1080;q.accelMult=1.03;q.fadeStart=3.4;
 const hp=g.player.hp;t.updateBullets(1/60);assert.ok(g.projectiles.includes(q),'must not disappear before arena entry');
 for(let i=0;i<30&&g.projectiles.includes(q);i++)t.updateBullets(1/60);
 assert.ok(g.player.hp<hp,'same world collision works after entry');
 const out=t.enemyBullet(t.arena.r+50,0,1,0,600,6,'hellblast2',35);t.updateBullets(.1);assert.ok(!g.projectiles.includes(out));
});
test('overhead attack uses 550px altitude and native 20-degree barrage fan',async()=>{
 const {t,g}=await setup({index:0});advance(t,g,2);
 assert.ok(g.boss.y<g.player.y-450);assert.equal(g.projectiles[0]?.kind,'fire','first overhead cast is a fireblast');
 advance(t,g,3);assert.equal(g.attackIndex,1);
 const darts=g.projectiles.filter(q=>q.kind==='dart');assert.ok(darts.length>=8);
 const angles=darts.slice(0,8).map(q=>Math.atan2(q.vy,q.vx));
 assert.ok(Math.abs(angles.at(-1)-angles[0]-40*Math.PI/180)<1e-8);
});
test('dash locks aim, only contacts during first 24 ticks, then decelerates; phase II has one charge',async()=>{
 for(const second of [false,true]){
  const {t,g}=await setup({index:3,second});advance(t,g,1/60);const locked={...g.dashVector},speed=Math.hypot(g.boss.vx,g.boss.vy);
  assert.ok(speed>=1800);g.player.y+=300;advance(t,g,23/60);
  assert.equal(g.dashVector.x,locked.x);assert.equal(g.dashVector.y,locked.y);
  advance(t,g,10/60);assert.ok(Math.hypot(g.boss.vx,g.boss.vy)<speed);assert.equal(g.boss.contactDamage,0);
  advance(t,g,(second?70:140)/60-34/60);assert.equal(g.attackIndex,4);
 }
});
