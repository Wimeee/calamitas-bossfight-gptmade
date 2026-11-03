const test=require('node:test'),assert=require('node:assert/strict');
const {loadGame}=require('./helpers/fixture.cjs');
test('boss immunity is enforced by damage, including transition, summons and Bullet Hell',async()=>{
 const {t}=await loadGame();t.start();let g=t.getGame();
 for(const stage of ['hell','hearts','brothers','seekers','accept']){
  t.enter(stage,'opening','IMMUNITY');const hp=g.boss.hp;t.hitTarget(g.boss,5000,g.boss.x,g.boss.y,'#fff');assert.equal(g.boss.hp,hp,stage);
 }
 t.start();g=t.getGame();
 t.enter('normal','h40','TRANSITION');g.thresholds.add('40');g.phase2Intro=200/60;const hp=g.boss.hp;
 assert.equal(t.possibleTargets().length,0);t.hitTarget(g.boss,5000,g.boss.x,g.boss.y,'#fff');assert.equal(g.boss.hp,hp);
 for(let i=0;i<202;i++)t.bossAttack(1/60);
 assert.equal(t.possibleTargets()[0],g.boss);t.hitTarget(g.boss,5000,g.boss.x,g.boss.y,'#fff');assert.ok(g.boss.hp<hp);
});
