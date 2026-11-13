const test=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),{fileURLToPath}=require('node:url');
const {loadGame}=require('./helpers/fixture.cjs');
class Image{
 set src(url){const b=fs.readFileSync(fileURLToPath(url));this.width=b.readUInt32BE(16);this.height=b.readUInt32BE(20);this.onload?.();}
}
test('prepared charged rip does not read pixels, create surfaces or blur during combat',async()=>{
 let readbacks=0;const draws=[];
 const {t,sandbox}=await loadGame({Image,canvasContext:{
  getImageData(x,y,w,h){readbacks++;return{data:new Uint8ClampedArray(w*h*4)};},
  drawImage(image,...args){draws.push({image,args,blur:Number.isFinite(this.shadowBlur)?this.shadowBlur:0});}
 }});
 await t.warmNativeArkEffects();
 t.start();const g=t.getGame();
 const preparedReadbacks=readbacks;
 sandbox.document.createElement=()=>{throw Error('surface allocation during charged rip');};
 draws.length=0;t.ctx.shadowBlur=0;
 const r={x:200,y:300,ex:974.4,ey:300};
 for(const width of [1,.8,.4,.1])assert.equal(t.drawNativeRipMask(r,width),true);
 assert.equal(readbacks,preparedReadbacks,'pixel conversion happens during loading');
 assert.equal(draws.length,8,'native glow and fill stay visible at every width');
 assert.ok(draws.every(d=>d.blur===0),'all blur must be baked before combat');
 assert.ok(draws.every(d=>d.image.width*d.image.height<300000),'battle draws must use screen-sized stamps instead of resampling the full native mask');
 for(const elapsed of [0,.1,.2,.4,.6])t.drawNativeBigRip(g,{...r,angle:0,max:70/60,time:70/60-elapsed});
 assert.equal(readbacks,preparedReadbacks);
});
