import {renderScale} from '../core/settings.js?v=27.1.0';
import {state} from '../core/state.js?v=27.1.0';
import {cameraView} from '../world/camera.js?v=27.1.0';
import {arena} from '../core/arena.js?v=27.1.0';
import {ctx} from '../core/dom.js?v=27.1.0';
import {W,H} from '../core/config.js?v=27.1.0';
import {arenaColors} from '../world/arena-state.js?v=27.1.0';
import {arenaImage,arenaTexture} from './arena-atlas.js?v=27.1.0';
import {paintArenaFeather,ARENA_FEATHER_OUTER,ARENA_FEATHER_INNER} from './arena-feather.js?v=27.1.0';
let field=null,mask=null;
let backdrop=null,backdropSource=null,backdropKey='';
function backdropRaster(image){
 // Camera zoom cancels out: preserve the native cover geometry at backing-pixel resolution.
 const scale=Math.max(W/image.width,H/image.height)*1.12*renderScale(),w=Math.ceil(image.width*scale),h=Math.ceil(image.height*scale),key=w+'|'+h+'|'+!!ctx.imageSmoothingEnabled;
 if(w*h>16777216)return image;
 if(backdropSource===image&&backdropKey===key)return backdrop;
 backdrop??=document.createElement('canvas');backdrop.width=w;backdrop.height=h;
 const c=backdrop.getContext('2d');c.imageSmoothingEnabled=ctx.imageSmoothingEnabled;c.drawImage(image,0,0,w,h);
 backdropSource=image;backdropKey=key;return backdrop;
}
function surface(){return document.createElement('canvas');}
function ensureSurfaces(){
 if(!field){field=surface();mask=surface();}
 const w=Math.round(W*renderScale()),h=Math.round(H*renderScale());
 if(field.width!==w||field.height!==h){field.width=mask.width=w;field.height=mask.height=h;}
}
function clear(c){c.setTransform(1,0,0,1,0,0);c.globalAlpha=1;c.globalCompositeOperation='source-over';c.clearRect(0,0,field.width,field.height);}
function nativeField(c,texture,v,dx,dy,scale,alpha){
 if(!texture||alpha<=0)return;c.save();c.translate(dx,dy);c.scale(scale,scale);c.globalAlpha=alpha;c.fillStyle=c.createPattern(texture,'repeat');c.fillRect((v.x-dx)/scale,(v.y-dy)/scale,v.w/scale,v.h/scale);c.restore();
}
export function drawBackdropBase(){
 const g=state.game,v=cameraView(g),t=g?.ritual?g.ritual.ambient:g?.t||0;ctx.fillStyle='#100b11';ctx.fillRect(v.x,v.y,v.w,v.h);
 const image=arenaImage('CalamitasBackground');if(image){const scale=Math.max(v.w/image.width,v.h/image.height)*1.12,w=image.width*scale,h=image.height*scale;ctx.drawImage(backdropRaster(image),v.x+(v.w-w)/2+Math.sin(t*.11)*24,v.y+(v.h-h)/2+Math.cos(t*.08)*18,w,h);}
 const a=g?.arenaState||{phase:0,previous:0,colorMix:1};
 for(const [phase,mix] of [[a.previous,1-a.colorMix],[a.phase,a.colorMix]])nativeField(ctx,arenaTexture('arenaSmoke',phase),v,-t*7+Math.sin(t*.14)*28,t*3,2.8,.1*mix);
 const cinder=arenaImage('CalamitasCinder');if(cinder){ctx.save();for(let i=0;i<(state.deviceMode==='mobile'?12:42);i++){const speed=12+i%4*5,x=v.x+((i*239.17+t*3+Math.sin(t*.5+i)*22)%v.w+v.w)%v.w,y=v.y+((i*173.7-t*speed)%v.h+v.h)%v.h;ctx.globalAlpha=.3+.25*(.5+.5*Math.sin(t*1.6+i));ctx.drawImage(cinder,x,y,4,4);}ctx.restore();}
}
function texturePhase(c,g,phase,mix,v){
 if(mix<=0)return;const t=g.t||0;
 nativeField(c,arenaTexture('arenaSmoke',phase),v,Math.sin(t*.24)*38+t*5,Math.cos(t*.17)*24-t*7,1.22+Math.sin(t*.42)*.025,.68*mix);
 nativeField(c,arenaTexture('arenaWave',phase),v,Math.sin(t*.39)*19-t*11,t*21,1+Math.sin(t*.63)*.018,.85*mix);
}
export function arenaBorderVisible(v,box){
 const o=ARENA_FEATHER_OUTER,i=ARENA_FEATHER_INNER;
 if(v.x+v.w<=box.l-o||v.x>=box.r+o||v.y+v.h<=box.t-o||v.y>=box.b+o)return false;
 return !(v.x>=box.l+i&&v.x+v.w<=box.r-i&&v.y>=box.t+i&&v.y+v.h<=box.b-i);
}
export function drawArenaLayer(g){
 if(!g||g.ritual)return;const v=cameraView(g);if(!arenaBorderVisible(v,arena))return;ensureSurfaces();const a=g.arenaState||{phase:0,previous:0,colorMix:1},c=field.getContext('2d'),m=mask.getContext('2d');
 clear(c);clear(m);const zx=v.zoom*field.width/W,zy=v.zoom*field.height/H;c.setTransform(zx,0,0,zy,-v.x*zx,-v.y*zy);m.setTransform(zx,0,0,zy,-v.x*zx,-v.y*zy);
 texturePhase(c,g,a.previous,1-a.colorMix,v);texturePhase(c,g,a.phase,a.colorMix,v);
 if(paintArenaFeather(m,arena)){c.setTransform(1,0,0,1,0,0);c.globalCompositeOperation='destination-in';c.drawImage(mask,0,0);ctx.drawImage(field,v.x,v.y,v.w,v.h);}
 // The collision boundary stays precise; only its surrounding native smoke is feathered.
 ctx.save();const opacity=.5+Math.sin((g.t||0)*1.8)*.09;ctx.lineWidth=2;
 for(const [phase,mix] of [[a.previous,1-a.colorMix],[a.phase,a.colorMix]]){if(mix<=0)continue;ctx.globalAlpha=opacity*mix;ctx.strokeStyle=arenaColors[phase];ctx.strokeRect(arena.l,arena.t,arena.r-arena.l,arena.b-arena.t);}ctx.restore();
}
