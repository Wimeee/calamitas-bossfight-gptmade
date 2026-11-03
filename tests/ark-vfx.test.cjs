const test=require('node:test'),assert=require('node:assert/strict');const {loadGame}=require('./helpers/fixture.cjs');
async function setup(){const a=await loadGame();a.t.start();a.t.enter('normal','opening');const g=a.t.getGame();Object.assign(g.player,{x:400,y:300,iframes:0});Object.assign(g.boss,{x:490,y:300});a.t.setPointer({x:700,y:300});return {...a,g};}
test('native parry produces five delayed flares and NPC success adds one star and ten energy lights',async()=>{
 for(const npc of [true,false]){const {t,g}=await setup();if(!npc){g.boss.x=1000;t.enemyBullet(490,300,-1,0,300,6,'dart',200);}t.arkAbility();t.updateSword(1/60);
 assert.equal(g.player.arkCharges,16);assert.equal(g.arkEffects?.filter(p=>p.kind==='flare').length,5);assert.equal(g.arkEffects.filter(p=>p.kind==='light').length,npc?10:0);
 if(npc)assert.equal(g.arkEffects.filter(p=>p.kind==='star').length,1);
 assert.ok(g.arkEffects.filter(p=>p.kind==='flare').every(p=>p.life>=20/60&&p.life<=25/60&&p.born>=g.t));}
});
test('Ark effect RNG is independent, particles remain in world space and survive the holdout',async()=>{
 const {t,g,sandbox}=await setup();assert.equal(typeof t.emitArkHit,'function');let calls=0;const rng=sandbox.Math.random;sandbox.Math.random=()=>{calls++;return rng();};
 t.emitArkHit(g,200,300,0);assert.equal(calls,0);assert.equal(g.arkEffects.length,5);const particle=g.arkEffects[0];g.player.x=1000;g.player.swing=null;g.t+=.2;t.updateArkEffects(.2,g);
 const pose=t.arkParticlePose(particle,g.t);assert.ok(pose.x<500);assert.ok(g.arkEffects.includes(particle));
 const count=g.arkEffects.length;g.mode='paused';t.updateArkEffects(10,g);assert.equal(g.arkEffects.length,count);
 g.mode='playing';g.t+=2;t.updateArkEffects(2,g);assert.equal(g.arkEffects.length,0);t.start();assert.equal(t.getGame().arkEffects,undefined);
});
test('native swirl particle sampling has the same count and seed at30/60/120FPS',async()=>{
 const counts=[];for(const hz of [30,60,120]){const {t,g}=await setup();assert.equal(typeof t.sampleArkEffects,'function');const s={max:55/120,time:55/120,wide:true,id:1,angle:0,direction:1,charge:0};
  for(let frame=0;frame<Math.ceil(s.max*hz);frame++){g.t+=1/hz;t.sampleArkEffects(g,s,'swing',1/hz);s.time-=1/hz;t.updateArkEffects(1/hz,g);}
  counts.push([g.arkFxSerial,g.arkFxSeed]);assert.ok(g.arkFxSerial>30);assert.ok(g.arkEffects.some(p=>p.kind==='smoke'));
 }assert.deepEqual(counts[0],counts[1]);assert.deepEqual(counts[1],counts[2]);
});
test('snap leaves native star and finishing slice, while Big Rip emits20burst particles and stitch sparks',async()=>{
 const {t,g}=await setup();assert.equal(typeof t.emitArkSnap,'function');const s={x:700,y:300,angle:0};t.emitArkSnap(g,s);t.emitArkSnap(g,s,true);
 assert.equal(g.arkEffects.filter(p=>p.kind==='slice').length,1);assert.ok(g.arkEffects.some(p=>p.kind==='star'));
 g.arkEffects=[];const r={x:400,y:300,ex:760,ey:300,angle:0};t.emitArkRipBurst(g,r);assert.equal(g.arkEffects.length,20);t.emitArkStitch(g,r,0);assert.equal(g.arkEffects.length,21);
});
test('effect pool is bounded without changing combat RNG or gameplay state',async()=>{
 const {t,g}=await setup();assert.equal(typeof t.emitArkHit,'function');const hp=g.boss.hp,playerHP=g.player.hp;
 for(let i=0;i<200;i++)t.emitArkHit(g,500,300,0);assert.ok(g.arkEffects.length<=640);assert.equal(g.boss.hp,hp);assert.equal(g.player.hp,playerHP);
});
