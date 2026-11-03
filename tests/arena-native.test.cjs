const test=require('node:test'),assert=require('node:assert/strict');
const {loadGame}=require('./helpers/fixture.cjs');
async function setup(){const a=await loadGame();a.t.start();const g=a.t.getGame();g.ritual=null;g.stage='normal';return {...a,g};}
test('native arena side ordering, Death scaling and final rectangle',async()=>{const {t,g}=await setup();assert.equal(typeof t.arenaTarget,'function');let b=t.arenaTarget(g);assert.equal(b.r-b.l,2500);g.hearts=[{hp:1}];b=t.arenaTarget(g);assert.equal(b.b-b.t,1562.5);assert.equal(b.r-b.l,2875);g.hearts=[];g.brothers=[{hp:1}];b=t.arenaTarget(g);assert.equal(b.r-b.l,3325);g.brothers=[];g.seekers=[{hp:1}];b=t.arenaTarget(g);assert.equal(b.b-b.t,3750);g.stage='accept';b=t.arenaTarget(g);assert.equal(b.r-b.l,1000);assert.equal(b.b-b.t,473);});
test('arena easing is frame-rate independent; fixed terrain survives moving borders; pause freezes',async()=>{for(const fps of [30,60,120]){const {t,g}=await setup();t.resetArenaState(g);g.stage='accept';const terrain=t.getTerrain();for(let i=0;i<fps;i++)t.updateArenaState(g,1/fps);assert.ok(Math.abs(t.arena.r-(1000+750*Math.pow(.98,60)))<.001);assert.equal(t.getTerrain(),terrain);const before=t.arena.r;g.mode='paused';t.updateArenaState(g,1);assert.equal(t.arena.r,before);}});
test('camera follows the player at normal scale and normalized aim survives zoom/resize',async()=>{const {t,g}=await setup();t.resetArenaState(g);t.setViewportSize(1920,1080);t.setPointer({u:.7,v:.3,viewX:1,viewY:1});t.updateCamera(g,1,true);const v=t.cameraView(g);assert.equal(v.zoom,t.ZOOM_DEFAULT*.85);assert.equal(g.camera.x,g.player.x);assert.equal(g.camera.y,g.player.y);g.player.x+=200;g.player.y+=100;t.updateCamera(g,0,true);assert.equal(g.camera.x,g.player.x);assert.equal(g.camera.y,g.player.y);t.updateCamera(g,0,true);const current=t.cameraView(g);assert.ok(Math.abs(t.getPointer().x-(current.x+current.w*.7))<1e-7);g.player.y=99999;t.movePlayerWithTerrain(g,0,0);assert.ok(g.player.y<t.arena.b);});

test('phase palette and tendrils follow the live roof without combat RNG; gore emits once and stays bounded',async()=>{
 const {t,g,sandbox}=await setup();t.resetArenaState(g);g.boss.hp=g.boss.max*.5;assert.equal(t.arenaPhase(g),1);g.boss.hp=g.boss.max*.3;assert.equal(t.arenaPhase(g),2);g.stage='accept';g.acceptT=1;assert.equal(t.arenaPhase(g),3);
 const h={x:500,y:100,hp:0,tendrilIndex:2};const a=t.heartTendrilAnchors(h,2);assert.equal(a.length,3);assert.ok(a.every(p=>p.y===t.arena.t&&p.x>t.arena.l&&p.x<t.arena.r));
 t.breakHeartTendrils(g,h);const count=g.arenaDebris.length;t.breakHeartTendrils(g,h);assert.equal(g.arenaDebris.length,count);assert.equal(g.arenaDebris.filter(p=>p.kind).length,2);
 g.hearts=[h];const before=JSON.stringify(g);t.drawHeart(h,g);assert.equal(JSON.stringify(g),before,'drawing does not mutate state');
 for(let i=0;i<200;i++)t.breakHeartTendrils(g,{x:500,y:100,tendrilIndex:i});assert.ok(g.arenaDebris.length<=320);
 g.stage='normal';for(let i=0;i<240;i++)t.updateArenaState(g,1/60);assert.equal(g.arenaDebris.length,0);
});

test('opening starts at double native extents once; Death mode and second worm preserve source geometry',async()=>{
 const {t,g}=await setup();g.difficulty='death';let b=t.arenaTarget(g);assert.equal(b.r-b.l,2000);g.hearts=[{hp:1}];g.phaseN=5;b=t.arenaTarget(g);assert.equal(b.r-b.l,2300);assert.equal(b.b-b.t,1750);
 g.hearts=[];g.stage='normal';g.phaseN=1;t.resetArenaState(g,true);t.updateArenaState(g,0);assert.equal(t.arena.r-t.arena.l,4000);t.updateArenaState(g,1/60);assert.ok(Math.abs(t.arena.r-t.arena.l-3800)<1e-7);
});

test('arena bottom contains the player without pretending to be terrain or refilling wings',async()=>{
 const {t,g}=await setup();Object.assign(g.player,{x:500,y:t.arena.b+20,vy:100,grounded:false,flightRemaining:1,dropHeld:true});t.movePlayerWithTerrain(g,0,1);assert.equal(g.player.y,t.arena.b-18);assert.equal(g.player.grounded,false);assert.equal(g.player.flightRemaining,1);
});
