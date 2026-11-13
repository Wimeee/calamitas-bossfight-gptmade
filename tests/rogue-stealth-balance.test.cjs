const test=require('node:test'),assert=require('node:assert/strict');
const {loadGame}=require('./helpers/fixture.cjs');

async function scenario(charged,distance){
 const {t,el}=await loadGame({isolatedCombat:true});el('class').value='rogue';t.start();t.enter('normal','opening');
 const g=t.getGame();Object.assign(g.player,{x:400,y:400,vx:100,iframes:999});
 Object.assign(g.boss,{x:400+distance,y:400,hp:1e9,max:1e9});t.rogueState().chargeMode=charged;
 for(let i=0;i<7200;i++){
  g.boss.y=400+Math.sin(i/120*1.1)*160;
  t.setPointer({x:g.boss.x,y:g.boss.y,fire:true});t.update(1/120);
 }
 return 1e9-g.boss.hp;
}

test('a full stealth throw gives a substantial burst through the normal shooting entry point',async()=>{
 const {t,el}=await loadGame();el('class').value='rogue';t.start();t.enter('normal','opening');
 const g=t.getGame(),normal=t.rogueThrowDamage();g.player.stealth=1;t.shoot();
 const blade=g.player.kit.blades[0];assert.equal(blade.charged,true);
 assert.ok(blade.damage>=normal*3.5,'waiting for stealth must buy a meaningful single-hit burst');
 assert.equal(g.player.stealth,.5);
 assert.ok(g.floaters.some(f=>f.text==='STEALTH STRIKE'));
});

test('charged mode pays for its recharge against a moving target at ordinary fight distances',async context=>{
 for(const distance of [400,800]){
  const spam=await scenario(false,distance),stealth=await scenario(true,distance);
  context.diagnostic(JSON.stringify({distance,spam:Math.round(spam),stealth:Math.round(stealth),ratio:Number((stealth/spam).toFixed(3))}));
  assert.ok(stealth>spam*1.1,JSON.stringify({distance,spam,stealth,ratio:stealth/spam}));
  assert.ok(stealth<spam*1.7,'charged play remains within the same encounter damage budget');
 }
});
