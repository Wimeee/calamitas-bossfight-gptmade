import {photoGeometry} from '../classes/photo-geometry.js?v=29.0.1';
import {renderQuality} from '../core/settings.js?v=29.0.1';
import { meleeSpriteConfig } from '../../config/melee-sprites.js?v=29.0.1';
import { playerConfig } from '../../config/player.js?v=29.0.1';
import { arkAngle, arkSwingGeometry, arkParryGeometry } from '../classes/ark-motion.js?v=29.0.1';
import { ctx } from '../core/dom.js?v=29.0.1';
import { state } from '../core/state.js?v=29.0.1';
import { settings } from '../core/settings.js?v=29.0.1';
import { clamp } from '../core/math.js?v=29.0.1';
import { drawMeleeFrame, meleeAtlasReady, meleeFrameCount } from './melee-atlas.js?v=29.0.1';
import { drawNativeArkBlade, nativeArkReady, drawNativeScissors, drawNativeArkSpark, drawNativeArkTrail, drawNativeProjectileTrail, drawNativeThrownArk, drawNativeSwingParticles, drawNativeConstellation, drawNativeSnapBurst,drawNativeBigRip,drawNativeParryRecharge } from './ark-native.js?v=29.0.1';
import { line,round,text } from './primitives.js?v=29.0.1';
import { drawNativeArmor } from './native-armor.js?v=29.0.1';
import { drawWarriorTrail } from './warrior-trails.js?v=29.0.1';

const deathClocks=new WeakMap();
const poseClocks=new WeakMap();
const weaponClocks=new WeakMap();
const bodyFps={idle:5,run:10,rise:7,fall:7};
const aim=g=>Math.atan2(state.pointer.y-g.player.y,state.pointer.x-g.player.x);
const getBladeExtent=side=>Math.hypot(side==='left'?120:134,132);
const frameAt=(kind,name,progress)=>Math.min(meleeFrameCount(kind,name)-1,Math.floor(clamp(progress,0,1)*meleeFrameCount(kind,name)));

export function warriorPose(g){
  const p=g.player,k=state.keys,t=g.ritual?.ambient??g.t;
  let clock=poseClocks.get(g);
  if(!clock){clock={name:'',since:t,time:t,flip:state.pointer.x<p.x,pose:null};poseClocks.set(g,clock);}
  if(g.mode==='paused'&&clock.pose)return clock.pose;
  const dx=(k.d||k.ArrowRight?1:0)-(k.a||k.ArrowLeft?1:0)+state.moveAxis.x;
  const dy=(k.s||k.ArrowDown?1:0)-(k.w||k.ArrowUp?1:0)+state.moveAxis.y;
  if(p.swing?.direction)clock.flip=p.swing.direction<0;
  else if(p.arkParry)clock.flip=Math.cos(p.arkParry.angle)<0;
  else if(Math.abs(state.pointer.x-p.x)>12)clock.flip=state.pointer.x<p.x;
  if(p.dashT>0&&Math.abs(p.dashX)>.1)clock.flip=p.dashX<0;
  let name='idle',progress=null;
  if(g.mode==='dead'){
    let start=deathClocks.get(g);if(start===undefined){start=performance.now();deathClocks.set(g,start);}
    name='death';progress=(performance.now()-start)/650;
  }else if(p.hits>0&&g.t-p.lastHit<.22){name='hurt';progress=(g.t-p.lastHit)/.22;}
  else if(p.dashT>0){name='dash';progress=1-p.dashT/(p.aegisDashDuration||playerConfig.dashDuration);}
  else if(g.mode==='playing'&&(!g.ritual||g.ritual.phase==='preparation')){
    if(p.physics){
      if(!p.grounded)name=p.vy< -20||p.flying?'rise':'fall';
      else if(Math.abs(p.vx)>20)name='run';
    }else{
      if(dy<-.15)name='rise';else if(dy>.15)name='fall';else if(Math.abs(dx)>.15)name='run';
    }
  }
  if(clock.name!==name||t<clock.time){clock.name=name;clock.since=t;}
  clock.time=t;
  const index=progress===null?Math.floor(Math.max(0,t-clock.since)*(bodyFps[name]||8))%meleeFrameCount('body',name):frameAt('body',name,progress);
  clock.pose={name,index,flip:clock.flip};return clock.pose;
}

