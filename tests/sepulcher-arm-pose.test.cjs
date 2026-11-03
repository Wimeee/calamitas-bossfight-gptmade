const test=require('node:test'),assert=require('node:assert/strict');
const {loadGame}=require('./helpers/fixture.cjs');
class LoadedImage{set src(url){this.url=String(url);this.width=this.naturalWidth=64;this.height=this.naturalHeight=64;this.onload?.();}}
const close=(a,b)=>assert.ok(Math.abs(a-b)<1e-7,`${a} != ${b}`);
async function fixture(){
 const calls=[],stack=[];let pose={x:0,y:0,angle:0,sx:1,sy:1};
 const {t}=await loadGame({Image:LoadedImage,canvasContext:{globalAlpha:1,
  save(){stack.push({...pose,alpha:Object.getOwnPropertyDescriptor(this,'globalAlpha').value});},
  restore(){const saved=stack.pop();pose=saved;this.globalAlpha=saved.alpha;},
  translate(x,y){pose.x+=x;pose.y+=y;},rotate(angle){pose.angle+=angle;},scale(x,y){pose.sx*=x;pose.sy*=y;},
  drawImage(image,...rect){if(image.url?.includes('/Sepulcher'))calls.push({url:image.url,rect,...pose});}
 }});
 await t.initializeMinionAtlas();t.start();t.enter('hearts','opening','TEST');
 for(let i=0;i<20;i++)t.updateMinions(1/60);
 calls.length=0;return {t,g:t.getGame(),calls};
}
test('production arm centers use native ahead/side factors for both mirrored directions',async()=>{
 const {t,g}=await fixture(),w=g.sepulcher;
 assert.equal(w.arms.length,24);assert.equal(w.arms[0].segmentIndex,4);
 for(const rotation of [-.55,.77]){
  for(const arm of w.arms)arm.rotation=rotation;
  t.updateMinions(1/60);
  for(const arm of w.arms){
   close(arm.poseRotation,rotation);
   const n=w.nodes[arm.segmentIndex],u=Math.max(0,Math.min(1,(rotation+.51)/.45));
   const forward=n.rotation+rotation*arm.direction-Math.PI/2,side=forward+Math.PI/2*arm.direction;
   close(arm.poseX,n.x+1.35*((284+396*u)*Math.cos(forward)+(200-182*u)*Math.cos(side)));
   close(arm.poseY,n.y+1.35*((284+396*u)*Math.sin(forward)+(200-182*u)*Math.sin(side)));
  }
 }
});
test('actual draw preserves every segment type, native pivots/flips, and repeated rendering never mutates game',async()=>{
 const {t,g,calls}=await fixture(),before=JSON.stringify(g);t.drawSepulcher(g);
 assert.equal(JSON.stringify(g),before);
 for(const part of ['Head','Tail','Body','BodyAlt','BodyEnergyBall','Arm','Forearm','Hand'])assert.ok(calls.some(c=>c.url.endsWith(`/Sepulcher${part}.png`)),part+' must draw');
 const arms=calls.filter(c=>c.url.endsWith('/SepulcherArm.png')),hands=calls.filter(c=>c.url.endsWith('/SepulcherHand.png'));
 assert.equal(arms.length,24);assert.equal(hands.length,24);
 for(const c of arms){close(c.rect[4],-10*1.35);close(c.rect[5],0);assert.equal(c.sy,-1);}
 for(const c of hands){close(c.rect[4],-17*1.35);close(c.rect[5],0);}
 assert.equal(hands.filter(c=>c.sx===-1).length,12);
 const first=JSON.stringify(calls);calls.length=0;t.drawSepulcher(g);
 assert.equal(JSON.stringify(calls),first);assert.equal(JSON.stringify(g),before);
});
test('actual head draw interpolates between fixed-tick snapshots using the shortest angle across Pi',async()=>{
 const {t,g,calls}=await fixture(),w=g.sepulcher;
 Object.assign(w._renderPrev.head,{x:0,y:0,rotation:3.1,alpha:0});
 Object.assign(w._renderCurr.head,{x:10,y:20,rotation:-3.1,alpha:0});
 for(const [fraction,x,y,angle] of [[0,0,0,3.1],[.5,5,10,Math.PI],[1,10,20,2*Math.PI-3.1]]){
  g.sepulcherStepRemainder=fraction/60;calls.length=0;t.drawSepulcher(g);
  const head=calls.find(c=>c.url.endsWith('/SepulcherHead.png'));close(head.x,x);close(head.y,y);close(head.angle,angle);
 }
});
