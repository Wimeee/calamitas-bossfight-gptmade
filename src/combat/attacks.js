import { classRegistry, weapons } from '../classes/registry.js?v=17.0.1';
import { rnd } from '../core/math.js?v=17.0.1';
import { state } from '../core/state.js?v=17.0.1';


function addShot(x,y,dx,dy,w,boost=1){
  const sp=w.speed;
  state.game.shots.push({
      x,
      y,
      vx:dx*sp,
      vy:dy*sp,
      r:w.rad,
      dmg:w.dmg*boost,
      life:1.5,
      col:w.col,
      id:w.id,
      pierce:w.id==='melee'?3:0,
      hitIds:new Set(),
      homing:w.id==='summon',
      wave:w.id==='rogue'?rnd(0,6):0
  });
  if(state.game.shots.length>180)state.game.shots.splice(0,30)
}


function shoot(){
  if(!state.game)return;
  const g=state.game,p=g.player,w=weapons[p.weapon];
  if(p.fireCd>0||g.mode!=='playing'||g.stage==='accept')return;
  classRegistry[w.id].attack(w);
}


export { addShot, shoot };
