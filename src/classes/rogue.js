import { beginAttack, kit } from './shared.js?v=20.0.0';
import { hitTarget } from '../combat/damage.js?v=20.0.0';
import { possibleTargets } from '../combat/targets.js?v=20.0.0';
import { arena } from '../core/arena.js?v=20.0.0';
import { audio } from '../core/audio.js?v=20.0.0';
import { dist, lerp, norm, segmentDistance } from '../core/math.js?v=20.0.0';
import { state } from '../core/state.js?v=20.0.0';
import { muzzlePoint, weaponAim } from '../render/weapons.js?v=20.0.0';


function throwCelestus(w,a){
  const p=state.game.player,k=kit(),charged=p.stealth>=.999;
  if(k.blades.length>=7)return;
  if(charged)p.stealth=0;
  const m=muzzlePoint(p,a,25);
  k.blades.push({
      x:m.x,
      y:m.y,
      vx:Math.cos(a)*800,
      vy:Math.sin(a)*800,
      age:0,
      returning:false,
      charged,
      empowered:false,
      dmg:w.dmg*(charged?1.65:1),
      outHits:new Set(),
      returnHits:new Set(),
      trail:[]
  });
  if(charged){
    audio.fx('big');
    state.game.floaters.push({x:p.x,y:p.y-45,life:.6,text:'STEALTH STRIKE',col:'#e8b8ff'});
  }
}


function activateRogue(){
  const g=state.game,p=g.player,k=kit(),a=weaponAim(g);
  if(!k.blades.some(s=>!s.returning))return;
  const struck=new Set();
  for(const s of k.blades){
    if(s.returning)continue;
    s.returning=true;
    s.returnHits.clear();
    s.empowered=true;
    for(const t of possibleTargets())if(!struck.has(t)&&dist(t,s)<t.r+85){
      hitTarget(t,1500,t.x,t.y,'#ffd2f4','rogue');
      struck.add(t);
    }
  }
  k.recallFlash=.3;
  k.abilityCd=2.2;
  audio.fx('rogue');
}


function updateRogue(dt){
  const g=state.game,p=g.player,k=kit();
  p.stealth=Math.min(1,p.stealth+dt*(g.t-k.lastFire>.3?.65:.18));
  for(let i=k.blades.length-1;i>=0;i--){
    const s=k.blades[i];
    s.age+=dt;
    s.trail.push({x:s.x,y:s.y});
    if(s.trail.length>7)s.trail.shift();
    if(s.age>.55||s.x<arena.l||s.x>arena.r||s.y<arena.t||s.y>arena.b)s.returning=true;
    if(s.returning){
      const d=norm(p.x-s.x,p.y-s.y);
      s.vx=d.x*1000;
      s.vy=d.y*1000;
    }
    else
    {
      const targets=possibleTargets();
      if(targets.length){
        const t=targets.reduce((a,b)=>dist(a,s)<dist(b,s)?a:b),d=norm(t.x-s.x,t.y-s.y);
        s.vx=lerp(s.vx,d.x*800,Math.min(1,dt*5));
        s.vy=lerp(s.vy,d.y*800,Math.min(1,dt*5));
      }
    }
    const ox=s.x,oy=s.y;
    s.x+=s.vx*dt;
    s.y+=s.vy*dt;
    const hits=s.returning?s.returnHits:s.outHits;
    for(const t of possibleTargets())if(!hits.has(t)&&segmentDistance(t.x,t.y,ox,oy,s.x,s.y)<t.r+(s.charged?21:14)){
      hitTarget(t,s.dmg*(s.returning?(s.empowered?1.3:.7):1),t.x,t.y,'#f1b9ff','rogue');
      hits.add(t);
      if(s.charged)for(const other of possibleTargets())if(other!==t&&dist(other,t)<115)hitTarget(other,s.dmg*.3,other.x,other.y,'#f1b9ff','rogue');
    }
    if(s.returning&&segmentDistance(p.x,p.y,ox,oy,s.x,s.y)<20){
      p.stealth=Math.min(1,p.stealth+.11);
      p.fireCd=Math.max(0,p.fireCd-.035);
      k.blades.splice(i,1);
    }
    else
    if(s.age>2.5)k.blades.splice(i,1);
  }
}


function attackRogue(w){
  if(kit().blades.length>=7)return;
  if(!beginAttack(w))return;
  const p=state.game.player;
  p.fireCd=w.cool;
  p.mana-=w.mana;
  audio.fx('rogue');
  throwCelestus(w,weaponAim(state.game));
}


export { throwCelestus, activateRogue, updateRogue, attackRogue };
