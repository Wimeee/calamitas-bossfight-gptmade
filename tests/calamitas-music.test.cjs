const test=require('node:test'),assert=require('node:assert/strict'),fs=require('fs'),path=require('path'),crypto=require('crypto');
const {loadGame}=require('./helpers/fixture.cjs');
function mediaClass(){const instances=[];class Media{
 constructor(src){this.src=src;this.paused=true;this.currentTime=0;this.volume=1;this.plays=0;instances.push(this);}
 play(){this.paused=false;this.plays++;return Promise.resolve();}
 pause(){this.paused=true;}
 removeAttribute(name){if(name==='src')this.src='';}load(){}
}return {Media,instances};}
async function factory(){const {t}=await loadGame();assert.equal(typeof t.createBattleMusic,'function','native soundtrack controller is available');return t;}
test('four exact original Vorbis sections have intact provenance, valid duration and DM DOKURO credit',()=>{
 const root=path.resolve(__dirname,'..'),manifest=JSON.parse(fs.readFileSync(path.join(root,'assets/calamitas/music/provenance.json')));
 assert.equal(manifest.artist,'DM DOKURO');assert.equal(manifest.assets.length,4);
 const html=fs.readFileSync(path.join(root,'index.html'),'utf8');assert.ok(html.includes('credits-name">DM DOKURO'));assert.ok(html.includes('https://dmdokuro.bandcamp.com/track/stained-brutal-calamity'));
 const durations={grief:165.33,lament:143.99,epiphany:265.33,acceptance:64};
 for(const a of manifest.assets){const b=fs.readFileSync(path.join(root,a.file));assert.equal(b.toString('ascii',0,4),'OggS');assert.equal(crypto.createHash('sha256').update(b).digest('hex'),a.sha256);
  const v=b.indexOf(Buffer.from([1,118,111,114,98,105,115])),rate=b.readUInt32LE(v+12),duration=Number(b.readBigUInt64LE(b.lastIndexOf('OggS')+6))/rate;
  assert.ok(Math.abs(duration-durations[a.phase])<.1);
 }
});
test('music selects Grief, Lament, Epiphany and delayed Acceptance from real encounter state',async()=>{
 const t=await factory();t.start();const g=t.getGame();
 for(const [hp,phase]of [[1,'grief'],[.75,'grief'],[.5,'lament'],[.4,'lament'],[.3,'epiphany'],[.1,'epiphany']]){g.boss.hp=g.boss.max*hp;assert.equal(t.battleMusicPhase(g),phase);}
 g.boss.hp=1;g.stage='accept';g.acceptT=40/60;assert.equal(t.battleMusicPhase(g),'epiphany');g.acceptT=41/60;assert.equal(t.battleMusicPhase(g),'acceptance');
 g.mode='paused';assert.equal(t.battleMusicPhase(g),null);g.mode='playing';g.ritual={phase:'preparation'};assert.equal(t.battleMusicPhase(g),null);
});
test('same-part phase changes do not restart; crossfade changes section once; pause keeps playhead',async()=>{
 const t=await factory(),{Media,instances}=mediaClass();let now=0;
 const player=t.createBattleMusic({Audio:Media,now:()=>now,fadeSeconds:.3});t.start();const g=t.getGame(),opts={enabled:true,volume:.4,screen:'game'};
 player.sync(g,opts);assert.equal(instances.length,1);const grief=instances[0];assert.equal(grief.loop,true);
 now=.3;player.sync(g,opts);assert.equal(grief.volume,.4);grief.currentTime=42;
 g.stage='hearts';player.sync(g,opts);g.stage='normal';g.boss.hp=g.boss.max*.75;player.sync(g,opts);assert.equal(instances.length,1);assert.equal(grief.plays,1);assert.equal(grief.currentTime,42);
 g.mode='paused';player.sync(g,opts);assert.equal(grief.paused,true);g.mode='playing';player.sync(g,opts);assert.equal(grief.currentTime,42);assert.equal(grief.plays,2);
 g.boss.hp=g.boss.max*.5;player.sync(g,opts);assert.equal(instances.length,2);const lament=instances[1];assert.equal(lament.currentTime,0);
 now=.45;player.sync(g,opts);assert.ok(grief.volume>0&&lament.volume>0);
 now=.61;player.sync(g,opts);assert.equal(grief.paused,true);assert.equal(lament.volume,.4);
 player.sync(g,{...opts,volume:.17});assert.equal(lament.volume,.17);
 player.sync(g,{...opts,enabled:false});assert.equal(lament.paused,true);
});
test('real audio lifecycle pauses music in menu/death/restart and SFX mute remains independent',async()=>{
 const {Media,instances}=mediaClass(),{t}=await loadGame({Audio:Media});t.start();const g=t.getGame();t.audio.setMusic(true);t.audio.tick(g);
 assert.equal(instances.length,1);const voice=instances[0];voice.currentTime=18;
 t.audio.setSound(false);assert.equal(voice.paused,false);
 t.togglePause();assert.equal(voice.paused,true);t.togglePause();assert.equal(voice.paused,false);assert.equal(voice.currentTime,18);
 t.showMenu();assert.equal(voice.paused,true);await t.resumeBattle();assert.equal(voice.paused,false);
 t.finish(false);assert.equal(voice.paused,true);t.start();t.audio.tick(t.getGame());assert.equal(instances.length,2);assert.equal(instances[1].currentTime,0);
 t.audio.setMusic(false);assert.equal(instances[1].paused,true);
});
test('blocked autoplay is handled once and only a new user gesture retries it',async()=>{
 const t=await factory(),{Media,instances}=mediaClass();let attempts=0;
 Media.prototype.play=function(){this.plays++;attempts++;if(attempts===1)return Promise.reject(Error('NotAllowedError'));this.paused=false;return Promise.resolve();};
 const player=t.createBattleMusic({Audio:Media,now:()=>0});t.start();const g=t.getGame(),opts={enabled:true,volume:.3,screen:'game'};
 player.sync(g,opts);await new Promise(setImmediate);for(let i=0;i<100;i++)player.sync(g,opts);assert.equal(attempts,1);
 player.unlock();await new Promise(setImmediate);assert.equal(attempts,2);assert.equal(instances[0].paused,false);
});
