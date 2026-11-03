const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs');
const {fileURLToPath}=require('node:url');
const {loadGame}=require('./helpers/fixture.cjs');
async function setup(){
 const pending=[],draws=[],scales=[],angles=[];
 class Image{set src(url){this.srcUrl=url;pending.push(this);}}
 const base={globalAlpha:1,drawImage(image,...args){draws.push({image,args});},scale(...v){scales.push(v);},rotate(v){angles.push(v);},getImageData(x,y,w,h){return{data:new Uint8ClampedArray(w*h*4)};}};
 const fixture=await loadGame({Image,canvasContext:base});
 const original=fixture.sandbox.document.createElement;
 fixture.sandbox.document.createElement=kind=>{
  if(kind!=='canvas')return original(kind);
  const canvas={width:0,height:0};
  const ctx=new Proxy({globalAlpha:1,drawImage(image,...args){canvas.source={image,args};},getImageData(x,y,w,h){return{data:new Uint8ClampedArray(w*h*4)};}},{get:(o,k)=>o[k]??(()=>{})});
  canvas.getContext=()=>ctx;return canvas;
 };
 const ready=fixture.t.initializeMeleeAtlas();
 for(const image of pending){try{const b=fs.readFileSync(fileURLToPath(image.srcUrl));image.width=b.readUInt32BE(16);image.height=b.readUInt32BE(20);image.onload?.();}catch{image.onerror?.();}}
 await ready;
 const {t}=fixture;t.start();const g=t.getGame();g.ritual=null;g.mode='playing';
 Object.assign(g.player,{weapon:0,physics:true,grounded:false,flying:true,flightRemaining:2,vy:-100});
 t.setPointer({x:g.player.x+100,y:g.player.y});
 function wing(time){g.t=time;draws.length=scales.length=angles.length=0;t.drawFlightWings(g);const hits=draws.filter(d=>d.image.source?.image.srcUrl?.includes('rebirth-wings'));assert.equal(hits.length,1);return hits[0].image.source.args[1]/174;}
 return{...fixture,g,draws,scales,angles,wing};
}
test('native wings use actual vertical cells, eight-step loop and freeze poses',async()=>{
 const {t,g,wing,scales}=await setup();
 assert.equal(wing(10),7);
 for(let i=1;i<=9;i++)assert.equal(wing(10+(i+.01)/12),[7,8,1,2,3,4,5,6][i%8]);
 g.player.flying=false;g.player.vy=100;t.setKeys({w:true});assert.equal(wing(12),1);
 t.setKeys({});assert.equal(wing(12.1),2);
 g.player.grounded=true;assert.equal(wing(12.2),0);
 g.mode='paused';g.player.grounded=false;assert.equal(wing(13),0);
 g.mode='playing';g.player.flying=true;g.player.vy=100;assert.equal(wing(14),7);
 assert.equal(wing(14.1),8);
 g.player={...g.player};assert.equal(wing(14.2),7,'new player object resets presentation even without id');
 assert.equal(wing(1),7,'rewound time resets');
 t.setPointer({x:g.player.x-100,y:g.player.y});wing(1.01);assert.deepEqual(scales.at(-1),[-1,1]);
});
test('native projectiles really draw and all classes share native wings',async()=>{
 const {t,g,draws,angles}=await setup();
 for(const [id,name]of [['arkBeam','rending-needle'],['arkStar','galaxia-bolt']]){
 draws.length=angles.length=0;assert.equal(t.drawWarriorProjectile({id,x:50,y:60,vx:100,vy:0},g),true);
 const head=draws.filter(d=>d.image.source?.image.srcUrl?.includes(name));assert.equal(head.length,1);assert.equal(angles.at(-1),Math.PI/2);
 }
 for(let weapon=1;weapon<5;weapon++){g.player.weapon=weapon;g.player.flying=false;g.player.grounded=true;draws.length=0;t.drawFlightWings(g);assert.equal(draws.length,1);assert.ok(draws[0].image.source.image.srcUrl.includes('rebirth-wings'));}
});

