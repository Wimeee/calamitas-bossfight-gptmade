const test=require('node:test'),assert=require('node:assert/strict');const {loadGame}=require('./helpers/fixture.cjs');
async function scene(){const a=await loadGame();a.t.start();a.t.enter('hearts','opening','TEST');for(let i=0;i<20;i++)a.t.updateMinions(1/60);return {...a,g:a.t.getGame()};}
test('worm ticks reuse both independent render snapshots while updating their values',async()=>{
 const {t,g}=await scene(),w=g.sepulcher,prev=w._renderPrev,curr=w._renderCurr,oldNode=curr.nodes[0],oldArm=curr.arms[0];
 const before={x:w.x,y:w.y,nodeX:w.nodes[0].x,armX:w.arms[0].poseX};t.updateMinions(1/60);
 assert.equal(w._renderPrev,prev);assert.equal(w._renderCurr,curr);assert.notEqual(prev,curr);
 assert.equal(curr.nodes[0],oldNode);assert.equal(curr.arms[0],oldArm);
 assert.equal(prev.head.x,before.x);assert.equal(prev.head.y,before.y);assert.equal(prev.nodes[0].x,before.nodeX);assert.equal(prev.arms[0].x,before.armX);
 assert.equal(curr.head.x,w.x);assert.equal(curr.nodes[0].x,w.nodes[0].x);assert.equal(curr.arms[0].x,w.arms[0].poseX);
});
test('worm draws without spreading nodes or allocating filtered arm lists, and leaves simulation untouched',async()=>{
 const {t,g}=await scene(),w=g.sepulcher;let spreads=0,filters=0;
 w.nodes=w.nodes.map(n=>new Proxy(n,{ownKeys:o=>{spreads++;return Reflect.ownKeys(o);}}));
 const filter=w.arms.filter.bind(w.arms);w.arms.filter=(...args)=>{filters++;return filter(...args);};
 const before=JSON.stringify(g);spreads=0;
 for(const fraction of [0,.5,1]){g.sepulcherStepRemainder=fraction/60;t.drawSepulcher(g);}
 assert.equal(spreads,0);assert.equal(filters,0);
 g.sepulcherStepRemainder=0;assert.equal(JSON.stringify(g),before);
});
