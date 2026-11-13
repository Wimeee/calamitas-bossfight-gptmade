const test=require('node:test'),assert=require('node:assert/strict');const {loadGame}=require('./helpers/fixture.cjs');
test('warm outlined combat labels use one draw each and preserve native measured width across locales',async()=>{
 class Image{constructor(){this.width=this.height=512;}set src(v){this.onload?.();}}
 const {t}=await loadGame({Image});await t.initializeHUDAtlas();const c=t.ctx,old=c.drawImage;let calls=0;c.drawImage=()=>calls++;
 try{for(const locale of ['uk','en']){t.setLocale(locale);const width=t.nativeText(c,'32400',10,20,{font:'combat',scale:.75});calls=0;for(let i=0;i<100;i++)assert.equal(t.nativeText(c,'32400',10+i,20,{font:'combat',scale:.75}),width);assert.equal(calls,100);assert.equal(width,t.nativeTextWidth('32400',.75,'combat'));}}finally{c.drawImage=old;}
});

test('changing combat numbers reuse bounded label surfaces and keep hot labels cached',async()=>{
 class Image{constructor(){this.width=this.height=512;}set src(v){this.onload?.();}}
 const {t,sandbox}=await loadGame({Image});await t.initializeHUDAtlas();
 const create=sandbox.document.createElement.bind(sandbox.document);let canvases=0;
 sandbox.document.createElement=name=>{if(name==='canvas')canvases++;return create(name);};
 for(let i=0;i<512;i++){
  t.nativeText(t.ctx,'32400',10,20,{font:'combat',scale:.75});
  t.nativeText(t.ctx,String(100000+i),10,20,{font:'combat',scale:.75});
 }
 assert.ok(canvases<=132,'changing numbers must reuse the128 cached surfaces, plus font tints');
 const before=canvases;
 t.nativeText(t.ctx,'32400',10,20,{font:'combat',scale:.75});
 assert.equal(canvases,before,'frequent HUD labels remain cached');
});
