import {minionImage} from '../render/minion-atlas.js?v=27.1.0';
import {minionSprites} from '../../config/minion-sprites.js?v=27.1.0';
const pixels=new Map();
function visualRandom(g){let n=g.helperVisualSeed??=193377;n^=n<<13;n^=n>>>17;n^=n<<5;g.helperVisualSeed=n>>>0;return(g.helperVisualSeed>>>0)/4294967296;}
function ashPixels(br){const kind=br.kind===0?'cataclysm':'catastrophe',s=minionSprites[kind],frame=br.nativeFrame||0,key=kind+frame;if(pixels.has(key))return pixels.get(key);const image=minionImage(kind);if(!image)return[];try{
 const canvas=document.createElement('canvas');canvas.width=s.cellW;canvas.height=s.cellH;const c=canvas.getContext('2d'),sx=Math.floor(frame/s.rows)*s.cellW,sy=frame%s.rows*s.cellH;c.drawImage(image,sx,sy,s.cellW,s.cellH,0,0,s.cellW,s.cellH);const glow=minionImage(kind+'Glow');if(glow){c.globalAlpha=.8;c.drawImage(glow,sx,sy,s.cellW,s.cellH,0,0,s.cellW,s.cellH);}const data=c.getImageData(0,0,s.cellW,s.cellH);if(!data?.data)return[];
 const result=[],stride=2;for(let y=0;y<s.cellH;y+=stride)for(let x=0;x<s.cellW;x+=stride){const i=(y*s.cellW+x)*4,b=(data.data[i]+data.data[i+1]+data.data[i+2])/765;if(data.data[i+3]>8&&b>.05)result.push({x:x-s.anchor.x,y:y-s.anchor.y,brightness:b});}
 if(pixels.size<12)pixels.set(key,result);return result;
 }catch{return[];}}
export function emitBrotherDeath(g,br){
 if(br.deathVisualEmitted)return;br.deathVisualEmitted=true;g.helperAshes??=[];g.helperDust??=[];const rand=()=>visualRandom(g),source=ashPixels(br),facing=g.player.x>br.x?-1:1,step=Math.max(1,Math.ceil(source.length/4096));
 for(let i=0;i<source.length;i+=step){const p=source[i];g.helperAshes.push({x:br.x+p.x*facing,y:br.y+p.y,vx:(br.vx||0)*.7,vy:(br.vy||0)*.7,brightness:p.brightness,gray:Math.round(p.brightness*.67*255),scale:.7+rand()*.6,ticks:0,lifetime:105+Math.floor(rand()*40),id:i});}
 for(let i=0;i<180;i++){const a=rand()*Math.PI*2,speed=(i<40?3:5)*(1+rand()*3)*60;g.helperDust.push({x:br.x+(rand()-.5)*100,y:br.y+(rand()-.5)*100,vx:Math.cos(a)*speed,vy:Math.sin(a)*speed,life:.35+rand()*.55,max:.9,scale:i<40?2:3,frame:i%3});}
 g.helperAshes=g.helperAshes.slice(-8192);g.helperDust=g.helperDust.slice(-400);
}
export function updateHelperEffects(dt,g){
 if(g.mode!=='playing'||g.ritual)return;g.helperEffectsRemainder=(g.helperEffectsRemainder||0)+dt;
 while(g.helperEffectsRemainder+1e-10>=1/60){g.helperEffectsRemainder=Math.max(0,g.helperEffectsRemainder-1/60);
  for(const a of g.helperAshes||[]){a.ticks++;a.scale=Math.max(0,Math.min(1,a.scale-(a.brightness*.67<.1?.08:.008)));const speed=Math.hypot(a.vx,a.vy)/60,d=Math.max(0,Math.min(1,(speed-6)/10)),f=Math.max(0,Math.min(1,(a.ticks-(25-d*10))/(55-d*35)))*.16,idealX=Math.sin(a.y/50+a.id)*4*60,idealY=(Math.sin((g.t||0)*3+a.id*.01)*3-1)*60;a.vx+=(idealX-a.vx)*f;a.vy+=(idealY-a.vy)*f;a.x+=a.vx/60;a.y+=a.vy/60;}
  if(g.helperAshes)g.helperAshes=g.helperAshes.filter(a=>a.ticks<a.lifetime&&a.scale>0);
  for(const p of g.helperGore||[]){p.life-=1/60;p.vy+=400/60;p.x+=p.vx/60;p.y+=p.vy/60;p.angle+=p.spin/60;}
  if(g.helperGore)g.helperGore=g.helperGore.filter(p=>p.life>0);
  for(const p of g.helperDust||[]){p.life-=1/60;p.x+=p.vx/60;p.y+=p.vy/60;p.vx*=.96;p.vy*=.96;p.scale*=.98;}
  if(g.helperDust)g.helperDust=g.helperDust.filter(p=>p.life>0);
 }
}