export function warriorWeaponPose(g,target,action,scale){
  const time=g.ritual?.ambient??g.t;
  let clock=weaponClocks.get(g);
  if(!clock){clock={action,angle:target,scale,from:target,fromScale:scale,since:time,time};weaponClocks.set(g,clock);}
  if(time<clock.time){clock.since=time;clock.from=clock.angle;clock.fromScale=clock.scale;}
  clock.time=time;
  if(clock.action!==action){clock.action=action;clock.from=clock.angle;clock.fromScale=clock.scale;clock.since=time;}
  const u=clamp((time-clock.since)/(action ? .045 : .085),0,1),blend=u*u*(3-2*u);
  const delta=Math.atan2(Math.sin(target-clock.from),Math.cos(target-clock.from));
  clock.angle=u>=1?target:clock.from+delta*blend;
  clock.scale=clock.fromScale+(scale-clock.fromScale)*blend;return clock;
}

export function drawWarriorBody(g,x=g.player.x,y=g.player.y,ghost=false,fade=1){
  if(g.player.weapon===3){const pose=warriorPose(g);return drawNativeArmor(g,{...pose,flip:g.player.whip?g.player.whip.side<0:pose.flip},x,y,ghost?.3*fade:1);}
  if(g.player.weapon===2||g.player.weapon===1)return drawNativeArmor(g,{flip:g.player.weapon===1?photoGeometry(g).flip:state.pointer.x<g.player.x},x,y,ghost?.3*fade:1);
  if(g.player.weapon!==0||!meleeAtlasReady('body'))return false;
  const pose=warriorPose(g);
  if(drawNativeArmor(g,pose,x,y,ghost?.3*fade:1))return true;
  return drawMeleeFrame('body',ghost?'dash':pose.name,pose.index,x,y,meleeSpriteConfig.bodyScale,0,pose.flip,ghost?.3*fade:1);
}

// Native item.noUseGraphic: no floating weapon outside an active holdout.
export function drawWarriorIdleWeapon(g){return g.player.weapon===0;}

