const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const {loadGame}=require('./helpers/fixture.cjs');
test('52 Ark combo, parry, snap and desktop/mobile input checks',async()=>{
const {t,el}=await loadGame();

let checks=0;const ok=(v,m)=>{assert.ok(v,m);checks++};
function fresh(){el('class').value='melee';t.setDeviceMode('desktop');t.start();t.enter('normal','opening','TEST');const g=t.getGame();g.player.x=400;g.player.y=320;g.player.iframes=0;g.boss.x=700;g.boss.y=320;t.setPointer({x:700,y:320,fire:false});return g;}
function step(g,n){for(let i=0;i<n;i++){g.t+=1/60;g.player.fireCd=Math.max(0,g.player.fireCd-1/60);t.updateSword(1/60);}}
let g=fresh();for(let i=0;i<4;i++){t.shoot();ok(g.player.swing.id===i,'combo order');ok(g.shots.filter(s=>s.id==='arkBeam').length===i+1,'needle per swing');step(g,23);}
ok(g.shots.filter(s=>s.id==='arkStar').length===12,'six stars per wide swing');ok(g.shots.filter(s=>s.id==='arkStar').every(s=>s.homing),'homing eon bolts');
t.shoot();const thrown=g.player.arkThrow;ok(!!thrown&&!g.player.swing,'fifth is throw only');step(g,42);t.shoot();ok(g.player.arkThrow===thrown&&!g.player.swing,'no overlapping swing during throw');
ok(Math.hypot(thrown.x-g.player.x,thrown.y-g.player.y)>250,'medium range cursor tracking');const hp=g.boss.hp;t.releaseArk();ok(thrown.snapped&&thrown.returning,'release in timing window snaps');ok(g.boss.hp<hp,'snap hits');ok(g.shots.filter(s=>s.id==='arkStar').length===15,'snap emits three stars');t.releaseArk();ok(g.shots.filter(s=>s.id==='arkStar').length===15,'release idempotent');step(g,50);ok(!g.player.arkThrow,'returns to player');
for(const frames of [5,110]){g=fresh();g.player.combo=4;t.shoot();step(g,frames);t.releaseArk();ok(!g.player.arkThrow.snapped&&g.player.arkThrow.returning,'early/late release returns without snap');}
g=fresh();g.player.combo=4;t.shoot();step(g,200);ok(!g.player.arkThrow,'full hold returns automatically');
g=fresh();g.boss.x=490;t.arkAbility();step(g,1);ok(g.player.arkCharges===16,'parry grants 16');ok(g.player.iframes>=.99,'body parry grants immunity');step(g,20);t.arkAbility();ok(g.player.arkCharges===0&&!!g.player.arkRip,'Big Rip consumes charges');step(g,45);t.arkAbility();ok(!g.player.arkParry,'parry cooldown respected');
g=fresh();g.projectiles=[{x:480,y:320,r:5,damage:60}];t.arkAbility();step(g,1);ok(g.projectiles[0].arkWeakenedUntil>g.t,'projectile weakened');ok(g.player.arkCharges===16&&g.player.iframes===0,'projectile parry charges without body immunity');
g=fresh();g.player.arkCharges=16;t.shoot();ok(g.player.arkCharges===15&&g.player.swing.boost===1.35,'empowered swing consumes one charge');
g=fresh();g.player.combo=4;t.shoot();t.arkAbility();ok(g.player.arkBuffered,'ability buffered during throw');step(g,200);ok(g.player.arkParryCd>0,'buffered parry executes');
g=fresh();g.player.combo=4;t.shoot();t.enter('hell','h75','TEST');ok(!g.player.arkThrow&&!g.player.swing,'phase clears attacks');
for(const weapon of ['melee','ranger','mage','summon','rogue']){el('class').value=weapon;t.start();g=t.getGame();t.enter('normal','opening','TEST');const ev={clientX:600,clientY:300,button:2,pointerId:1,preventDefault(){}};for(const fn of el('game').listeners.pointerdown)fn(ev);ok(t.getPointer().fire,'RMB holds '+weapon);ok(g.player.fireCd>0,'RMB fires immediately '+weapon);for(const fn of el('game').listeners.pointerup)fn(ev);ok(!t.getPointer().fire,'RMB releases '+weapon);}
g=fresh();for(const fn of el('game').listeners.pointerdown)fn({clientX:600,clientY:300,button:1,pointerId:2,preventDefault(){}});ok(!t.getPointer().fire&&!g.player.swing,'middle button ignored');
g=fresh();t.setDeviceMode('mobile');g.player.combo=4;t.shoot();step(g,57);ok(g.player.arkThrow.snapped,'mobile auto performs timed snap');
g=fresh();t.setDeviceMode('mobile');t.takeAction('auto');g.player.combo=4;t.shoot();step(g,45);ok(!g.player.arkThrow.snapped,'manual mobile waits for release');t.releaseArk();ok(g.player.arkThrow.snapped,'manual mobile release snaps');
g=fresh();g.boss.x=490;g.boss.y=320;t.shoot();const swing=g.player.swing;for(let i=0;i<8;i++){g.t+=.034;t.updateSword(.034);}ok(swing.hitIds.has(g.boss),'swept melee hits at 30fps');const damaged=g.boss.hp;t.updateSword(.1);ok(g.boss.hp===damaged,'swing hits each enemy once');

});
