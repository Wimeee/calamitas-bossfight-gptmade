const test=require('node:test');
const assert=require('node:assert/strict');
const {loadGame}=require('./helpers/fixture.cjs');

test('sprite matte removes outside black while retaining enclosed dark armor',async()=>{
  const {t}=await loadGame();
  const pixels=new Uint8ClampedArray(5*5*4);
  for(let i=0;i<25;i++)pixels[i*4+3]=255;
  for(let y=1;y<=3;y++)for(let x=1;x<=3;x++)if(x!==2||y!==2){
    const at=(y*5+x)*4;pixels[at]=230;pixels[at+1]=130;pixels[at+2]=40;
  }
  t.removeSpriteMatte(pixels,5,5);
  assert.equal(pixels[3],0);assert.equal(pixels[(2*5+2)*4+3],255);
  assert.equal(pixels[(1*5+1)*4],230);
});

test('melee sprite cells stay inside both supplied sheets and poses follow existing controls',async()=>{
  const {t}=await loadGame();
  for(const kind of ['body','ark'])for(const frames of Object.values(t.meleeSpriteConfig[kind]))for(const r of frames){
    assert.ok(r.x>=0&&r.y>=0&&r.x+r.w<=1672&&r.y+r.h<=941);
    assert.ok(r.ax>=0&&r.ax<=r.w&&r.ay>=0&&r.ay<=r.h);
  }
  t.start();const g=t.getGame(),p=g.player;p.iframes=0;t.setPointer({x:800,y:410});
  assert.equal(t.warriorPose(g).name,'idle');
  t.setKeys({d:true});assert.equal(t.warriorPose(g).name,'run');
  t.setKeys({w:true});assert.equal(t.warriorPose(g).name,'rise');
  t.setKeys({s:true});assert.equal(t.warriorPose(g).name,'fall');
  p.dashT=.1;p.dashX=-1;assert.equal(t.warriorPose(g).name,'dash');assert.equal(t.warriorPose(g).flip,true);
  p.dashT=0;p.hits=1;p.lastHit=g.t;assert.equal(t.warriorPose(g).name,'hurt');
  g.mode='dead';assert.equal(t.warriorPose(g).name,'death');
  for(let weapon=1;weapon<5;weapon++){p.weapon=weapon;assert.equal(t.drawWarriorBody(g),false);assert.equal(t.drawWarriorWeapon(g),false);}
});

test('missing image API keeps legacy rendering available and never blocks game startup',async()=>{
  const {t}=await loadGame();t.start();
  assert.equal(await t.initializeMeleeAtlas(),false);
  assert.equal(t.meleeAtlasReady('body'),false);assert.equal(t.drawWarriorBody(t.getGame()),false);
  t.draw(t.getGame());
});
