import {arkConstellationLayout} from './ark-constellation-layout.js?v=26.0.2';
import { arkSwingGeometry, arkSwingRatio } from '../classes/ark-motion.js?v=26.0.2';
import { ctx } from '../core/dom.js?v=26.0.2';
const images={};let loading;
const vfxNames=['rip-texture','rip-layer','scissors-glow','heavy-smoke','thin-sparkle','light','bloom-line','bloom-cap','slice-line','pulse-ring','parry-bar-back','parry-bar-front'];
export function initializeNativeArk(){
 if(loading)return loading;if(typeof Image==='undefined')return Promise.resolve(false);
 loading=Promise.all(['left','left-glow','right','right-glow','sparkle','trail-glow','swing-smear','swirl-smoke','projectile-streak','bloom-circle',...vfxNames].map(part=>new Promise(resolve=>{
  const image=new Image();image.onload=()=>{images[part]=image;resolve(true);};image.onerror=()=>resolve(false);
  const file=['sparkle','swing-smear','swirl-smoke','projectile-streak','bloom-circle'].includes(part)?part:'ark-'+part;
  image.src=new URL((vfxNames.includes(part)?'../../assets/ark-vfx/'+part:'../../assets/melee-original/'+file)+'.png?v=26.0.2',import.meta.url).href;
 }))).then(()=>nativeArkReady());return loading;
}
export function nativeArkReady(){return !!(images.left&&images['left-glow']&&images.right&&images['right-glow']);}
export function getNativeArkDimensions(side){const image=images[side];return image?{width:image.width,height:image.height}:null;}
export function drawNativeArkBlade(side,x,y,scale,angle,flip=false,alpha=1,pivot){
 const image=images[side],glow=images[side+'-glow'];if(!image||!glow)return false;
 const origin=pivot||[flip?image.width:0,image.height];
 ctx.save();ctx.imageSmoothingEnabled=false;ctx.globalAlpha*=alpha;ctx.translate(x,y);ctx.rotate(angle);ctx.scale(flip?-scale:scale,scale);
 const canvasX=flip?image.width-origin[0]:origin[0];
 ctx.drawImage(image,-canvasX,-origin[1]);ctx.drawImage(glow,-canvasX,-origin[1]);ctx.restore();return true;
}
export function drawNativeScissors(x,y,angle,opening=0,scale=1,alpha=1){
 if(!nativeArkReady())return false;
 drawNativeArkBlade('right',x,y,scale,angle+Math.PI/4+opening,false,alpha,[44,86]);
 drawNativeArkBlade('left',x,y,scale,angle+Math.PI/4-opening,false,alpha,[32,86]);return true;
}
export function drawNativeArkSpark(x,y,scale=1,angle=0,alpha=1,color='#d8bfff',bloomScale=1){
 const image=images.sparkle;if(!image)return false;const bloom=arkEffectTexture('bloom-circle',color);
 ctx.save();ctx.globalAlpha*=alpha;ctx.globalCompositeOperation='lighter';ctx.translate(x,y);
 if(bloom){const size=image.height*scale*bloomScale;ctx.save();ctx.globalAlpha*=.5;ctx.drawImage(bloom,-size/2,-size/2,size,size);ctx.restore();}
 ctx.rotate(angle);ctx.save();ctx.rotate(Math.PI/4);ctx.globalAlpha*=.5;const small=scale*.75;ctx.drawImage(image,-image.width*small/2,-image.height*small/2,image.width*small,image.height*small);ctx.restore();
 ctx.drawImage(image,-image.width*scale/2,-image.height*scale/2,image.width*scale,image.height*scale);ctx.restore();return true;
}
const effectTints=new Map();
function effectImage(name,hue){
 const source=images[name];if(!source)return null;
 const color=typeof hue==='string'?(hue.startsWith('hsl')?'hsl('+Math.round(parseFloat(hue.slice(4))/15)*15+' 100% 68%)':hue):'hsl('+((Math.round(hue/15)*15)%360+360)%360+' 100% 68%)',key=name+color;if(effectTints.has(key))return effectTints.get(key);
 const canvas=document.createElement('canvas');canvas.width=source.width;canvas.height=source.height;
 const c=canvas.getContext('2d');c.drawImage(source,0,0);c.globalCompositeOperation='multiply';c.fillStyle=color;c.fillRect(0,0,canvas.width,canvas.height);
 c.globalCompositeOperation='destination-in';c.drawImage(source,0,0);c.globalCompositeOperation='source-over';
 effectTints.set(key,canvas);return canvas;
}
export function arkEffectTexture(name,color='#fff'){return color==='#fff'||color==='#ffffff'?images[name]:effectImage(name,color);}
export function drawNativeArkTrail(g,s,angle,progress){
 const geometry=arkSwingGeometry(s,progress,g.player),swirl=!!s.wide;
 if(!swirl&&progress*s.max*120>10){
  const side=s.charge>0?'scissors-glow':'right-glow',image=images[side];
  if(image)for(let i=1;i<10;i++){
   const past=Math.max(0,progress-i/(120*s.max)),pose=arkSwingGeometry(s,past,g.player),scale=geometry.scale-.2*i/10;
   const rotation=pose.angle+Math.PI/4+(geometry.flip?Math.PI/2:0),origin=s.charge>0?[33,86]:[geometry.flip?image.width:0,image.height];
   ctx.save();ctx.globalAlpha*=s.charge>0?.15:.05;ctx.translate(geometry.draw.x,geometry.draw.y);ctx.rotate(rotation);ctx.scale(geometry.flip?-scale:scale,scale);ctx.drawImage(image,-(geometry.flip?image.width-origin[0]:origin[0]),-origin[1]);ctx.restore();
  }
 }

 if(!swirl&&progress<=.5)return true;
 const image=effectImage(swirl?'swirl-smoke':'swing-smear',swirl?'#d2691e':((s.id===2?306:0)+Math.max(0,(progress-.5)*2)*54));if(!image)return false;
 const facing=s.direction??1;
 const rotation=swirl?angle+Math.PI+(facing<0?Math.PI:0):s.angle+Math.PI+(-Math.PI/8+Math.PI/8*progress)*facing;
 const scale=geometry.scale*(swirl?2.1:2.3),opacity=Math.max(0,Math.sin(Math.PI*progress))*(swirl?.7:.5);
 ctx.save();ctx.translate(g.player.x,g.player.y);ctx.rotate(rotation);ctx.scale(scale,scale);
 ctx.globalAlpha*=opacity;ctx.globalCompositeOperation='lighter';ctx.drawImage(image,-image.width/2,-image.height/2);ctx.restore();return true;
}
export function drawNativeProjectileTrail(s){
 const image=effectImage('projectile-streak',s.id==='arkBeam'?205:280);if(!image)return false;
 const history=s.nativeTrail||[],points=[...history,{x:s.x,y:s.y}];if(points.length<2)return true;
 ctx.save();ctx.globalCompositeOperation='lighter';
 for(let i=1;i<points.length;i++){
  const a=points[i-1],b=points[i],dx=b.x-a.x,dy=b.y-a.y,length=Math.hypot(dx,dy);if(length<.01)continue;
  const width=(s.id==='arkBeam'?24:22)*Math.pow(i/points.length,3);
  ctx.save();ctx.globalAlpha*=.65*i/points.length;ctx.translate(a.x,a.y);ctx.rotate(Math.atan2(dy,dx));
  ctx.drawImage(image,0,-width/2,length+1,width);ctx.restore();
 }
 ctx.restore();return true;
}
export function drawNativeThrownArk(g,s){
 const progress=Math.max(0,Math.min(1,s.age/s.max)),scale=s.snapped?1.5:1+.5*Math.sin(progress*Math.PI);

 const snap=s.snapped?1-(s.snapLife||0)/(s.snapMax||.22):0;
 const hue=s.snapped?(-1+2*snap)*54:((35-(1-progress)*140-17.5)/17.5)*54;
 const smear=effectImage(s.charge>0?'swirl-smoke':'swing-smear',hue),alpha=(s.snapped?Math.cos(snap*Math.PI/2):Math.sin(progress*Math.PI))*.5;
 if(smear){ctx.save();ctx.translate(s.x,s.y);ctx.rotate(s.angle-3.5*Math.PI/4);ctx.scale(scale*1.65,scale*1.65);ctx.globalCompositeOperation='lighter';ctx.globalAlpha*=alpha;ctx.drawImage(smear,-smear.width/2,-smear.height/2);ctx.restore();}
 const frontRotation=s.angle+Math.PI/4;
 if((s.charge||0)>0||s.snapped){
  const snap=s.snapped?1-(s.snapLife||0)/(s.snapMax||.22):0;
  const open=s.snapped?Math.min(1,snap+.5):Math.min(1,progress*2);
  const backRotation=s.angle+(s.snapped?1.33*Math.PI/2+(Math.PI/4-1.33*Math.PI/2)*open:Math.PI/4+(1.33*Math.PI/2-Math.PI/4)*open);
  let x=s.x,y=s.y;
  if(s.snapped&&!(s.charge>0)){
    const u=Math.min(1,snap+.25),f=u*u*(3-2*u);x=g.player.x+(s.x-g.player.x)*f;y=g.player.y+(s.y-g.player.y)*f;
  }
  drawNativeArkBlade('right',x,y,scale,backRotation,false,1,[44,86]);
 }
 return drawNativeArkBlade('left',s.x,s.y,scale,frontRotation,false,1,[32,86]);
}


