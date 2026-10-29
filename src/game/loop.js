import { state } from '../core/state.js?v=17.0.1';
import { update } from './update.js?v=17.0.1';
import { draw } from '../render/scene.js?v=17.0.1';


function loop(now){
  state.raf=requestAnimationFrame(loop);
  let dt=Math.min(.034,(now-state.last)/1000||.016);
  state.last=now;
  if(state.game&&state.game.mode==='playing')update(dt);
  draw(state.game)
}


export { loop };
