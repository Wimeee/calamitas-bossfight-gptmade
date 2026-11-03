const test=require('node:test'),assert=require('node:assert/strict');const {loadGame}=require('./helpers/fixture.cjs');
async function setup(){const {t}=await loadGame();t.start();t.enter('normal','opening');const g=t.getGame();Object.assign(g.player,{x:300,y:0,vx:0,vy:0,grounded:false,support:null,iframes:0,dashT:.19,dashX:1});g.boss.x=2500;g.boss.y=-1000;return {t,g};}
function bullet(t,g,x,speed=0){const q=t.enemyBullet(x,0,1,0,speed,5,'dart',35);Object.assign(q,{sourceCalamitas:true,ai0:0,ai1:2,ai2:speed,opacity:1});return q;}
test('real player dash cannot tunnel through stationary barrage at30/60/120Hz',async()=>{
 for(const hz of [30,60,120]){const {t,g}=await setup();bullet(t,g,315);for(let i=0;i<Math.ceil(hz/30);i++)t.update(1/hz);assert.ok(g.player.hits>0,`${hz}Hz crossing`);}
});
test('parallel player and projectile motion with20px separation is not a false hit',async()=>{
 for(const hz of [30,60,120]){const {t,g}=await setup();bullet(t,g,320,900);for(let i=0;i<Math.ceil(hz/30);i++)t.update(1/hz);assert.equal(g.player.hits,0,`${hz}Hz parallel`);}
});
test('new bullets cannot collide retrospectively with the player past path; immunity and pause stay safe',async()=>{
 const {t,g}=await setup(),p=g.player;const motion={duration:1/30,points:[{time:0,x:100,y:0},{time:1/30,x:300,y:0}],projectiles:new Set()};
 bullet(t,g,200);t.updateBullets(1/30,motion);assert.equal(p.hits,0,'new projectile only sees current player');
 g.projectiles=[];p.iframes=1;bullet(t,g,315);t.update(1/30);assert.equal(p.hits,0);
 g.mode='paused';const x=p.x;t.update(1/30);assert.equal(p.x,x);assert.equal(p.hits,0);
});
test('piecewise player path around a corner does not hit bullets on the empty diagonal',async()=>{
 const {t,g}=await setup(),p=g.player;Object.assign(p,{x:400,y:100});const q=bullet(t,g,350);q.y=50;
 const motion={duration:1/30,points:[{time:0,x:300,y:0},{time:1/60,x:400,y:0},{time:1/30,x:400,y:100}],projectiles:new Set([q])};
 t.updateBullets(1/30,motion);assert.equal(p.hits,0);
  const onPath=bullet(t,g,400);onPath.y=50;motion.projectiles=new Set([q,onPath]);
  t.updateBullets(1/30,motion);assert.ok(p.hits>0,'actual vertical leg of the same path hits');
});
test('native brother extra updates are synchronized with player movement at30/60/120Hz',async()=>{
 for(const hz of [30,60,120]){
  const {t,g}=await setup();g.brothers=[{kind:0,hp:1}];
  const q=t.spawnBrotherProjectile(g,'fist',350,0,5,0,1);q.nativeLife=1190;q.opacity=1;q.canHit=true;
  for(let i=0;i<Math.ceil(hz/30);i++)t.update(1/hz);
  assert.equal(g.player.hits,0,`${hz}Hz parallel extra-updates fist`);
 }
});
