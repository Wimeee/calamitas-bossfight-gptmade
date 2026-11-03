const test=require('node:test'),assert=require('node:assert/strict');const {loadGame}=require('./helpers/fixture.cjs');
test('Ark source swing curves, fixed facing and shared hit segment match rendered blade',async()=>{
 const {t}=await loadGame();const normal={angle:0,wide:false,direction:1,charge:0};
 assert.ok(Math.abs(t.arkAngle(normal,0)-Math.PI*.375)<1e-9);
 assert.ok(Math.abs(t.arkAngle(normal,.5)+Math.PI*.375)<1e-9);
 const left={...normal,angle:Math.PI,direction:-1};
 for(const progress of [0,.05,.1,.25,.5,.8,1]){
 const rightAngle=t.arkAngle(normal,progress),leftAngle=t.arkAngle(left,progress);assert.ok(Math.abs(leftAngle-(Math.PI-rightAngle))<1e-9);
 const pose=t.arkSwingGeometry(normal,progress,{x:400,y:300});
 assert.equal(pose.angle,rightAngle);assert.ok(pose.scale>=.6&&pose.scale<=1.8+1e-8);
 const length=Math.hypot(pose.end.x-pose.start.x,pose.end.y-pose.start.y);assert.ok(Math.abs(length-172*pose.scale)<1e-8);
 }
 const charged=t.arkSwingGeometry({...normal,charge:16},.5,{x:0,y:0});assert.ok(charged.scale>t.arkSwingGeometry(normal,.5,{x:0,y:0}).scale);
});
test('wide Ark bolts are released around the swing over time, not as an instant fan',async()=>{
 const {t}=await loadGame();t.start();t.enter('normal','opening','TEST');const g=t.getGame();t.setPointer({x:g.player.x+400,y:g.player.y,fire:false});g.player.combo=1;t.fireArk();
 assert.equal(g.shots.filter(s=>s.id==='arkStar').length,0);
 for(let i=0;i<Math.ceil(55/2);i++){g.t+=1/60;t.updateSword(1/60);}
 const bolts=g.shots.filter(s=>s.id==='arkStar');assert.equal(bolts.length,6);
 assert.ok(new Set(bolts.map(s=>Math.atan2(s.vy,s.vx).toFixed(1))).size>=4);
});

test('parry ignores static, harmless and huge projectiles; empowered swing has real bonus and double blades state',async()=>{
 const {t}=await loadGame();t.start();t.enter('normal','opening','TEST');const g=t.getGame(),p=g.player;
 Object.assign(p,{x:400,y:320});Object.assign(g.boss,{x:2000,y:320});t.setPointer({x:800,y:320,fire:false});
 const q={x:480,y:320,r:5,damage:170,vx:0,vy:0};g.projectiles=[q];t.arkAbility();t.updateSword(.01);assert.equal(p.arkCharges,0);
 q.vx=100;q.damage=1;t.updateSword(.01);assert.equal(p.arkCharges,0);
 q.damage=170;q.r=150;t.updateSword(.01);assert.equal(p.arkCharges,0);
 q.r=5;t.updateSword(.01);assert.equal(p.arkCharges,16);assert.ok(q.arkWeakenedUntil>g.t);
 t.updateSword(.3);t.fireArk();assert.equal(p.swing.charge,16);assert.equal(p.arkCharges,15);assert.equal(p.swing.dmg,1700*1.35);
});
test('Ark cursor travel is fixed-tick consistent at30/60/120fps and snap emits one cue',async()=>{
 const {t}=await loadGame(),positions=[];
 for(const rate of [30,60,120]){
 t.start();t.enter('normal','opening','TEST');const g=t.getGame(),p=g.player;Object.assign(p,{x:400,y:320,combo:4});g.boss.x=3000;t.setPointer({x:1400,y:320,fire:false});
 t.fireArk();for(let i=0;i<rate*.5;i++){g.t+=1/rate;t.updateSword(1/rate);}
 positions.push(p.arkThrow.x);
 }
 assert.ok(Math.max(...positions)-Math.min(...positions)<1e-6);
 const cues=[];t.audio.fx=name=>cues.push(name);t.start();t.enter('normal','opening','TEST');const g=t.getGame();g.player.combo=4;t.setPointer({x:g.player.x+500,y:g.player.y,fire:false});t.fireArk();
 for(let i=0;i<30;i++){g.t+=1/60;t.updateSword(1/60);}
 assert.equal(cues.filter(x=>x==='arkSnapReady').length,1);
 t.releaseArk();t.releaseArk();assert.equal(cues.filter(x=>x==='arkSnap').length,1);
 t.updateSword(.3);t.updateSword(.3);assert.equal(cues.filter(x=>x==='arkSnapEnd').length,1);
});
