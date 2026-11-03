const test=require('node:test'),assert=require('node:assert/strict');const {loadGame}=require('./helpers/fixture.cjs');
test('mobile phase changes reuse media elements unlocked in the original gesture',async()=>{
 const {t}=await loadGame();let gesture=true;const instances=[];
 class Media{constructor(src){this.src=src;this.volume=1;this.paused=true;instances.push(this);}play(){if(gesture)this.authorized=true;if(!this.authorized)return Promise.reject(Error('NotAllowedError'));this.paused=false;return Promise.resolve();}pause(){this.paused=true;}load(){}removeAttribute(){this.src='';}}
 let time=0;const player=t.createBattleMusic({Audio:Media,mobile:()=>true,now:()=>time,fadeSeconds:.1});player.unlock();gesture=false;await new Promise(setImmediate);assert.equal(instances.length,2,'only two primed stream elements');t.start();const g=t.getGame(),opts={enabled:true,volume:.3,screen:'game'};
 for(const ratio of [1,.5,.3]){g.boss.hp=g.boss.max*ratio;player.sync(g,opts);await new Promise(setImmediate);assert.equal(player.status().blocked,false);time+=.2;player.sync(g,opts);}g.stage='accept';g.acceptT=1;player.sync(g,opts);await new Promise(setImmediate);assert.equal(player.status().phase,'acceptance');assert.equal(player.status().blocked,false);assert.equal(instances.length,2,'phase transitions must not construct newly blocked media elements');
});
