const test=require('node:test'),assert=require('node:assert/strict');const {loadGame}=require('./helpers/fixture.cjs');
test('both native heart summons form mirrored200px diagonals in Expert, Revengeance and Death',async()=>{
 const {t,el}=await loadGame();for(const diff of ['normal','revenge','death'])for(const marker of ['opening','sep2']){
  el('diff').value=diff;t.start();const g=t.getGame();Object.assign(t.arena,{l:-2000,r:3000,t:-2500,b:400});t.enter('hearts',marker);const size=diff==='death'?1000:1250,top=300-size+250-(diff==='death'?50:0),step=diff==='death'?100:125;
  const hearts=[...g.hearts].sort((a,b)=>a.y-b.y||a.x-b.x);assert.equal(hearts.length,10);
  for(let i=0;i<5;i++){const left=hearts[2*i],right=hearts[2*i+1];assert.equal(left.x,500-size+50+200*i);assert.equal(right.x,500+size-50-200*i);assert.equal(left.y,top+step*i);assert.equal(right.y,left.y);assert.equal(left.hp,10800);assert.equal(right.hp,10800);}
 }
});
test('last summon-cast paths end at exactly the same native positions as real hearts',async()=>{
 const {t,el}=await loadGame();for(const diff of ['normal','death']){el('diff').value=diff;t.start();const g=t.getGame();t.enter('hearts','opening');g.calamitasEffects=[];
  t.updateSummonCast(1/60,g,{type:'sepulcher',remaining:1/60,fxTicks:1});const endpoints=g.calamitasEffects.filter(p=>p.kind==='point');assert.equal(endpoints.length,10);
  for(const h of g.hearts)assert.ok(endpoints.some(p=>Math.abs(p.x-h.x)<1e-8&&Math.abs(p.y-h.y)<1e-8),'cast finishes at the real heart');
 }
});
