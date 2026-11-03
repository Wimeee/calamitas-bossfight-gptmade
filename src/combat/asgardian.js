import {relativeActorDistance} from './motion-collision.js?v=26.1.1';
import {asgardianConfig as c} from '../../config/asgardian.js?v=26.1.1';
import {possibleTargets} from './targets.js?v=26.1.1';
import {hitTarget} from './damage.js?v=26.1.1';
import {segmentDistance} from '../core/math.js?v=26.1.1';
import {emitAsgardianImpact,emitAsgardianInferno} from '../systems/asgardian-effects.js?v=26.1.1';
import {damageSepulcherArea} from './sepulcher-damage.js?v=26.1.1';
import {getSepulcherBlockers,checkSepulcherCollision} from './sepulcher-blocking.js?v=26.1.1';
function canHit(g,t){return t.hp>0&&possibleTargets().includes(t);}
export function tryAsgardianSlam(g,target,oldX=target.x,oldY=target.y,swept=false,hitElapsed=g.player.aegisDash?.elapsed){
 const p=g.player,a=p.aegisDash;if(!a||hitElapsed>c.slamWindow+1e-10||g.mode!=='playing'||!canHit(g,target)||(a.hits.get(target)||-Infinity)>g.t)return false;
 const x=p.x+p.vx/120,y=p.y+p.vy/120;if(!swept&&segmentDistance(x,y,oldX,oldY,target.x,target.y)>(target.r||20)+14)return false;
 const hp=target.hp;hitTarget(target,c.slamDamage,target.x,target.y,'#e88bff','shield');if(target.hp===hp)return false;
 a.hits.set(target,g.t+c.targetCooldown);p.iframes=Math.max(p.iframes,c.iframes);p.contactGuard=Math.max(p.contactGuard,c.iframes);target.godSlayerInferno={remaining:c.infernoTime,carry:target.godSlayerInferno?.carry||0,fx:0};
 emitAsgardianImpact(g,target.x,target.y);
 for(const t of possibleTargets())if(t.hp>0&&Math.abs(t.x-p.x)<c.explosionRadius+(t.r||0)&&Math.abs(t.y-p.y)<c.explosionRadius+(t.r||0))hitTarget(t,c.explosionDamage,t.x,t.y,'#e88bff','shield');
 damageSepulcherArea(g,p.x,p.y,c.explosionRadius,c.explosionDamage);return true;
}
export function updateAsgardianCollisions(g,motion){
 const p=g.player,a=p.aegisDash;if(!a)return;
 const duration=motion?.duration||0,startElapsed=a.elapsed-duration,until=Math.min(duration,c.slamWindow-startElapsed);
 if(a.elapsed>c.slamWindow+1e-10&&until<=0)return;
 const original=motion?.points||[],points=[];
 // A30Hz frame can straddle native tick18. Only its active portion may slam.
 for(let i=0;i<original.length;i++){const q=original[i];if(q.time<=until+1e-10)points.push(q);else{const prev=original[i-1];if(prev&&until>prev.time){const u=(until-prev.time)/(q.time-prev.time);points.push({x:prev.x+(q.x-prev.x)*u,y:prev.y+(q.y-prev.y)*u,time:until});}break;}}
 const hitElapsed=Math.min(a.elapsed,c.slamWindow);
 for(const t of possibleTargets()){
  if(t===g.boss&&motion?.bossSegments?.length){
   let hit=false;
   for(const segment of motion.bossSegments){
    if(segment.start>=until)continue;let clipped=segment;
    if(segment.end>until){const u=(until-segment.start)/(segment.end-segment.start);clipped={...segment,end:until,to:{x:segment.from.x+(segment.to.x-segment.from.x)*u,y:segment.from.y+(segment.to.y-segment.from.y)*u}};}
    if(relativeActorDistance(motion.points,clipped)<(t.r||20)+14){hit=true;break;}
   }
   if(hit)tryAsgardianSlam(g,t,t.x,t.y,true,hitElapsed);continue;
  }
  let hit=false;for(let i=1;i<points.length;i++)if(segmentDistance(t.x,t.y,points[i-1].x,points[i-1].y,points[i].x,points[i].y)<(t.r||20)+14){hit=true;break;}
  if(hit)tryAsgardianSlam(g,t,t.x,t.y,true,hitElapsed);else if(a.elapsed<=c.slamWindow+1e-10)tryAsgardianSlam(g,t);
 }
 if(g.stage==='hearts'&&g.sepulcher&&!a.hits.has(g.sepulcher)){
  let collision;const blockers=getSepulcherBlockers(g);for(let i=1;i<points.length;i++){const from=points[i-1],to=points[i];const c=checkSepulcherCollision(from.x,from.y,to.x,to.y,14,blockers);if(c.hit){collision=c;break;}}
  if(collision){a.hits.set(g.sepulcher,g.t+c.targetCooldown);damageSepulcherArea(g,collision.point.x,collision.point.y,14,c.slamDamage);damageSepulcherArea(g,collision.point.x,collision.point.y,c.explosionRadius,c.explosionDamage);emitAsgardianImpact(g,collision.point.x,collision.point.y);p.iframes=Math.max(p.iframes,c.iframes);}
 }
}
export function updateAsgardianInferno(dt,g){
 if(g.mode!=='playing'||g.ritual)return;
 for(const t of [g.boss,...g.hearts,...g.brothers,...g.seekers]){const d=t.godSlayerInferno;if(!d)continue;const active=Math.min(dt,d.remaining);d.remaining=Math.max(0,d.remaining-dt);
  if(t.hp>0&&canHit(g,t)){d.carry+=active*c.infernoBaseDPS*(t.heatDamageScale??1);const loss=Math.floor(d.carry+1e-8);d.carry-=loss;if(loss>0){const hp=t.hp;t.hp=Math.max(t===g.boss?1:0,t.hp-loss);d.shown=(d.shown||0)+Math.ceil(hp-t.hp);}d.textTime=(d.textTime||0)+active;if(d.shown&&(d.textTime>=.25||d.remaining<=0)){if(g.floaters.length<140)g.floaters.push({x:t.x,y:t.y-10,life:.6,text:String(d.shown),col:'#dc8bff',dot:true});d.shown=0;d.textTime=0;}d.fx+=active;while(d.fx>=1/30){d.fx-=1/30;emitAsgardianInferno(g,t);}}
  if(d.remaining<=1e-9||t.hp<=0)delete t.godSlayerInferno;
 }
}
