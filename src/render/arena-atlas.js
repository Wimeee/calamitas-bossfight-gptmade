import {arenaColors} from '../world/arena-state.js?v=26.0.5';
const images=new Map(),tints=new Map();let promise;
export function arenaImage(name){return images.get(name);}
export function arenaTexture(name,phase){return tints.get(name+phase);}
export function initializeArenaAtlas(){
 if(promise)return promise;if(typeof Image==='undefined')return Promise.resolve();
 promise=Promise.all(['arenaSmoke','arenaWave','platforms','heartGore1','heartGore2','CalamitasBackground','CalamitasCinder'].map(name=>new Promise(resolve=>{
  const image=new Image();image.onload=()=>{try{images.set(name,image);
   if(name==='arenaSmoke'||name==='arenaWave'){
    const mask=document.createElement('canvas');mask.width=mask.height=384;const c=mask.getContext('2d');c.drawImage(image,0,0,384,384);
    const data=c.getImageData(0,0,384,384);if(!data?.data){resolve();return;}for(let i=0;i<data.data.length;i+=4){data.data[i+3]=data.data[i];data.data[i]=data.data[i+1]=data.data[i+2]=255;}c.putImageData(data,0,0);
    arenaColors.forEach((color,phase)=>{const tex=document.createElement('canvas');tex.width=tex.height=384;const x=tex.getContext('2d');x.drawImage(mask,0,0);x.globalCompositeOperation='source-in';x.fillStyle=color;x.fillRect(0,0,384,384);tints.set(name+phase,tex);});
   }}catch{}finally{resolve();}};image.onerror=()=>resolve();image.src=new URL('../../assets/arena-original/'+name+'.png',import.meta.url).href;
 })));return promise;
}
