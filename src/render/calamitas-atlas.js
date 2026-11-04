import { calamitasSprites as spec } from '../../config/calamitas-sprites.js?v=27.1.1';
const images=new Map();let ready=null;
export const calamitasAssetStatus={state:'idle',loaded:0,failed:0};
// Preserve the ready artwork while removing its additive black matte once.
export function shieldTextureAlpha(pixels){
  for(let i=0;i<pixels.length;i+=4){
    const light=Math.max(pixels[i],pixels[i+1],pixels[i+2]);
    const alpha=light<=2?0:Math.round(pixels[i+3]*light/255);
    if(light>2){pixels[i]=Math.round(pixels[i]*255/light);pixels[i+1]=Math.round(pixels[i+1]*255/light);pixels[i+2]=Math.round(pixels[i+2]*255/light);}
    pixels[i+3]=alpha;
  }
  return pixels;
}
function prepareShieldTexture(image){
  const surface=document.createElement('canvas');surface.width=image.naturalWidth||image.width;surface.height=image.naturalHeight||image.height;
  const c=surface.getContext('2d',{willReadFrequently:true});c.drawImage(image,0,0);
  const data=c.getImageData(0,0,surface.width,surface.height);shieldTextureAlpha(data.data);c.putImageData(data,0,0);return surface;
}
function load(name,file){
  return new Promise(resolve=>{
    const image=new Image();image.onload=()=>{
      try{
        // Only the supplied shield has an additive black matte. Native parts retain RGBA.
        const needsAlpha=name==='shield';
        images.set(name,needsAlpha?prepareShieldTexture(image):image);
        calamitasAssetStatus.loaded++;
      }
      catch{calamitasAssetStatus.failed++;}
      resolve();
    };
    image.onerror=()=>{calamitasAssetStatus.failed++;resolve();};
    image.src=new URL('../../assets/calamitas/'+file,import.meta.url).href;
  });
}
export function initializeCalamitasAtlas(){
  if(ready)return ready;
  if(typeof Image==='undefined'){calamitasAssetStatus.state='unsupported';return Promise.resolve();}
  calamitasAssetStatus.state='loading';
  ready=Promise.all([
    load('hooded',spec.hooded.file),
    load('unhooded',spec.unhooded.file),
    load('shield','shield.png'),
    load('forcefield','forcefield.png'),
    load('shieldTop',spec.shieldTop.file),
    load('shieldBottom',spec.shieldBottom.file)
  ])
    .then(()=>{calamitasAssetStatus.state=calamitasAssetStatus.failed?'fallback':'ready';});
  return ready;
}
export function calamitasFrameRect(clip,frame,skin='hooded'){
  const sheet=spec[skin]||spec.hooded;
  const index=spec.clips[clip]*spec.framesPerClip+Math.max(0,Math.min(5,frame|0));
  return {sx:Math.floor(index/spec.rows)*sheet.cellW,sy:(index%spec.rows)*sheet.cellH,w:sheet.cellW,h:sheet.cellH};
}
export function calamitasImage(name){return images.get(name);}
export function paintCalamitasFrame(c,pose,x,y,scale=spec.scale,alpha=1){
  const image=images.get(pose.skin);if(!image)return false;
  const r=calamitasFrameRect(pose.clip,pose.frame,pose.skin);
  c.save();c.globalAlpha*=alpha;c.translate(x,y);c.rotate(pose.angle||0);c.scale(-pose.facing,1); /* Native artwork faces right; spriteDirection+1 flips it. */c.imageSmoothingEnabled=false;
  c.drawImage(image,r.sx,r.sy,r.w,r.h,-r.w*scale/2,-r.h*scale/2,r.w*scale,r.h*scale);c.restore();return true;
}
