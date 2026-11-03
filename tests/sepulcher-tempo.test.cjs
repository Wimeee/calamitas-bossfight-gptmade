const test=require('node:test'),assert=require('node:assert/strict');
const {loadGame}=require('./helpers/fixture.cjs');
test('Sepulcher ramps up without an initial speed snap and uses the slower browser movement tempo',async()=>{
 const paths=[];
 for(const hz of [30,60,120]){
  const {t}=await loadGame();t.start();t.enter('hearts','opening','TEST');const g=t.getGame();
  t.updateMinions(0);let previousSpeed=0,maximum=0;
  for(let i=0;i<hz*3;i++){
   t.updateMinions(1/hz);const w=g.sepulcher,speed=Math.hypot(w.vx,w.vy);maximum=Math.max(maximum,speed);
   if(i<hz*.45)assert.ok(Math.abs(speed-previousSpeed)<100,`unexpected startup speed snap at ${hz}FPS: ${previousSpeed} -> ${speed}`);
   previousSpeed=speed;
  }
  const w=g.sepulcher;assert.ok(maximum<1200,'adapted head speed remains below the previous 1200px/s baseline');
  assert.equal(w.nodes.length,52);assert.equal(w.headScale,1.6875);assert.equal(w.bodyScale,1.35);
  paths.push([w.x,w.y,w.vx,w.vy]);
 }
 for(let i=1;i<paths.length;i++)paths[0].forEach((n,j)=>assert.ok(Math.abs(n-paths[i][j])<1e-7));
});