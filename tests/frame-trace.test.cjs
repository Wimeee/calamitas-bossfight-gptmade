const test=require('node:test'),assert=require('node:assert/strict');const {loadGame}=require('./helpers/fixture.cjs');
test('trace associates a long RAF gap with previous callback work and retains only its bounded window',async()=>{
 const {t}=await loadGame();assert.equal(typeof t.createFrameTrace,'function');const trace=t.createFrameTrace(4),g={stage:'normal',t:1,player:{weapon:0},projectiles:[],shots:[]};
 trace.record(0,2,40,0,1,true,g);g.stage='hearts';trace.record(50,1,3,5,3,true,g);
 let report=trace.snapshot();assert.equal(report.worst[0].intervalMs,50);assert.equal(report.worst[0].previousDrawMs,40);assert.equal(report.worst[0].drawMs,3);
 assert.equal(report.worst[0].previousStage,'normal');assert.equal(report.worst[0].stage,'hearts');
 trace.breakSequence();trace.record(5000,1,1,0,1,true,g);assert.equal(trace.snapshot().summary.over25ms,1,'pause gap must not become a freeze');
 for(let i=1;i<=9;i++)trace.record(5000+i*10,1,2,0,1,true,g);
 report=trace.snapshot();assert.equal(report.samples,4);assert.equal(report.summary.over25ms,0);assert.equal(report.summary.p95IntervalMs,10);
 trace.reset();assert.equal(trace.snapshot().samples,0);
});
test('real loop collects separate CPU timings, preserves pause samples and isolates a new attempt',async()=>{
 const {t}=await loadGame();t.start();const g=t.getGame();g.player.iframes=999;t.state.last=1000;t.loop(1010);t.loop(1060);
 let report=t.getPerformanceReport();assert.equal(report.samples,2);assert.equal(report.worst[0].intervalMs,50);assert.match(report.version,/^\d+\.\d+\.\d+$/);
 assert.equal(report.game.classId,'melee');assert.equal(report.worst[0].stage,g.stage);
 t.togglePause();t.togglePause();t.state.last=10000;t.loop(10010);assert.equal(t.getPerformanceReport().summary.worstIntervalMs,50,'pause must break continuity even without a paused RAF');
 t.showMenu('settings');t.loop(20000);assert.equal(t.getPerformanceReport().samples,3);
 t.start();assert.equal(t.getPerformanceReport().samples,0,'previous attempt cannot leak before the first new frame');
});
test('clipboard success copies the report only on demand without changing the battle',async()=>{
 const {t,el,sandbox}=await loadGame();let copied='';sandbox.navigator.clipboard={writeText:async value=>{copied=value;}};
 t.start();t.state.last=1000;t.loop(1010);await t.copyPerformanceReport();
 assert.equal(JSON.parse(copied).samples,1);assert.equal(el('performance-report').hidden,true);assert.match(el('performance-report-status').textContent,/скопійовано/);
});
test('report export provides selectable local text when clipboard is unavailable and translates status',async()=>{
 const {t,el}=await loadGame();t.start();t.state.last=1000;t.loop(1010);t.loop(1040);t.showMenu('settings');
 const before=JSON.stringify(t.getGame());await t.copyPerformanceReport();
 assert.equal(el('performance-report').hidden,false);assert.ok(JSON.parse(el('performance-report').value).samples>0);
 assert.match(el('performance-report-status').textContent,/Скопіюй/);assert.equal(JSON.stringify(t.getGame()),before);
 t.setLocale('en');await t.copyPerformanceReport();assert.match(el('performance-report-status').textContent,/Copy/);
 t.start();await t.copyPerformanceReport();assert.equal(el('performance-report').value,'');assert.equal(el('performance-report').hidden,true);
});
