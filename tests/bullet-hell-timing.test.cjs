const test=require('node:test'),assert=require('node:assert/strict');
const {loadGame}=require('./helpers/fixture.cjs');
async function schedule(phase,hz){
 const {t}=await loadGame();t.start();const g=t.getGame();g.phaseN=phase;g.stageT=0;g.projectiles=[];
 const events=[];let previous=0;
 for(let frame=1;frame<=hz*14;frame++){
  g.t=g.stageT=frame/hz;t.bulletHell(1/hz);
  for(const q of g.projectiles.slice(previous))events.push({time:g.stageT,kind:q.kind,damage:q.damage,vx:q.vx});
  previous=g.projectiles.length;
 }
 return {events,g};
}
test('BH2-BH5 source cumulative-clock explosive schedules agree at 30/60/120 FPS',async()=>{
 for(const phase of [2,3,4,5])for(const hz of [30,60,120]){
  const {events,g}=await schedule(phase,hz);
  const check=(kind,damage,times)=>{
   const shots=events.filter(e=>e.kind===kind&&e.damage===damage);assert.equal(shots.length,times.length,`BH${phase} ${kind} at ${hz}FPS`);
   shots.forEach((e,i)=>assert.ok(Math.abs(e.time-times[i])<=1/hz+1e-8,`BH${phase} ${kind} event ${i}: ${e.time}`));return shots;
  };
  check('fire',38,phase===5?[4,8,12]:[3,6,9,12]);
  check('giga',50,phase===2?[]:phase===3?[2,6,10,14]:phase===4?[3,7,11]:[6,12]);
  check('maelstrom',100,[]);assert.equal(!!g.maelstrom,phase===4,'only BH4 spawns the real Maelstrom entity');
  const waves=check('skull',43,phase===5?Array.from({length:56},(_,i)=>(Math.floor(i/2)+1)*.5):[]);
  waves.forEach((e,i)=>assert.equal(e.vx,i%2===0?-300:300));
  assert.equal(events.filter(e=>e.damage===51).length,0,'no duplicate aimed explosive stream');
 }
});
test('native schedules catch up a long frame and no explosive schedule runs in BH1',async()=>{
 const {t}=await loadGame();t.start();const g=t.getGame();g.phaseN=3;g.stageT=g.t=10.1;t.bulletHell(10.1);
 assert.equal(g.projectiles.filter(q=>q.kind==='fire').length,3);
 assert.equal(g.projectiles.filter(q=>q.kind==='giga').length,3);
 const {events}=await schedule(1,60);assert.ok(events.every(e=>e.kind==='hellblast2'));
});
