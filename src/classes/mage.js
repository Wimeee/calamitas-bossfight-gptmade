import { beginAttack, kit } from './shared.js?v=17.0.0';
import { fireChannelWeapon } from '../combat/beams.js?v=17.0.0';
import { hitTarget } from '../combat/damage.js?v=17.0.0';
import { possibleTargets } from '../combat/targets.js?v=17.0.0';
import { audio } from '../core/audio.js?v=17.0.0';
import { dist, norm } from '../core/math.js?v=17.0.0';
import { state } from '../core/state.js?v=17.0.0';
import { weaponAim } from '../render/weapons.js?v=17.0.0';


function activateMage(){
  const g=state.game,p=g.player,k=kit(),a=weaponAim(g);
  if(k.resonance<1)return;
  const d=norm(state.pointer.x-p.x,state.pointer.y-p.y),range=Math.min(550,dist(state.pointer,p));
  k.zones.push({x:p.x+d.x*range,y:p.y+d.y*range,time:2,max:2,tick:0,r:105});
  k.resonance=0;
  k.abilityCd=4;
  p.mana=Math.min(p.maxMana,p.mana+75);
  audio.fx('magic');
  g.floaters.push({x:p.x,y:p.y-50,life:.8,text:'+75 MANA',col:'#a8d7ff'});
}


function updateMage(dt){
  const g=state.game,p=g.player,k=kit();
  for(let i=k.zones.length-1;i>=0;i--){
    const z=k.zones[i];
    z.time-=dt;
    z.tick-=dt;
    if(z.time<=0){
      k.zones.splice(i,1);
      continue;
    }
    if(z.tick<=0){
      z.tick+=.25;
      for(const t of possibleTargets())if(dist(t,z)<t.r+z.r)hitTarget(t,450,t.x,t.y,'#ffd596','mage');
    }
  }
}


function attackMage(w){
  if(!beginAttack(w))return;
  const p=state.game.player;
  p.fireCd=w.cool;
  p.mana-=w.mana;
  audio.fx('magic');
  fireChannelWeapon(w,weaponAim(state.game));
}


export { activateMage, updateMage, attackMage };
