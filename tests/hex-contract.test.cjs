const test=require('node:test'),assert=require('node:assert/strict');const {loadGame}=require('./helpers/fixture.cjs');
test('all native projectile families map to source Hex durations',async()=>{
 const {t}=await loadGame();for(const [kind,seconds]of [['dart',3],['hellblast',3],['hellblast2',3],['skull',2],['wave',2],['fire',4],['giga',5]])assert.equal(t.projectileHexDuration({kind,sourceCalamitas:true}),seconds,kind);
 assert.equal(t.projectileHexDuration({kind:'sepulcherDart',ai0:0}),3);assert.equal(t.projectileHexDuration({kind:'fist',nativeBrother:true}),0);assert.equal(t.projectileHexDuration({kind:'slash',nativeBrother:true}),0);assert.equal(t.projectileHexDuration({kind:'dart'}),0);
});
test('actual BH5 wave hit applies120tick Hex; protected hit applies none',async()=>{
 for(const immune of [false,true]){
  const {t}=await loadGame();t.start();const g=t.getGame();g.phaseN=5;g.stageT=.5;t.bulletHell(.5);const q=g.projectiles.find(q=>q.kind==='skull');assert.ok(q);
  g.projectiles=[q];Object.assign(q,{x:g.player.x,y:g.player.y,vx:0,vy:0,sourceTicks:60,opacity:1});g.player.iframes=immune?1:0;
  t.updateBullets(1/60);assert.equal(g.player.debuffs?.hex?.remaining,immune?undefined:2);
 }
});
test('shorter Hex never replaces longer remaining duration; refresh preserves fractional damage carry',async()=>{
 const {t}=await loadGame();t.start();const g=t.getGame();t.applyPlayerHex(g,5);t.updatePlayerDebuffs(g,.01);const old=g.player.debuffs.hex,carry=old.carry;
 t.applyPlayerHex(g,2);assert.equal(g.player.debuffs.hex,old);assert.equal(old.remaining,4.99);
 t.applyPlayerHex(g,5);assert.equal(g.player.debuffs.hex.remaining,5);assert.equal(g.player.debuffs.hex.carry,carry);
});
test('Hex freezes on pause, expires consistently across FPS and does not count DOT as fresh projectile hits',async()=>{
 for(const hz of [30,60,120]){
  const {t}=await loadGame();t.start();const g=t.getGame(),p=g.player,hp=p.hp,hits=p.hits;t.applyPlayerHex(g,2);g.mode='paused';t.updatePlayerDebuffs(g,1);assert.equal(p.debuffs.hex.remaining,2);assert.equal(p.hp,hp);
  g.mode='playing';for(let i=0;i<2*hz;i++)t.updatePlayerDebuffs(g,1/hz);
  assert.equal(p.debuffs.hex,undefined);assert.equal(p.hp,hp-30);assert.equal(p.hits,hits);
 }
});
