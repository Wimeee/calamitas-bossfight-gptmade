import { arkAngle } from '../classes/ark-motion.js?v=26.0.2';
import { ctx } from '../core/dom.js?v=26.0.2';
const images={};let loading;
export function initializeNativeArmor(){
 if(loading)return loading;if(typeof Image==='undefined')return Promise.resolve(false);
 loading=Promise.all(['body','back','legs','melee-head'].map(part=>new Promise(resolve=>{
  const image=new Image();image.onload=()=>{images[part]=image;resolve(true);};image.onerror=()=>resolve(false);
  image.src=new URL('../../assets/melee-original/auric-'+part+'.png?v=26.0.2',import.meta.url).href;
 }))).then(r=>r.every(Boolean));return loading;
}
export function nativeArmorReady(){return ['body','back','legs','melee-head'].every(p=>images[p]);}
// tModLoader official Armor Texture Migration Guide: male torso(0,0), jump(1,0),
// front shoulder(0,1), back shoulder(1,1); front/back arms rows0/2,
// jump/walk rows1/3. Native layers share the same40x56 coordinate origin.
export function nativeArmorCells(g,pose){
 const p=g.player,time=g.ritual?.ambient??g.t;
 const airborne=!p.grounded,walking=p.grounded&&Math.abs(p.vx)>20;
 const cycle=Math.floor(time*12),swing=p.swing?Math.min(3,Math.floor((1-p.swing.time/p.swing.max)*4)):null;
 let armColumn=swing!==null?3+swing:airborne?2:walking?3+cycle%4:2;
 if(p.swing||p.arkParry){
   let angle=p.swing?arkAngle(p.swing,1-p.swing.time/p.swing.max):p.arkParry.angle;
   if(pose.flip)angle=Math.PI-angle;
   angle=Math.atan2(Math.sin(angle),Math.cos(angle));
   armColumn=angle<-Math.PI/2?3:angle<-Math.PI/6?4:angle<Math.PI/6?5:6;
 }
 const armRow=swing!==null?0:airborne||walking?1:0;
 const leg=airborne?5:walking?6+cycle%14:0;
 return {leg,torso:airborne?1:0,front:[armColumn,armRow],back:[armColumn,armRow+2],shoulders:!airborne&&swing===null};
}
export function drawNativeArmor(g,pose,x=g.player.x,y=g.player.y,alpha=1){
 if(!nativeArmorReady())return false;
 const cells=nativeArmorCells(g,pose);
 ctx.save();ctx.imageSmoothingEnabled=false;ctx.globalAlpha*=alpha;ctx.translate(x,y);ctx.scale(pose.flip?-1:1,1);
 const strip=(part,index)=>ctx.drawImage(images[part],0,index*56,40,56,-20,-28,40,56);
 const body=(col,row)=>ctx.drawImage(images.body,col*40,row*56,40,56,-20,-28,40,56);
 strip('back',cells.leg);body(...cells.back);
 if(cells.shoulders)body(1,1);
 strip('legs',cells.leg);body(cells.torso,0);strip('melee-head',cells.leg);
 body(...cells.front);if(cells.shoulders)body(0,1);
 ctx.restore();return true;
}

