const test=require('node:test'),assert=require('node:assert/strict');
const {loadGame}=require('./helpers/fixture.cjs');
function media(){const all=[];class Media{
 constructor(src){this.src=src;this.volume=1;this.paused=true;this.currentTime=0;this.readyState=2;this.events={};all.push(this);}
 addEventListener(name,fn){this.events[name]=fn;}
 play(){this.paused=false;return Promise.resolve();}
 pause(){this.paused=true;}
 removeAttribute(){this.src='';}load(){}
 ready(){this.readyState=4;this.events.playing?.();}
}return {Media,all};}
test('buffering section keeps outgoing music audible until replacement is playing, then smoothly overlaps',async()=>{
 const {t}=await loadGame(),{Media,all}=media();let clock=0;const music=t.createBattleMusic({Audio:Media,now:()=>clock,fadeSeconds:1});t.start();const g=t.getGame(),opts={enabled:true,volume:.4};
 music.sync(g,opts);all[0].ready();clock=1;music.sync(g,opts);assert.equal(all[0].volume,.4);
 g.boss.hp=g.boss.max*.5;music.sync(g,opts);clock=5;music.sync(g,opts);assert.equal(all[0].volume,.4,'no premature fade while next OGG buffers');assert.equal(all[1].volume,0);
 all[1].ready();clock=5.5;music.sync(g,opts);assert.ok(all[0].volume>0&&all[1].volume>0,'both streams overlap');
 clock=6.1;music.sync(g,opts);assert.equal(all[0].paused,true);assert.equal(all[1].volume,.4);assert.equal(music.status().streams,1);
});
test('Acceptance survives actual victory and menu navigation without restarting; mute and next fight still work',async()=>{
 const {Media,all}=media(),{t}=await loadGame({Audio:Media});t.start();const g=t.getGame();g.stage='accept';g.acceptT=2;t.audio.tick(g);all[0].ready();const ending=all[0];ending.currentTime=23;
 t.finish(true);assert.equal(ending.paused,false);assert.equal(ending.loop,false,'ending plays through once');
 t.showMenu();t.showPanel('credits');t.showPanel('thanks');t.audio.syncMusic();assert.equal(ending.paused,false);assert.equal(ending.currentTime,23);assert.equal(all.length,1);
 t.audio.setMusic(false);assert.equal(ending.paused,true);t.audio.setMusic(true);assert.equal(ending.paused,false);assert.equal(ending.currentTime,23);
 t.start();assert.equal(ending.paused,true);t.audio.tick(t.getGame());assert.equal(all.length,2);assert.equal(all[1].currentTime,0);
});
test('failed incoming stream restores the outgoing stream instead of leaving silence',async()=>{
 const {t}=await loadGame(),{Media,all}=media();let clock=0;const music=t.createBattleMusic({Audio:Media,now:()=>clock});t.start();const g=t.getGame(),opts={enabled:true,volume:.4};music.sync(g,opts);all[0].ready();clock=2;music.sync(g,opts);
 g.boss.hp=g.boss.max*.5;music.sync(g,opts);all[1].events.error?.();clock=4;music.sync(g,opts);assert.equal(all[0].paused,false);assert.equal(all[0].volume,.4);assert.equal(music.status().phase,'grief');assert.equal(music.status().streams,1);
});
test('thanks is a separate navigable panel and new menu copy is fully translated',async()=>{
 const {t,el}=await loadGame();t.showPanel('thanks');assert.equal(t.model.panel,'thanks');assert.equal(el('title-menu').hidden,false);
 t.setLocale('en');assert.equal(t.translate('Подяки авторам оригіналу'),'Thanks to the original creators');assert.equal(t.translate('Цей фан-проєкт створили'),'This fan project was made by');t.showPanel('home');assert.equal(t.model.panel,'home');
});
