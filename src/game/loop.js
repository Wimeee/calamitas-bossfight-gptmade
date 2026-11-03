import { state } from '../core/state.js?v=25.0.0';
import { update } from './update.js?v=25.0.0';
import { draw } from '../render/scene.js?v=25.0.0';


function loop(now){
  if(state.screen!=='game'){state.raf=0;return;}
  state.raf=requestAnimationFrame(loop);
  let dt=Math.min(.034,(now-state.last)/1000||.016);
  state.last=now;
  if(state.game&&state.game.mode==='playing')update(dt);
  draw(state.game)
}


export { loop };
