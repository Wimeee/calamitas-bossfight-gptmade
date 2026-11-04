const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const {loadGame}=require('./helpers/fixture.cjs');
test('class, input, phase, beam and arena regressions',async()=>{
const {t,el}=await loadGame();
const noop=()=>{};
const html=fs.readFileSync('index.html','utf8');
let checks=0;function check(v,msg){assert.ok(v,msg);checks++}
check(Object.keys(t.pixelArt).length===30,'all 30 embedded sprites generated');
check(t.VERSION===require('../package.json').version,'update detector version');
check(JSON.parse(fs.readFileSync('version.json','utf8')).version===t.VERSION,'manifest matches');
for(const diff of ['normal','revenge','death']){
 t.configureArena(diff);const size=diff==='death'?2000:2512;
 check(t.arena.r-t.arena.l===size&&t.arena.b-t.arena.t===size,'tile-scaled square arena '+diff);
}
check(t.screenToWorld(600,360).x===500&&t.screenToWorld(600,360).y===300,'view transform center');
// Desktop CSS-to-canvas conversion must compensate for the larger canvas origin.
t.eventPos({clientX:500,clientY:300});check(t.getPointer().x===500&&t.getPointer().y===300,'mouse conversion');
t.configureArena('normal');
t.eventPos({clientX:100,clientY:100});check(Math.abs(t.getPointer().x-(500-480/(.765*.85)))<1e-9&&Math.abs(t.getPointer().y-(300-240/(.765*.85)))<1e-9,'mouse off-center conversion with15percent desktop zoom-out');
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
 for(let i=0;i<(weapon==='summon'?65:20);i++){t.update(1/60);matchingImpact ||= g.impacts.some(f=>f.kind===weapon);t.draw(g);}
 check(g.boss.hp<hp,weapon+' damages boss');check(weapon==='mage'?g.player.kit.vortexBeams.some(b=>b.resolved):weapon==='ranger'?!!g.player.kit.photo?.visual:weapon==='summon'?g.player.summonState.pulses.length>0:matchingImpact,weapon+' matching native attack state');
 check(g.player.mana>=0&&g.player.mana<=g.player.maxMana,'mana bounds '+weapon);
}
// Beam collision is real, stops at the nearest target and respects the arena wall.
t.setDeviceMode('desktop');el('class').value='ranger';t.start();
for(const listener of el('game').listeners.pointerdown)listener({clientX:600,clientY:300,button:0,pointerId:1,preventDefault:noop});
for(const listener of el('game').listeners.pointerup)listener({pointerId:1,button:0});
check(!t.getGame().ritual||!t.getGame().player.kit?.photo?.active,'ritual cannot fire ranger holdout');
t.setDeviceMode('desktop');t.start();t.enter('hearts','opening','BEAM TEST');let bg=t.getGame();
const near={x:620,y:300,r:16,hp:1000,max:1000},far={x:780,y:300,r:16,hp:1000,max:1000};bg.hearts=[far,near];
let ray=t.traceWeaponBeam(500,300,0,4);check(ray.hit===near&&Math.abs(ray.ex-600)<1e-9,'beam stops at nearest target');
ray=t.traceWeaponBeam(500,300,Math.PI,4);check(!ray.hit&&Math.abs(ray.ex-t.arena.l)<1e-9,'beam ignores targets behind');
bg.hearts=[{...near,y:400}];ray=t.traceWeaponBeam(500,300,0,4);check(!ray.hit&&Math.abs(ray.ex-t.arena.r)<1e-9,'off-axis miss and arena endpoint');
// Native Ranger and Mage lifecycle are covered by their production-controller tests.
});
