import { kit } from '../classes/shared.js?v=26.1.2';
import { hitTarget } from './damage.js?v=26.1.2';
import { possibleTargets } from './targets.js?v=26.1.2';
import { arena } from '../core/arena.js?v=26.1.2';
import { clamp } from '../core/math.js?v=26.1.2';
import { state } from '../core/state.js?v=26.1.2';
import { muzzlePoint } from '../render/weapons.js?v=26.1.2';
import { getSepulcherBlockers, traceSepulcherBeam } from './sepulcher-blocking.js?v=26.1.2';


function beamWallDistance(x,y,dx,dy){
  let {l,r,t,b}=arena;
  for(const target of possibleTargets()){
    l=Math.min(l,target.x-target.r);r=Math.max(r,target.x+target.r);
    t=Math.min(t,target.y-target.r);b=Math.max(b,target.y+target.r);
  }
  const tx=dx>1e-8?(r-x)/dx:dx< -1e-8?(l-x)/dx:Infinity;
  const ty=dy>1e-8?(b-y)/dy:dy< -1e-8?(t-y)/dy:Infinity;
  return Math.max(0,Math.min(tx,ty,1800));
}


function traceWeaponBeam(x,y,angle,halfWidth){
  const dx=Math.cos(angle),dy=Math.sin(angle);
  let distance=beamWallDistance(x,y,dx,dy),hit=null;

  // Check Sepulcher blockers first (if worm exists)
  const g = state.game;
  if (g?.sepulcher) {
    const blockers = getSepulcherBlockers(g);
    if (blockers.length > 0) {
      const beamResult = traceSepulcherBeam(x, y, dx, dy, halfWidth, blockers, distance);
      if (beamResult.hit) {
        distance = beamResult.distance;
        hit = null; // Blocker is not a damageable target
      }
    }
  }

  // Check damageable targets (hearts, brothers, seekers, boss)
  for(const target of possibleTargets()){
    const rx=target.x-x,ry=target.y-y,along=rx*dx+ry*dy,r=target.r+halfWidth;
    const disc=r*r-(rx*rx+ry*ry-along*along);
    if(disc<0)continue;
    const root=Math.sqrt(disc);
    if(along+root<0)continue;
    const entry=Math.max(0,along-root);
    if(entry<=distance){
      distance=entry;
      hit=target;
    }
  }
  return{x,y,ex:x+dx*distance,ey:y+dy*distance,hit,distance};
}


function fireChannelWeapon(w,aim){
  const g=state.game,p=g.player,k=kit(),mage=w.id==='mage',charge=clamp(p.channelCharge||0,0,1);
  if(!mage){
    k.heat=Math.min(1,k.heat+.045);
    if(k.heat>=1){
      k.overheat=.8;
      k.heat=.3;
    }
  }
  let connected=false;
  const origin=muzzlePoint(p,aim,mage?45:59),rays=[];
  origin.x=clamp(origin.x,arena.l+1,arena.r-1);
  origin.y=clamp(origin.y,arena.t+1,arena.b-1);
  const count=mage?6:1,spread=mage?.065*(1-charge)+.003:0,impacted=new Set();
  for(let i=0;i<count;i++){
    const offset=mage?(i-(count-1)/2)*spread:0,r=traceWeaponBeam(origin.x,origin.y,aim+offset,mage?3:4);
    if(r.hit){
      connected=true;
      hitTarget(r.hit,mage?w.dmg*1.65/count:w.dmg*(1+k.heat*.5),r.ex,r.ey,mage?'#ffca73':'#ffe5a5',w.id,!impacted.has(r.hit));
      impacted.add(r.hit);
    }
    rays.push(r);
  }
  if(mage&&connected)k.resonance=Math.min(1,k.resonance+.04);
  p.beamPulse={kind:w.id,rays,angle:aim,charge,life:mage?.13:.15};
  p.lastChannelAt=g.t;
}


export { beamWallDistance, traceWeaponBeam, fireChannelWeapon };
