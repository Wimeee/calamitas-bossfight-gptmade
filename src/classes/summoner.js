// Generic legacy cosmicStar shots retain their existing absorption utility.
import {state} from '../core/state.js?v=29.1.1';
import {damageSepulcherArea} from '../combat/sepulcher-damage.js?v=29.1.1';
import {hitTarget} from '../combat/damage.js?v=29.1.1';
import {possibleTargets} from '../combat/targets.js?v=29.1.1';
import {audio} from '../core/audio.js?v=29.1.1';
export {summonSquad,lashWhip,commandVolley,markCosmicTarget,updateCosmic,attackSummoner,activateSummoner} from './native-summoner.js?v=29.1.1';
function cosmicStarBurst(s,hit){
  const g=state.game;
  damageSepulcherArea(g,s.x,s.y,90,s.dmg*.48);
  for(const target of possibleTargets()){
    if(target===hit)continue;
    if(Math.hypot(target.x-s.x,target.y-s.y)<90+target.r)
    hitTarget(target,s.dmg*.48,s.x,s.y,'#ffe7a2','cosmicStar');
  }
  for(let i=0;i<24;i++){
    const a=i*Math.PI*2/24,vel=105+(i%4)*27;
    g.sparks.push({x:s.x,y:s.y,vx:Math.cos(a)*vel,vy:Math.sin(a)*vel,life:.50,max:.50,c:'#fff0ad'});
  }
  audio.fx('big');
}



export {cosmicStarBurst};
