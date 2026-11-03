const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const {loadGame}=require('./helpers/fixture.cjs');
test('official pinned assets are intact and all 42 cells fit both supplied layouts',async()=>{
 const {t}=await loadGame(),root=path.resolve(__dirname,'../assets/calamitas'),manifest=JSON.parse(fs.readFileSync(path.join(root,'manifest.json')));
 let bytes=0;
 for(const entry of manifest.assets){const b=fs.readFileSync(path.join(root,entry.name));bytes+=b.length;const hash=crypto.createHash('sha1').update('blob '+b.length+'\0').update(b).digest('hex');assert.equal(hash,entry.sha,entry.name);}
 assert.ok(bytes<500000);
 for(const skin of ['hooded','unhooded']){
  const sheet=t.calamitasSprites[skin],b=fs.readFileSync(path.join(root,sheet.file));
  assert.equal(b.readUInt32BE(16),sheet.width);assert.equal(b.readUInt32BE(20),sheet.height);
  const cells=new Set();
  for(const clip of Object.keys(t.calamitasSprites.clips))for(let frame=0;frame<6;frame++){
   const rect=t.calamitasFrameRect(clip,frame,skin);assert.ok(rect.sx>=0&&rect.sy>=0&&rect.sx+rect.w<=sheet.width&&rect.sy+rect.h<=sheet.height);cells.add(rect.sx+','+rect.sy);
  }assert.equal(cells.size,42);
 }
});
test('animation entry, phase-II poses, facing dead zone and blast punch follow combat state without changing it',async()=>{
 const {t}=await loadGame();t.start();const g=t.getGame();t.enter('normal','opening','TEST');
 let pose=t.sampleCalamitasPose(g);assert.equal(pose.clip,'idle');assert.equal(pose.frame,0);
 g.t=.35;assert.equal(t.sampleCalamitasPose(g).frame,3);
 g.attackIndex=1;pose=t.sampleCalamitasPose(g);assert.equal(pose.clip,'handCast');assert.equal(pose.frame,3);
 g.thresholds.add('40');g.attackTimer=.09;assert.equal(t.sampleCalamitasPose(g).clip,'handPunch');
 g.attackIndex=2;g.boss.castKind='giga2';g.boss.castAt=g.t;assert.equal(t.sampleCalamitasPose(g).clip,'blastPunch');assert.equal(t.sampleCalamitasPose(g).frame,3);
 g.t+=.125;assert.equal(t.sampleCalamitasPose(g).frame,4);
 g.dashActive=.6;g.dashVector={x:1,y:.2};assert.equal(t.sampleCalamitasPose(g).clip,'dash');
 g.player.x=g.boss.x-30;const facing=t.sampleCalamitasPose(g).facing;g.player.x=g.boss.x+2;assert.equal(t.sampleCalamitasPose(g).facing,facing);
 const before=JSON.stringify(g);t.sampleCalamitasPose(g);assert.equal(JSON.stringify(g),before);
 g.stage='accept';assert.equal(t.calamitasPoseState(g).second,false);
 assert.equal(t.calamitasAssetStatus.state,'unsupported','missing browser Image API keeps the procedural fallback');
});
test('sample sound decodes once, gates overlap, follows SFX settings and refuses paused/menu playback',async()=>{
 const {t}=await loadGame();t.start();const g=t.getGame();let decodes=0,starts=0,stops=0;const gains=[];
 const ctx={currentTime:0,decodeAudioData:async()=>{decodes++;return {};},createGain(){const node={gain:{value:0,setTargetAtTime(value){this.value=value;}},connect(){},disconnect(){}};gains.push(node);return node;},
 createBufferSource(){return {connect(){},disconnect(){},start(){starts++;},stop(){stops++;this.onended?.();}};}};
 const sample=t.createCalamitasAudio({fetcher:async()=>({ok:true,arrayBuffer:async()=>new ArrayBuffer(10)})});
 await sample.initialize(ctx,{});assert.equal(decodes,6);await sample.initialize(ctx,{});assert.equal(decodes,6);
 assert.equal(sample.play('dash',g),true);assert.equal(sample.play('dash',g),true);assert.equal(starts,1);
 ctx.currentTime=.2;sample.play('dash',g);assert.equal(starts,2);
 t.updateSettings({sfxVolume:.3});assert.equal(gains[0].gain.value,.3);
 t.updateSettings({sfxEnabled:false});assert.equal(sample.activeVoices,0);assert.ok(stops>=2);assert.equal(sample.play('dash',g),false);
 t.updateSettings({sfxEnabled:true});g.mode='paused';assert.equal(sample.play('laugh',g),false);g.mode='playing';t.state.screen='menu';assert.equal(sample.play('laugh',g),false);
});
test('ritual natural completion/skip and dash/casts emit each sample at the actual event',async()=>{
 const {t}=await loadGame();let events=[],stops=[];t.audio.calamitas=name=>events.push(name);t.audio.stopCalamitas=tag=>stops.push(tag);
 t.start({ritual:true});let g=t.getGame();g.player.x=500;t.beginRitual();assert.equal(events.filter(x=>x==='altar').length,1);
 t.updateRitual(4.6);assert.equal(events.filter(x=>x==='laugh').length,1);t.completeRitual();assert.equal(events.filter(x=>x==='laugh').length,1);assert.ok(stops.includes('altar'));
 t.start({ritual:true});g=t.getGame();g.player.x=500;t.beginRitual();t.updateRitual(1);const count=events.length;t.skipRitual();assert.equal(events.length,count+1);assert.equal(events.at(-1),'laugh');
 t.enter('normal','opening','TEST');g.attackIndex=3;g.attackTimer=0;t.bossAttack(.01);const before=events.length;t.bossAttack(.4);assert.equal(events.length,before+1);assert.equal(events.at(-1),'dash');
 g.dashWind=0;g.dashActive=0;g.attackIndex=0;g.attackTimer=0;const castBefore=events.length;t.bossAttack(.01);assert.equal(events.length,castBefore);t.bossAttack(91/60);assert.equal(events.at(-1),'cast');
 t.togglePause();assert.ok(stops.includes(undefined));
});

