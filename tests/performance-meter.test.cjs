const test=require('node:test'),assert=require('node:assert/strict');const {loadGame}=require('./helpers/fixture.cjs');
test('FPS uses raw frame intervals and retains the slowest frame across normal display windows',async()=>{
 const {t}=await loadGame();assert.equal(typeof t.createFrameMeter,'function');const meter=t.createFrameMeter();meter.sample(0);
 for(let i=1;i<=120;i++)meter.sample(i*1000/120);let s=meter.status();assert.ok(Math.abs(s.fps-120)<1);assert.ok(Math.abs(s.minFPS-120)<1);
 meter.sample(1050);for(let i=1;i<=120;i++)meter.sample(1050+i*1000/120);s=meter.status();assert.equal(Math.round(s.minFPS),20);assert.ok(Math.abs(s.fps-120)<1,'minimum does not distort current FPS forever');
});
test('pause and hidden-tab gaps do not count; a new attempt resets minimum',async()=>{
 const {t}=await loadGame();const m=t.createFrameMeter();m.sample(0);m.sample(50);m.sample(5000,false);m.sample(10000);m.sample(10010);assert.equal(Math.round(m.status().minFPS),20);m.reset();m.sample(11000);m.sample(11010);assert.equal(m.status().minFPS,100);
});
test('real menu lifecycle excludes its idle gap from the attempt minimum',async()=>{
 const {t,el}=await loadGame();t.updateSettings({showFPS:true});t.start();t.updateFPSCounter(0);for(let i=1;i<=60;i++)t.updateFPSCounter(i*10);t.showMenu();t.loop(700);t.resumeBattle();t.updateFPSCounter(10000);t.updateFPSCounter(10010);assert.match(el('fps-counter').textContent,/Найнижчий FPS: 100/);
});
test('visibility events exclude background time even if no animation frame fires while hidden',async()=>{
 const {t,el,sandbox}=await loadGame();t.start();for(let i=0;i<=60;i++)t.updateFPSCounter(i*10);for(const hidden of [true,false]){sandbox.document.hidden=hidden;for(const callback of sandbox.document.listeners.visibilitychange)callback();}t.updateFPSCounter(10000);t.updateFPSCounter(10010);assert.match(el('fps-counter').textContent,/Найнижчий FPS: 100/);
});
test('FPS setting persists and checkbox updates a bilingual overlay without changing combat state',async()=>{
 const storage=new Map(),{t,el}=await loadGame({storage});assert.equal(t.settings.showFPS,true);t.updateSettings({showFPS:true});assert.equal(el('setting-fps').checked,true);t.start();const g=t.getGame(),before=JSON.stringify(g);for(let i=0;i<=65;i++)t.updateFPSCounter(i*1000/120);
 assert.equal(el('fps-counter').hidden,false);assert.match(el('fps-counter').textContent,/120/);assert.equal(JSON.stringify(g),before);
 t.setLocale('en');t.updateFPSCounter(600);assert.match(el('fps-counter').textContent,/Lowest FPS/);t.updateSettings({showFPS:false});assert.equal(el('fps-counter').hidden,true);const next=await loadGame({storage});assert.equal(next.t.settings.showFPS,false);
});
