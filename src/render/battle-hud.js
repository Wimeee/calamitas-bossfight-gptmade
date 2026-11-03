import { W,H,TAU } from '../core/config.js?v=26.2.0';
import { ctx } from '../core/dom.js?v=26.2.0';
import { cameraView } from '../world/camera.js?v=26.2.0';
import { clamp } from '../core/math.js?v=26.2.0';
import { settings,keyLabel } from '../core/settings.js?v=26.2.0';
import { hudImage,paintHUD,nativeText,nativeTextWidth } from './hud-atlas.js?v=26.2.0';

export function battleHUDLayout(){return{hp:{x:W-320,y:15,w:300,h:40},mana:{x:W-320,y:49,w:300,h:40},boss:{x:W-365,y:H-72,w:345,h:54},rage:{x:36,y:20,w:104,h:40},adrenaline:{x:36,y:68,w:104,h:40}};}
export function playerDebuffPoint(g){const v=cameraView(g),z=v.zoom||1;return{x:clamp((g.player.x-v.x)*z,22,W-22),y:clamp((g.player.y-v.y)*z+40,105,H-110)};}
function resource(name,value,max,box){
 const n=name==='MP'?Math.min(20,Math.ceil(max/20)):20,s=1,ratio=clamp(value/Math.max(1,max),0,1),middle=name+'_Panel_Middle',right=name+'_Panel_Right';
 const x=box.x+14+(20-n)*12,y=box.y+12;paintHUD(ctx,'Panel_Left',x-6,y,6*s,24*s);
 for(let i=0;i<n;i++)paintHUD(ctx,middle,x+i*12*s,y,12*s,24*s);
 paintHUD(ctx,right,x+n*12*s-16,y-(name==='HP'?10:6),46*s,name==='HP'?38*s:40*s);
 for(let i=0;i<n;i++){const amount=clamp(ratio*n-(n-i-1),0,1);if(amount)paintHUD(ctx,name+'_Fill',x+i*12+(12-12*amount),y+6,12*amount,12,12-12*amount,0,12*amount,12);}
 nativeText(ctx,Math.ceil(value)+' / '+max,x+n*12-4,y-11,{scale:.65,align:'right',color:name==='HP'?'#ffcfbc':'#c6e5ff'});
}
// Readiness clocks come from simulation events. Rendering never consumes combat RNG.
export function ripperPresentation(g,kind){
 const r=g.rippers,ad=kind==='adrenaline',active=r[kind+'Time']>0;
 const border=ad?(r[kind]>=1||active?'adrenalineBorderFull':'adrenalineBorder'):'rageBorder';
 const frames=ad?(border.endsWith('Full')?6:12):1;
 const at=r[kind+'ReadyAt'],age=at==null?Infinity:Math.max(0,g.t-at),delay=ad?5/60:6/60;
 const readyFrame=Math.floor((age+1e-9)/delay);
 const tick=Math.floor(g.t*60),seed=ad?91:17;
 const noise=n=>{const v=Math.sin(n*12.9898+seed)*43758.5453;return(v-Math.floor(v))*4-2;};
 return{border,frames,readyFrame:readyFrame<10?readyFrame:-1,shakeX:active?noise(tick):0,shakeY:active?noise(tick+113):0};
}
function ripper(g,kind,box){
 const r=g.rippers,ratio=clamp(r[kind],0,1),ad=kind==='adrenaline',v=ripperPresentation(g,kind),image=hudImage(v.border);if(!image)return;
 const x=box.x+v.shakeX,y=box.y+v.shakeY,frameH=image.height/v.frames-(ad?1:0);
 // Frames beyond zero are the Draedon's Heart skin, not the normal meter.
 paintHUD(ctx,v.border,x,y,image.width,frameH,0,0,image.width,frameH);
 const fill=hudImage(kind);if(fill&&ratio>0)paintHUD(ctx,kind,x+12,y+(ad?2:0),fill.width*ratio,fill.height,0,0,fill.width*ratio,fill.height);
 if(v.readyFrame>=0){const name=ad?'adrenalineFull':'rageFull',flare=hudImage(name);if(flare){
  const h=flare.height/10-1,dx=(image.width-flare.width)/2,dy=((ad?image.height/v.frames:frameH)-h)/2+(ad?5:0);
  paintHUD(ctx,name,x+dx,y+dy,flare.width,h,0,v.readyFrame*(h+1),flare.width,h);
 }}
}
function bossBar(target,name,box){const ratio=clamp(target.hp/Math.max(1,target.max),0,1),percent=(ratio*100).toFixed(1)+'%',pw=nativeTextWidth(percent,.7,'bossFont');
 nativeText(ctx,percent,box.x,box.y,{font:'bossFont',scale:.7,color:'#f8d76a'});
 nativeText(ctx,name,box.x+box.w,box.y+8,{scale:.65,align:'right',color:'#ffffff'});
 paintHUD(ctx,'bossSeparator',box.x,box.y+24,box.w,4);
 paintHUD(ctx,'bossMain',box.x,box.y+32,box.w*ratio,10);
 nativeText(ctx,'('+Math.ceil(target.hp)+' / '+target.max+')',box.x,box.y+43,{scale:.6});
}
export function drawPlayerDebuffs(g){const hex=g.player.debuffs?.hex;if(!hex||hex.remaining<=0)return;const p=playerDebuffPoint(g),size=28,x=p.x-size/2,y=p.y;
 paintHUD(ctx,'hex',x,y,size,size);const ratio=clamp(hex.remaining/hex.max,0,1);
 ctx.save();ctx.strokeStyle='#ffe6b0';ctx.lineWidth=2;ctx.beginPath();ctx.arc(p.x,y+size/2,size/2+2,-Math.PI/2,-Math.PI/2+TAU*ratio);ctx.stroke();ctx.restore();
 nativeText(ctx,hex.remaining<1?hex.remaining.toFixed(1):Math.ceil(hex.remaining)+'s',p.x,y+29,{align:'center',scale:.75,color:'#ffcccb'});
}
export function drawBattleHUD(g){if(!g||g.ritual)return;const b=battleHUDLayout(g);ctx.save();ctx.imageSmoothingEnabled=false;
 resource('HP',g.player.hp,g.player.maxHp,b.hp);if(g.player.weapon===2)resource('MP',g.player.mana,g.player.maxMana,b.mana);
 if(g.rippers?.enabled){ripper(g,'rage',b.rage);ripper(g,'adrenaline',b.adrenaline);}
 if(g.mode!=='won'&&g.boss.hp>0)bossBar(g.boss,'Supreme Calamitas',b.boss);
 if(g.stage==='brothers')g.brothers.filter(t=>t.hp>0).slice(0,2).forEach((t,i)=>bossBar(t,t.kind===0?'Supreme Cataclysm':'Supreme Catastrophe',{...b.boss,y:b.boss.y-(i+1)*60}));
 drawPlayerDebuffs(g);ctx.restore();
}
