import {translate} from '../core/localization.js?v=30.0.0';
import { hudFonts } from '../../config/hud-fonts.js?v=30.0.0';
const names=['ragePulse','rageDust','adrenDust','ripperLight','rage','rageBorder','rageFull','adrenaline','adrenalineBorder','adrenalineBorderFull','adrenalineFull','bossMain','bossCombo','bossSeparator','hex','Panel_Left','HP_Panel_Middle','HP_Panel_Right','HP_Fill','MP_Panel_Middle','MP_Panel_Right','MP_Fill'];
const images=new Map(),tints=new Map();let loading;
export const hudAssetStatus={state:'idle',loaded:0,failed:0};
export function initializeHUDAtlas(){
 if(loading)return loading;if(typeof Image==='undefined'){hudAssetStatus.state='unsupported';return Promise.resolve();}
 hudAssetStatus.state='loading';const files=[...names.map(n=>n+'.png'),...Object.values(hudFonts).flatMap(f=>f.pages)];
 loading=Promise.all([...new Set(files)].map(file=>new Promise(resolve=>{const image=new Image();image.onload=()=>{images.set(file,image);hudAssetStatus.loaded++;resolve();};image.onerror=()=>{hudAssetStatus.failed++;resolve();};image.src=new URL('../../assets/hud-original/'+file,import.meta.url).href;}))).then(()=>{hudAssetStatus.state=hudAssetStatus.failed?'fallback':'ready';});return loading;
}
export function hudImage(name){return images.get(name.endsWith('.png')?name:name+'.png');}
export function paintHUD(ctx,name,x,y,w,h,sx=0,sy=0,sw,sh){const image=hudImage(name);if(!image)return false;sw??=image.width;sh??=image.height;if(w<=0||h<=0||sw<=0||sh<=0)return true;ctx.imageSmoothingEnabled=false;ctx.drawImage(image,sx,sy,sw,sh,x,y,w,h);return true;}
function colored(image,file,color){const key=file+'|'+color;if(tints.has(key))return tints.get(key);if(tints.size>=40)tints.delete(tints.keys().next().value);
 const canvas=document.createElement('canvas');canvas.width=image.width;canvas.height=image.height;const c=canvas.getContext('2d');c.drawImage(image,0,0);c.globalCompositeOperation='source-in';c.fillStyle=color;c.fillRect(0,0,canvas.width,canvas.height);tints.set(key,canvas);return canvas;}
export function nativeTextWidth(value,scale=.6,font='mouse'){const f=hudFonts[font];return [...translate(value)].reduce((w,c)=>{const g=f.glyphs[c]||f.glyphs[f.fallback];return w+(g?g.kern.x+g.kern.y+g.kern.z+f.spacing:0)*scale;},0);}
function paintNativeText(ctx,value,x,y,{scale=.6,font='mouse',color='#ffffff',align='left',outline=true}={}){
 const f=hudFonts[font],str=translate(value),width=nativeTextWidth(str,scale,font);let pen=x-(align==='right'?width:align==='center'?width/2:0);
 function pass(dx,dy,col){let cursor=pen;for(const c of str){const g=f.glyphs[c]||f.glyphs[f.fallback];if(!g)continue;const file=font+'-'+g.page+'.png',image=images.get(file),r=g.rect;cursor+=g.kern.x*scale;if(image&&r.width&&r.height)ctx.drawImage(colored(image,file,col),r.x,r.y,r.width,r.height,cursor+g.crop.x*scale+dx,y+g.crop.y*scale+dy,r.width*scale,r.height*scale);cursor+=(g.kern.y+g.kern.z+f.spacing)*scale;}}
 ctx.imageSmoothingEnabled=false;if(outline){pass(-1,0,'#08070b');pass(1,0,'#08070b');pass(0,-1,'#08070b');pass(0,1,'#08070b');}pass(0,0,color);return width;
}

// Reuse complete bitmap labels: outlined text otherwise submits five draws per glyph.
// Bounded by entry count and pixel area; do not cache missing/loading font pages.
const labels=new Map();
export function nativeText(ctx,value,x,y,{scale=.6,font='mouse',color='#ffffff',align='left',outline=true}={}){
 const str=translate(value),f=hudFonts[font],width=nativeTextWidth(str,scale,font);
 const options={scale,font,color,outline},key=JSON.stringify([str,scale,font,color,outline]);
 let cached=labels.get(key);
 if(!cached){
  let pen=0,minX=0,minY=0,maxX=width,maxY=0,loaded=true;
  for(const ch of str){const g=f.glyphs[ch]||f.glyphs[f.fallback];if(!g)continue;
   pen+=g.kern.x*scale;
   if(g.rect.width&&g.rect.height){loaded&&=images.has(font+'-'+g.page+'.png');minX=Math.min(minX,pen+g.crop.x*scale);minY=Math.min(minY,g.crop.y*scale);maxX=Math.max(maxX,pen+(g.crop.x+g.rect.width)*scale);maxY=Math.max(maxY,(g.crop.y+g.rect.height)*scale);}
   pen+=(g.kern.y+g.kern.z+f.spacing)*scale;
  }
  const pad=outline?2:1,left=Math.floor(minX)-pad,top=Math.floor(minY)-pad,w=Math.ceil(maxX)-left+pad,h=Math.ceil(maxY)-top+pad;
  if(!loaded||!str||w*h>262144||!Number.isFinite(w*h)||w<=0||h<=0)return paintNativeText(ctx,str,x,y,{...options,align});
  const canvas=document.createElement('canvas');canvas.width=w;canvas.height=h;
  paintNativeText(canvas.getContext('2d'),str,-left,-top,options);
  cached={canvas,left,top};if(labels.size>=128)labels.delete(labels.keys().next().value);labels.set(key,cached);
 }
 const pen=x-(align==='right'?width:align==='center'?width/2:0);
 ctx.imageSmoothingEnabled=false;ctx.drawImage(cached.canvas,pen+cached.left,y+cached.top);return width;
}

export function tintedHUDImage(name,color){const image=hudImage(name);return image?colored(image,name+'.png',color):null;}
