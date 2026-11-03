const test=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),{fileURLToPath}=require('node:url');
const {loadGame}=require('./helpers/fixture.cjs');
const loaded=loadGame();
const near=(a,b)=>assert.ok(Math.abs(a-b)<1e-9,`${a} != ${b}`);

test('production shield geometry follows source anchors, flip and jaw angles',async()=>{
  const {t}=await loaded;
  for(const [angle,cx,cy,jx,jy] of [[0,24,0,24,42],[Math.PI,-24,0,-24,42],[Math.PI/2,0,24,-42,24],[-Math.PI/2,0,-24,42,-24]]){
    const g=t.computeChargeShieldGeometry(angle,0,1,0);
    near(g.shieldCenterX,cx);near(g.shieldCenterY,cy);near(g.jawDrawX,jx);near(g.jawDrawY,jy);
    near(g.topRot,angle);near(g.bottomRot,angle+(g.flipVertically?-.71:.71));
    near(Math.hypot(g.jawDrawX-cx,g.jawDrawY-cy),42);
  }
  const a=t.computeChargeShieldGeometry(0,.2,0,0),b=t.computeChargeShieldGeometry(0,.2,0,.1);
  assert.notEqual(a.bottomRot,b.bottomRot);
});
test('aura renders only approved texture pixels, freezes with simulation and vanishes in Acceptance',async()=>{
  const draws=[],rotations=[];let pixelWrites=0;
  class NativeImage{
    set src(value){this.url=value;const b=fs.readFileSync(fileURLToPath(value));this.width=this.naturalWidth=b.readUInt32BE(16);this.height=this.naturalHeight=b.readUInt32BE(20);this.onload();}
  }
  const {t}=await loadGame({Image:NativeImage,canvasContext:{
    getImageData:(x,y,w,h)=>({data:new Uint8ClampedArray(w*h*4)}),
    putImageData:()=>pixelWrites++,drawImage:(...args)=>draws.push(args),rotate:a=>rotations.push(a)
  }});
  await t.initializeCalamitasAtlas();t.start();const g=t.getGame();t.enter('normal','opening','TEST');
  const pose=t.sampleCalamitasPose(g),source=t.calamitasImage('shield');draws.length=0;rotations.length=0;
  const writes=pixelWrites;t.drawCalamitasAura(g,pose);
  assert.equal(draws.length,2);assert.ok(draws.every(call=>call[0]===source),'both layers use existing PNG');
  const first=draws.map(call=>call.slice()),angles=rotations.slice();draws.length=0;rotations.length=0;
  t.drawCalamitasAura(g,pose);assert.deepEqual(draws,first);assert.deepEqual(rotations,angles);
  g.t+=1;rotations.length=0;t.drawCalamitasAura(g,pose);assert.notDeepEqual(rotations,angles);
  assert.equal(pixelWrites,writes,'no generated graphics in draw');assert.equal(t.calamitasVisualCacheSize(),0);
  draws.length=0;g.stage='accept';t.drawCalamitasAura(g,pose);assert.equal(draws.length,0);
  g.stage='normal';g.dashActive=.2;g.boss.shieldRotation=Math.PI;
  t.drawCalamitasChargeShield(g,pose);
  assert.equal(draws[0][0],t.calamitasImage('shieldBottom'));assert.equal(draws[1][0],t.calamitasImage('shieldTop'));
});
