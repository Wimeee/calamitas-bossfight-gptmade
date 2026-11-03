const test=require('node:test'),assert=require('node:assert/strict');const {loadGame}=require('./helpers/fixture.cjs');
async function setup(){const {t}=await loadGame();t.start();t.enter('normal','opening');const g=t.getGame();Object.assign(g.player,{x:300,y:0,iframes:0,hits:0,dashT:0,contactGuard:0});Object.assign(g.boss,{x:350,y:0,vx:1800,vy:0,contactDamage:94});g.attackIndex=3;g.calamitasAI={index:3,stage:g.stage,marker:g.marker,second:false,ticks:1,shot:0,localShot:0,charges:0,firstFire:true,canSplit:true,remainder:0};return {t,g};}
function advance(t,g,dt,dx){const old={x:g.player.x,y:g.player.y};g.player.x+=dx;g.t+=dt;const motion={duration:dt,points:[{time:0,...old},{time:dt,x:g.player.x,y:g.player.y}],projectiles:new Set()};t.bossAttack(dt,motion);t.updateAsgardianCollisions(g,motion);t.resolveCalamitasContact?.(g,motion);return motion;}
test('parallel boss and player with50px separation do not produce a false contact at30/60/120Hz',async()=>{
 for(const hz of [30,60,120]){const {t,g}=await setup();for(let i=0;i<Math.round(hz/30);i++)advance(t,g,1/hz,1800/hz);assert.equal(g.player.hits,0,hz+'Hz parallel');}
});
test('opposing boss and player paths cannot tunnel through one another at30/60/120Hz',async()=>{
 for(const hz of [30,60,120]){const {t,g}=await setup();g.player.x=420;for(let i=0;i<Math.round(hz/30);i++)advance(t,g,1/hz,-6000/hz);assert.equal(g.player.hits,1,hz+'Hz crossing');}
});
test('idle boss, expired charge, immunity and pause never create body damage',async()=>{
 for(const kind of ['idle','expired','immune','paused']){const {t,g}=await setup();g.player.x=350;
 if(kind==='idle'){g.attackIndex=1;g.calamitasAI=null;g.boss.vx=0;g.boss.contactDamage=0;}if(kind==='expired'){g.calamitasAI.ticks=24;g.boss.contactDamage=0;}if(kind==='immune')g.player.iframes=1;if(kind==='paused')g.mode='paused';
 const x=g.boss.x;advance(t,g,1/30,0);assert.equal(g.player.hits,0,kind);if(kind==='paused')assert.equal(g.boss.x,x);
 }
});
test('Aegis slam resolves before a real crossing contact and does not ram a parallel boss',async()=>{
 for(const crossing of [false,true]){const {t,g}=await setup();g.player.x=crossing?420:300;t.dash(crossing?-1:1);const before=g.boss.hp;
 advance(t,g,1/30,crossing?-120:60);assert.equal(g.player.hits,0,'valid shield contact grants source immunity before body damage');assert.equal(g.boss.hp<before,crossing,'only actual same-time overlap can slam');
 }
});

test('real update loop preserves parallel Aegis spacing and lets a genuine ram protect before boss damage',async()=>{
 for(const hz of [30,60,120])for(const crossing of [false,true]){const {t,g}=await setup();g.player.x=crossing?420:300;g.boss.vx=1398;t.dash(crossing?-1:1);const hp=g.boss.hp;
  for(let i=0;i<Math.round(hz/30);i++)t.update(1/hz);
  assert.equal(g.player.hits,0,hz+'Hz real shield/body ordering');assert.equal(g.boss.hp<hp,crossing,hz+'Hz real simultaneous collision');
 }
});
