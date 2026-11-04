import {introFont} from '../../config/intro-font.js?v=29.1.1';
import {ctx} from '../core/dom.js?v=29.1.1';
import {W,H} from '../core/config.js?v=29.1.1';
import {infernumIntroText,infernumIntroState} from '../game/intro-timeline.js?v=29.1.1';
const images={},letters=new Map();let loading,noise,cover;
export function initializeIntroAtlas(){
 if(loading)return loading;if(typeof Image==='undefined')return Promise.resolve(false);
 return loading=Promise.all([...introFont.pages.map(p=>'intro-'+p),'cover','perlin'].map(name=>new Promise(resolve=>{const im=new Image();im.onload=()=>{images[name]=im;resolve(true);};im.onerror=()=>resolve(false);im.src=new URL('../../assets/intro-original/'+name+'.png?v=29.1.1',import.meta.url).href;}))).then(results=>{
  if(!results.every(Boolean))return false;
  const make=(w,h)=>{const c=document.createElement('canvas');c.width=w;c.height=h;return c;};
  const n=make(images.perlin.width,images.perlin.height),nc=n.getContext('2d',{willReadFrequently:true});nc.drawImage(images.perlin,0,0);noise=nc.getImageData(0,0,n.width,n.height);
  cover=make(images.cover.width,images.cover.height);const c=cover.getContext('2d');c.drawImage(images.cover,0,0);c.globalCompositeOperation='source-in';c.fillStyle='#000';c.fillRect(0,0,cover.width,cover.height);
  for(const [char,g]of Object.entries(introFont.glyphs)){const r=g.rect,canvas=make(Math.max(1,r.width),Math.max(1,r.height)),x=canvas.getContext('2d',{willReadFrequently:true});x.drawImage(images['intro-'+g.page],r.x,r.y,r.width,r.height,0,0,r.width,r.height);const pixels=x.getImageData(0,0,canvas.width,canvas.height),black=make(canvas.width,canvas.height),bx=black.getContext('2d');bx.drawImage(canvas,0,0);bx.globalCompositeOperation='source-in';bx.fillStyle='#000';bx.fillRect(0,0,black.width,black.height);letters.set(char,{...g,canvas,x,pixels,original:new Uint8ClampedArray(pixels.data),black,stamp:null});}
  return true;
 });
}
function nativeWidth(g){return Math.max(0,g.kern.x)+g.kern.y+Math.max(0,g.kern.z);}
export function introLetterAdvance(char){const g=introFont.glyphs[char]||introFont.glyphs['?'];return nativeWidth(g)+2;}
const advance=introLetterAdvance;
// CPU equivalent of the original SCalIntroLetterShader; only visible glyphs,
// warmed reusable surfaces and24Hz updates. Never touches combat randomness.
function shade(letter,time,ratio){
 const stamp=Math.floor(time*24)+':'+ratio;if(letter.stamp===stamp)return;letter.stamp=stamp;
 const r=letter.rect,im=images['intro-'+letter.page],out=letter.pixels.data,source=letter.original,t=Math.floor(time*24)/24,b=(Math.sin(t*4+ratio*4+1.57)+1)/2;
 for(let y=0;y<r.height;y++)for(let x=0;x<r.width;x++){const i=(y*r.width+x)*4;if(!source[i+3])continue;const u=(r.x+x)/im.width,v=(r.y+y)/im.height;
  let blend=(Math.sin(t*9+u*18+1.57)*.5+.5)*.5+Math.sin(t*-13-v*7.1+1.57)*.5;
  const nx=Math.min(noise.width-1,Math.floor(u*noise.width)),ny=Math.min(noise.height-1,Math.floor(v*noise.height));let brightness=blend*.5+noise.data[(ny*noise.width+nx)*4]/255*.5;
  if(v<.2){brightness*=v/.2;blend*=v/.2;}const white=Math.min(1,(blend*1.5)**2),colors=[1,b*165/255,0];
  for(let j=0;j<3;j++){const base=source[i+j]/255,mix=base+(colors[j]-base)*(blend*.5+.2),mult=colors[j]+(1-colors[j])*white;out[i+j]=Math.max(0,Math.min(255,mix*mult*(1+brightness)*255));}out[i+3]=source[i+3];
 }letter.x.putImageData(letter.pixels,0,0);
}
export function drawInfernumTitle(seconds){
 const title=infernumIntroText(),s=infernumIntroState(seconds,title);if(seconds<0||seconds>=5)return;
 ctx.save();
 if(cover&&s.cover>0){const scale=s.cover*12.5;ctx.drawImage(cover,W/2-cover.width*scale/2,H*.32-cover.height*scale/2,cover.width*scale,cover.height*scale);ctx.drawImage(cover,W/2-cover.width*scale/2,H*.32-cover.height*scale/2,cover.width*scale,cover.height*scale);}
 if(s.opacity<=0){ctx.restore();return;}
 const lines=title.split('\n'),base=1.45*H/1440,widths=lines.map((line,i)=>[...line].reduce((n,c)=>n+advance(c),0)*base*(i?2.1:1)),fit=Math.min(1,W*.92/Math.max(...widths)),draws=[];let absolute=0;
 for(let row=0;row<lines.length;row++){const line=lines[row],scale=base*(row?2.1:1)*fit;let x=W/2-widths[row]*fit/2;const y=H*.35+(row?2.1*base*24:0);
  for(let j=0;j<line.length;j++){const char=line[j],g=letters.get(char)||letters.get('?'),width=advance(char)*scale;x+=width;if(absolute++>=s.letters)break;if(!g)continue;
   const px=x-nativeWidth(g)*scale+(g.kern.x+g.crop.x)*scale,py=y+g.crop.y*scale,w=g.rect.width*scale,h=g.rect.height*scale;draws.push({g,px,py,w,h,ratio:j/Math.max(1,line.length-1)});
  }
 }
 for(const {g,px,py,w,h}of draws){ctx.globalAlpha=s.opacity;ctx.drawImage(g.black,px+1.5,py+1.5,w,h);}
 for(const {g,px,py,w,h,ratio}of draws){shade(g,seconds,ratio);for(let i=0;i<4;i++){const a=i*Math.PI/2;ctx.globalAlpha=s.opacity*s.afterimage;ctx.drawImage(g.canvas,px+Math.cos(a)*s.spread,py+Math.sin(a)*s.spread,w,h);}ctx.globalAlpha=s.opacity;ctx.drawImage(g.canvas,px,py,w,h);}ctx.restore();
}
