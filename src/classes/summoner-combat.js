import {summonerConfig as C} from '../../config/summoner.js?v=29.0.1';
import {possibleTargets} from '../combat/targets.js?v=29.0.1';
import {hitTarget} from '../combat/damage.js?v=29.0.1';
import {getSepulcherBlockers,checkSepulcherCollision} from '../combat/sepulcher-blocking.js?v=29.0.1';
import {damageSepulcherArea,damageSepulcherWhere} from '../combat/sepulcher-damage.js?v=29.0.1';
import {updateMageDebuffs} from '../combat/mage-debuffs.js?v=29.0.1';
import {audio} from '../core/audio.js?v=29.0.1';
export function summonTarget(g,x,y,range,manhattan=false){const targets=possibleTargets().filter(t=>t.hp>0),mark=g.player.cosmicMark;if(mark&&targets.includes(mark)&&Math.hypot(mark.x-x,mark.y-y)<range)return mark;let best=null;for(const t of targets){const d=manhattan?Math.abs(t.x-x)+Math.abs(t.y-y):Math.hypot(t.x-x,t.y-y);if(d<range){range=d;best=t;}}return best;}
export function summonPulse(k,kind,x,y,r=32){k.pulses.push({kind,x,y,r,at:k.clock,id:++k.effectId});if(k.pulses.length>48)k.pulses.shift();}
export function summonHit(g,k,q,t,proc=true){
 const tag=(t.summonTagUntil??0)>k.clock&&q.kind!=='whip',damage=(q.damage+(tag?C.tagDamage:0))*(tag&&Math.random()<C.tagCrit?2:1)*C.outgoingMultiplier;hitTarget(t,damage,t.x,t.y,'#e4d7ff','summon',false);
 if(q.kind==='bolt'||q.kind==='star')t.miracleBlight=Math.max(t.miracleBlight||0,q.kind==='star'?5:3);
 const d=t.summonAilments??={};if(q.kind==='fireball'||q.kind==='draconid')d.dragon=Math.max(d.dragon||0,q.kind==='draconid'?3:2);
 if(q.kind!=='whip'){d.shadow=3;d.static=1;d.astral=3;d.irradiated=3;
  if(proc&&k.clock>=(k.procUntil??0)){k.procUntil=k.clock+100/60;k.shots.push({kind:'apparatus',x:q.x??t.x,y:q.y??t.y,vx:0,vy:0,r:22,left:60,age:0,damage:60*C.damageBonus,hits:new Map()});}
 }summonPulse(k,q.kind==='whip'?'tag':'hit',t.x,t.y,18);
}
export function summonStarBurst(g,k,q){
 const inside=t=>{const dx=Math.max(0,Math.abs(t.x-q.x)-144),dy=Math.max(0,Math.abs(t.y-q.y)-144);return dx*dx+dy*dy<=(t.r||0)**2;};
 for(const t of possibleTargets())if(t.hp>0&&inside(t))summonHit(g,k,{...q,kind:'star'},t);
 damageSepulcherWhere(g,inside,q.damage);summonPulse(k,'star',q.x,q.y,144);audio.fx('summonExplosion');
}
function intersects(x,y,nx,ny,r,t){return checkSepulcherCollision(x,y,nx,ny,r,[{x:t.x,y:t.y,radius:t.r}]);}
export function updateSummonShots(g,k){
 const blockers=getSepulcherBlockers(g);
 for(const q of k.shots){if(q.dead)continue;q.age++;const x=q.x,y=q.y;
  if(q.kind==='apparatus'){
   for(const t of possibleTargets())if(t.hp>0&&Math.abs(t.x-x)<21+t.r&&Math.abs(t.y-y)<22+t.r&&(q.hits.get(t)??-Infinity)<=k.clock){summonHit(g,k,q,t,false);q.hits.set(t,k.clock+20/60);}
   if(q.age%20===1)damageSepulcherArea(g,x,y,22,q.damage);q.left--;if(q.left<=0)q.dead=true;continue;
  }
  const target=summonTarget(g,x,y,q.kind==='bolt'?1200:600);
  if(target&&!(q.kind==='fireball'&&q.age===1)){const a=Math.atan2(target.y-y,target.x-x),speed=q.kind==='bolt'?40:q.kind==='star'?45:q.initialSpeed;if(q.kind==='fireball'){q.vx=q.vx*.85+Math.cos(a)*speed*.15;q.vy=q.vy*.85+Math.sin(a)*speed*.15;}else{q.vx=(q.vx*20+Math.cos(a)*speed)/21;q.vy=(q.vy*20+Math.sin(a)*speed)/21;}}
  q.x+=q.vx;q.y+=q.vy;q.rotation=q.kind==='star'?(q.rotation||0)+(Math.abs(q.vx)+Math.abs(q.vy))*.01*Math.sign(q.vx||1):Math.atan2(q.vy,q.vx)+(q.kind==='fireball'?-Math.PI/2:Math.PI/2);
  const wall=checkSepulcherCollision(x,y,q.x,q.y,q.r,blockers),hits=[];for(const t of possibleTargets()){if(t.hp<=0)continue;const h=intersects(x,y,q.x,q.y,q.r,t);if(h.hit&&(!wall.hit||h.t<wall.t))hits.push({t,at:h.t});}hits.sort((a,b)=>a.at-b.at);
  if(hits.length){const h=hits[0];q.x=x+(q.x-x)*h.at;q.y=y+(q.y-y)*h.at;summonHit(g,k,q,h.t);q.dead=true;if(q.kind==='star')summonStarBurst(g,k,q);else if(q.kind==='fireball'){summonPulse(k,'fire',q.x,q.y,50);audio.fx('summonFirePop');}}
  else if(wall.hit){q.x=wall.point.x;q.y=wall.point.y;q.dead=true;}
  q.left--;if(!q.dead&&q.left<=0){q.dead=true;if(q.kind==='star')summonStarBurst(g,k,q);else if(q.kind==='fireball'){summonPulse(k,'fire',q.x,q.y,40);audio.fx('summonFirePop');}}
  q.trail??=[];q.trail.push({x:q.x,y:q.y});if(q.trail.length>8)q.trail.shift();
 }k.shots=k.shots.filter(q=>!q.dead).slice(-128);
}
export function updateSummonDebuffs(g,k,dt){
 const hosts=[...new Set([g.boss,...g.hearts,...g.brothers,...g.seekers])],vulnerable=new Set(possibleTargets());updateMageDebuffs(dt,g,hosts,vulnerable,C.outgoingMultiplier);
 for(const t of hosts){const d=t.summonAilments;if(!d)continue;let loss=0;for(const [name,dps]of [['dragon',480*(t.heatDamageScale??1)],['shadow',15],['astral',37.5],['static',2.5*(t.vx?4:1)*(t.electricDamageScale??1)],['irradiated',0]]){const active=Math.min(dt,Math.max(0,d[name]||0));d[name]=Math.max(0,(d[name]||0)-dt);loss+=active*dps;}
  if(t.hp>0&&vulnerable.has(t)){d.carry=(d.carry||0)+loss*C.outgoingMultiplier;const n=Math.floor(d.carry+1e-8);d.carry=Math.max(0,d.carry-n);const old=t.hp;t.hp=Math.max(t===g.boss?1:0,t.hp-n);d.shown=(d.shown||0)+old-t.hp;}
  d.textTime=(d.textTime||0)+dt;if(d.shown>0&&d.textTime>=.25){if(g.floaters.length<140)g.floaters.push({x:t.x,y:t.y-12,life:.6,text:String(Math.ceil(d.shown)),col:'#ffa476',dot:true});d.shown=0;d.textTime=0;}
  if(['dragon','shadow','astral','static','irradiated'].every(name=>(d[name]||0)<=1e-8))delete t.summonAilments;
 }
}
