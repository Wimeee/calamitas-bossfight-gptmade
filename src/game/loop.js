import { state } from '../core/state.js?v=26.0.4';
import { update } from './update.js?v=26.0.4';
import { draw } from '../render/scene.js?v=26.0.4';
import { updateFPSCounter } from '../ui/fps.js?v=26.0.4';


function loop(now){
  if(state.screen!=='game'){state.raf=0;updateFPSCounter(now);return;}
  state.raf=requestAnimationFrame(loop);
  if(document.hidden){state.last=now;updateFPSCounter(now);return;}
  let dt=Math.min(.034,(now-state.last)/1000||.016);
  state.last=now;
  if(state.game&&state.game.mode==='playing')update(dt);
  draw(state.game);
  updateFPSCounter(now);
}


export { loop };
