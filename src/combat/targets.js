import { state } from '../core/state.js?v=27.1.0';


function attackTarget(){
  const g=state.game,targets=g.stage==='hearts'?g.hearts:g.stage==='brothers'?g.brothers:g.stage==='seekers'?g.seekers:[];
  return nearestTarget(targets,g.player.x,g.player.y)||g.boss;
}


function nearestForHoming(x,y){
  const g=state.game,targets=g.stage==='hearts'?g.hearts:g.stage==='brothers'?g.brothers:g.stage==='seekers'?g.seekers:[];
  return nearestTarget(targets,x,y)||g.boss;
}


function possibleTargets(){
  let g=state.game;
  if(g.castDelayState||g.stage==='normal'&&(g.phase2Intro>0||g.boss.dontTakeDamage))return [];
  return g.stage==='hearts'?g.hearts:g.stage==='brothers'?g.brothers:g.stage==='seekers'?g.seekers:g.stage==='normal'?[g.boss]:[]
}


function nearestTarget(targets,x,y){
  let nearest=null,best=Infinity;
  for(const target of targets){
    const d=(target.x-x)**2+(target.y-y)**2;
    if(d<best){
      best=d;
      nearest=target;
    }
  }
  return nearest;
}


export { attackTarget, nearestForHoming, possibleTargets, nearestTarget };