function glowStar(x,y,scale,hue,alpha,angle=0){drawNativeArkSpark(x,y,scale,angle,alpha,'hsl('+hue+' 100% 80%)',3);}
// Persistent native particles are simulated separately from drawing.
export function drawNativeSwingParticles(){}
export function drawNativeConstellation(g,s){
 const layout=arkConstellationLayout(g,s);if(!layout)return;const {nodes,links,origin,age}=layout;
 ctx.save();ctx.globalCompositeOperation='lighter';
 for(const [from,to]of links){const a=nodes[from],b=nodes[to],dx=b.x-a.x,dy=b.y-a.y,len=Math.hypot(dx,dy),rotation=Math.atan2(dy,dx)+Math.PI/2,color='hsl('+((b.hue+age*7.2)%360)+' 100% 80%)',line=arkEffectTexture('bloom-line',color),cap=arkEffectTexture('bloom-cap',color);if(!line)continue;
  ctx.save();ctx.translate(origin.x+a.x,origin.y+a.y);ctx.rotate(rotation);ctx.globalAlpha*=.75;ctx.drawImage(line,-line.width*.4,-len,line.width*.8,len);ctx.restore();
  if(cap)for(const [n,flip]of [[a,1],[b,0]]){ctx.save();ctx.translate(origin.x+n.x,origin.y+n.y);ctx.rotate(rotation+flip*Math.PI);ctx.globalAlpha*=.75;ctx.drawImage(cap,-cap.width*.4,-cap.height*.8,cap.width*.8,cap.height*.8);ctx.restore();}
 }
 const alpha=Math.sin(age/20*Math.PI);for(const n of nodes)glowStar(origin.x+n.x,origin.y+n.y,n.scale,(n.hue+age*7.2)%360,alpha,n.rotation);ctx.restore();
}

