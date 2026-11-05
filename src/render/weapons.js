import {drawNativeWhip} from './summoner.js?v=30.0.0';
import {drawPhotoHeld} from './ranger.js?v=30.0.0';
import {drawMageHeld} from './mage.js?v=30.0.0';
import { drawWarriorIdleWeapon, drawWarriorProjectile } from './warrior.js?v=30.0.0';
import { weapons } from '../classes/registry.js?v=30.0.0';
import { TAU } from '../core/config.js?v=30.0.0';
import { ctx } from '../core/dom.js?v=30.0.0';
import { clamp } from '../core/math.js?v=30.0.0';
import { state } from '../core/state.js?v=30.0.0';
import { drawArkPair } from './melee.js?v=30.0.0';
import { line, pixel, round } from './primitives.js?v=30.0.0';


function drawPixelWhip(g){
  if(g.player.weapon===3){drawNativeWhip(g);return;}
  const p=g.player,w=p.whip;
  if(!w||w.time<=0)return;
  const pr=1-w.time/w.max,len=w.range*Math.sin(pr*Math.PI*.95),a=w.angle,side=Math.sin(pr*TAU)*48;
  const dx=Math.cos(a),dy=Math.sin(a),cx=p.x+dx*len*.53-dy*side,cy=p.y+dy*len*.53+dx*side,ex=p.x+dx*len,ey=p.y+dy*len;
  const count=Math.max(2,Math.ceil(len/10));
  for(let i=1;i<=count;i++){
    const u=i/count,v=1-u,x=v*v*p.x+2*v*u*cx+u*u*ex,y=v*v*p.y+2*v*u*cy+u*u*ey;
    const tangent=Math.atan2(2*v*(cy-p.y)+2*u*(ey-cy),2*v*(cx-p.x)+2*u*(ex-cx));
    pixel(i===count?'whip-tip':'whip-link',x,y,i===count?1:.85,tangent);
  }
}


function weaponAim(g){
  const p=g.player;
  return Math.atan2(state.pointer.y-p.y,state.pointer.x-p.x)
}


function muzzlePoint(p,a,reach){
  return{x:p.x+Math.cos(a)*reach,y:p.y+Math.sin(a)*reach}
}


function drawHeldWeapon(g){
  const p=g.player,w=weapons[p.weapon],a=weaponAim(g),kick=p.weaponKick||0;
  if(w.id==='summon'||w.id==='rogue')return;
  if(w.id==='ranger'){drawPhotoHeld(g,a);return;}
  if(w.id==='mage'){drawMageHeld(g,a);return;}
  if(w.id==='melee'){
    if(drawWarriorIdleWeapon(g))return;
    if(!p.swing&&!p.arkThrow&&!p.arkParry&&!p.arkRip)drawArkPair(p.x,p.y,a,72,.12);
    return;
  }
  ctx.save();
  ctx.translate(p.x,p.y);
  ctx.rotate(a);
  line(3,6,18,10,'#345465',7);
  round(18,10,3,'#dbb89e','#293346',1);
  line(4,-5,20,-3,'#4b7180',6);
  round(20,-3,3,'#e7c7a8','#293346',1);
  ctx.restore();
  const reach=w.id==='rogue'?27:w.id==='melee'?32:27;
  pixel('weapon-'+w.id,p.x+Math.cos(a)*(reach-kick*24),p.y+Math.sin(a)*(reach-kick*24),w.id==='rogue'?.82:w.id==='mage'?1.06:.92,a);
  if(kick>0&&w.id==='ranger'){
    const m=muzzlePoint(p,a,59);
    ctx.save();
    ctx.globalAlpha=.6;
    pixel('impact-ranger',m.x,m.y,.6+kick*2,a);
    ctx.restore();
  }
  if(kick>0&&w.id==='mage'){
    const m=muzzlePoint(p,a,44);
    ctx.save();
    ctx.globalAlpha=.75;
    pixel('impact-mage',m.x,m.y,.6,g.t*3);
    ctx.restore();
  }
}


function drawPlayerShot(s,g){
  if(drawWarriorProjectile(s,g))return;
  const a=Math.atan2(s.vy,s.vx),speed=Math.hypot(s.vx,s.vy)||1,dx=s.vx/speed,dy=s.vy/speed;
  if(s.id==='rogue'){
    ctx.save();
    ctx.globalAlpha=.18;
    pixel('weapon-rogue',s.x-dx*16,s.y-dy*16,.72,g.t*14+s.wave-.4);
    ctx.restore();
    pixel('weapon-rogue',s.x,s.y,.73,g.t*14+s.wave);
  }else
  if(s.id==='cosmicStar'||s.id==='arkStar'){
    ctx.save();
    ctx.globalAlpha=.25;
    round(s.x,s.y,s.r+7,s.col);
    ctx.restore();
    pixel('weapon-rogue',s.x,s.y,s.id==='cosmicStar'?.58:.37,g.t*8);
  }else
  {
    const cosmic=s.id==='cosmicBolt';
    line(s.x-dx*40,s.y-dy*40,s.x,s.y,cosmic?'#78dab466':'#a99be977',cosmic?5:7);
    line(s.x-dx*28,s.y-dy*28,s.x,s.y,cosmic?'#edffdb':'#d5faff',2);
    pixel(cosmic?'shot-cosmic':'shot-ark',s.x,s.y,cosmic?1.1:.95,a);
  }
}


function drawChannelBeam(g){
  const p=g.player,beam=p.beamPulse;
  if(!beam||beam.life<=0)return;
  const fade=clamp(beam.life/.07,0,1),mage=beam.kind==='mage';
  const start=muzzlePoint(p,beam.angle,mage?45:59);
  ctx.save();
  ctx.lineCap='round';
  for(let i=0;i<beam.rays.length;i++){
    const r=beam.rays[i],c=mage?(beam.charge>.85?'#ffd27a':i%2?'#ffad56':'#ed7250'):'#ffcb67';
    ctx.globalAlpha=fade*.10;
    line(start.x,start.y,r.ex,r.ey,c,mage?12:17);
    ctx.globalAlpha=fade*.6;
    line(start.x,start.y,r.ex,r.ey,c,mage?4.5:6);
    ctx.globalAlpha=fade*.95;
    line(start.x,start.y,r.ex,r.ey,mage?'#ffedb5':'#fff9d9',mage?1.5:2.2);
    if(r.hit){
      ctx.globalAlpha=fade*.75;
      pixel('impact-'+beam.kind,r.ex,r.ey,mage?.48:.65,g.t*4+i);
    }
  }
  ctx.globalAlpha=fade;
  const m=beam.rays[0];
  if(m){
    pixel('impact-'+beam.kind,m.x,m.y,mage?.52:.7,g.t*5);
  }
  ctx.restore();
}


export { drawPixelWhip, weaponAim, muzzlePoint, drawHeldWeapon, drawPlayerShot, drawChannelBeam };
