const test=require('node:test'),assert=require('node:assert/strict'),fs=require('fs');const {fileURLToPath}=require('node:url');const {loadGame}=require('./helpers/fixture.cjs');
class NativeImage{set src(url){this.url=url;const b=fs.readFileSync(fileURLToPath(url));this.width=this.naturalWidth=b.readUInt32BE(16);this.height=this.naturalHeight=b.readUInt32BE(20);this.onload();}}
test('ordinary Ark swing has nine native glow afterimages after10native ticks',async()=>{
 const calls=[];const {t}=await loadGame({Image:NativeImage,canvasContext:{drawImage:(img,...args)=>calls.push({url:img.url,args})}});await t.initializeNativeArk();t.start();t.enter('normal','opening');const g=t.getGame();t.setPointer({x:700,y:300});t.fireArk();const s=g.player.swing,pose=t.arkSwingGeometry(s,.75,g.player);calls.length=0;t.drawNativeArkTrail(g,s,pose.angle,.75);
 assert.equal(calls.filter(c=>c.url?.includes('ark-right-glow')).length,9);
});
test('source constellation is stable between15tick swaps and follows owner translation without waving',async()=>{
 const {t}=await loadGame();t.start();const g=t.getGame(),s={x:g.player.x+600,y:g.player.y,max:140/120,age:140/120*.25+.05,initialAngle:0};
 const a=t.arkConstellationLayout(g,s);assert.ok(a.nodes.length>=3&&a.nodes.length<=12);assert.ok(a.nodes.every(n=>n.scale>=1&&n.scale<=1.5));
 s.x+=100;s.age+=.01;const b=t.arkConstellationLayout(g,s);assert.equal(a.nodes,b.nodes);g.player.x+=30;const c=t.arkConstellationLayout(g,s);assert.equal(c.origin.x,a.origin.x+30);assert.equal(c.nodes,a.nodes);
 s.age+=.25;const d=t.arkConstellationLayout(g,s);assert.notEqual(d.nodes,a.nodes);
});
test('native BigRip scissors disappear after hold40percent and parry gauge follows340tick recharge',async()=>{
 const {t}=await loadGame();const r={max:70/60,time:70/60,x:100,y:300,ex:460,ey:300};let pose=t.nativeRipPose(r);assert.ok(pose.alpha>0);r.time=70/60-32/60;pose=t.nativeRipPose(r);assert.equal(pose.alpha,0);
 assert.equal(t.parryRechargeState({arkParryCd:340/60}),null);let gauge=t.parryRechargeState({arkParryCd:340/60-.5});assert.ok(gauge.progress>0&&gauge.alpha>0);gauge=t.parryRechargeState({arkParryCd:.05});assert.ok(gauge.progress>.98&&gauge.alpha<.5);assert.equal(t.parryRechargeState({arkParryCd:0}),null);
});
