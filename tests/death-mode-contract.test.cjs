const test=require('node:test'),assert=require('node:assert/strict');const {loadGame}=require('./helpers/fixture.cjs');
async function setup(diff,stage='brothers'){const {t,el}=await loadGame();el('diff').value=diff;t.start();const g=t.getGame();g.player.iframes=999;t.enter(stage,stage==='brothers'?'bros':'opening');return {t,g};}
test('Death has native 1000px arena extents versus Revengeance1250 and higher incoming damage',async()=>{
 const snapshots=[];for(const diff of ['revenge','death']){const {t,g}=await setup(diff,'normal');const b=t.arenaTarget(g);snapshots.push({width:b.r-b.l,scale:g.scale});}
 assert.equal(snapshots[1].width/snapshots[0].width,.8);assert.ok(snapshots[1].scale>snapshots[0].scale);
});
test('Death brothers enter empowered phase below60percent and finish opening delay earlier than Revengeance',async()=>{
 const snapshots=[];for(const diff of ['revenge','death']){const {t,g}=await setup(diff);t.updateMinions(1/60);g.brothers[0].hp=g.brothers[0].max*.59;for(let i=0;i<120;i++)t.updateMinions(1/60);snapshots.push({empowered:g.brothers[0].nativeAI.empowered,shots:g.projectiles.length});}
 assert.equal(snapshots[0].empowered,false);assert.equal(snapshots[1].empowered,true);assert.equal(snapshots[0].shots,0);assert.ok(snapshots[1].shots>0);
});
test('only Death resurrects the opposite brother once and cannot skip directly to phaseII',async()=>{
 for(const diff of ['revenge','death']){const {t,g}=await setup(diff);t.updateMinions(1/60);g.brothers[0].hp=0;t.updateBullets(0);t.updateMinions(1/60);const last=g.brothers[0];last.nativeAI.broAlive=false;last.hp=0;t.updateBullets(0);
  if(diff==='death'){assert.equal(g.stage,'brothers');assert.equal(g.brothers.length,1);assert.equal(g.brothers[0].kind,1-last.kind);assert.equal(g.brotherRespawnAvailable,false);t.updateMinions(1/60);g.brothers[0].nativeAI.broAlive=false;g.brothers[0].hp=0;t.updateBullets(0);}
  assert.equal(g.stage,'normal');assert.equal(g.marker,'h40');
 }
});
test('native Death fireblast and gigablast burst into16and36 projectiles versus14and32',async()=>{
 for(const [diff,counts]of [['revenge',[14,32]],['death',[16,36]]]){const {t,g}=await setup(diff,'normal');for(const [i,kind]of ['fire','giga'].entries()){g.projectiles=[];t.explosion({x:0,y:0,kind,sourceCalamitas:true});assert.equal(g.projectiles.length,counts[i]);}}
});
