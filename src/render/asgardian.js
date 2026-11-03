import {ctx} from '../core/dom.js?v=26.0.5';
import {state} from '../core/state.js?v=26.0.5';
import {nativeArmorCells} from './native-armor.js?v=26.0.5';
import {arkEffectTexture} from './ark-native.js?v=26.0.5';
const images={},tints=new Map();let loading;
export function initializeAsgardianAtlas(){
 if(loading)return loading;if(typeof Image==='undefined')return Promise.resolve(false);
 return loading=Promise.all(['shield','mark','explosion'].map(name=>new Promise(resolve=>{
  const image=new Image();image.onload=()=>{images[name]=image;resolve(true);};image.onerror=()=>resolve(false);
  image.src=new URL('../../assets/asgardian-original/'+name+'.png?v=26.0.5',import.meta.url).href;
 }))).then(r=>r.every(Boolean));
}
export function asgardianShieldFrame(g){
 const p=g.player;
 if(p.swing)return Math.min(4,1+Math.floor((1-p.swing.time/p.swing.max)*4));
 return nativeArmorCells(g,{flip:false}).leg;
}
function tinted(name,color){
 const source=images[name];if(!source)return null;const key=name+color;if(tints.has(key))return tints.get(key);
 const canvas=document.createElement('canvas');canvas.width=source.width;canvas.height=source.height;
 const c=canvas.getContext('2d');c.drawImage(source,0,0);c.globalCompositeOperation='multiply';c.fillStyle=color;c.fillRect(0,0,canvas.width,canvas.height);c.globalCompositeOperation='destination-in';c.drawImage(source,0,0);tints.set(key,canvas);return canvas;
}
export function drawAsgardianShield(g){
 const image=images.shield,p=g.player;if(!image||g.mode==='dead')return false;
 if(p.iframes>0&&Math.floor(g.t*20)%2)return true;
 const facing=p.aegisDash?p.dashX:state.pointer.x<p.x?-1:1,frame=asgardianShieldFrame(g);
 ctx.save();ctx.imageSmoothingEnabled=false;ctx.translate(p.x,p.y);ctx.scale(facing,1);
 // Native equipment strip:20 body poses,40x56 each; not a20-frame idle animation.
 ctx.drawImage(image,0,frame*56,40,56,-20,-28,40,56);ctx.restore();return true;
}
export function drawAsgardianEffects(g){
 if(g.mode==='dead')return;
 ctx.save();ctx.globalCompositeOperation='lighter';
 for(const p of g.aegisEffects||[]){const age=(g.t-p.born)*60,u=age/(p.life*60);if(u<0||u>=1||p.kind==='sound')continue;
  const decay=.95,power=Math.pow(decay,age),distance=(1-power)/(1-decay);
  const x=p.x+p.vx*distance,y=p.y+p.vy*distance;
  let image,sx,sy,alpha,rotation=p.rotation||0;
  if(p.kind==='pulse'){image=arkEffectTexture('pulse-ring',p.color);sx=sy=2*(p.scale+(p.endScale-p.scale)*(1-Math.pow(1-u,4)));alpha=Math.pow(Math.cos(u*Math.PI/2),2);}
  else if(p.kind==='explosion'){image=tinted('explosion',p.color);sx=sy=p.scale*(1-Math.pow(1-u,4));alpha=Math.pow(Math.cos(u*Math.PI/2),2);}
  else {image=tinted('mark',p.color);sx=p.scale*(p.stretch?.[0]||1);sy=p.scale*(p.stretch?.[1]||1);alpha=1-u;rotation=Math.atan2(p.vy,p.vx);}
  if(!image)continue;ctx.save();ctx.translate(x,y);ctx.rotate(rotation);ctx.globalAlpha=alpha;ctx.drawImage(image,-image.width*sx/2,-image.height*sy/2,image.width*sx,image.height*sy);ctx.restore();
 }
 ctx.restore();
}
