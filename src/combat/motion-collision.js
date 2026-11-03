import {segmentDistance} from '../core/math.js?v=26.1.1';

// Keep this snapshot local to one combat update; pause/restart cannot reuse a path.
export function beginCombatMotion(g,dt){return{duration:dt,points:[{time:0,x:g.player.x,y:g.player.y}],projectiles:new Set(g.projectiles)};}
export function projectileMotionPosition(q){
  const native=q.nativeBrother||q.kind==='sepulcherDart'||q.sourceCalamitas&&['hellblast','hellblast2','fire','giga','skull'].includes(q.kind)||q.kind==='dart'&&q.ai1===4;
  const barrage=q.kind==='dart'&&q.ai1===2&&q.sourceCalamitas;
  if(!native&&!barrage)return{x:q.x,y:q.y};
  const updates=q.nativeBrother?(q.kind==='fist'?(q.variant<2?3:1):q.variant===3?6:q.variant===1?3:q.variant>=4?1:2):1;
  // Evaluate the same instant as player physics between native60Hz ticks.
  const remainder=(q.nativeBrother?q.remainder:q.stepRemainder)||0;
  return{x:q.x+(q.vx||0)*remainder*updates,y:q.y+(q.vy||0)*remainder*updates};
}
export function movingPlayerDistance(p,q,oldX,oldY,motion,start=null){
  if(!motion?.projectiles.has(q)||motion.duration<=0||motion.points.length<2)return segmentDistance(p.x,p.y,oldX,oldY,q.x,q.y);
  const end=projectileMotionPosition(q);oldX=start?.x??oldX;oldY=start?.y??oldY;
  const points=motion.points,dx=end.x-oldX,dy=end.y-oldY;let distance=Infinity;
  for(let i=1;i<points.length;i++){
    const a=points[i-1],b=points[i],u=a.time/motion.duration,v=b.time/motion.duration;
    distance=Math.min(distance,segmentDistance(0,0,oldX+dx*u-a.x,oldY+dy*u-a.y,oldX+dx*v-b.x,oldY+dy*v-b.y));
  }
  return distance;
}

// Minimum simultaneous separation of a piecewise player path and one timed actor segment.
export function relativeActorDistance(points,segment){
 const {start,end,from,to}=segment;if(end<=start||!points?.length)return Infinity;let best=Infinity;
 for(let i=1;i<points.length;i++){
  const a=points[i-1],b=points[i],lo=Math.max(start,a.time),hi=Math.min(end,b.time);if(hi<lo||b.time<=a.time)continue;
  const at=time=>{const p=(time-a.time)/(b.time-a.time),q=(time-start)/(end-start);return{x:from.x+(to.x-from.x)*q-a.x-(b.x-a.x)*p,y:from.y+(to.y-from.y)*q-a.y-(b.y-a.y)*p};};
  const u=at(lo),v=at(hi);best=Math.min(best,segmentDistance(0,0,u.x,u.y,v.x,v.y));
 }return best;
}
