import {ctx} from '../core/dom.js?v=28.0.1';
import {renderQuality} from '../core/settings.js?v=28.0.1';
import {circleVisible} from './visibility.js?v=28.0.1';
const images={};let loading;
export function initializeMageAtlas(){
 if(loading)return loading;if(typeof Image==='undefined')return Promise.resolve(false);
 loading=Promise.all(['void-vortex','void-orb','pulse','bloom','mana-sickness','mana-potion'].map(name=>new Promise(resolve=>{
  const image=new Image();image.onload=()=>{
   if(name==='pulse'||name==='bloom'){
    const c=document.createElement('canvas');c.width=c.height=name==='pulse'?512:128;const x=c.getContext('2d');
    x.drawImage(image,0,0,c.width,c.height);
    // Native additive artwork stores black RGB, sometimes with opaque alpha.
    // Tint RGB once while retaining its original alpha/black background.
    try{const pixels=x.getImageData(0,0,c.width,c.height);if(pixels?.data){for(let i=0;i<pixels.data.length;i+=4)pixels.data[i]*=120/255;x.putImageData(pixels,0,0);images[name]=c;}else images[name]=image;}catch{images[name]=image;}
   }else images[name]=image;resolve(true);
  };image.onerror=()=>resolve(false);image.src=new URL('../../assets/mage-original/'+name+'.png?v=28.0.1',import.meta.url).href;
 }))).then(r=>r.every(Boolean));return loading;
}
export function mageImage(name){return images[name];}
export function drawMageHeld(g,a){
 const p=g.player,image=images['void-vortex'];if(!image||p.fireCd<=0)return;
 ctx.save();ctx.imageSmoothingEnabled=false;ctx.translate(p.x,p.y);ctx.rotate(a+Math.PI/4);
 // Staff artwork points NE; the native grip is on the SW end, not its center.
 ctx.drawImage(image,-22,-108,130,130);ctx.restore();
}
function drawOrb(q,frame,x=q.x,y=q.y,alpha=1){
 const im=images['void-orb'];if(!im)return;const f=Math.floor(frame/4)%5,scale=q.scale*(q.kind==='seek'?1.3:1),w=38*scale,h=40*scale;
 ctx.globalAlpha=alpha;ctx.drawImage(im,0,f*40,38,40,x-w/2,y-h/2,w,h);
}
export function drawMageEffects(g){
 const k=g.player.kit;if(g.player.weapon!==2||!k)return;
 ctx.save();ctx.imageSmoothingEnabled=false;ctx.globalCompositeOperation='lighter';
 const low=renderQuality()==='low';
 for(const q of k.vortexOrbs||[]){
  if(q.kind==='core'&&q.time<25||!circleVisible(ctx,q.x,q.y,40))continue;
  const alpha=Math.min(1,q.left/20),frame=(q.kind==='seek'?500:90)-q.left;
  if(q.kind==='seek')for(let i=0;i<q.trail.length;i+=low?4:2){const p=q.trail[i];drawOrb(q,frame,p.x,p.y,alpha*.3*(i+1)/q.trail.length);}
  drawOrb(q,frame,q.x,q.y,alpha);
 }
 for(const b of k.vortexBeams||[]){
  const end=b.travel,tail=Math.max(0,end-220),dx=b.dx,dy=b.dy;
  ctx.globalAlpha=Math.min(1,b.life/.03)*.8;ctx.strokeStyle='#74ffff';ctx.lineWidth=3.6;ctx.beginPath();ctx.moveTo(b.x+dx*tail,b.y+dy*tail);ctx.lineTo(b.x+dx*end,b.y+dy*end);ctx.stroke();
  ctx.strokeStyle='#ffffff';ctx.lineWidth=1.6;ctx.stroke();
  if(b.age<.05&&images.bloom){ctx.globalAlpha=.5*(1-b.age/.05);ctx.drawImage(images.bloom,b.x-36,b.y-36,72,72);}
 }
 for(const pulse of k.vortexPulses||[]){if(!images.pulse||!circleVisible(ctx,pulse.x,pulse.y,180))continue;
  const t=pulse.age/pulse.life,size=2048*(.03+.13*t);ctx.globalAlpha=1-t;ctx.drawImage(images.pulse,pulse.x-size/2,pulse.y-size/2,size,size);
 }
 ctx.restore();
}
