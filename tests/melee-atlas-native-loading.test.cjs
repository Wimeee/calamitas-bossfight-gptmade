const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const {fileURLToPath}=require('node:url');
const {loadGame}=require('./helpers/fixture.cjs');
test('melee atlas loads in-bounds legacy body and Ark alongside exact native RGBA assets',async()=>{
 const requests=[],crops=[],pixels=[];
 class Image{
  set src(url){this.srcUrl=url;requests.push(url);queueMicrotask(()=>{try{const bytes=fs.readFileSync(fileURLToPath(url));this.width=bytes.readUInt32BE(16);this.height=bytes.readUInt32BE(20);this.onload();}catch{this.onerror();}});}
 }
 const {t}=await loadGame({Image,canvasContext:{
  drawImage(image,x,y,w,h){if(!image.srcUrl)return;assert.ok(x>=0&&y>=0&&x+w<=image.width&&y+h<=image.height,'crop within '+image.srcUrl);crops.push({url:image.srcUrl,x,y,w,h});},
  getImageData(x,y,w,h){const data=new Uint8ClampedArray(w*h*4);for(let i=3;i<data.length;i+=4)data[i]=255;return{data};},
  putImageData(data){pixels.push(data.data[3]);}
 }});
 assert.equal(await t.initializeMeleeAtlas(),true);
 for(const kind of ['body','ark','wings','rendingNeedle','galaxiaBolt'])assert.equal(t.meleeAtlasReady(kind),true,kind+' ready');
 assert.ok(requests.some(x=>x.includes('/assets/melee/armor-source.png')));
 assert.ok(requests.some(x=>x.includes('/assets/melee/ark-source.png')));
 const wings=crops.filter(x=>x.url.includes('rebirth-wings.png'));
 assert.ok(wings.some(x=>x.x===0&&x.y===1392&&x.w===180&&x.h===174));
 assert.ok(pixels.includes(255),'native opaque black retained');
 assert.equal(requests.some(x=>/wings-source|ark-blast-source/.test(x)),false);
});
