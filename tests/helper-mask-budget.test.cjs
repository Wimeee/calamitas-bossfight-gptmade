const test=require('node:test'),assert=require('node:assert/strict');
const {loadGame}=require('./helpers/fixture.cjs');
class Image{constructor(){this.width=this.height=8;}set src(value){this.srcValue=value;this.onload?.();}}
test('prepared helper textures never read pixels back when new effect colors appear',async()=>{
 let reads=0;const {t}=await loadGame({Image,canvasContext:{getImageData:()=>{reads++;return {data:new Uint8ClampedArray([80,30,10,200])};},putImageData(){}}});
 await t.initializeHelperAtlas();const prepared=reads;
 for(const name of ['point','orb','pulse','staticPulse','void','soulVortex'])for(const color of ['#ff2020','#ff00ff','#ffffff'])assert.ok(t.helperTint(name,color));
 assert.equal(reads,prepared,'all source-alpha readback must happen during preparation');
});
test('helper tint capacity evicts old colors but retains recently requested colors',async()=>{
 const {t}=await loadGame({Image,canvasContext:{getImageData:()=>({data:new Uint8ClampedArray([80,30,10,200])})}});await t.initializeHelperAtlas();
 for(let i=0;i<80;i++)t.helperTint('orb','#'+i.toString(16).padStart(6,'0'));
 const newest=t.helperTint('orb','#abcdef');assert.ok(newest);
 assert.equal(t.helperTint('orb','#abcdef'),newest,'fresh colors must be cached after capacity is reached');
});
test('normal battle preparation also bakes first-use native spell and vortex colors',async()=>{
 const {t,sandbox}=await loadGame({Image,canvasContext:{getImageData:()=>({data:new Uint8ClampedArray([80,30,10,200])})}});
 await t.prepareBattleAssets();let allocations=0;const create=sandbox.document.createElement;
 sandbox.document.createElement=(...args)=>{allocations++;return create(...args);};
 for(const [name,color]of [['pulse','#ff00ff'],['point','#ff2020'],['orb','#ff0080'],['soulVortex','#ff0026'],['void','#000000'],['staticPulse','#ff2020']])assert.ok(t.helperTint(name,color));
 assert.equal(allocations,0,'first native spells must reuse prepared color surfaces');
});
