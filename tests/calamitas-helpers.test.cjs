const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const {fileURLToPath}=require('node:url'),{loadGame}=require('./helpers/fixture.cjs');
const root=path.resolve(__dirname,'..');
class NativeImage{set src(url){this.url=url;const b=fs.readFileSync(fileURLToPath(url));this.width=this.naturalWidth=b.readUInt32BE(16);this.height=this.naturalHeight=b.readUInt32BE(20);this.onload();}}
test('encounter assets retain original hashes and production rectangles match source layouts',async()=>{
 const {t}=await loadGame();const base=path.join(root,'assets/calamitas/encounter'),manifest=JSON.parse(fs.readFileSync(path.join(base,'manifest.json')));
 for(const a of manifest.assets){const b=fs.readFileSync(path.join(root,a.file));assert.equal(crypto.createHash('sha1').update('blob '+b.length+'\0').update(b).digest('hex'),a.sha,a.file);}
 for(const [kind,w,h,rows] of [['cataclysm',212,208,9],['catastrophe',400,230,8],['seeker',96,130,6],['heart',44,61,6]]){
  const s=t.minionSprites[kind];assert.equal(s.cellW,w);assert.equal(s.cellH,h);assert.equal(s.rows,rows);
  for(const clip of Object.keys(s.clips))for(let f=0;f<(s.sequences?.[clip]?.length||s.framesPerClip);f++){
   const r=t.minionFrameRect(kind,clip,f);assert.ok(r.sx>=0&&r.sy>=0&&r.sx+r.w<=s.width&&r.sy+r.h<=s.height,kind+clip+f);
  }
 }
 for(const [kind,s] of Object.entries(t.encounterProjectiles))for(let f=0;f<s.frames;f++){
  const r=t.projectileFrameRect(kind,f);assert.ok(r.sx>=0&&r.sy>=0&&r.sx+r.w<=s.width&&r.sy+r.h<=s.height,kind+f);
 }
 assert.equal(t.encounterProjectileKind('fire'),'scalfireblast');assert.equal(t.encounterProjectileKind('giga'),'gigablast');
 assert.equal(t.encounterProjectileKind('fist'),'cataclysmFist');assert.equal(t.encounterProjectileKind('slash'),'catastropheSlash');
});
test('loaded helper/projectile renderers use native images without mutating combat and freeze animation time',async()=>{
 const calls=[];const {t}=await loadGame({Image:NativeImage,canvasContext:{drawImage:(...a)=>calls.push(a),getImageData:(x,y,w,h)=>({data:new Uint8ClampedArray(w*h*4)}),putImageData:()=>{}}});
 await t.initializeMinionAtlas();await t.initializeEncounterProjectileAtlas();assert.equal(t.minionAssetStatus.failed,0);assert.equal(t.encounterProjectileAssetStatus.failed,0);
 t.start();const g=t.getGame();t.enter('brothers','50','TEST');g.stageT=2;g.t=2;
 const br=g.brothers[0],p=t.brotherPoseState(br,g);assert.equal(t.brotherPoseState(br,g).frame,p.frame);
 const before=JSON.stringify(g);t.drawCalamitasEncounter(g);assert.equal(JSON.stringify(g),before);assert.ok(calls.some(a=>a[0]===t.minionImage('cataclysm')));
 t.enter('hearts','opening','TEST');t.updateMinions(.016);const beforeHearts=JSON.stringify(g);calls.length=0;t.drawCalamitasEncounter(g);
 assert.equal(JSON.stringify(g),beforeHearts);assert.ok(calls.some(a=>a[0]===t.minionImage('sepulcherHead')));assert.ok(calls.some(a=>a[0]===t.minionImage('heart')));
 t.enter('seekers','20','TEST');const beforeSeekers=JSON.stringify(g);calls.length=0;t.drawCalamitasEncounter(g);assert.equal(JSON.stringify(g),beforeSeekers);assert.ok(calls.some(a=>a[0]===t.minionImage('seeker')));
 const q={kind:'fist',x:400,y:300,vx:200,vy:0,r:7,t:.1};g.projectiles=[q];const frame=t.encounterProjectileFrame(q,g);assert.equal(t.encounterProjectileFrame(q,g),frame);q.t+=.1;assert.notEqual(t.encounterProjectileFrame(q,g),frame);
 calls.length=0;const beforeBullet=JSON.stringify(g);t.drawEnemyProjectiles(g);assert.equal(JSON.stringify(g),beforeBullet);assert.ok(calls.some(a=>a[0]===t.projectileImage('cataclysmFist')));
});
test('encounter SFX paths exist, decode once and obey pause/mute/voice cleanup',async()=>{
 const {t}=await loadGame();t.start();const g=t.getGame();let requests=0,decoded=0;
 const gain=()=>({gain:{value:1,setTargetAtTime(){}},connect(){},disconnect(){}});
 const ctx={currentTime:0,createGain:gain,decodeAudioData:async()=>{decoded++;return {};},createBufferSource:()=>({connect(){},disconnect(){},start(){},stop(){}})};
 const bank=t.createMinionAudio({fetcher:async url=>{requests++;const p=fileURLToPath(url);assert.ok(fs.existsSync(p),p);return {ok:true,arrayBuffer:async()=>new ArrayBuffer(1)};}});
 await bank.initialize(ctx,gain());await bank.initialize(ctx,gain());const expected=Object.values(t.minionAudioClips).reduce((n,c)=>n+(c.files?.length||1)+(c.layers?.length||0),0);assert.equal(decoded,expected);assert.equal(requests,expected);assert.equal(bank.status.failed,0);
 assert.equal(bank.play('sepulcherSpawn',g),true);assert.equal(bank.activeVoices,1);assert.equal(bank.play('sepulcherSpawn',{mode:'paused'}),false);
 t.updateSettings({sfxEnabled:false});assert.equal(bank.activeVoices,0);assert.equal(bank.play('sepulcherSpawn',g),false);
  let lifecycleStops=0;const oldStop=t.minionAudio.stop;
  try{t.minionAudio.stop=()=>{lifecycleStops++;};t.audio.stopCalamitas();assert.equal(lifecycleStops,1,'existing pause/menu/restart stop hook includes encounter bank');}
  finally{t.minionAudio.stop=oldStop;}
});
