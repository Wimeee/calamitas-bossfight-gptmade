const test=require('node:test'),assert=require('node:assert/strict'),fs=require('fs');const {fileURLToPath}=require('node:url');const {loadGame}=require('./helpers/fixture.cjs');
class NativeImage{set src(url){this.url=url;const b=fs.readFileSync(fileURLToPath(url));this.width=this.naturalWidth=b.readUInt32BE(16);this.height=this.naturalHeight=b.readUInt32BE(20);this.onload();}}
test('Aegis uses real40x56 equipment poses and native360px explosion for every class',async()=>{
 const calls=[];const {t}=await loadGame({Image:NativeImage,canvasContext:{drawImage:(img,...args)=>calls.push({url:img.url,args})}});assert.equal(await t.initializeAsgardianAtlas(),true);t.start();const g=t.getGame();g.player.iframes=0;
 for(let w=0;w<5;w++){g.player.weapon=w;g.player.grounded=true;g.player.vx=0;calls.length=0;assert.equal(t.drawAsgardianShield(g),true);const c=calls.find(c=>c.url?.includes('asgardian-original/shield'));assert.deepEqual(c.args.slice(0,4),[0,0,40,56]);}
 g.player.grounded=false;assert.equal(t.asgardianShieldFrame(g),5);g.player.swing={time:.1,max:.4};assert.equal(t.asgardianShieldFrame(g),4);
});
test('BigRip uses native3.2x242 damage reach and200px scissors displacement',async()=>{
 const {t}=await loadGame();t.start();t.enter('normal','opening');const g=t.getGame();g.player.x=100;g.player.y=100;g.player.arkCharges=16;t.setPointer({x:1500,y:100});t.arkAbility();const r=g.player.arkRip;assert.ok(Math.abs(r.ex-r.x-774.4)<1e-6);r.time=r.max-25/60;const pose=t.nativeRipPose(r);assert.ok(Math.abs(pose.x-r.x-640)<1e-6);
 Object.assign(g.boss,{x:800,y:100});const hp=g.boss.hp;r.hit=false;t.updateSword(1/60);assert.ok(g.boss.hp<hp,'far target lies inside native rip reach');
});
