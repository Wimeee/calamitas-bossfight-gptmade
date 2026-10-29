import { beginAttack, kit } from './shared.js?v=21.0.0';
import { beamWallDistance, fireChannelWeapon } from '../combat/beams.js?v=21.0.0';
import { hitTarget } from '../combat/damage.js?v=21.0.0';
import { possibleTargets } from '../combat/targets.js?v=21.0.0';
import { audio } from '../core/audio.js?v=21.0.0';
import { segmentDistance } from '../core/math.js?v=21.0.0';
import { state } from '../core/state.js?v=21.0.0';
import { muzzlePoint, weaponAim } from '../render/weapons.js?v=21.0.0';


function activateRanger(){
  const g=state.game,p=g.player,k=kit(),a=weaponAim(g);
  if(k.heat<.35)return;
  const damage=1800+2700*k.heat,end=muzzlePoint(p,a,beamWallDistance(p.x,p.y,Math.cos(a),Math.sin(a)));
  k.rail={x:p.x,y:p.y,ex:end.x,ey:end.y,time:.28,max:.28};
  for(const t of possibleTargets())if(segmentDistance(t.x,t.y,p.x,p.y,end.x,end.y)<t.r+13)hitTarget(t,damage,t.x,t.y,'#fff0ba','ranger');
  k.heat=0;
  k.overheat=0;
  k.abilityCd=1.4;
  p.fireCd=Math.max(p.fireCd,.15);
  audio.fx('big');
}


function updateRanger(dt){
  const g=state.game,k=kit();
  if(g.t-k.lastFire>.15)k.heat=Math.max(0,k.heat-dt*.28);
}


function attackRanger(w){
  if(kit().overheat>0)return;
  if(!beginAttack(w))return;
  const p=state.game.player;
  p.fireCd=w.cool;
  p.mana-=w.mana;
  audio.fx('shoot');
  fireChannelWeapon(w,weaponAim(state.game));
}


export { activateRanger, updateRanger, attackRanger };
