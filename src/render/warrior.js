import { meleeSpriteConfig } from '../../config/melee-sprites.js?v=22.1.0';
import { playerConfig } from '../../config/player.js?v=22.1.0';
import { arkAngle } from '../classes/melee.js?v=22.1.0';
import { ctx } from '../core/dom.js?v=22.1.0';
import { state } from '../core/state.js?v=22.1.0';
import { settings } from '../core/settings.js?v=22.1.0';
import { clamp } from '../core/math.js?v=22.1.0';
import { drawMeleeFrame,meleeAtlasReady,meleeFrameCount } from './melee-atlas.js?v=22.1.0';
import { line,round,text } from './primitives.js?v=22.1.0';
import { drawWarriorTrail } from './warrior-trails.js?v=22.1.0';

const deathClocks=new WeakMap();
const poseClocks=new WeakMap();
const weaponClocks=new WeakMap();
const bodyFps={idle:5,run:10,rise:7,fall:7};
const aim=g=>Math.atan2(state.pointer.y-g.player.y,state.pointer.x-g.player.x);
const frameAt=(kind,name,progress)=>Math.min(meleeFrameCount(kind,name)-1,Math.floor(clamp(progress,0,1)*meleeFrameCount(kind,name)));

export function warriorPose(g){
  const p=g.player,k=state.keys,t=g.ritual?.ambient??g.t;
  let clock=poseClocks.get(g);
  if(!clock){clock={name:'',since:t,time:t,flip:state.pointer.x<p.x,pose:null};poseClocks.set(g,clock);}
  if(g.mode==='paused'&&clock.pose)return clock.pose;
  const dx=(k.d||k.ArrowRight?1:0)-(k.a||k.ArrowLeft?1:0)+state.moveAxis.x;
  const dy=(k.s||k.ArrowDown?1:0)-(k.w||k.ArrowUp?1:0)+state.moveAxis.y;
  if(Math.abs(state.pointer.x-p.x)>12)clock.flip=state.pointer.x<p.x;
  if(p.dashT>0&&Math.abs(p.dashX)>.1)clock.flip=p.dashX<0;
  let name='idle',progress=null;
  if(g.mode==='dead'){
    let start=deathClocks.get(g);if(start===undefined){start=performance.now();deathClocks.set(g,start);}
    name='death';progress=(performance.now()-start)/650;
  }else if(p.hits>0&&g.t-p.lastHit<.22){name='hurt';progress=(g.t-p.lastHit)/.22;}
  else if(p.dashT>0){name='dash';progress=1-p.dashT/playerConfig.dashDuration;}
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
  if(g.player.weapon!==0||!meleeAtlasReady('body'))return false;
  const pose=warriorPose(g);
  return drawMeleeFrame('body',ghost?'dash':pose.name,pose.index,x,y,meleeSpriteConfig.bodyScale,0,pose.flip,ghost?.3*fade:1);
}

export function drawWarriorIdleWeapon(g){
  const p=g.player;if(p.weapon!==0||!meleeAtlasReady('ark'))return false;
  if(!p.swing&&!p.arkThrow&&!p.arkParry&&!p.arkRip&&g.mode!=='dead'){
    const pose=warriorWeaponPose(g,aim(g)+.35,null,.42),a=pose.angle;
    drawMeleeFrame('ark','closed',2,p.x+Math.cos(a)*12,p.y+Math.sin(a)*12,pose.scale,a+Math.PI/2);
  }
  return true;
}

export function drawWarriorWeapon(g){
  const p=g.player;if(p.weapon!==0||!meleeAtlasReady('ark'))return false;
  if(p.arkCharges>0&&g.mode!=='dead'){
    const count=settings.quality==='low'?1:2;
    for(let i=0;i<count;i++){
      const a=g.t*2+i*Math.PI;
      drawMeleeFrame('ark','star',Math.floor(g.t*8)%2,p.x+Math.cos(a)*27,p.y+Math.sin(a)*24,.16);
    }
  }
  if(p.swing){
    const s=p.swing,progress=clamp(1-s.time/s.max,0,1),reach=s.wide?146:124,pose=warriorWeaponPose(g,arkAngle(s,progress),s,(reach-12)/160),a=pose.angle;
    drawWarriorTrail(g,s,a,progress);
    drawMeleeFrame('ark','closed',2,p.x+Math.cos(a)*12,p.y+Math.sin(a)*12,pose.scale,a+Math.PI/2);
  }
  if(p.arkThrow){
    const s=p.arkThrow,ready=!s.returning&&s.age>=.466&&s.age<=1.7475,steps=settings.quality==='low'?4:8;
    let px=p.x,py=p.y;
    for(let i=1;i<=steps;i++){
      const f=i/steps,x=p.x+(s.x-p.x)*f,y=p.y+(s.y-p.y)*f+Math.sin(f*Math.PI)*Math.sin(g.t*6+i)*8;
      line(px,py,x,y,'#a696e080',1.3);px=x;py=y;
    }
    if(s.snapLife){
      const progress=1-s.snapLife/.22;
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
    const pose=warriorWeaponPose(g,s.angle,s,.84),a=pose.angle;
    drawMeleeFrame('ark','open',frameAt('ark','open',progress),p.x,p.y,pose.scale,a+.5);
    if(s.success)drawMeleeFrame('ark','impact',frameAt('ark','impact',progress),p.x+Math.cos(s.angle)*60,p.y+Math.sin(s.angle)*60,.85);
  }
  if(p.arkRip){
    const r=p.arkRip,f=r.time/r.max,progress=1-f;
    ctx.save();ctx.globalAlpha=f;
    line(r.x,r.y,r.ex,r.ey,'#8a3cb950',42*f);line(r.x,r.y,r.ex,r.ey,'#ecd2ff',3);
    drawMeleeFrame('ark','rip',frameAt('ark','rip',progress),r.ex,r.ey,.9+progress*.25,r.angle);
    ctx.restore();
  }
  if(g.mode!=='dead'){
    const charges=p.arkCharges||0;
    text(charges?'✦ '+charges+' · ПКМ: BIG RIP':p.arkParryCd>0?'PARRY '+p.arkParryCd.toFixed(1)+'с':'ПКМ: PARRY',p.x,p.y+38,10,charges?'#ffe3a4':'#b4d7e9');
  }
  return true;
}

export function drawWarriorProjectile(s,g){
  if(!meleeAtlasReady('ark'))return false;
  if(s.id==='arkStar')return drawMeleeFrame('ark','bolt',Math.floor(g.t*18)%5,s.x,s.y,.27,g.t*3);
  if(s.id==='arkBeam')return drawMeleeFrame('ark','fire',Math.floor(g.t*18)%2,s.x,s.y,.45,Math.atan2(s.vy,s.vx)+.95);
  return false;
}

export function drawWarriorImpact(f){
  if(f.kind!=='melee'||!meleeAtlasReady('ark'))return false;
  return drawMeleeFrame('ark','impact',frameAt('ark','impact',1-f.life/f.max),f.x,f.y,.42,f.angle,f.angle<0,clamp(f.life/f.max*2,0,1));
}
