const test=require('node:test'),assert=require('node:assert/strict');
const {loadGame}=require('./helpers/fixture.cjs');
test('native explosive hit cannot swallow the scheduled radial burst',async()=>{
 const {t}=await loadGame();t.start();t.enter('normal','opening','PERSISTENCE');const g=t.getGame(),p=g.player;p.iframes=0;
 const q=t.enemyBullet(p.x,p.y,0,0,0,18,'fire',54);Object.assign(q,{sourceCalamitas:true,detonating:true,nativeLife:60,opacity:1,life:1});
 const hp=p.hp;t.updateBullets(1/60);assert.ok(p.hp<hp);assert.ok(g.projectiles.includes(q),'source penetrate=-1: contact must not delete the fireball');
 for(let i=0;i<60;i++)t.updateBullets(1/60);
 assert.ok(!g.projectiles.includes(q));assert.equal(g.projectiles.filter(s=>s.kind==='dart').length,12,'the native Expert burst still happens');
});
