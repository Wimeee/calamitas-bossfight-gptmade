import {summonerConfig as C} from '../../config/summoner.js?v=29.1.0';
// Translation of the installed Terraria1.4.4 FillWhipControlPoints IL.
// Keep these exact points for BOTH rendering and swept collision.
export function nativeWhipPoints(g,w){
 const progress=Math.max(0,Math.min(1,w.age/w.max)),side=w.side,curl=10*Math.PI*(1-progress*1.5)*-side/C.whipSegments,retract=Math.max(0,(progress*1.5-1)/.5),extension=progress*1.5>1?1-retract:progress*1.5;
 const length=C.whipVelocity*(30*2*progress)*extension*C.whipRange/C.whipSegments,arm={x:g.player.x+6*side,y:g.player.y-4},points=[arm];let a={...arm},b={...arm},c={...arm},aa=-Math.PI/2,ab=Math.PI/2+Math.PI/2*side,ac=Math.PI/2;
 const mix=(a,b,t)=>({x:a.x+(b.x-a.x)*t,y:a.y+(b.y-a.y)*t});
 for(let i=0;i<C.whipSegments;i++){
  const turn=curl*i/C.whipSegments,na={x:a.x+Math.cos(aa)*length,y:a.y+Math.sin(aa)*length},nb={x:b.x+Math.cos(ab)*length*2,y:b.y+Math.sin(ab)*length*2},nc={x:c.x+Math.cos(ac)*length*2,y:c.y+Math.sin(ac)*length*2},blend=1-(1-extension)**2,m=mix(nb,mix(nc,na,blend*.9+.1),blend*.7+.3),x=m.x-arm.x,y=(m.y-arm.y)*1.5,rotation=w.angle+Math.PI/2+Math.PI*1.5*retract**2*side;
  points.push({x:arm.x+x*Math.cos(rotation)-y*Math.sin(rotation),y:arm.y+x*Math.sin(rotation)+y*Math.cos(rotation)});aa+=turn;ab+=turn;ac+=turn;a=na;b=nb;c=nc;
 }return points;
}
