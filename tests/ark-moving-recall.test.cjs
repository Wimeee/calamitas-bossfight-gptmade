const test=require('node:test'),assert=require('node:assert/strict');const{loadGame}=require('./helpers/fixture.cjs');
test('early Ark recall finishes while player keeps running or flying and primary can attack immediately',async()=>{
 const{t}=await loadGame();
 for(const speed of [330,690,-690]){
 t.start();t.enter('normal','opening','TEST');const g=t.getGame(),p=g.player;
 Object.assign(p,{x:400,y:320,combo:4});g.boss.x=4000;t.setPointer({x:400-Math.sign(speed)*900,y:320,fire:false});t.fireArk();
 for(let i=0;i<12;i++){g.t+=1/120;t.updateSword(1/120);}
 const throwState=p.arkThrow;t.releaseArk();assert.equal(throwState.returning,true);assert.equal(throwState.snapped,false);
 for(let i=0;i<90&&p.arkThrow;i++){p.x+=speed/120;g.t+=1/120;t.updateSword(1/120);}
 assert.equal(p.arkThrow,null,'recall cannot chase the moving player indefinitely at '+speed);
 p.fireCd=0;t.fireArk();assert.ok(p.swing,'primary attack is usable again while still moving');
 }
});
