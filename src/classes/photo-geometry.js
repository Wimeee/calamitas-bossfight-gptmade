import {state} from '../core/state.js?v=29.1.1';
// Native holdout origin85x33, player offset28; primary55/-10, light108/+6.
// One geometry authority keeps the image, arms and actual projectiles aligned.
const pausedPoses=new WeakMap();
export function photoGeometry(g){
 const p=g.player,last=pausedPoses.get(g),mx=state.pointer.x,my=state.pointer.y;
 if(last&&(g.mode==='paused'||last.x===p.x&&last.y===p.y&&last.mx===mx&&last.my===my))return last.pose;
 const a=Math.atan2(my-p.y,mx-p.x),dx=Math.cos(a),dy=Math.sin(a),side=dx<0?-1:1;
 const point=(reach,vertical=0)=>({x:p.x+dx*reach-dy*vertical*side,y:p.y+dy*reach+dx*vertical*side,dx,dy,a});
 const pose={a,dx,dy,side,flip:side<0,holdout:point(28),primary:point(55,-10),light:point(108,6),backpack:{x:p.x-20*side,y:p.y-6}};pausedPoses.set(g,{pose,x:p.x,y:p.y,mx,my});return pose;
}
