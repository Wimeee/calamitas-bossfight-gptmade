import { meleeSpriteConfig } from '../../config/melee-sprites.js?v=20.0.0';
import { arkAngle } from '../classes/melee.js?v=20.0.0';
import { ctx } from '../core/dom.js?v=20.0.0';
import { state } from '../core/state.js?v=20.0.0';
import { settings } from '../core/settings.js?v=20.0.0';
import { clamp } from '../core/math.js?v=20.0.0';
import { drawMeleeFrame,meleeAtlasReady,meleeFrameCount } from './melee-atlas.js?v=20.0.0';
import { line,round,text } from './primitives.js?v=20.0.0';

const deathClocks=new WeakMap();
const aim=g=>Math.atan2(state.pointer.y-g.player.y,state.pointer.x-g.player.x);
const frameAt=(kind,name,progress)=>Math.min(meleeFrameCount(kind,name)-1,Math.floor(clamp(progress,0,1)*meleeFrameCount(kind,name)));

export function warriorPose(g){
  const p=g.player,k=state.keys,t=g.ritual?.ambient??g.t;
  const dx=(k.d||k.ArrowRight?1:0)-(k.a||k.ArrowLeft?1:0)+state.moveAxis.x;
  const dy=(k.s||k.ArrowDown?1:0)-(k.w||k.ArrowUp?1:0)+state.moveAxis.y;
  const flip=p.dashT>0?Math.abs(p.dashX)>.1?p.dashX<0:state.pointer.x<p.x:state.pointer.x<p.x;
  let name='idle',progress=(t*7)%1;
  if(g.mode==='dead'){
    let start=deathClocks.get(g);if(start===undefined){start=performance.now();deathClocks.set(g,start);}
    name='death';progress=(performance.now()-start)/650;
  }else if(p.hits>0&&g.t-p.lastHit<.22){name='hurt';progress=(g.t-p.lastHit)/.22;}
  else if(p.dashT>0){name='dash';progress=(t*24)%1;}
  else if(g.mode==='playing'&&(!g.ritual||g.ritual.phase==='preparation')){
    if(dy<-.15){name='rise';progress=(t*10)%1;}
    else if(dy>.15){name='fall';progress=(t*10)%1;}
    else if(Math.abs(dx)>.15){name='run';progress=(t*12)%1;}
  }
  return{name,index:frameAt('body',name,progress),flip};
}

export function drawWarriorBody(g,x=g.player.x,y=g.player.y,ghost=false,fade=1){
  if(g.player.weapon!==0||!meleeAtlasReady('body'))return false;
  const pose=warriorPose(g);
  return drawMeleeFrame('body',ghost?'dash':pose.name,pose.index,x,y,meleeSpriteConfig.bodyScale,0,pose.flip,ghost?.3*fade:1);
}

export function drawWarriorIdleWeapon(g){
  const p=g.player;if(p.weapon!==0||!meleeAtlasReady('ark'))return false;
  if(!p.swing&&!p.arkThrow&&!p.arkParry&&!p.arkRip&&g.mode!=='dead'){
    const a=aim(g),t=g.ritual?.ambient??g.t;
    drawMeleeFrame('ark','closed',Math.floor(t*7)%4,p.x+Math.cos(a)*15,p.y+Math.sin(a)*15,.36,a+Math.PI/2);
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
    const s=p.swing,progress=clamp(1-s.time/s.max,0,1),a=arkAngle(s,progress),index=frameAt('ark','slash',progress);
    const rect=meleeSpriteConfig.ark.slash[index],reach=s.wide?146:124;
    drawMeleeFrame('ark','slash',index,p.x,p.y,reach/(rect.w-rect.ax),a+.48);
  }
  if(p.arkThrow){
    const s=p.arkThrow,ready=!s.returning&&s.age>=.466&&s.age<=1.7475,steps=settings.quality==='low'?4:8;
    let px=p.x,py=p.y;
    for(let i=1;i<=steps;i++){
      const f=i/steps,x=p.x+(s.x-p.x)*f,y=p.y+(s.y-p.y)*f+Math.sin(f*Math.PI)*Math.sin(g.t*6+i)*8;
      line(px,py,x,y,'#a696e080',1.3);px=x;py=y;
    }
    if(s.snapLife){
      drawMeleeFrame('ark','snap',frameAt('ark','snap',1-s.snapLife/.22),s.x,s.y,1.05,aim(g));
    }else drawMeleeFrame('ark','spin',Math.floor(s.age*24)%6,s.x,s.y,.66,s.angle*.25);
    if(ready){
      ctx.save();ctx.strokeStyle='#ffe4b3';ctx.lineWidth=1.5;ctx.setLineDash([4,9]);
      ctx.beginPath();ctx.arc(s.x,s.y,83,0,Math.PI*2);ctx.stroke();ctx.restore();
      text('ВІДПУСТИ · SNAP',s.x,s.y-94,11,'#ffe4b3');
    }
  }
  if(p.arkParry){
    const s=p.arkParry,progress=1-s.time/s.max;
    drawMeleeFrame('ark','open',frameAt('ark','open',progress),p.x,p.y,.84,s.angle+.5);
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
    text(charges?'✦ '+charges+' · ЛКМ: BIG RIP':p.arkParryCd>0?'PARRY '+p.arkParryCd.toFixed(1)+'с':'ЛКМ: PARRY',p.x,p.y+38,10,charges?'#ffe3a4':'#b4d7e9');
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
