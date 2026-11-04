const {test}=require('node:test');
const assert=require('node:assert/strict');
const {loadGame}=require('./helpers/fixture.cjs');
async function setup(){const f=await loadGame({isolatedCombat:true});f.el('class').value='mage';f.t.start();f.t.enter('normal','opening','TEST');const g=f.t.getGame();Object.assign(g.player,{x:400,y:400,iframes:999});Object.assign(g.boss,{x:700,y:400,hp:1e8,max:1e8});f.t.setPointer({x:700,y:400,fire:false});return {...f,g};}
test('native Void Vortex casts twelve cursor-centered spheres plus hidden four-damage core, once per49ticks',async()=>{const {t,g}=await setup();t.shoot();const k=g.player.kit;assert.equal(t.weapons[2].name,'Void Vortex');assert.equal(k.vortexOrbs.length,13);for(const q of k.vortexOrbs.filter(q=>q.kind==='orbit'))assert.ok(Math.abs(Math.hypot(q.x-700,q.y-400)-90)<1e-8);const core=k.vortexOrbs.find(q=>q.kind==='core');assert.equal(core.x,700);assert.equal(core.y,400);assert.equal(core.damage,k.vortexOrbs[0].damage*4);assert.equal(g.player.fireCd,49/60);t.shoot();assert.equal(k.vortexOrbs.length,13);assert.ok(!g.player.beamPulse);});
test('source180Hz substeps make staggered beams, central explosion and homing children independent of display FPS',async()=>{const snapshots=[];for(const fps of [30,60,120]){const {t,g}=await setup();t.shoot();const hp=g.boss.hp;for(let i=0;i<fps*.5;i++)t.updateMageCombat(1/fps);assert.ok(g.boss.hp<hp);const k=g.player.kit;assert.equal(k.vortexOrbs.filter(q=>q.kind==='seek').length,12);assert.equal(k.vortexOrbs.filter(q=>q.kind==='core').length,0);snapshots.push({hp:g.boss.hp,orbs:k.vortexOrbs.map(q=>[q.x,q.y,q.left])});}assert.equal(JSON.stringify(snapshots[0]),JSON.stringify(snapshots[1]));assert.equal(JSON.stringify(snapshots[1]),JSON.stringify(snapshots[2]));});
test('Ethereal Talisman and Auric magic helmet provide360mana, cost reduction and actual auto-potions with stacking sickness',async()=>{const {t,g}=await setup();assert.equal(g.player.maxMana,360);t.shoot();assert.equal(g.player.mana,310);g.player.fireCd=0;g.player.mana=0;t.shoot();assert.equal(g.player.mana,250);assert.equal(g.player.manaPotions,59);assert.equal(g.player.manaSickness,5);const a=g.player.kit.vortexOrbs.at(-1).damage;g.player.fireCd=0;g.player.mana=0;t.shoot();assert.equal(g.player.manaSickness,10);assert.ok(g.player.kit.vortexOrbs.at(-1).damage<a);g.player.manaPotions=0;g.player.mana=0;g.player.fireCd=0;const count=g.player.kit.vortexOrbs.length;t.shoot();assert.equal(g.player.kit.vortexOrbs.length,count);assert.equal(g.player.mana,0);});
test('RMB cannot conjure Nova or free mana, phases and fresh attempts discard old vortex state',async()=>{const {t,g}=await setup();g.player.mana=40;t.classAbility();assert.equal(g.player.mana,40);assert.equal(g.player.kit.zones.length,0);g.player.mana=360;t.shoot();t.enter('hell','h75','NEXT');assert.equal(g.player.kit.vortexOrbs.length,0);t.start();assert.equal(t.getGame().player.manaSickness,0);assert.equal(t.getGame().player.maxMana,360);});
test('beam hits current target geometry rather than a stale lock and respects nearer worm/heart ordering',async()=>{
 const {t,g}=await setup(),k=t.mageState();
 const ray=()=>({x:400,y:400,ex:400,ey:400,dx:1,dy:0,travel:0,age:0,life:.2,damage:100,resolved:false});
 g.boss.x=500;g.boss.y=500;k.vortexBeams=[ray()];const before=g.boss.hp;t.updateMageCombat(1/180);assert.equal(g.boss.hp,before,'off-axis target is not hit by remembered aim');
 g.boss.x=650;g.boss.y=400;t.updateMageCombat(1/180);assert.ok(g.boss.hp<before,'target entering the beam path is hit');
 g.stage='hearts';g.hearts=[{x:450,y:400,r:10,hp:1000},{x:750,y:400,r:10,hp:1000}];g.sepulcher={x:550,y:400,alpha:0,nodes:[],arms:[],hp:10000};g.t++;
 k.vortexBeams=[ray()];t.updateMageCombat(1/180);assert.ok(g.hearts[0].hp<1000);assert.equal(g.hearts[1].hp,1000);
 const blocked=ray();blocked.x=blocked.ex=500;k.vortexBeams=[blocked];t.updateMageCombat(1/180);assert.ok(blocked.resolved);assert.equal(g.hearts[1].hp,1000,'worm absorbs a beam before the rear heart');assert.ok(blocked.ex<550);
});
test('sustained channel remains bounded; mana pauses after casting and only regenerates while idle',async()=>{
 const {t,g}=await setup();t.shoot();t.updateMage(.5);assert.equal(g.player.mana,310);t.updateMage(1);assert.equal(g.player.mana,320);
 for(let i=0;i<1200;i++){g.t+=1/60;t.updateMage(1/60);g.player.fireCd=Math.max(0,g.player.fireCd-1/60);t.shoot();t.updateMageCombat(1/60);assert.ok(g.player.kit.vortexOrbs.length<90);assert.ok(g.player.kit.vortexBeams.length<24);}
 assert.ok(g.player.manaPotions<60);assert.ok(g.player.mana>=0);const k=g.player.kit,c=JSON.stringify(k.vortexOrbs);g.mode='paused';t.updateMageCombat(1);assert.equal(JSON.stringify(k.vortexOrbs),c);
});
test('mage uses the real magic helmet and native body cells without changing warrior art or combat state',async()=>{
 const fs=require('fs'),{fileURLToPath}=require('url'),calls=[];
 class Image{set src(url){this.url=url;const b=fs.readFileSync(fileURLToPath(url));this.width=b.readUInt32BE(16);this.height=b.readUInt32BE(20);this.onload?.();}}
 const {t,el}=await loadGame({Image,canvasContext:{globalAlpha:1,drawImage:(im,...args)=>calls.push({url:im.url,args})}});await t.initializeNativeArmor();el('class').value='mage';t.start();const g=t.getGame();g.ritual=null;g.player.grounded=true;t.setPointer({x:g.player.x+100,y:g.player.y});calls.length=0;const before=JSON.stringify(g);
 assert.equal(t.drawWarriorBody(g),true);assert.equal(JSON.stringify(g),before);assert.ok(calls.some(c=>c.url.includes('/auric-magic-head.png')));assert.ok(!calls.some(c=>c.url.includes('/auric-melee-head.png')));
 for(const c of calls){const b=fs.readFileSync(fileURLToPath(c.url));assert.ok(c.args[0]>=0&&c.args[1]>=0&&c.args[0]+c.args[2]<=b.readUInt32BE(16)&&c.args[1]+c.args[3]<=b.readUInt32BE(20));}
 calls.length=0;g.player.weapon=0;t.drawNativeArmor(g,{flip:false});assert.ok(calls.some(c=>c.url.includes('/auric-melee-head.png')));
});
test('local mage nerf preserves native item base and projectile ratios while reducing cast damage by10percent',async()=>{
 const {t,g}=await setup();t.shoot();const orbs=g.player.kit.vortexOrbs;assert.equal(t.weapons[2].dmg,210);assert.ok(Math.abs(orbs[0].damage-210*1.65*.9)<1e-8);assert.equal(orbs.find(q=>q.kind==='core').damage,orbs[0].damage*4);assert.equal(g.player.mana,310);
});
test('installed2.2.4 policy: initial ring and visible core cannot contact-hit; homing children arm after20updates',async()=>{
 const {t,g}=await setup(),k=t.mageState(),hp=g.boss.hp;
 const q={kind:'orbit',x:g.boss.x,y:g.boss.y,vx:0,vy:0,damage:100,delay:-40,fired:true,spin:1,time:30,left:90,scale:1,turnAt:20,turn:1,hits:new Set(),trail:[]};
 k.vortexOrbs=[q,{...q,kind:'core',hits:new Set()}];t.updateMageCombat(1/180);assert.equal(g.boss.hp,hp,'neither initial sphere may inflict contact damage');
 k.vortexOrbs=[{...q,kind:'seek',time:19,left:500,scale:.5,hits:new Set(),trail:[]}];t.updateMageCombat(1/180);assert.equal(g.boss.hp,hp,'child not armed at update19');t.updateMageCombat(1/180);assert.ok(g.boss.hp<hp,'child can contact-hit at update20');
});
test('potion asset provenance uses Terraria SuperManaPotion2209, not Phantasm3540',()=>{
 const fs=require('fs'),path=require('path'),m=JSON.parse(fs.readFileSync(path.join(__dirname,'../assets/mage-original/provenance.json'))),entries=m.files.filter(f=>f.file==='mana-potion.png');assert.equal(entries.length,1);assert.ok(entries[0].source.endsWith('/Item_2209.xnb'));
});
