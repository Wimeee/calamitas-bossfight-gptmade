import { meleeSpriteConfig } from '../../config/melee-sprites.js?v=27.0.0';
import { ctx } from '../core/dom.js?v=27.0.0';
import { prepareWarriorTrails } from './warrior-trails.js?v=27.0.0';
import { initializeNativeArk } from './ark-native.js?v=27.0.0';

import { initializeNativeArmor } from './native-armor.js?v=27.0.0';

const cache={body:null,ark:null,wings:null,rendingNeedle:null,galaxiaBolt:null};
let loading;

// Remove only edge-connected black matte, preserving enclosed dark armor details.
// NOTE: Native RGBA assets are already transparent - this only runs on legacy sheets that may have black matte.
export function removeSpriteMatte(pixels,w,h){
  const count=w*h,visited=new Uint8Array(count),queue=new Int32Array(count);
  let head=0,tail=0;
  const visit=i=>{
    if(visited[i])return;
    const p=i*4;
    if(Math.max(pixels[p],pixels[p+1],pixels[p+2])>34&&pixels[p+3])return;
    visited[i]=1;queue[tail++]=i;
  };
  for(let x=0;x<w;x++){visit(x);visit((h-1)*w+x);}
  for(let y=1;y<h-1;y++){visit(y*w);visit(y*w+w-1);}
  while(head<tail){
    const i=queue[head++],x=i%w,y=(i/w)|0;pixels[i*4+3]=0;
    if(x)visit(i-1);if(x<w-1)visit(i+1);if(y)visit(i-w);if(y<h-1)visit(i+w);
  }
  return pixels;
}

const sheetLabels=[[25,0,305,45],[830,0,430,47],[25,230,290,35],[25,410,290,35],[25,588,255,37],[800,588,240,38],[25,776,240,39],[615,776,450,39],[1200,776,455,39]];

async function prepareFrame(image,rect,kind){
  const canvas=document.createElement('canvas');canvas.width=rect.w;canvas.height=rect.h;
  const c=canvas.getContext('2d',{willReadFrequently:true});
  c.drawImage(image,rect.x,rect.y,rect.w,rect.h,0,0,rect.w,rect.h);
  if(kind==='ark')for(const [x,y,w,h]of sheetLabels)c.clearRect(x-rect.x,y-rect.y,w,h);
  const data=c.getImageData(0,0,rect.w,rect.h);
  // Native assets (wings, rendingNeedle, galaxiaBolt) are already clean RGBA - skip matte removal
  if(!['wings','rendingNeedle','galaxiaBolt'].includes(kind)){
    removeSpriteMatte(data.data,rect.w,rect.h);
  }
  c.putImageData(data,0,0);
  const bitmap=typeof createImageBitmap==='function'?await createImageBitmap(canvas):canvas;
  return{image:bitmap,...rect};
}

export function transitionSamples(count,steps=3,loop=false){
  const samples=[];
  for(let i=0;i<(loop?count:count-1);i++)for(let step=0;step<steps;step++)samples.push({a:i,b:(i+1)%count,mix:step/steps});
  if(!loop)samples.push({a:count-1,b:count-1,mix:0});
  return samples;
}

async function prepareTransitions(frames,loop){
  const left=Math.ceil(Math.max(...frames.map(f=>f.ax))),top=Math.ceil(Math.max(...frames.map(f=>f.ay)));
  const w=left+Math.ceil(Math.max(...frames.map(f=>f.w-f.ax))),h=top+Math.ceil(Math.max(...frames.map(f=>f.h-f.ay)));
  return Promise.all(transitionSamples(frames.length,3,loop).map(async sample=>{
    const canvas=document.createElement('canvas');canvas.width=w;canvas.height=h;
    const c=canvas.getContext('2d');c.imageSmoothingEnabled=false;c.globalCompositeOperation='lighter';
    const a=frames[sample.a],b=frames[sample.b];
    c.globalAlpha=1-sample.mix;c.drawImage(a.image,left-a.ax,top-a.ay);
    if(sample.mix){c.globalAlpha=sample.mix;c.drawImage(b.image,left-b.ax,top-b.ay);}
    return{image:typeof createImageBitmap==='function'?await createImageBitmap(canvas):canvas,w,h,ax:left,ay:top};
  }));
}

export function initializeMeleeAtlas(){
  if(loading)return loading;
  if(typeof Image==='undefined')return Promise.resolve(false);
  const load=(kind,name,directory='melee-original')=>new Promise(resolve=>{
    const image=new Image();image.decoding='async';
    image.onload=async()=>{
      try{
        const groups={};
        for(const [animation,rects]of Object.entries(meleeSpriteConfig[kind])){
          const frames=await Promise.all(rects.map(rect=>prepareFrame(image,rect,kind)));
          const needsTransitions=kind==='ark'&&['open','spin','snap','rip','impact'].includes(animation);
          groups[animation]=needsTransitions?await prepareTransitions(frames,animation==='spin'):frames;
          if(groups[animation]!==frames)for(const frame of frames)frame.image.close?.();
        }
        cache[kind]=groups;resolve(true);
      }catch{resolve(false);}
    };
    image.onerror=()=>resolve(false);
    image.src=new URL('../../assets/'+directory+'/'+name+'?v=27.0.0',import.meta.url).href;
  });
  loading=Promise.all([
    load('body','armor-source.png','melee'),
    load('ark','ark-source.png','melee'),
    load('wings','rebirth-wings.png'),           // Native Wings of Rebirth (9 frames, 180x174)
    load('rendingNeedle','rending-needle.png'),   // Native RendingNeedle (14x88) for arkBeam
    load('galaxiaBolt','galaxia-bolt.png'),        // Native GalaxiaBolt (22x34) for arkStar
    initializeNativeArk(),
    initializeNativeArmor()
  ]).then(results=>{
    const bodyReady=results[0];
    const arkReady=results[1];
    const wingsReady=results[2];
    const rendingReady=results[3];
    const galaxiaReady=results[4];
    // nativeArkReady = results[5] - but we don't block on it
    // prepareWarriorTrails must run whenever body+ark are ready, regardless of optional native failures
    if(bodyReady && arkReady) prepareWarriorTrails();
    // Native successful loads remain usable when another image fails
    return bodyReady && arkReady;
  });
  return loading;
}

export function meleeAtlasReady(kind){return !!cache[kind];}

export function drawMeleeFrame(kind,name,index,x,y,scale,angle=0,flip=false,alpha=1){
  const group=cache[kind]?.[name];if(!group)return false;
  const frame=group[Math.max(0,Math.min(group.length-1,index|0))];
  ctx.save();ctx.imageSmoothingEnabled=false;ctx.globalAlpha*=alpha;ctx.shadowBlur=0;
  ctx.translate(x,y);ctx.rotate(angle);ctx.scale(flip?-scale:scale,scale);
  ctx.drawImage(frame.image,-frame.ax,-frame.ay);ctx.restore();return true;
}

export function meleeFrameCount(kind,name){return cache[kind]?.[name]?.length||meleeSpriteConfig[kind]?.[name]?.length||0;}