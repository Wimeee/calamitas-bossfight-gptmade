const test=require('node:test'),assert=require('node:assert/strict');const {loadGame}=require('./helpers/fixture.cjs');
test('native right-facing artwork is mirrored only for source spriteDirection+1, in both skins',async()=>{
 class Image{set src(v){this.width=120;this.height=1302;this.onload();}}
 const {t}=await loadGame({Image});await t.initializeCalamitasAtlas();t.start();const g=t.getGame();t.enter('normal','opening');
 const flips=[],c={globalAlpha:1,save(){},restore(){},translate(){},rotate(){},scale(x){flips.push(x)},drawImage(){}};
 for(const skin of ['hooded','unhooded'])for(const [side,expected]of [[1,1],[-1,-1]]){
  g.player.x=g.boss.x+side*100;const pose=t.sampleCalamitasPose(g);pose.skin=skin;t.paintCalamitasFrame(c,pose,0,0);assert.equal(flips.at(-1),expected,skin+' must face the player, artwork points right unflipped');
 }
});