export function drawNativeSnapBurst(){}

let ripMask,ripFill;
function prepareRipMask(){
 if(ripMask&&ripFill)return true;const mask=images['rip-texture'],layer=images['rip-layer'];if(!mask||!layer)return false;
 ripMask=document.createElement('canvas');ripMask.width=mask.width;ripMask.height=mask.height;const c=ripMask.getContext('2d');c.drawImage(mask,0,0);const data=c.getImageData(0,0,mask.width,mask.height);if(!data?.data){ripMask=null;return false;}
 for(let i=0;i<data.data.length;i+=4){data.data[i+3]=data.data[i];data.data[i]=239;data.data[i+1]=111;data.data[i+2]=85;}c.putImageData(data,0,0);
 ripFill=document.createElement('canvas');ripFill.width=mask.width;ripFill.height=mask.height;const f=ripFill.getContext('2d');f.fillStyle=f.createPattern(layer,'repeat');f.fillRect(0,0,mask.width,mask.height);f.globalCompositeOperation='destination-in';f.drawImage(ripMask,0,0);return true;
}
export function drawNativeRipMask(r,widthRatio=1,alpha=1){
 if(!prepareRipMask()||widthRatio<=0)return false;const dx=r.ex-r.x,dy=r.ey-r.y,len=Math.hypot(dx,dy),width=len*618/1622*.25*widthRatio;
 ctx.save();ctx.translate((r.x+r.ex)/2,(r.y+r.ey)/2);ctx.rotate(Math.atan2(dy,dx)+Math.PI/2);ctx.globalAlpha*=alpha;
 ctx.save();ctx.globalCompositeOperation='lighter';ctx.shadowColor='#ef6f55';ctx.shadowBlur=3;ctx.globalAlpha*=.5;ctx.drawImage(ripMask,-width/2-1,-len/2-1,width+2,len+2);ctx.restore();
 ctx.drawImage(ripFill,-width/2,-len/2,width,len);ctx.restore();return true;
}
export function nativeRipPose(r){
 const elapsed=r.max-r.time,snap=Math.max(0,Math.min(1,elapsed/(25/60))),hold=Math.max(0,Math.min(1,(elapsed-25/60)/(15/60)));
 const thrust=snap<.3?.2-.1*Math.sin(snap/.3*Math.PI):.2+3*(1-Math.pow(1-(snap-.3)/.7,3));
 const ratio=thrust/3.2,closed=snap<.35?-.15*Math.sin(snap/.35*Math.PI):snap<.5?Math.pow((snap-.35)/.15,4):1;
 return{x:r.x+(r.ex-r.x)*ratio*200/242,y:r.y+(r.ey-r.y)*ratio*200/242,snap,hold,opening:(1-closed)*Math.PI/4,alpha:Math.max(0,1-hold/.4),ratio};
}
export function drawNativeBigRip(g,r){
 const pose=nativeRipPose(r);if(!r.hit)drawNativeRipMask({...r,ex:r.x+(r.ex-r.x)*pose.ratio,ey:r.y+(r.ey-r.y)*pose.ratio},1,1);
 if(pose.alpha>0){
  const dx=Math.cos(r.angle),dy=Math.sin(r.angle);drawNativeArkSpark(pose.x+dx*pose.snap*150,pose.y+dy*pose.snap*150,2.8,g.t*.1,pose.alpha,'#6495ed',5);
  const sides=[['right',[44,86],r.angle+Math.PI/4+pose.opening,'#00bfff'],['left',[33,86],r.angle+Math.PI/4-pose.opening,'#ff6347']];
  for(const [side,pivot,angle,color]of sides){const image=arkEffectTexture(side,color);if(!image)continue;ctx.save();ctx.globalCompositeOperation='lighter';ctx.globalAlpha*=pose.alpha*.9;ctx.translate(pose.x,pose.y);ctx.rotate(angle);ctx.drawImage(image,-pivot[0]*1.4,-pivot[1]*1.4,image.width*1.4,image.height*1.4);ctx.restore();}
 }return true;
}
export function parryRechargeState(p){const max=340/60,elapsed=max-(p.arkParryCd||0);if(!p.arkParryCd||elapsed<=15/60)return null;return{progress:Math.min(1,(elapsed-15/60)/(max-15/60)),alpha:Math.min(1,(elapsed-15/60)/(25/60),(p.arkParryCd||0)/(8/60))};}
export function drawNativeParryRecharge(g){const state=parryRechargeState(g.player),back=images['parry-bar-back'],front=images['parry-bar-front'];if(!state||!back||!front)return false;const p=g.player,w=front.width*state.progress;ctx.save();ctx.globalAlpha*=Math.max(0,state.alpha);ctx.drawImage(back,p.x-back.width/2,p.y-36-back.height/2);if(w>0)ctx.drawImage(front,0,0,w,front.height,p.x-front.width/2,p.y-36-front.height/2,w,front.height);ctx.restore();return true;}