export function drawWarriorWeapon(g){
  const p=g.player;if(p.weapon!==0||!meleeAtlasReady('ark'))return false;
  if(p.arkCharges>0&&g.mode!=='dead'){
    const count=renderQuality()==='low'?1:2;
    for(let i=0;i<count;i++){
      const a=g.t*2+i*Math.PI;
      drawNativeArkSpark(p.x+Math.cos(a)*27,p.y+Math.sin(a)*24,.5,a);
    }
  }
  if(p.swing){
    const s=p.swing,progress=clamp(1-s.time/s.max,0,1),geometry=arkSwingGeometry(s,progress,p);
    drawNativeArkTrail(g,s,geometry.angle,progress);
    drawNativeSwingParticles(g,s,progress);
    const rotation=geometry.angle+Math.PI/4+(geometry.flip?Math.PI/2:0);
    if(s.charge>0){
      const direction=geometry.flip?-1:1,a=geometry.angle;
      const backX=geometry.draw.x+(Math.cos(a)*56+Math.cos(a-Math.PI/2)*11*direction)*geometry.scale;
      const backY=geometry.draw.y+(Math.sin(a)*56+Math.sin(a-Math.PI/2)*11*direction)*geometry.scale;
      drawNativeArkBlade('right',backX,backY,geometry.scale,rotation,geometry.flip,1,[geometry.flip?90:44,86]);
      drawNativeArkBlade('left',geometry.draw.x,geometry.draw.y,geometry.scale,rotation,geometry.flip);
    }else drawNativeArkBlade(s.wide?'left':'right',geometry.draw.x,geometry.draw.y,geometry.scale,rotation,geometry.flip);
  }
  if(p.arkThrow){
    const s=p.arkThrow,ready=!s.returning&&s.age>=s.max*.25&&s.age<s.max*.75,steps=renderQuality()==='low'?4:8;
    drawNativeConstellation(g,s);
    drawNativeSnapBurst(g,s);
    if(nativeArkReady()){
      drawNativeThrownArk(g,s);
    }else if(s.snapLife){
      const progress=1-s.snapLife/(s.snapMax||.22);
      drawMeleeFrame('ark','snap',frameAt('ark','snap',progress),s.x,s.y,.86+progress*.26,aim(g),false,Math.min(1,(1-progress)*4));
    }else{
      const count=meleeFrameCount('ark','spin');
      drawMeleeFrame('ark','spin',Math.floor(s.age*count*3)%count,s.x,s.y,.66);
    }
    if(ready){
      ctx.save();ctx.strokeStyle='#ffe4b3';ctx.lineWidth=1.5;ctx.setLineDash([4,9]);
      ctx.beginPath();ctx.arc(s.x,s.y,83,0,Math.PI*2);ctx.stroke();ctx.restore();
      text('ВІДПУСТИ · SNAP',s.x,s.y-94,11,'#ffe4b3');
    }
  }
  if(p.arkParry){
    const s=p.arkParry,progress=1-s.time/s.max;
    const geometry=arkParryGeometry(s,p),a=s.angle;
    if(!drawNativeScissors(geometry.x,geometry.y,a,geometry.opening,geometry.scale))
      drawMeleeFrame('ark','open',frameAt('ark','open',progress),p.x,p.y,geometry.scale,a+.5);
    if(s.success)drawNativeArkSpark(p.x+Math.cos(s.angle)*60,p.y+Math.sin(s.angle)*60,1.5,progress*Math.PI,1-progress);
  }
  if(p.arkRip)drawNativeBigRip(g,p.arkRip);
  drawNativeParryRecharge(g);
  if(g.mode!=='dead'){
    const charges=p.arkCharges||0;
    text(charges?'✦ '+charges+' · ПКМ: BIG RIP':p.arkParryCd>0?'PARRY '+p.arkParryCd.toFixed(1)+'с':'ПКМ: PARRY',p.x,p.y+38,10,charges?'#ffe3a4':'#b4d7e9');
  }
  return true;
}

export function drawWarriorProjectile(s,g){
  // RendingNeedle (Ark Beam) - native 14x88 texture, scale 2.4f, opacity 0.6f
  // Rotation: velocity.ToRotation() + PiOver2 (from RendingNeedle.cs)
  if(s.id==='arkBeam'){
    if(!meleeAtlasReady('rendingNeedle'))return false;
    drawNativeProjectileTrail(s);
    // Native: scale 2.4, opacity 0.6. We use presentation scale adapted from source.
    // Source scale 2.4 on 14x88 = ~33.6x211.2. Our presentation: scale 0.6 on 14x88 = ~8.4x52.8
    const angle = Math.atan2(s.vy,s.vx) + Math.PI/2;
    const scale = 2.4; // Native RendingNeedle scale
    ctx.save();
    ctx.globalAlpha *= 0.6; // Source opacity 0.6
    const result = drawMeleeFrame('rendingNeedle','fly',0,s.x,s.y,scale,angle);
    ctx.restore();
    return result;
  }

  // GalaxiaBolt / EonBolt (Ark Star/homing) - native 22x34 texture
  // Rotation: velocity.ToRotation() + PiOver2 (from EonBolt.cs)
  if(s.id==='arkStar'){
    if(!meleeAtlasReady('galaxiaBolt'))return false;
    drawNativeProjectileTrail(s);
    const angle = Math.atan2(s.vy,s.vx) + Math.PI/2;
    const scale = 1; // Native EonBolt scale
    drawNativeArkSpark(s.x,s.y,.65,angle);
    return drawMeleeFrame('galaxiaBolt','fly',0,s.x,s.y,scale,angle);
  }

  return false;
}

export function drawWarriorImpact(f){
  if(f.kind!=='melee')return false;
  return drawNativeArkSpark(f.x,f.y,.7,f.angle,clamp(f.life/f.max*2,0,1));
}
