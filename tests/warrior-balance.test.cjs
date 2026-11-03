const test=require('node:test'),assert=require('node:assert/strict');const {loadGame}=require('./helpers/fixture.cjs');
test('local warrior tuning multiplies outgoing attacks, preserves other classes and shared Aegis',async()=>{
 const {t}=await loadGame();t.start();t.enter('normal','opening');const g=t.getGame();
 for(const index of [0,1,2,3,4]){g.player.weapon=index;let hp=g.boss.hp;t.hitTarget(g.boss,100,0,0,'#fff','melee',false);assert.ok(Math.abs(hp-g.boss.hp-(index===0?216:72))<1e-6);
  hp=g.boss.hp;t.hitTarget(g.boss,100,0,0,'#fff','shield',false);assert.ok(Math.abs(hp-g.boss.hp-72)<1e-6,'shield identical for all classes');
 }
});
test('warrior balance preserves invulnerable stages and boss phase floor',async()=>{
 const {t}=await loadGame();t.start();t.enter('hell','h75');const g=t.getGame(),hp=g.boss.hp;t.hitTarget(g.boss,1e9,0,0,'#fff','melee',false);assert.equal(g.boss.hp,hp);
 t.enter('normal','opening');t.hitTarget(g.boss,1e9,0,0,'#fff','melee',false);assert.equal(g.boss.hp,1);
});