test('phase-II punches return to flight and do not replay old casts across the phase transition',async()=>{
 const {t}=await loadGame();t.start();const g=t.getGame();t.enter('normal','opening','TEST');g.thresholds.add('40');
 g.t=10;g.attackIndex=2;g.attackTimer=.6;
 assert.equal(t.sampleCalamitasPose(g).clip,'idle');
 g.attackTimer=.29;assert.equal(t.sampleCalamitasPose(g).frame,0);
 g.attackTimer=.19;assert.equal(t.sampleCalamitasPose(g).frame,1);
 g.attackTimer=.09;assert.equal(t.sampleCalamitasPose(g).frame,2);
 Object.assign(g.boss,{castAt:10,castKind:'giga2',castSecond:true});g.attackTimer=.8;
 for(const [age,frame] of [[0,3],[.10,4],[.20,5]]){g.t=10+age;const pose=t.sampleCalamitasPose(g);assert.equal(pose.clip,'blastPunch');assert.equal(pose.frame,frame);}
 g.t=10.26;assert.equal(t.sampleCalamitasPose(g).clip,'idle','recovery ends instead of freezing the first punch frame');
 g.t=10;g.boss.castSecond=false;assert.equal(t.sampleCalamitasPose(g).clip,'idle','a first-phase projectile cannot replay as a phase-II punch');
 g.boss.castSecond=true;g.attackIndex=1;g.boss.castKind='hellblast';g.boss.castAt=10;g.attackTimer=.23;
 assert.equal(t.sampleCalamitasPose(g).frame,3);
 g.t=10.04;assert.equal(t.sampleCalamitasPose(g).frame,4);
 g.t=10.08;assert.equal(t.sampleCalamitasPose(g).frame,5);
 g.t=10.08;g.attackIndex=0;assert.equal(t.sampleCalamitasPose(g).frame,5,'last shot completes recovery after attackIndex advances');
 g.attackIndex=1;g.t=10.11;assert.equal(t.sampleCalamitasPose(g).clip,'idle');
 g.attackTimer=.06;assert.equal(t.sampleCalamitasPose(g).frame,1);
 g.attackIndex=0;g.attackTimer=.7;g.t=11;assert.equal(t.sampleCalamitasPose(g).clip,'idle','dart volley uses flight, not the ritual animation');
});


test('supplied shield keeps its red color and pattern while only black matte becomes transparent',async()=>{
 const {t}=await loadGame();
 const pixels=new Uint8ClampedArray([0,0,0,255, 200,40,60,255, 255,50,80,128]);
 t.shieldTextureAlpha(pixels);
 assert.equal(pixels[3],0);
 assert.deepEqual([...pixels.slice(4,8)],[255,51,77,200]);
 assert.deepEqual([...pixels.slice(8,12)],[255,50,80,128]);
 const blackRed=200,composited=pixels[4]*pixels[7]/255;
 assert.ok(Math.abs(composited-blackRed)<1);
});
