import {mageConfig as C} from '../../config/mage.js?v=29.1.0';
import {kit} from './shared.js?v=29.1.0';
import {state} from '../core/state.js?v=29.1.0';
import {audio} from '../core/audio.js?v=29.1.0';
import {possibleTargets} from '../combat/targets.js?v=29.1.0';
import {hitTarget} from '../combat/damage.js?v=29.1.0';
import {damageSepulcherArea} from '../combat/sepulcher-damage.js?v=29.1.0';
import {updateMageDebuffs} from '../combat/mage-debuffs.js?v=29.1.0';
import {getSepulcherBlockers,checkSepulcherCollision} from '../combat/sepulcher-blocking.js?v=29.1.0';

export function initializeMage(g){const p=g.player;if(p.weapon!==2)return;p.maxMana=p.mana=C.maxMana;p.manaPotions=C.manaPotions;p.manaSickness=0;p.manaRegenDelay=0;p.manaMagnet=true;}
export function mageState(){const k=kit();k.vortexOrbs??=[];k.vortexBeams??=[];k.vortexPulses??=[];k.vortexStep??=0;return k;}
export function drinkMagePotion(g=state.game){
 const p=g.player;if(p.weapon!==2||g.mode!=='playing'||g.ritual||p.mana>=p.maxMana||p.manaPotions<=0)return false;
 const amount=Math.min(C.manaPotionAmount,p.maxMana-p.mana);p.mana+=amount;p.manaPotions--;
 p.manaSickness=Math.min(10,(p.manaSickness||0)+5);
 g.floaters.push({x:p.x,y:p.y-25,life:1,text:'+'+amount+' MANA',col:'#a4eaff'});audio.fx('magePotion');return true;
}
// The original weapon has no alternate-fire ability.
export function activateMage(){}
export function attackMage(){
 const g=state.game,p=g.player,k=mageState(),x=state.pointer.x,y=state.pointer.y,cost=Math.floor(C.mana*C.manaCost);
 if(!Number.isFinite(x)||!Number.isFinite(y))return;
 if(p.mana<cost&&!drinkMagePotion(g))return;if(p.mana<cost)return;
 p.mana-=cost;p.fireCd=C.useTime;p.weaponKick=.12;p.manaRegenDelay=C.regenDelay;k.lastFire=g.t;
 const damage=C.damage*C.damageBonus*C.outgoingMultiplier*(1-.25*(p.manaSickness||0)/10),spin=Math.random()<.5?-1:1,start=Math.random()*Math.PI*2;
 for(let i=0;i<12;i++){const a=start+i*Math.PI/6,v=a+spin*Math.PI/2;k.vortexOrbs.push(orb('orbit',x+Math.cos(a)*90,y+Math.sin(a)*90,Math.cos(v)*4,Math.sin(v)*4,damage,i*4,spin));}
 k.vortexOrbs.push(orb('core',x,y,0,0,damage*4,0,spin));audio.fx('mageCast');
}
function orb(kind,x,y,vx,vy,damage,delay=0,spin=1){return {kind,x,y,vx,vy,damage,delay,spin,time:0,left:kind==='seek'?500:90,scale:kind==='seek'?.35+Math.random()*.2:1,turnAt:20+Math.floor(Math.random()*21),turn:Math.random()<.5?-1:1,hits:new Set(),trail:[]};}
function nearest(x,y){let best=null,distance=1000;for(const t of possibleTargets())if(t.hp>0){const d=Math.hypot(t.x-x,t.y-y);if(d<distance){best=t;distance=d;}}return best;}
function hit(g,q,t,beam=false){hitTarget(t,q.damage*(Math.random()<C.critChance?2:1),t.x,t.y,'#9affff','mage',false);const status=beam?'electrified':'auricRebuke';t[status]=Math.max(t[status]||0,beam?1.5:3);}
function beam(g,k,q){
 const target=nearest(q.x,q.y);if(!target)return false;
 const a=Math.atan2(target.y-q.y,target.x-q.x);
 // ClimaxBeam:8px/update,extraUpdates70,timeLeft500. Keep a finite damage front.
 k.vortexBeams.push({x:q.x,y:q.y,ex:q.x,ey:q.y,dx:Math.cos(a),dy:Math.sin(a),age:0,life:500/(71*60),travel:0,damage:q.damage,resolved:false});return true;
}
function explode(g,k,q){
 for(const t of possibleTargets())if(t.hp>0&&Math.hypot(t.x-q.x,t.y-q.y)<=200+t.r)hit(g,q,t);
 damageSepulcherArea(g,q.x,q.y,200,q.damage);
 for(let i=0;i<12;i++){const a=Math.random()*Math.PI*2,s=Math.SQRT2*10*(.4+Math.random()*.15);k.vortexOrbs.push(orb('seek',q.x,q.y,Math.cos(a)*s,Math.sin(a)*s,q.damage/6));}
 k.vortexPulses.push({x:q.x,y:q.y,age:0,life:16/60});audio.fx('mageExplosion');
}
function rotate(q,a){const c=Math.cos(a),s=Math.sin(a),x=q.vx;q.vx=x*c-q.vy*s;q.vy=x*s+q.vy*c;}
function stepOrb(g,k,q,blockers){
 if(q.kind==='seek'){
  if(q.time>=q.turnAt&&q.time%25===0){rotate(q,.65*q.turn);q.turn*=-1;}
  const t=nearest(q.x,q.y);if(t){const a=Math.atan2(t.y-q.y,t.x-q.x),n=Math.max(40,100-q.time*.3);q.vx=(q.vx*(n-1)+Math.cos(a)*15)/n;q.vy=(q.vy*(n-1)+Math.sin(a)*15)/n;}
 }else{
  if(q.left<65){q.vx*=.98;q.vy*=.98;}else if(q.delay%2===0){rotate(q,.14*q.spin);q.vx*=1.0092;q.vy*=1.0092;}
  if(q.time===25&&q.kind==='core'){q.scale=1.5;q.delay=0;}
  q.delay--;if(!q.fired&&q.delay===-30&&q.kind==='orbit')q.fired=beam(g,k,q);
 }
 const x=q.x,y=q.y;q.x+=q.vx;q.y+=q.vy;
 if(q.kind==='seek'&&q.time>=20){
  // Projectile.scale changes drawing only; native width/height stay38x38.
  const block=checkSepulcherCollision(x,y,q.x,q.y,19,blockers);let end=block.hit?block.t:Infinity,first=null;
  for(const t of possibleTargets()){if(t.hp<=0||q.hits.has(t))continue;const c=checkSepulcherCollision(x,y,q.x,q.y,19,[{x:t.x,y:t.y,radius:t.r}]);if(c.hit&&c.t<end){end=c.t;first=t;}}
  if(first){hit(g,q,first);q.hits.add(first);q.left=1;}else if(block.hit){q.x=block.point.x;q.y=block.point.y;q.left=1;}
 }
 if(q.kind==='seek'&&q.time%3===0){q.trail.push({x:q.x,y:q.y});if(q.trail.length>15)q.trail.shift();}
 if(q.kind==='seek'||q.delay<=0)q.time++;q.left--;if(q.left<=0&&q.kind==='core')explode(g,k,q);
}
export function updateMage(dt){
 const g=state.game,p=g.player;if(p.weapon!==2)return;
 p.manaSickness=Math.max(0,(p.manaSickness||0)-dt);const delay=p.manaRegenDelay||0;p.manaRegenDelay=Math.max(0,delay-dt);
 p.mana=Math.min(p.maxMana,p.mana+C.regenPerSecond*Math.max(0,dt-delay));
}
export function updateMageCombat(dt){
 const g=state.game,p=g.player;if(p.weapon!==2||g.mode!=='playing'||g.ritual)return;
 const k=mageState();k.vortexStep+=dt*180;
 const hosts=[...new Set([g.boss,...g.hearts,...g.brothers,...g.seekers])],vulnerable=new Set(possibleTargets());
 while(k.vortexStep+1e-9>=1){
  k.vortexStep=Math.max(0,k.vortexStep-1);const blockers=getSepulcherBlockers(g),count=k.vortexOrbs.length;
  updateMageDebuffs(1/180,g,hosts,vulnerable);
  for(let i=0;i<count;i++)stepOrb(g,k,k.vortexOrbs[i],blockers);
  k.vortexOrbs=k.vortexOrbs.filter(q=>q.left>0);
  for(const b of k.vortexBeams){
   b.age+=1/180;b.life-=1/180;if(b.resolved)continue;
   const x=b.ex,y=b.ey,nx=x+b.dx*8*71/3,ny=y+b.dy*8*71/3;
   const block=checkSepulcherCollision(x,y,nx,ny,2,blockers);let end=block.hit?block.t:1,first=null;
   for(const t of possibleTargets()){if(t.hp<=0)continue;const c=checkSepulcherCollision(x,y,nx,ny,2,[{x:t.x,y:t.y,radius:t.r}]);if(c.hit&&c.t<end){end=c.t;first=t;}}
   b.ex=x+(nx-x)*end;b.ey=y+(ny-y)*end;b.travel=Math.hypot(b.ex-b.x,b.ey-b.y);
   if(first||block.hit){if(first)hit(g,b,first,true);b.resolved=true;b.life=Math.min(b.life,.1);}
  }
  k.vortexBeams=k.vortexBeams.filter(b=>b.life>0);
  for(const pulse of k.vortexPulses)pulse.age+=1/180;k.vortexPulses=k.vortexPulses.filter(q=>q.age<q.life);
 }
}
