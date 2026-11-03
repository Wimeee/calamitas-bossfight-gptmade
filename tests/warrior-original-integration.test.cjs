const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const {fileURLToPath}=require('node:url');
const {loadGame}=require('./helpers/fixture.cjs');
async function nativeGame(){
 const pending=[],draws=[],scales=[];
 class Image{set src(url){this.srcUrl=url;pending.push(this);}}
 const {t}=await loadGame({Image,canvasContext:{globalAlpha:1,drawImage(image,...args){draws.push({image,args});},scale(...v){scales.push(v);},getImageData(x,y,w,h){return{data:new Uint8ClampedArray(w*h*4)};}}});
 const ready=t.initializeMeleeAtlas();
 for(const image of pending){try{const bytes=fs.readFileSync(fileURLToPath(image.srcUrl));image.width=bytes.readUInt32BE(16);image.height=bytes.readUInt32BE(20);image.onload?.();}catch{image.onerror?.();}}
 await ready;t.start();const g=t.getGame();g.ritual=null;g.mode='playing';t.setPointer({x:g.player.x+100,y:g.player.y});
 return{t,g,draws,scales};
}
test('native armor uses bounded original composite parts and same aligned origin',async()=>{
 const {t,g,draws,scales}=await nativeGame();
 for(const pose of ['idle','run','rise','swing']){
 Object.assign(g.player,{grounded:pose==='idle'||pose==='run',vx:pose==='run'?200:0,swing:pose==='swing'?{time:.1,max:.3}:null});
 draws.length=0;assert.equal(t.drawWarriorBody(g),true);
 const native=draws.filter(d=>d.image.srcUrl?.includes('/auric-'));assert.ok(native.length>=6);
 assert.ok(native.some(d=>d.image.srcUrl.includes('melee-head')));
 for(const {image,args:[x,y,w,h,dx,dy]}of native){assert.ok(x>=0&&y>=0&&x+w<=image.width&&y+h<=image.height);assert.equal(dx,-20);assert.equal(dy,-28);}
 }
 t.setPointer({x:g.player.x-100,y:g.player.y});draws.length=0;t.drawWarriorBody(g);assert.deepEqual(scales.at(-1),[-1,1]);
 g.player.weapon=1;assert.equal(t.drawWarriorBody(g),false);
});
test('all Ark states use original blade images and left-facing aim mirrors once',async()=>{
 const {t,g,draws,scales}=await nativeGame();const p=g.player;
 t.setPointer({x:p.x-200,y:p.y});draws.length=0;t.drawWarriorIdleWeapon(g);
 assert.equal(draws.length,0,'no idle holdout in the original');
 const states=[['swing',{time:.1,max:.25,angle:0,arc:2.45,wide:false,id:0}],['arkThrow',{x:p.x+150,y:p.y,angle:1,age:.9,max:2.33}],['arkParry',{angle:0,time:.15,max:.25}],['arkRip',{x:p.x,y:p.y,ex:p.x+300,ey:p.y,angle:0,time:.3,max:.65}]];
 for(const [name,value]of states){
 p.swing=p.arkThrow=p.arkParry=p.arkRip=null;p[name]=value;draws.length=0;t.drawWarriorWeapon(g);
 assert.ok(draws.some(d=>/ark-(left|right)\.png/.test(d.image.srcUrl||'')),name+' originalblade');
 assert.equal(draws.some(d=>d.image.srcUrl?.includes('ark-source.png')),false);
 }
});
test('melee audio requests real OGG assets, rotates source variants and honors mute',async()=>{
 const {t}=await loadGame();t.start();const requests=[],played=[];
 const bank=t.createMeleeAudio({fetcher:async url=>{const file=fileURLToPath(url);requests.push(file);const b=fs.readFileSync(file);assert.ok(['OggS','RIFF'].includes(b.toString('ascii',0,4)));return{ok:true,arrayBuffer:async()=>b.buffer.slice(b.byteOffset,b.byteOffset+b.byteLength)};}});
 const gain=()=>({gain:{value:1,setTargetAtTime(){}},connect(){},disconnect(){}});
 const ctx={currentTime:10,createGain:gain,decodeAudioData:async b=>b,createBufferSource(){return{connect(){},disconnect(){},start(){played.push(this.buffer);},stop(){}};}};
 await bank.initialize(ctx,gain());assert.equal(bank.status.failed,0);assert.ok(requests.length>=8);
 assert.equal(bank.play('arkThrow'),true);ctx.currentTime+=1;assert.equal(bank.play('arkThrow'),true);assert.notEqual(played[0],played[1]);
 const count=played.length;ctx.currentTime+=1;assert.equal(bank.play('arkParrySuccess'),true);assert.equal(played.length-count,2,'crystal impact and snap are layered');
 t.updateSettings({sfxEnabled:false});assert.equal(bank.play('arkSnap'),false);assert.equal(bank.activeVoices,0);
});

test('native constellation star layers stay bounded and repeated rendering does not alter combat state',async()=>{
 const {t,g,draws}=await nativeGame(),p=g.player;
 const s={x:p.x+450,y:p.y+40,age:.65,max:140/120,angle:1,snapped:true,snapLife:.2,snapMax:35/120};
 const before=JSON.stringify({s,p,t:g.t});
 draws.length=0;t.drawNativeConstellation(g,s);t.drawNativeSnapBurst(g,s);
 const stars=draws.filter(d=>d.image.srcUrl?.includes('sparkle.png'));
 const layout=t.arkConstellationLayout(g,s);assert.ok(layout.nodes.length>=3&&layout.nodes.length<=12);assert.equal(stars.length,layout.nodes.length*2,'two native GenericSparkle layers per constellation node');
 assert.equal(JSON.stringify({s,p,t:g.t}),before);
 draws.length=0;t.drawNativeConstellation(g,s);t.drawNativeSnapBurst(g,s);
 assert.equal(draws.filter(d=>d.image.srcUrl?.includes('sparkle.png')).length,stars.length);
 assert.equal(JSON.stringify({s,p,t:g.t}),before);
});
