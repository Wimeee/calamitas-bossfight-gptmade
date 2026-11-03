const test=require('node:test'),assert=require('node:assert/strict');
const {loadGame}=require('./helpers/fixture.cjs');
test('native rage/adrenaline cues fire once on readiness and actual activation',async()=>{
 const {t,el}=await loadGame();el('diff').value='revenge';t.start();const g=t.getGame();g.ritual=null;g.stage='normal';const r=g.rippers,events=[];t.audio.fx=name=>events.push(name);
 g.boss.x=g.player.x+40;g.boss.y=g.player.y;r.rage=.999;r.adrenaline=.999;t.updateRippers(1,g);
 assert.deepEqual(events,['rageReady','adrenalineReady']);t.updateRippers(.01,g);assert.equal(events.length,2);
 assert.equal(t.activateRipper('rage'),true);assert.equal(t.activateRipper('adrenaline'),true);assert.deepEqual(events.slice(2),['rageActivate','adrenalineActivate']);
 assert.equal(t.activateRipper('rage'),false);assert.equal(events.length,4);
 t.applyPlayerHex(g,4);t.finish(false);assert.equal(Object.keys(g.player.debuffs).length,0);
});
test('damage popups show actually inflicted damage and DoT respects Death scaling',async()=>{
 const {t,el}=await loadGame();el('diff').value='death';t.start();const g=t.getGame();g.ritual=null;g.stage='normal';
 const target={x:600,y:400,hp:12,max:100};t.hitTarget(target,100,600,400,'#fff');assert.equal(target.hp,0);assert.equal(g.floaters.at(-1).text,'12');
 const hp=g.player.hp;t.applyPlayerHex(g,4);for(let i=0;i<240;i++)t.updatePlayerDebuffs(g,1/60);assert.equal(g.player.hp,hp-75);assert.equal(g.player.debuffs.hex,undefined);
});
