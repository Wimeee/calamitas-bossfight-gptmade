const test=require('node:test'),assert=require('node:assert/strict'),fs=require('fs');
const {fileURLToPath}=require('node:url'),{loadGame}=require('./helpers/fixture.cjs');
test('native moving wave is drawn at its collision position and fading fireblast keeps the same alpha',async()=>{
 class NativeImage{set src(url){const b=fs.readFileSync(fileURLToPath(url));this.width=this.naturalWidth=b.readUInt32BE(16);this.height=this.naturalHeight=b.readUInt32BE(20);this.onload();}}
 const positions=[],alphas=[],stack=[];let ctx;
 const {t}=await loadGame({Image:NativeImage,canvasContext:{translate:(x,y)=>positions.push([x,y]),save(){stack.push(this.globalAlpha);},restore(){this.globalAlpha=stack.pop();},drawImage(){alphas.push(this.globalAlpha);},getImageData:(x,y,w,h)=>({data:new Uint8ClampedArray(w*h*4)})}});ctx=t.ctx;ctx.globalAlpha=1;
 await t.initializeEncounterProjectileAtlas();t.start();t.settings.quality='low';const g=t.getGame();
 const wave=t.enemyBullet(400,310,1,0,300,15,'skull',43);Object.assign(wave,{sourceCalamitas:true,t:.7,opacity:.4});
 t.drawEnemyProjectiles(g);assert.deepEqual(positions.at(-1),[wave.x,wave.y]);assert.equal(alphas.at(-1),.4);
 g.projectiles=[];const fire=t.enemyBullet(500,300,1,0,300,18,'fire',38);Object.assign(fire,{sourceCalamitas:true,opacity:.25});
 t.drawEnemyProjectiles(g);assert.equal(alphas.at(-1),.25);
});
test('both phases traverse the complete 24-step native attack route',async()=>{
 for(const second of [false,true]){
  const {t}=await loadGame();t.start();t.enter('normal','opening','ROUTE');const g=t.getGame();g.player.iframes=999;
  if(second)g.thresholds.add('40');
  const route=['darts','hellblast','giga','dash','dash','giga','hellblast','darts','dash','darts','hellblast','giga','giga','hellblast','dash','darts','giga','giga','dash','dash','darts','dash','darts','dash'];
  for(let index=0;index<route.length;index++){
   const act=route[index],ticks=act==='dash'?(second?70:140):act==='hellblast'?(second?300:480):(second?240:300);
   for(let tick=0;tick<ticks;tick++){g.t+=1/60;t.bossAttack(1/60);g.projectiles=[];}
   assert.equal(g.attackIndex,index+1,`${second?'II':'I'} attack ${index}: ${act}`);
   assert.ok(Number.isFinite(g.boss.x)&&Number.isFinite(g.boss.y));
  }
 }
});
test('actual phase route reaches both worms, brothers, seekers and acceptance without stale attacks or casts',async()=>{
 const {t}=await loadGame();t.start();const g=t.getGame();g.player.iframes=999;
 function endHell(n){assert.equal(g.phaseN,n);g.stageT=15;t.bulletHell(0);if(g.castDelayState)t.getEncounter().update(g.castDelayState.remaining+1e-8);}
 function hearts(){assert.equal(g.hearts.length,10);g.hearts.forEach(h=>h.hp=0);t.updateBullets(0);assert.equal(g.stage,'normal');assert.equal(g.calamitasAI,null);}
 function hp(value){g.boss.hp=g.boss.max*value;t.transitionCalamitas(g);if(g.castDelayState)t.updatePhaseTransitions(0,g);}
 endHell(1);hearts();hp(.75);endHell(2);assert.equal(g.stage,'normal');hp(.5);endHell(3);
 assert.equal(g.brothers.length,2);g.brothers.forEach(b=>b.hp=0);t.updateBullets(0);assert.equal(g.phase2Intro,200/60);
 t.bossAttack(200/60+1e-8);assert.equal(g.projectiles.length,0);
 hp(.3);endHell(4);hp(.2);assert.equal(g.seekers.length,10);
 g.seekers.forEach(s=>s.hp=0);t.updateBullets(0);assert.equal(g.stage,'normal');
 hp(.1);endHell(5);hearts();g.boss.hp=1;t.transitionCalamitas(g);assert.equal(g.stage,'accept');assert.equal(g.projectiles.length,0);assert.equal(g.maelstrom,null);
});
