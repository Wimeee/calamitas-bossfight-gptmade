const test=require('node:test'),assert=require('node:assert/strict');
const {loadGame}=require('./helpers/fixture.cjs');
async function scene(){const a=await loadGame();a.t.start();const g=a.t.getGame();g.player.iframes=999;a.t.setKeys({d:true});a.t.state.last=1000;return {...a,g};}
test('one short stall preserves combat time and movement like equivalent shorter frames',async()=>{
 const a=await scene(),b=await scene();a.t.loop(1080);
 for(let i=1;i<=8;i++)b.t.loop(1000+i*10);
 assert.ok(Math.abs(a.g.totalTime-.08)<1e-8,'80ms gap must not silently become34ms');
 assert.ok(Math.abs(a.g.totalTime-b.g.totalTime)<1e-8);
 assert.ok(Math.abs(a.g.player.x-b.g.player.x)<1,'substepped motion remains consistent');
});
test('long stalls stay bounded, zero/negative elapsed does not move, and pause stays frozen',async()=>{
 const {t,g}=await scene();t.loop(1000);assert.equal(g.totalTime,0);t.loop(999);assert.equal(g.totalTime,0);
 t.state.last=1000;t.loop(5000);assert.ok(Math.abs(g.totalTime-.1)<1e-8);
 const time=g.totalTime;t.togglePause();t.loop(5080);assert.equal(g.totalTime,time);
});
test('visibility and fresh starts reset frame baselines without hidden-tab catch-up',async()=>{
 const {t,g,sandbox}=await scene();t.state.last=0;
 for(const listener of sandbox.document.listeners.visibilitychange||[])listener();
 t.loop(1005);assert.ok(g.totalTime<.006);
 t.state.last=-99999;t.start();assert.equal(t.state.last,1000);
});
test('catch-up stops as soon as the selected practice attack completes',async()=>{
 const {t}=await loadGame();t.start({practice:{id:'normal2',attackIndex:0,invincible:true}});
 const g=t.getGame();g.attackIndex=1;t.state.last=1000;t.loop(1080);
 assert.equal(g.mode,'won');assert.ok(g.totalTime<=1/60+1e-8,'remaining budget cannot advance a finished attempt');
});
