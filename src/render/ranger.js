import {photoGeometry} from '../classes/photo-geometry.js?v=29.0.1';
import {ctx} from '../core/dom.js?v=29.0.1';
import {renderQuality} from '../core/settings.js?v=29.0.1';
import {circleVisible} from './visibility.js?v=29.0.1';
const images={},tints=[],colors=[[255,69,0],[64,224,208],[255,165,0],[124,252,0]];let loading;
// Original rate=t*8: interpolate during the first half of each color interval,
// then hold the destination color. No combat RNG or per-frame tint canvases.
export function photoColor(time){const rate=Math.max(0,time)*8,index=Math.floor(rate/2)%4,mix=Math.min(1,rate%2),a=colors[index],b=colors[(index+1)%4];return a.map((v,i)=>v+(b[i]-v)*mix);}
function palette(time){const phase=Math.max(0,time)*4,part=phase%1;return Math.floor(phase)%4*8+Math.min(7,Math.round(Math.min(1,part*2)*7));}
export function photoImage(name){return images[name];}
export function initializePhotoAtlas(){
 if(loading)return loading;if(typeof Image==='undefined')return Promise.resolve(false);
 loading=Promise.all(['holdout','holdout-glow','bloom','pulse','gel','backpack'].map(name=>new Promise(resolve=>{
  const im=new Image();im.onload=()=>{images[name]=im;if(name==='bloom')for(let index=0;index<32;index++){const a=colors[Math.floor(index/8)],b=colors[(Math.floor(index/8)+1)%4],color=a.map((v,i)=>v+(b[i]-v)*(index%8)/7),c=document.createElement('canvas');c.width=c.height=96;const x=c.getContext('2d');x.drawImage(im,0,0,96,96);try{const p=x.getImageData(0,0,96,96);for(let i=0;i<p.data.length;i+=4)for(let j=0;j<3;j++)p.data[i+j]*=color[j]/255;x.putImageData(p,0,0);}catch{}tints.push(c);}resolve(true);};im.onerror=()=>resolve(false);im.src=new URL('../../assets/ranger-original/'+name+'.png?v=29.0.1',import.meta.url).href;
 }))).then(r=>r.every(Boolean));return loading;
}
export function drawPhotoHeld(g,a){
 const p=g.player;if(g.mode==='dead'||g.mode==='won'||!p.kit?.photo?.active||!images.holdout)return;
 const pose=photoGeometry(g);a=pose.a;ctx.save();ctx.translate(pose.holdout.x,pose.holdout.y);ctx.rotate(a);if(pose.flip)ctx.scale(1,-1);ctx.imageSmoothingEnabled=false;ctx.drawImage(images.holdout,-85,-33,170,66);if(images['holdout-glow']){ctx.globalCompositeOperation='lighter';ctx.globalAlpha=.7;ctx.drawImage(images['holdout-glow'],-85,-33,170,66);}ctx.restore();
}
export function drawPhotoBackpack(g){
 const p=g.player,im=images.backpack;if(p.weapon!==1||g.mode==='dead'||p.vy!==0||!im)return false;const pose=photoGeometry(g);ctx.save();ctx.imageSmoothingEnabled=false;ctx.translate(pose.backpack.x,pose.backpack.y);ctx.scale(pose.flip?-1:1,1);ctx.drawImage(im,-19,-23,38,46);ctx.restore();return true;
}
function bloom(x,y,size,alpha,index){const im=tints[index%32]||images.bloom;if(!im)return;ctx.globalAlpha=alpha;ctx.drawImage(im,x-size/2,y-size/2,size,size);}
const noise=n=>{const x=Math.sin(n*127.1)*43758.5453;return x-Math.floor(x);};
function sparks(e,age,count,color,spread=100){
 const life=e.kind==='burst'?.8:.6,fade=Math.max(0,1-age/life);if(!fade)return;
 for(let i=0;i<count;i++){const seed=e.id*31+i,angle=noise(seed)*Math.PI*2,speed=(.3+noise(seed+7))*spread,distance=speed*age,x=e.x+Math.cos(angle)*distance,y=e.y+Math.sin(angle)*distance;ctx.save();ctx.translate(x,y);ctx.rotate(angle);ctx.globalAlpha=fade;ctx.drawImage(tints[(color+i*8)%32]||images.bloom,-12,-2,24,4);ctx.restore();bloom(x,y,14,fade*.6,(color+i*8)%32);}
}
function ring(x,y,size,alpha,angle=0,squash=1){if(!images.pulse)return;ctx.save();ctx.translate(x,y);ctx.rotate(angle);ctx.scale(1,squash);ctx.globalAlpha=alpha;ctx.drawImage(images.pulse,-size/2,-size/2,size,size);ctx.restore();}
export function drawPhotoEffects(g){
 const k=g.player.kit?.photo;if(g.mode==='dead'||g.mode==='won'||g.player.weapon!==1||!k||!images.bloom)return;
 const low=renderQuality()==='low',color=palette(g.t),clock=k.clock;ctx.save();ctx.globalCompositeOperation='lighter';
 const v=k.visual;if(v&&v.age<.066){const count=low?24:48,fade=Math.max(0,1-v.age/.066),warm=Math.max(.05,1-k.photoTimer/90);ctx.save();ctx.translate(v.x,v.y);ctx.rotate(v.a);for(let i=0;i<count;i++){const t=i/(count-1),distance=v.range*t,size=Math.max(5,74*(1-t)*warm);if(!circleVisible(ctx,distance,0,size*2))continue;const flow=.85+Math.sin(clock*90-i*1.7)*.15,im=tints[color]||images.bloom;ctx.globalAlpha=fade*.75;ctx.drawImage(im,distance-size*1.5,-size*flow/2,size*3,size*flow);ctx.globalAlpha=fade*.55;ctx.drawImage(images.bloom,distance-size,-size*.12,size*2,size*.24);if(i%(low?6:3)===0){const offset=Math.sin(clock*18+i)*size*.7;ctx.globalAlpha=fade*.6;ctx.drawImage(im,distance-size,offset,size*2,3);}}ctx.restore();}
 // The native holdout vents energy above its crystal; it has no invented recoil.
 if(k.active){const p=g.player,{a,side}=photoGeometry(g);for(let i=0;i<(low?3:6);i++){const age=(clock*.9+i*.173)%1,along=12+noise(i+4)*35,x=p.x+Math.cos(a)*along+Math.sin(a)*side*(22+age*20),y=p.y+Math.sin(a)*along-Math.cos(a)*side*(22+age*20);bloom(x,y,14*(1-age),.5*(1-age),16);}}
 for(const list of [k.lights,k.clusters])for(const q of list){if(!circleVisible(ctx,q.x,q.y,170))continue;const cluster=q.kind==='cluster',scale=cluster?1:.001+.999*Math.min(1,q.ticks/25);for(let i=0;i<q.trail.length;i+=low?6:2){const p=q.trail[i],fraction=(i+1)/q.trail.length;bloom(p.x,p.y,(cluster?55:70)*fraction,.45*fraction,color);}bloom(q.x,q.y,(cluster?160:80)*scale,.9,color);bloom(q.x,q.y,24*scale,.9,color);if(cluster){const a=Math.atan2(q.vy,q.vx)+Math.PI/2,offset=Math.max(-.7,Math.min(.7,Math.sin(q.left*.875/Math.PI)))*22.5;for(const side of [-1,1])bloom(q.x+Math.cos(a)*offset*side,q.y+Math.sin(a)*offset*side,120,.35,color);}}
 if(images.pulse)for(const p of k.pulses){if(!circleVisible(ctx,p.x,p.y,p.r))continue;const t=1-p.life/p.max,size=p.r*2*(.3+.7*t);ctx.globalAlpha=(1-t)*.65;ctx.drawImage(images.pulse,p.x-size/2,p.y-size/2,size,size);}
 for(const e of k.effects||[]){const age=clock-e.at;if(!circleVisible(ctx,e.x,e.y,e.kind==='burst'?e.r+180:300))continue;const c=(color+e.id*8)%32;
  if(e.kind==='alternate'){const t=Math.min(1,age/(40/60));for(let i=0;i<(low?2:4);i++){const move=t*(25+i*18);ring(e.x+Math.cos(e.angle)*move,e.y+Math.sin(e.angle)*move,35+t*(35+i*12),(1-t)*.5,e.angle,.65);}sparks(e,age,low?6:16,c,110);}
  else if(e.kind==='hit'){if(e.r>1&&age<.2)ring(e.x,e.y,200*(1.2+.6*age/.2),(1-age/.2)*.7);sparks(e,age,low?3:5,c,100);}
  else if(e.kind==='warm'){sparks(e,age,low?10:30,c,180);}
  else sparks(e,age,low?8:e.kind==='burst'?30:25,c,e.kind==='burst'?e.r*1.8:120);
 }
 ctx.restore();
}
