const test=require('node:test'),assert=require('node:assert/strict');
const {loadGame}=require('./helpers/fixture.cjs');
test('unchanged HUD writes nothing in either locale and still refreshes changed state',async()=>{
 const {t,el}=await loadGame();t.start();let writes=0;
 const watch=(object,key)=>{let value=object[key];Object.defineProperty(object,key,{get:()=>value,set:next=>{writes++;value=next;},configurable:true});};
 for(const id of ['hptxt','manatxt','potion','regenstatus','regenpotionstatus','phase','timer','bosshp','hits','dashes','statehint','weaponname','weapondesc','wingstatus'])watch(el(id),'textContent');
 watch(el('hpbar').style,'width');watch(el('manabar').style,'width');watch(el('practice-toolbar'),'hidden');
 watch(el('markers'),'innerHTML');
 for(const locale of ['uk','en']){
  t.setLocale(locale);t.ui();writes=0;for(let i=0;i<10;i++)t.ui();
  assert.equal(writes,0,locale+' unchanged HUD must not churn DOM/text nodes');
  t.getGame().player.hp-=1;t.ui();assert.ok(writes>0);assert.match(el('hptxt').textContent,/599|598/);
 }
});
