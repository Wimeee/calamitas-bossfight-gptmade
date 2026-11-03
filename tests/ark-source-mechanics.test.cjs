const test=require('node:test'),assert=require('node:assert/strict');
const {loadGame}=require('./helpers/fixture.cjs');
test('Ark source clocks, long throw, delayed single Big Rip and parry combo reset',async()=>{
 const {t}=await loadGame();
 const fresh=()=>{t.start();t.enter('normal','opening','TEST');const g=t.getGame();Object.assign(g.player,{x:400,y:320,iframes:0});Object.assign(g.boss,{x:600,y:320});t.setPointer({x:1600,y:320,fire:false});return g;};
 let g=fresh();t.fireArk();assert.equal(g.player.swing.max,35/120);
 g=fresh();g.player.combo=1;t.fireArk();assert.equal(g.player.swing.max,55/120);
 g=fresh();g.player.combo=4;t.fireArk();assert.equal(g.player.arkThrow.max,140/120);g.t+=.25;t.updateSword(.25);
 assert.ok(g.player.arkThrow.x-g.player.x>600);assert.ok(g.player.arkThrow.x-g.player.x<=760);
 g=fresh();g.player.arkCharges=16;const hp=g.boss.hp;t.arkAbility();assert.equal(g.boss.hp,hp);assert.equal(g.player.arkRip.max,70/60);
 t.updateSword(.4);assert.equal(g.boss.hp,hp);t.updateSword(.03);assert.ok(g.boss.hp<hp);assert.equal(g.shots.filter(s=>s.id==='arkStar').length,5);
 const after=g.boss.hp;t.updateSword(.1);assert.equal(g.boss.hp,after);
 g=fresh();g.boss.x=490;g.player.combo=3;t.arkAbility();t.updateSword(.01);assert.equal(g.player.arkCharges,16);assert.equal(g.player.combo,0);
});
