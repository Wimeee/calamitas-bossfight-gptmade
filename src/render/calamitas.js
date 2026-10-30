import { calamitasSprites as spec } from '../../config/calamitas-sprites.js?v=22.1.0';
import { seq,TAU } from '../core/config.js?v=22.1.0';
import { ctx } from '../core/dom.js?v=22.1.0';
import { settings } from '../core/settings.js?v=22.1.0';
import { clamp } from '../core/math.js?v=22.1.0';
import { calamitasImage,paintCalamitasFrame } from './calamitas-atlas.js?v=22.1.0';

const clocks=new WeakMap(),effects=new Map();
export function calamitasPoseState(g){
  const second=g.thresholds.has('40'),act=seq[g.attackIndex%seq.length],boss=g.boss;
  if(g.ritual?.phase==='summoning'||g.stage==='hell'||g.phase2Intro>0)return {clip:'casting',fps:9,second};
  if(g.stage==='accept')return {clip:'idle',fps:6,second:false};
  if(g.dashWind>0||g.dashActive>0)return {clip:'dash',fps:15,second};
  if(g.stage!=='normal'&&g.stage!=='hearts')return {clip:'idle',fps:9,second};
  const age=g.t-(boss.castAt??-99),recent=age>=0&&boss.castSecond!==false;
  // The second-phase blast is a ONE-SHOT punch. Between shots Calamitas flies normally.
  // Its six frames are charge 0..2, release 3, recovery 4..5, then idle.
  if(second&&recent&&boss.castKind?.startsWith('giga')&&age<.25){
    return {clip:'blastPunch',fps:0,frame:Math.min(5,3+Math.floor(age/.25*3)),second};
  }
  if(second&&recent&&boss.castKind==='hellblast'&&age<.10){
    return {clip:'handPunch',fps:0,frame:Math.min(5,3+Math.floor(age/.10*3)),second};
  }
  if(act?.startsWith('giga')){
    if(!second)return {clip:'blast',fps:10.5,second};
    if(g.attackTimer>0&&g.attackTimer<=.30)return {clip:'blastPunch',fps:0,frame:Math.min(2,Math.floor((1-g.attackTimer/.30)*3)),second};
    return {clip:'idle',fps:9,second};
  }
  if(act==='hellblast'){
    if(!second)return {clip:'handCast',fps:9,second};
    const half=.10;
    if(g.attackTimer>0&&g.attackTimer<=half)return {clip:'handPunch',fps:0,frame:Math.min(2,Math.floor((1-g.attackTimer/half)*3)),second};
    return {clip:'idle',fps:9,second};
  }
  // Source FrameAnimationType: darts use flight, not the rune-covered summoning cast.
  if(act==='darts')return {clip:second?'idle':'dash',fps:9,second};
  return {clip:'idle',fps:9,second};
}
export function sampleCalamitasPose(g){
  const time=g.ritual?g.ritual.ambient:g.t,next=calamitasPoseState(g),b=g.boss;
  let clock=clocks.get(g);
  if(!clock){clock={clip:next.clip,entered:time,last:time,facing:-1,angle:0,trail:[]};clocks.set(g,clock);}
  if(next.clip!==clock.clip||time<clock.last){clock.clip=next.clip;clock.entered=time;clock.trail.length=0;}
  if(Math.abs(g.player.x-b.x)>12)clock.facing=g.player.x>b.x?-1:1; // native sprite faces left
  const charge=g.dashWind>0||g.dashActive>0,targetField=(g.stage==='normal'?spec.fieldRadius:spec.immuneRadius)*(charge?spec.chargeScale:1);
  if(clock.fieldRadius===undefined||time<clock.last)clock.fieldRadius=targetField;
  const dt=clamp(time-clock.last,0,.05),desired=g.dashActive>0?clamp((g.dashVector?.y||0)*clock.facing*-.35,-.35,.35):0;
  if(dt>0){
    clock.fieldRadius+=(targetField-clock.fieldRadius)*(1-Math.exp(-spec.fieldResponse*dt));
    clock.angle+=(desired-clock.angle)*(1-Math.exp(-15*dt));
    if(g.dashActive>0){clock.trail.unshift({x:b.x,y:b.y});if(clock.trail.length>6)clock.trail.pop();}
    else clock.trail.length=0;
  }
  clock.last=time;
  const frame=next.frame??(Math.floor(Math.max(0,time-clock.entered)*next.fps)%6);
  return {...next,frame,fieldRadius:clock.fieldRadius,facing:clock.facing,angle:clock.angle,skin:b.skin==='unhooded'?'unhooded':'hooded',trail:clock.trail};
}
function tintSurface(skin,clip,frame){
  const key=skin+'|'+clip+'|'+frame;
  if(effects.has(key))return effects.get(key);
  const c=document.createElement('canvas');c.width=110;c.height=110;
  const gc=c.getContext('2d');paintCalamitasFrame(gc,{skin,clip,frame,facing:1},55,55,spec.scale);
  gc.globalCompositeOperation='source-in';gc.fillStyle='#ff244f';gc.fillRect(0,0,110,110);
  effects.set(key,c);return c;
}

export function drawCalamitasAura(g,pose,x=g.boss.x,y=g.boss.y){
  const immune=g.stage!=='normal',accept=g.stage==='accept';
  const source=calamitasImage('shield');if(!source||accept)return;
  const time=g.ritual?g.ritual.ambient:g.t;
  const radius=pose.fieldRadius??(immune?spec.immuneRadius:spec.fieldRadius);
  ctx.save();ctx.translate(x,y);ctx.rotate(time*.10);
  ctx.globalAlpha*=immune?.78:pose.second?.70:.64;
  // Draw the supplied red texture as-is. No generated ring, recoloring or gradients.
  ctx.drawImage(source,-radius,-radius,radius*2,radius*2);
  ctx.restore();
}
export function drawOfficialCalamitas(g,{x=g.boss.x,y=g.boss.y,aura=true}={}){
  if(!calamitasImage(g.boss.skin==='unhooded'?'unhooded':'hooded'))return false;
  const pose=sampleCalamitasPose(g),low=settings.quality==='low';
  if(pose.second){
    const stamp=tintSurface(pose.skin,pose.clip,pose.frame),count=low?3:7;
    ctx.save();ctx.globalAlpha*=.18;
    for(let i=0;i<count;i++){const a=i*TAU/count+g.t*4,r=3.6+Math.cos(g.t*4)*.65;ctx.drawImage(stamp,x-55+Math.cos(a)*r,y-55+Math.sin(a)*r);}
    ctx.restore();
  }
  if(g.dashActive>0)for(let i=pose.trail.length-1;i>=1;i--)paintCalamitasFrame(ctx,pose,pose.trail[i].x,pose.trail[i].y,spec.scale,(1-i/7)*.16);
  paintCalamitasFrame(ctx,pose,x,y);
  if(aura)drawCalamitasAura(g,pose,x,y);
  return true;
}
export function calamitasVisualCacheSize(){return effects.size;}
