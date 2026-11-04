const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const {loadGame}=require('./helpers/fixture.cjs');
test('38 class resource, ability, projectile and lifecycle checks',async()=>{
const {t,el}=await loadGame({isolatedCombat:true});

let checks=0;const ok=(v,m)=>{assert.ok(v,m);checks++};
function fresh(id){el('class').value=id;t.setDeviceMode('desktop');t.start();t.enter('normal','opening','TEST');const g=t.getGame();g.player.x=400;g.player.y=300;g.player.iframes=999;g.boss.x=650;g.boss.y=300;g.boss.hp=g.boss.max=1e8;g.pickupTimer=999;t.setPointer({x:650,y:300,fire:false});return g;}
function frames(g,n,fire=false){t.setPointer({fire});for(let i=0;i<n;i++)t.update(1/60);}
let g=fresh('ranger');t.classAbility();ok(!g.player.kit.rail,'cold rail unavailable');frames(g,60,true);let k=g.player.kit;ok(k.heat>=.35,'beam builds heat');const hp=g.boss.hp;t.classAbility();ok(g.boss.hp<hp&&k.rail&&k.heat===0,'rail damages and vents');const hp2=g.boss.hp;t.classAbility();ok(g.boss.hp===hp2,'rail cooldown');frames(g,40);ok(!k.rail,'rail fades');
g=fresh('ranger');frames(g,145,true);ok(g.player.kit.overheat>0,'overheat reached');const mana=g.player.mana,cd=g.player.fireCd;g.player.fireCd=0;const before=g.boss.hp;t.shoot();ok(g.boss.hp===before&&g.player.mana===mana,'overheat blocks fire');frames(g,65);ok(g.player.kit.overheat===0,'overheat recovers');
g=fresh('ranger');g.stage='hearts';g.hearts=[{x:520,y:300,r:16,hp:10000},{x:700,y:300,r:16,hp:10000}];g.player.kit={heat:.8,overheat:0,abilityCd:0,resonance:0,rail:null,zones:[],blades:[],lastFire:0,recallFlash:0};t.classAbility();ok(g.hearts.every(x=>x.hp<10000),'rail pierces both targets');
g=fresh('mage');t.classAbility();ok(!g.player.kit.zones.length,'no invented Nova');const mageHP=g.boss.hp;frames(g,120,true);ok(g.boss.hp<mageHP,'actual vortex sequence damages target');ok(g.player.kit.resonance===0,'no invented resonance');g.player.mana=40;t.classAbility();ok(g.player.mana===40,'alternate fire cannot generate mana');frames(g,240);ok(!g.player.kit.vortexOrbs.length,'vortex projectiles expire');
g=fresh('mage');t.setPointer({x:600,y:500});frames(g,120,true);ok(g.player.kit.resonance===0,'misses do not build resonance');
g=fresh('rogue');t.shoot();ok(g.player.kit.blades.length===1,'Celestus launches');const s=g.player.kit.blades[0];frames(g,22);ok(s.outHits.has(g.boss),'outbound hit');frames(g,60);ok(s.returnHits.has(g.boss),'return hit');ok(!g.player.kit.blades.length&&g.player.stealth>.11,'catch restores stealth');
g=fresh('rogue');g.player.stealth=1;t.shoot();ok(g.player.kit.blades[0].charged&&g.player.stealth===0,'stealth strike spends full meter');frames(g,15);t.classAbility();ok(g.player.kit.blades[0].returning&&g.player.kit.blades[0].empowered,'recall empowers return');frames(g,180,true);ok(g.player.kit.blades.length<=7,'bounded blade count');ok(g.player.stealth>=0&&g.player.stealth<=1,'bounded stealth');
g=fresh('summon');t.classAbility();ok(g.player.cosmicMark===g.boss&&g.shots.length===4,'mark commands four spirits');const shots=g.shots.length;t.classAbility();ok(g.shots.length===shots,'volley cannot spam');frames(g,245);t.classAbility();ok(g.shots.length>=4,'volley recharges');
for(const id of ['ranger','mage','summon','rogue']){
 g=fresh(id);frames(g,90,true);g.mode='paused';const hp=g.boss.hp;t.classAbility();ok(g.boss.hp===hp,'paused ability blocked '+id);g.mode='playing';t.enter('hell','h75','NEXT');k=g.player.kit;ok(!k.blades.length&&!k.zones.length&&!k.rail&&!k.heat&&!k.resonance,'phase cleanup '+id);
 t.setDeviceMode('mobile');g.mode='playing';t.enter('normal','h75','TEST');t.takeAction('target');ok(Number.isFinite(g.player.mana),'mobile action '+id);
}

});
