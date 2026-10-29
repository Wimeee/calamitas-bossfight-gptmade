import { meleeSpriteConfig } from '../../config/melee-sprites.js?v=20.0.1';
import { ctx } from '../core/dom.js?v=20.0.1';

const cache={body:null,ark:null};
let loading;

// Remove only edge-connected black matte, preserving enclosed dark armor details.
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
  removeSpriteMatte(data.data,rect.w,rect.h);c.putImageData(data,0,0);
  const bitmap=typeof createImageBitmap==='function'?await createImageBitmap(canvas):canvas;
  return{image:bitmap,...rect};
}

export function initializeMeleeAtlas(){
  if(loading)return loading;
  if(typeof Image==='undefined')return Promise.resolve(false);
  const load=(kind,name)=>new Promise(resolve=>{
    const image=new Image();image.decoding='async';
    image.onload=async()=>{
      try{
        const groups={};
        for(const [animation,rects]of Object.entries(meleeSpriteConfig[kind]))groups[animation]=await Promise.all(rects.map(rect=>prepareFrame(image,rect,kind)));
        cache[kind]=groups;resolve(true);
      }catch{resolve(false);}
    };
    image.onerror=()=>resolve(false);
    image.src=new URL('../../assets/melee/'+name+'?v=20.0.1',import.meta.url).href;
  });
  loading=Promise.all([load('body','armor-source.png'),load('ark','ark-source.png')]).then(results=>results.every(Boolean));
  return loading;
}

export function meleeAtlasReady(kind){return !!cache[kind];}

export function drawMeleeFrame(kind,name,index,x,y,scale,angle=0,flip=false,alpha=1){
  const group=cache[kind]?.[name];if(!group)return false;
  const frame=group[Math.max(0,Math.min(group.length-1,index|0))];
  ctx.save();ctx.imageSmoothingEnabled=false;ctx.globalAlpha*=alpha;ctx.shadowBlur=0;
  ctx.translate(Math.round(x),Math.round(y));ctx.rotate(angle);ctx.scale(flip?-scale:scale,scale);
  ctx.drawImage(frame.image,-frame.ax,-frame.ay);ctx.restore();return true;
}

export function meleeFrameCount(kind,name){return cache[kind]?.[name]?.length||meleeSpriteConfig[kind]?.[name]?.length||0;}
