const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const {loadGame}=require('./helpers/fixture.cjs');
test('167 combat, input, phase, beam and arena regressions',async()=>{
const {t,el}=await loadGame();
const noop=()=>{};
const html=fs.readFileSync('index.html','utf8');
let checks=0;function check(v,msg){assert.ok(v,msg);checks++}
check(Object.keys(t.pixelArt).length===30,'all 30 embedded sprites generated');
check(t.VERSION===require('../package.json').version,'update detector version');
check(JSON.parse(fs.readFileSync('version.json','utf8')).version===t.VERSION,'manifest matches');
for(const diff of ['normal','revenge','death']){
 t.configureArena(diff);const oldArea=diff==='death'?710*424:886*530;
 check(Math.abs((t.arena.r-t.arena.l)*(t.arena.b-t.arena.t)/oldArea-1.5)<1e-12,'arena exactly +50% '+diff);
}
check(t.screenToWorld(600,360).x===500&&t.screenToWorld(600,360).y===300,'view transform center');
// Desktop CSS-to-canvas conversion must compensate for the larger canvas origin.
t.eventPos({clientX:500,clientY:300});check(t.getPointer().x===500&&t.getPointer().y===300,'mouse conversion');
t.configureArena('normal');
t.eventPos({clientX:100,clientY:100});check(t.getPointer().x===20&&t.getPointer().y===60,'mouse off-center conversion');
t.aimCanvas({clientX:500,clientY:300});check(t.getPointer().x===500&&t.getPointer().y===300,'mobile aim conversion');
el('scal-game').classList.add('focus-mode');
el('game').getBoundingClientRect=()=>({left:0,top:0,width:1200,height:600});
t.aimCanvas({clientX:600,clientY:300});check(t.getPointer().x===500&&t.getPointer().y===300,'mobile wide letterbox conversion');
el('game').getBoundingClientRect=()=>({left:0,top:0,width:1000,height:800});
t.aimCanvas({clientX:500,clientY:400});check(t.getPointer().x===500&&t.getPointer().y===300,'mobile tall letterbox conversion');
el('game').getBoundingClientRect=()=>({left:0,top:0,width:1000,height:600});
el('scal-game').classList.remove('focus-mode');
for(const mode of ['desktop','mobile'])for(const weapon of ['melee','ranger','mage','summon','rogue']){
 el('class').value=weapon;t.setDeviceMode(mode);t.start();let g=t.getGame();g.player.hp=1e9;g.player.maxHp=1e9;
 check(g.player.weapon===['melee','ranger','mage','summon','rogue'].indexOf(weapon),'weapon preserved');
 const x=g.player.x;t.setKeys({d:true});for(let i=0;i<10;i++)t.update(1/60);t.setKeys({});check(g.player.x>x,'movement '+mode);
 t.dash();check(g.player.dashes===1,'dash '+mode);t.togglePause();check(g.mode==='paused','pause');t.togglePause();
 for(const [stage,marker] of [['hearts','opening'],['brothers','bros'],['seekers','seek'],['normal','h40'],['accept','finish']]){
  t.enter(stage,marker,stage);for(let i=0;i<8;i++){t.update(1/60);t.draw(g)}check(g.stage===stage,'stage '+stage);
 }
}
// Actual attacks still damage a target, and produce the matching class impact.
for(const weapon of ['melee','ranger','mage','summon','rogue']){
 el('class').value=weapon;t.setDeviceMode('desktop');t.start();t.enter('normal','opening','TEST');const g=t.getGame();
 g.player.x=500;g.player.y=340;g.player.iframes=999;g.boss.x=620;g.boss.y=340;g.attackTimer=999;g.patternTimer=999;t.setPointer({x:620,y:340});
 const hp=g.boss.hp;t.shoot();let matchingImpact=g.impacts.some(f=>f.kind===weapon);
 for(let i=0;i<20;i++){t.update(1/60);matchingImpact ||= g.impacts.some(f=>f.kind===weapon);t.draw(g);}
 check(g.boss.hp<hp,weapon+' damages boss');check(matchingImpact,weapon+' matching hit art');
 check(g.player.mana>=0&&g.player.mana<=g.player.maxMana,'mana bounds '+weapon);
}
// Every added pattern releases the expected geometry with finite velocities.
for(const kind of ['spiral','cross','pincer']){
 t.start();const g=t.getGame();g.projectiles=[];
 t.releaseExtraPattern({kind,x:500,y:300,angle:.3,phase:3});
 check(g.projectiles.length===(kind==='cross'?24:kind==='pincer'?6:19),'pattern projectile count '+kind);
 check(g.projectiles.every(q=>Number.isFinite(q.vx)&&Number.isFinite(q.vy)),'finite pattern '+kind);
 if(kind==='spiral')check(g.projectiles.every(q=>q.curve===.22),'spiral angular movement');
 else check(g.projectiles.every(q=>q.straight),'straight pattern '+kind);
}
// Delayed release, cleanup on stage transition, and bounded visual effect storage.
t.start();let pg=t.getGame();pg.stageT=2;pg.patternTimer=0;t.updateExtraPatterns(.01);
check(pg.patternWarnings.length===1&&pg.projectiles.length===0,'warning precedes pattern');
pg.stageT+=.4;t.updateExtraPatterns(.4);check(pg.projectiles.length===0,'no early release');
pg.stageT+=.6;t.updateExtraPatterns(.6);check(pg.projectiles.length>0,'warning releases pattern');
t.enter('accept','finish','ACCEPTANCE');check(pg.patternWarnings.length===0&&pg.projectiles.length===0,'stage clears hazards');
for(let i=0;i<100;i++)t.hitTarget(pg.boss,1,500,300,'#fff','mage');check(pg.impacts.length===70,'impact cap');
// Stationary exposure across a grid INCLUDING the edges and corners, all hells/difficulties.
const report=[];
for(const diff of ['normal','revenge','death'])for(let phase=1;phase<=5;phase++){
 let minHits=Infinity,misses=[];
 for(let ix=0;ix<7;ix++)for(let iy=0;iy<5;iy++){
  el('diff').value=diff;t.setDeviceMode('desktop');t.start();let g=t.getGame();g.phaseN=phase;g.player.x=t.arena.l+11+(t.arena.r-t.arena.l-22)*ix/6;g.player.y=t.arena.t+11+(t.arena.b-t.arena.t-22)*iy/4;
  g.player.hp=g.player.maxHp=1e9;g.player.iframes=0;
  for(let frame=0;frame<890;frame++){const dt=1/60;g.t+=dt;g.stageT+=dt;g.player.iframes=Math.max(0,g.player.iframes-dt);t.bulletHell(dt);t.updateExtraPatterns(dt);t.updateBullets(dt);}
  minHits=Math.min(minHits,g.player.hits);if(!g.player.hits)misses.push([ix,iy]);
 }
 check(misses.length===0,'static safe spots '+diff+' phase '+phase+': '+JSON.stringify(misses));report.push({diff,phase,points:35,minHits});
}
// Warning must lock a target and release a straight non-homing skull after 0.7s.
el('diff').value='normal';t.start();let g=t.getGame();g.huntTimer=0;t.bulletHell(.01);check(!!g.huntWarning,'warning created');const tx=g.huntWarning.tx;g.player.x+=80;for(let i=0;i<43;i++){g.stageT+=1/60;t.bulletHell(1/60)}let skull=g.projectiles.find(q=>q.kind==='skull');check(skull?.straight,'locked skull does not drift');check(tx!==g.player.x,'warning target stayed fixed');
// Beam collision is real, stops at the nearest target and respects the arena wall.
t.setDeviceMode('desktop');el('class').value='ranger';t.start();
for(const listener of el('game').listeners.pointerdown)listener({clientX:600,clientY:300,button:2,pointerId:1,preventDefault:noop});
for(const listener of el('game').listeners.pointerup)listener({pointerId:1,button:2});
check(!!t.getGame().player.beamPulse,'quick desktop click fires before next frame');
t.setDeviceMode('desktop');t.start();t.enter('hearts','opening','BEAM TEST');let bg=t.getGame();
const near={x:620,y:300,r:16,hp:1000,max:1000},far={x:780,y:300,r:16,hp:1000,max:1000};bg.hearts=[far,near];
let ray=t.traceWeaponBeam(500,300,0,4);check(ray.hit===near&&Math.abs(ray.ex-600)<1e-9,'beam stops at nearest target');
ray=t.traceWeaponBeam(500,300,Math.PI,4);check(!ray.hit&&Math.abs(ray.ex-t.arena.l)<1e-9,'beam ignores targets behind');
bg.hearts=[{...near,y:400}];ray=t.traceWeaponBeam(500,300,0,4);check(!ray.hit&&Math.abs(ray.ex-t.arena.r)<1e-9,'off-axis miss and arena endpoint');
for(const id of ['ranger','mage']){
 el('class').value=id;t.start();t.enter('normal','opening','BEAM DAMAGE');bg=t.getGame();bg.player.x=500;bg.player.y=300;bg.player.channelCharge=1;bg.boss.x=720;bg.boss.y=300;bg.attackTimer=999;bg.patternTimer=999;bg.player.iframes=999;t.setPointer({x:720,y:300});
 const hp=bg.boss.hp,mana=bg.player.mana,w=t.weapons[bg.player.weapon];t.shoot();
 check(Math.abs((hp-bg.boss.hp)-(id==='mage'?w.dmg*1.65:w.dmg*1.0225)*.72)<1e-6,'preserved damage budget '+id);
 check(bg.player.mana===mana-w.mana,'preserved mana cost '+id);
 check(bg.player.beamPulse.rays.length===(id==='mage'?6:1),'visible real beam count '+id);
 check(bg.shots.length===0,'beam does not create fake bullets '+id);
 check(bg.impacts.length===1,'one impact per target per tick '+id);
 t.setKeys({});for(let i=0;i<20;i++)t.update(1/60);check(!bg.player.beamPulse,'beam stops after release '+id);
 t.fireChannelWeapon(w,0);t.enter('hell','h75','NEXT');check(!bg.player.beamPulse,'phase clears beam '+id);
}

});
