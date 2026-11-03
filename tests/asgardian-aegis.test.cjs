const test=require('node:test'),assert=require('node:assert/strict');const {loadGame}=require('./helpers/fixture.cjs');
async function setup(id='melee'){const a=await loadGame();a.el('class').value=id;a.t.start();a.t.enter('normal','opening');const g=a.t.getGame();g.player.weapon=a.t.weapons.findIndex(w=>w.id===id);Object.assign(g.player,{x:300,y:0,vx:0,vy:0,grounded:false,iframes:999});g.boss.x=1500;g.boss.y=-500;return {...a,g};}
test('all classes receive native horizontal Aegis start speed and cannot restart an active dash',async()=>{
 for(const id of ['melee','ranger','mage','summon','rogue']){const {t,g}=await setup(id);t.dash(1);assert.equal(g.player.vx,1398);assert.equal(g.player.dashCd,0);assert.ok(g.player.aegisDash);const count=g.player.dashes;t.dash(-1);assert.equal(g.player.dashes,count);assert.equal(g.player.dashY,0);assert.equal(g.player.dashX,1,'rejected input cannot reverse an active native dash');}
});
test('native Aegis damping and displacement agree at30/60/120Hz and cooldown starts on completion',async()=>{
 const positions=[];for(const hz of [30,60,120]){const {t,g}=await setup();t.dash(1);
  for(let i=0;i<hz/5;i++)t.update(1/hz);positions.push(g.player.x);assert.ok(g.player.vx<1398&&g.player.vx>960);assert.equal(g.player.dashCd,0);
  for(let i=0;i<2*hz&&g.player.aegisDash;i++)t.update(1/hz);assert.equal(g.player.aegisDash,null);assert.ok(g.player.dashCd>0&&g.player.dashCd<=.5+1e-8);
  for(let i=0;i<Math.ceil(.6*hz);i++)t.update(1/hz);t.dash(-1);assert.equal(g.player.dashes,2,'ready after half-second recovery, not old2.15seconds');
 }assert.ok(Math.max(...positions)-Math.min(...positions)<1e-5);
});
test('Aegis slam deals source1000 plus300explosion, grants12tick immunity and respects target12tick cooldown',async()=>{
 const {t,g}=await setup();assert.equal(typeof t.tryAsgardianSlam,'function');Object.assign(g.player,{iframes:0});Object.assign(g.boss,{x:330,y:0});t.dash(1);const hp=g.boss.hp;
 assert.equal(t.tryAsgardianSlam(g,g.boss),true);assert.ok(Math.abs(hp-g.boss.hp-936)<1e-6);assert.equal(g.player.iframes,.2);assert.equal(g.boss.godSlayerInferno.remaining,5);
 assert.equal(t.tryAsgardianSlam(g,g.boss),false);g.t+=.21;g.player.aegisDash.elapsed=.21;assert.equal(t.tryAsgardianSlam(g,g.boss),true);
});
test('immune Calamitas cannot be farmed for shield damage or immunity; slam window ends at18ticks',async()=>{
 const {t,g}=await setup();assert.equal(typeof t.tryAsgardianSlam,'function');g.player.iframes=0;t.enter('hell','h75');t.dash(1);g.boss.x=g.player.x;g.boss.y=g.player.y;const hp=g.boss.hp;
 assert.equal(t.tryAsgardianSlam(g,g.boss),false);assert.equal(g.boss.hp,hp);assert.equal(g.player.iframes,0);
 t.enter('normal','opening');g.player.aegisDash.elapsed=19/60;assert.equal(t.tryAsgardianSlam(g,g.boss),false);
});
test('Aegis native effects are bounded, independent of gameplay RNG and reset with the battle',async()=>{
 const {t,g,sandbox}=await setup();assert.equal(typeof t.emitAsgardianImpact,'function');let calls=0;const rng=sandbox.Math.random;sandbox.Math.random=()=>{calls++;return rng();};
 for(let i=0;i<40;i++)t.emitAsgardianImpact(g,350,0);assert.ok(g.aegisEffects.length<=256);assert.equal(calls,0);t.start();assert.equal(t.getGame().aegisEffects,undefined);
});

test('a frame straddling tick18 can slam only its early active section',async()=>{
 for(const [x,expected] of [[320,true],[380,false]]){const {t,g}=await setup();t.dash(1);Object.assign(g.player,{x:360,y:0,vx:1000});g.player.aegisDash.elapsed=.29+1/30;g.t=.29+1/30;Object.assign(g.boss,{x,y:0,r:1});const hp=g.boss.hp;
 t.updateAsgardianCollisions(g,{duration:1/30,points:[{time:0,x:300,y:0},{time:1/30,x:360,y:0}]});assert.equal(g.boss.hp<hp,expected,'clip player path to native18tick slam window');}
});
