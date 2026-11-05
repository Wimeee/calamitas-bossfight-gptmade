import {rogueConfig as C} from '../../config/rogue.js?v=30.0.0';
import {possibleTargets} from '../combat/targets.js?v=30.0.0';
import {hitTarget} from '../combat/damage.js?v=30.0.0';
import {getSepulcherBlockers,checkSepulcherCollision} from '../combat/sepulcher-blocking.js?v=30.0.0';
import {damageSepulcherArea} from '../combat/sepulcher-damage.js?v=30.0.0';
import {audio} from '../core/audio.js?v=30.0.0';
import {cameraView} from '../world/camera.js?v=30.0.0';
export function rogueEffect(k,kind,x,y){k.effects.push({kind,x,y,time:k.clock});if(k.effects.length>64)k.effects.shift();}
export function rogueHoming(q,range,speed,inertia){let target=null;for(const t of possibleTargets()){const d=Math.hypot(t.x-q.x,t.y-q.y);if(t.hp>0&&d<range){range=d;target=t;}}if(target){const dx=target.x-q.x,dy=target.y-q.y,d=Math.hypot(dx,dy)||1;q.vx=(q.vx*inertia+dx/d*speed)/(inertia+1);q.vy=(q.vy*inertia+dy/d*speed)/(inertia+1);}}
export function hitRogueTarget(g,k,q,t){
 if(t.hp<=0)return;const first=(q.numHits||0)===0,rogue=q.kind==='blade'||q.kind==='mini',critChance=rogue?C.crit+(g.player.hp>=g.player.maxHp?.1:0)+(!q.charged&&k.raiderUntil>k.clock?.1:0):.24,crit=Math.random()<critChance;
 const amount=q.damage*C.outgoingMultiplier*(q.kind==='mini'&&t===g.boss?C.bossMiniMultiplier:1)*(crit?2:1),old=t.hp;
 hitTarget(t,amount,t.x,t.y,'#ffbdf3','rogue',false);if(t.hp===old)return;
 q.numHits=(q.numHits||0)+1;
 if(q.kind==='blade'||q.kind==='mini')t.miracleBlight=Math.max(t.miracleBlight||0,q.kind==='blade'?5:3);
 if(q.kind==='blade'){
  for(let i=0;i<8;i++){const a=Math.PI*2*i/8-(Math.PI*3/8-Math.atan2(q.vy,q.vx));k.shots.push({kind:'mini',x:q.x,y:q.y,vx:Math.cos(a)*2.5,vy:Math.sin(a)*2.5,r:24,left:85,age:0,rotation:0,damage:Math.floor(q.damage*.7),hits:new Map(),trail:[]});}k.minisSpawned+=8;audio.fx('rogueHit');
 }
 if(q.charged){
  if(q.numHits<=3)for(let i=0;i<3;i++){const a=Math.random()*Math.PI*2,speed=3+Math.random()*3;k.shots.push({kind:'spark',x:t.x,y:t.y,vx:Math.cos(a)*speed,vy:Math.sin(a)*speed,r:6,left:60,age:0,rotation:0,damage:9*C.damageBonus,hits:k.sparkHits,trail:[]});}
  if(q.numHits<=3&&k.clock>=k.flareUntil){k.flareUntil=k.clock+1;for(let i=0;i<3;i++){const x=t.x+Math.random()*400-200,y=cameraView(g).y-600-Math.random()*50;k.shots.push({kind:'flare',x,y,vx:(t.x-x)/40,vy:(t.y-y)/40,r:6,left:60,age:0,rotation:0,damage:110*C.damageBonus,hits:new Map(),trail:[]});}}
  k.raiderUntil=k.clock+10;audio.fx('rogueRaider');
 }
 // Native Nanotech glove: once per projectile, consumes20 resource for10HP;
 // auxiliary mini scythes can heal during the Raider buff, but cannot create more children.
 if(rogue&&first&&(q.charged||k.raiderUntil>k.clock)&&k.lifeSteal>0&&g.player.hp<g.player.maxHp&&Math.hypot(q.x-g.player.x,q.y-g.player.y)<3000){const reserved=k.heals.reduce((n,h)=>n+h.amount,0),amount=Math.min(10,Math.max(0,g.player.maxHp-g.player.hp-reserved));if(amount>0){k.lifeSteal-=amount*2;k.heals.push({x:q.x,y:q.y,amount,age:0});}}
 rogueEffect(k,'hit',t.x,t.y);
}
export function rogueSweep(g,k,q,x,y,blockers){
 const nx=q.x,ny=q.y;
 const wall=checkSepulcherCollision(x,y,q.x,q.y,q.r,blockers),hits=[];
 const stamp=q.kind==='spark'?k.ticks:q.age;
 for(const t of possibleTargets()){if(t.hp<=0||(q.hits.get(t)??-Infinity)>stamp)continue;const h=checkSepulcherCollision(x,y,q.x,q.y,q.r,[{x:t.x,y:t.y,radius:t.r}]);if(h.hit&&(!wall.hit||h.t<=wall.t))hits.push({t,at:h.t});}hits.sort((a,b)=>a.at-b.at);
 for(const h of hits){q.x=x+(nx-x)*h.at;q.y=y+(ny-y)*h.at;hitRogueTarget(g,k,q,h.t);q.hits.set(h.t,q.kind==='blade'&&q.phase===2?Infinity:stamp+(q.kind==='blade'?30:q.kind==='mini'?40:q.kind==='spark'?20:1));if(q.penetration===1||q.kind==='nano'||q.kind==='flare'){q.dead=true;return;}q.x=nx;q.y=ny;}
 if(wall.hit){q.x=wall.point.x;q.y=wall.point.y;damageSepulcherArea(g,q.x,q.y,q.r,q.damage*C.outgoingMultiplier);q.dead=true;rogueEffect(k,'absorbed',q.x,q.y);}
}
export function updateRogueAuxiliary(g,k){
 const blockers=getSepulcherBlockers(g),active=k.shots.slice();
 for(const q of active){if(q.dead)continue;const updates=q.kind==='mini'?5:q.kind==='flare'?11:1;
  for(let i=0;i<updates&&!q.dead;i++){q.age++;const x=q.x,y=q.y;
   if(q.kind==='mini'){q.vx*=1.02;q.vy*=1.02;q.rotation+=2;}
   else if(q.kind==='spark'&&q.age>5){q.vy=Math.min(16,q.vy+.2);q.rotation=-q.vx*.05;}
   else if(q.kind==='nano'){q.rotation+=q.vx*.2+(q.vx>0?.08:-.08);if(q.age>=30)rogueHoming(q,200,12,20);if(q.age>60){q.opacity=Math.max(0,1-(q.age-60)*5/255);if(q.age>=111){q.dead=true;break;}}}
   q.x+=q.vx;q.y+=q.vy;
   if(q.kind!=='nano'||q.age>=30)rogueSweep(g,k,q,x,y,blockers);else if(checkSepulcherCollision(x,y,q.x,q.y,q.r,blockers).hit)q.dead=true;
   q.left--;if(q.left<=0)q.dead=true;
   q.trail.push({x,y});if(q.trail.length>6)q.trail.shift();
  }
  if(q.dead&&q.kind==='flare'){rogueEffect(k,'flare',q.x,q.y);audio.fx('rogueFlare');}
 }
 k.shots=k.shots.filter(q=>!q.dead).slice(-C.maxShots);
 for(const h of k.heals){h.age++;const dx=g.player.x-h.x,dy=g.player.y-h.y,d=Math.hypot(dx,dy)||1,s=Math.min(20,4+h.age*.35);if(d<s+12){const amount=Math.min(h.amount,g.player.maxHp-g.player.hp);g.player.hp+=amount;h.dead=true;if(amount>0&&g.floaters.length<140)g.floaters.push({x:g.player.x,y:g.player.y-20,life:.7,text:'+'+Math.round(amount),col:'#8dffb3'});}else{h.x+=dx/d*s;h.y+=dy/d*s;}if(h.age>300)h.dead=true;}
 k.heals=k.heals.filter(h=>!h.dead);k.effects=k.effects.filter(e=>k.clock-e.time<.5);
}
