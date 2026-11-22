const images=new Map(),masks=new Map(),tints=new Map();let ready;
const tintedNames=new Set(['soulVortex','largeBloom','point','orb','pulse','staticPulse','castBloom','void','nativeSpark']);
export function helperImage(name){return images.get(name);}
function prepareMask(name,image){
 try{
  const c=document.createElement('canvas'),scale=['staticPulse','void'].includes(name)?Math.min(1,512/Math.max(image.width,image.height)):1;
  c.width=Math.round(image.width*scale);c.height=Math.round(image.height*scale);
  const x=c.getContext('2d',{willReadFrequently:true});x.drawImage(image,0,0,c.width,c.height);
  const data=x.getImageData(0,0,c.width,c.height);if(!data?.data)return null;
  for(let i=0;i<data.data.length;i+=4){data.data[i+3]=Math.min(data.data[i+3],data.data[i]);data.data[i]=data.data[i+1]=data.data[i+2]=255;}
  x.putImageData(data,0,0);return c;
 }catch{return null;}
}
export function initializeHelperAtlas(){
 if(ready)return ready;if(typeof Image==='undefined')return Promise.resolve();
 return ready=Promise.all(['screamyFace','soulVortex','largeBloom','brimstone','fistAlt','slashAlt','point','orb','pulse','staticPulse','castBloom','void','nativeSpark','seekerGore1','seekerGore2','seekerGore3','seekerGore4','seekerGore5'].map(name=>new Promise(resolve=>{
  const image=new Image();image.onload=()=>{images.set(name,image);if(tintedNames.has(name))masks.set(name,prepareMask(name,image));resolve();};
  image.onerror=()=>resolve();image.src=new URL('../../assets/helper-original/'+name+'.png',import.meta.url).href;
 })));
}
export function helperTint(name,color){
 const key=name+'|'+color;
 if(tints.has(key)){const c=tints.get(key);tints.delete(key);tints.set(key,c);return c;}
 const image=helperImage(name);if(!image)return null;
 // Prepare native effect masks before battle; retain compatibility for other
 // loaded atlas images, extracting their alpha at most once if requested.
 if(!masks.has(name))masks.set(name,prepareMask(name,image));
 const mask=masks.get(name);if(!mask)return null;
 try{
  const c=document.createElement('canvas');c.width=mask.width;c.height=mask.height;
  const x=c.getContext('2d');x.drawImage(mask,0,0);x.globalCompositeOperation='source-in';x.fillStyle=color;x.fillRect(0,0,c.width,c.height);
  if(tints.size>=64)tints.delete(tints.keys().next().value);
  tints.set(key,c);return c;
 }catch{return null;}
}

// Finite colors emitted by native Calamitas, summon, projectile and ritual FX.
// Bake these while the menu is preparing, before they can interrupt a fight.
export function warmHelperTints(){
 const palette={
  largeBloom:['#ff004d','#fff0f2','#79154d','#ff1238','#ffffff','#000000','#ff007f','#00bfff'],
  pulse:['#ff2535','#79154d','#ff2020','#ff00ff'],
  point:['#ff2020','#ff004c','#ff0080'],orb:['#ff2020','#ff004c','#ff0080','#ffffff'],
  staticPulse:['#ff2020','#ff004c'],castBloom:['#00bfff','#79154d','#ff2020','#ffffff'],
  void:['#00bfff','#79154d','#ff2020','#000000'],nativeSpark:['#00bfff','#79154d','#ff2020','#ff0080','#ff334e'],
  soulVortex:['#ff0000','#ff0026','#ff004d','#ff0073','#ff0099']
 };
 for(const [name,colors]of Object.entries(palette))for(const color of colors)helperTint(name,color);
}
