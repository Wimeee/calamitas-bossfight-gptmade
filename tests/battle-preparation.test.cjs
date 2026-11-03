const test=require('node:test'),assert=require('node:assert/strict');const {loadGame}=require('./helpers/fixture.cjs');
function delayedImages(){const pending=[];class Image{constructor(){this.width=this.height=72;}set src(v){pending.push(()=>this.onload?.());}}return {Image,pending};}
test('launch keeps the menu visible and battle clock stopped while native resources are preparing',async()=>{
 const {Image,pending}=delayedImages(),{t,el}=await loadGame({Image});t.showPanel('setup');const launched=t.launchBattle();await Promise.resolve();assert.equal(t.state.screen,'menu');assert.equal(t.getGame(),null);assert.equal(el('menu-launch').disabled,true);
 for(let i=0;i<pending.length;i++)pending[i]();await launched;assert.equal(t.state.screen,'game');assert.equal(t.getGame().totalTime,0);assert.equal(el('menu-launch').disabled,false);
});
test('leaving setup while resources load cancels the delayed battle launch',async()=>{
 const {Image,pending}=delayedImages(),{t}=await loadGame({Image});t.showPanel('setup');const launched=t.launchBattle();t.showPanel('home');for(let i=0;i<pending.length;i++)pending[i]();await launched;assert.equal(t.state.screen,'menu');assert.equal(t.getGame(),null);
});
