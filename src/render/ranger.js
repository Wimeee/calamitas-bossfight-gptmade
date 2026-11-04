import {ctx} from '../core/dom.js?v=28.0.0';
import {renderQuality} from '../core/settings.js?v=28.0.0';
import {circleVisible} from './visibility.js?v=28.0.0';
const images={},tints=[],colors=[[255,69,0],[64,224,208],[255,165,0],[124,252,0]];let loading;
export function photoImage(name){return images[name];}
export function initializePhotoAtlas(){
 if(loading)return loading;if(typeof Image==='undefined')return Promise.resolve(false);
 loading=Promise.all(['holdout','holdout-glow','bloom','pulse','gel'].map(name=>new Promise(resolve=>{
  const im=new Image();im.onload=()=>{images[name]=im;if(name==='bloom')for(const color of colors){const c=document.createElement('canvas');c.width=c.height=96;const x=c.getContext('2d');x.drawImage(im,0,0,96,96);try{const p=x.getImageData(0,0,96,96);for(let i=0;i<p.data.length;i+=4)for(let j=0;j<3;j++)p.data[i+j]*=color[j]/255;x.putImageData(p,0,0);}catch{}tints.push(c);}resolve(true);};im.onerror=()=>resolve(false);im.src=new URL('../../assets/ranger-original/'+name+'.png?v=28.0.0',import.meta.url).href;
 }))).then(r=>r.every(Boolean));return loading;
}
export function drawPhotoHeld(g,a){
 const p=g.player;if(!p.kit?.photo?.active||!images.holdout)return;
 ctx.save();ctx.translate(p.x+Math.cos(a)*28,p.y+Math.sin(a)*28);ctx.rotate(a);if(Math.cos(a)<0)ctx.scale(1,-1);ctx.imageSmoothingEnabled=false;ctx.drawImage(images.holdout,-85,-33,170,66);if(images['holdout-glow']){ctx.globalCompositeOperation='lighter';ctx.globalAlpha=.7;ctx.drawImage(images['holdout-glow'],-85,-33,170,66);}ctx.restore();
}
function bloom(x,y,size,alpha,index){const im=tints[index%4]||images.bloom;if(!im)return;ctx.globalAlpha=alpha;ctx.drawImage(im,x-size/2,y-size/2,size,size);}
export function drawPhotoEffects(g){
 const k=g.player.kit?.photo;if(g.player.weapon!==1||!k||!images.bloom)return;
 const low=renderQuality()==='low',color=Math.floor(g.t*3)%4;ctx.save();ctx.globalCompositeOperation='lighter';
 const v=k.visual;if(v&&v.age<.05){const count=low?28:60,fade=1-v.age/.05,warm=Math.max(.12,1-k.photoTimer/90);ctx.save();ctx.translate(v.x,v.y);ctx.rotate(v.a);for(let i=0;i<count;i++){const t=i/(count-1),distance=v.range*t,size=Math.max(8,74*(1-t)*warm),im=tints[color]||images.bloom;ctx.globalAlpha=fade*.85;ctx.drawImage(im,distance-size*1.5,-size/2,size*3,size);ctx.globalAlpha=fade*.65;ctx.drawImage(images.bloom,distance-size,-size*.14,size*2,size*.28);if(!low&&i%4===0){const offset=Math.sin(g.t*18+i)*size;ctx.globalAlpha=fade*.5;ctx.drawImage(im,distance-size,offset,size*2,4);}}ctx.restore();}
 for(const q of [...k.lights,...k.clusters]){if(!circleVisible(ctx,q.x,q.y,120))continue;for(let i=0;i<q.trail.length;i+=low?6:3){const p=q.trail[i];bloom(p.x,p.y,24,.35*i/q.trail.length,color+(i>>2));}bloom(q.x,q.y,q.kind==='cluster'?85:55,.9,color);bloom(q.x,q.y,22,1,(color+1)%4);}
 if(images.pulse)for(const p of k.pulses){if(!circleVisible(ctx,p.x,p.y,p.r))continue;const t=1-p.life/p.max,size=p.r*2*(.3+.7*t);ctx.globalAlpha=(1-t)*.65;ctx.drawImage(images.pulse,p.x-size/2,p.y-size/2,size,size);}
 ctx.restore();
}
