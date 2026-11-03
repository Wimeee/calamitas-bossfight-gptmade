import {ripperDamage,ripperCombat} from '../systems/rippers.js?v=26.0.5';
import {segmentDistance} from '../core/math.js?v=26.0.5';
import {audio} from '../core/audio.js?v=26.0.5';
// Pinned Calamity Sepulcher*.SetDefaults: DR=.999999f, unbreakableDR=true.
// Arms have dontTakeDamage=true; all other segments share the head via realLife.
const DAMAGE_MULTIPLIER=Math.fround(1-Math.fround(.999999));
export function getSepulcherDamageTargets(g){
 const w=g?.sepulcher;if(!w||g.mode!=='playing'||g.stage!=='hearts'||g.castDelayState||!g.hearts?.some(h=>h.hp>0))return [];
 const out=[],add=(ref,width,height)=>{if(Number.isFinite(ref.x)&&Number.isFinite(ref.y))out.push({ref,x:ref.x,y:ref.y,halfW:width/2,halfH:height/2,r:Math.hypot(width,height)/2});};
 add(w,62,64);for(const node of w.nodes||[])add(node,node.isEnergyBall||node.isTail?20:48,node.isEnergyBall||node.isTail?20:48);return out;
}
export function sepulcherCircleHits(t,x,y,radius){const dx=Math.max(0,Math.abs(x-t.x)-t.halfW),dy=Math.max(0,Math.abs(y-t.y)-t.halfH);return dx*dx+dy*dy<=radius*radius;}
export function sepulcherCapsuleHits(t,x1,y1,x2,y2,radius){
 let enter=0,exit=1;const dx=x2-x1,dy=y2-y1;let intersects=true;
 for(const [origin,delta,lo,hi] of [[x1,dx,t.x-t.halfW,t.x+t.halfW],[y1,dy,t.y-t.halfH,t.y+t.halfH]]){
  if(Math.abs(delta)<1e-12){if(origin<lo||origin>hi)intersects=false;continue;}
  const a=(lo-origin)/delta,b=(hi-origin)/delta;enter=Math.max(enter,Math.min(a,b));exit=Math.min(exit,Math.max(a,b));
 }
 if(intersects&&enter<=exit)return true;
 if(sepulcherCircleHits(t,x1,y1,radius)||sepulcherCircleHits(t,x2,y2,radius))return true;
 for(const x of [t.x-t.halfW,t.x+t.halfW])for(const y of [t.y-t.halfH,t.y+t.halfH])if(segmentDistance(x,y,x1,y1,x2,y2)<=radius)return true;
 return false;
}
export function damageSepulcherWhere(g,test,amount,options={}){
 if(!Number.isFinite(amount)||amount<=0)return 0;const targets=getSepulcherDamageTargets(g);if(!targets.length)return 0;
 const worm=g.sepulcher;worm.maxHp??=(g.difficulty==='revenge'||g.difficulty==='death'?345000:300000);worm.hp??=worm.maxHp;
 const reduced=Math.fround(Math.fround(amount*ripperDamage(g))*DAMAGE_MULTIPLIER);if(!Number.isFinite(reduced))return 0;const damage=Math.max(1,Math.trunc(reduced));let total=0;
 for(const target of targets){
  if(options.hitIds?.has(target.ref)||g.t<(options.cooldowns?.get(target.ref)??-Infinity)||!test(target))continue;
  options.hitIds?.add(target.ref);options.cooldowns?.set(target.ref,g.t+(options.interval||0));
  const inflicted=Math.min(worm.hp,damage);if(inflicted<=0)break;worm.hp-=inflicted;total+=inflicted;ripperCombat(g);
  // Original armored NPC combat text is gray; this does not trigger ordinary on-hit procs.
  if(g.floaters.length<140)g.floaters.push({x:target.x,y:target.y-12,life:.85,text:String(inflicted),col:'#808080'});
  if(worm.hp<=0){g.sepulcher=null;g.sepulcherDefeated=true;audio.minion('sepulcherDeath',g);break;}
 }
 return total;
}
export function damageSepulcherArea(g,x,y,radius,amount,options){
 if(!Number.isFinite(radius)||radius<0||!Number.isFinite(x)||!Number.isFinite(y))return 0;
 return damageSepulcherWhere(g,t=>sepulcherCircleHits(t,x,y,radius),amount,options);
}
