const test=require('node:test'),assert=require('node:assert/strict');const {loadGame}=require('./helpers/fixture.cjs');
test('warm outlined combat labels use one draw each and preserve native measured width across locales',async()=>{
 class Image{constructor(){this.width=this.height=512;}set src(v){this.onload?.();}}
 const {t}=await loadGame({Image});await t.initializeHUDAtlas();const c=t.ctx,old=c.drawImage;let calls=0;c.drawImage=()=>calls++;
 try{for(const locale of ['uk','en']){t.setLocale(locale);const width=t.nativeText(c,'32400',10,20,{font:'combat',scale:.75});calls=0;for(let i=0;i<100;i++)assert.equal(t.nativeText(c,'32400',10+i,20,{font:'combat',scale:.75}),width);assert.equal(calls,100);assert.equal(width,t.nativeTextWidth('32400',.75,'combat'));}}finally{c.drawImage=old;}
});
