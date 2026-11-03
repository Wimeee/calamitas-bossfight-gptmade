const test=require('node:test'),assert=require('node:assert/strict');
const {loadGame}=require('./helpers/fixture.cjs');
async function ready(){const a=await loadGame();a.el('diff').value='revenge';a.t.start();const g=a.t.getGame();g.ritual=null;g.stage='normal';return{...a,g,r:g.rippers};}
test('full unused adrenaline breaks once with native sound; active, blocked and zero hits stay silent',async()=>{
 const {t,g,r}=await ready(),events=[];t.audio.fx=n=>events.push(n);r.adrenaline=1;g.player.iframes=0;t.hurt(100/g.scale);
 assert.equal(r.adrenaline,0);assert.deepEqual(events,['adrenalineLost','damage']);t.hurt(10);assert.equal(events.length,2);
 r.adrenaline=1;r.adrenalineTime=2;g.player.iframes=0;events.length=0;t.hurt(10);assert.deepEqual(events,['damage']);assert.equal(r.adrenaline,1);
 r.adrenalineTime=0;events.length=0;t.ripperHit(g,0);assert.deepEqual(events,[]);assert.equal(r.adrenaline,1);
});
test('bonuses add to 2.85 for regular melee and partial-hit pauses accumulate',async()=>{
 const {t,g,r}=await ready();r.rage=1;r.adrenaline=1;t.activateRipper('rage');t.activateRipper('adrenaline');assert.equal(t.ripperDamage(g),2.85);
 const target={hp:1000};t.hitTarget(target,100,0,0,'#fff','melee',false);assert.equal(target.hp,145,'ordinary-melee2.85 Rippers multiplied by explicit3x local warrior balance');
 r.rageTime=0;r.adrenalineTime=0;r.adrenaline=.9;r.pause=.4;t.ripperHit(g,1);assert.equal(r.pause,1.4);
});
test('base charge rates and active durations stay independent of FPS',async()=>{
 for(const fps of [30,60,120]){const {t,g,r}=await ready();g.boss.x=g.player.x+100;g.boss.y=g.player.y;
 for(let i=0;i<15*fps;i++){g.t+=1/fps;t.updateRippers(1/fps,g);}assert.ok(Math.abs(r.rage-1)<1e-9);assert.ok(Math.abs(r.adrenaline-.5)<1e-9);
 for(let i=0;i<15*fps;i++){g.t+=1/fps;t.updateRippers(1/fps,g);}assert.equal(r.adrenaline,1);assert.equal(t.activateRipper('rage'),true);assert.equal(t.activateRipper('adrenaline'),true);
 for(let i=0;i<9*fps;i++){g.t+=1/fps;t.updateRippers(1/fps,g);}assert.equal(r.rageTime,0);assert.equal(r.adrenalineTime,0);
 }
});
test('player effects have bounded native particles, pause safely and do not consume combat RNG',async()=>{
 const a=await ready(),b=await ready();const {t,g,r}=a;r.rage=1;r.adrenaline=1;t.activateRipper('rage');t.activateRipper('adrenaline');
 assert.equal(typeof t.updateRipperVisuals,'function');for(let i=0;i<180;i++){g.t+=1/60;t.updateRipperVisuals(g,1/60);}assert.ok(r.visuals.particles.length>0&&r.visuals.particles.length<=120);assert.ok(r.visuals.pulses.length<=4);
 assert.equal(a.sandbox.Math.random(),b.sandbox.Math.random());const before=JSON.stringify(r.visuals);g.mode='paused';t.updateRipperVisuals(g,1);assert.equal(JSON.stringify(r.visuals),before);
});
test('minions grant ordinary proximity rage and multiple worm segments never stack',async()=>{
 const {t,g,r}=await ready();g.boss.x=g.player.x+2000;g.boss.y=g.player.y;
 g.brothers=[{x:g.player.x+20,y:g.player.y,hp:100,r:30}];t.updateRippers(1,g);assert.ok(Math.abs(r.rage-1/45)<1e-9);
 r.rage=0;g.brothers=[];g.stage='hearts';g.hearts=[{x:g.player.x+20,y:g.player.y,hp:100,r:12}];t.updateRippers(1,g);assert.ok(Math.abs(r.rage-1/45)<1e-9);
 r.rage=0;g.hearts[0].x=g.player.x+1500;g.sepulcher={x:g.player.x+1500,y:g.player.y,nodes:Array.from({length:52},()=>({x:g.player.x+10,y:g.player.y}))};t.updateRippers(1,g);assert.ok(Math.abs(r.rage-1/45)<1e-9);
});
