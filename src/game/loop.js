import { state } from '../core/state.js?v=31.1.2';
import { update } from './update.js?v=31.1.2';
import { draw } from '../render/scene.js?v=31.1.2';
import { updateFPSCounter } from '../ui/fps.js?v=31.1.2';


let lastMobilePaint=null,paintOwner=null;
function loop(now){
  if(state.screen!=='game'){state.raf=0;updateFPSCounter(now);return;}
  state.raf=requestAnimationFrame(loop);
  if(document.hidden){lastMobilePaint=null;state.last=now;updateFPSCounter(now);return;}
  // Recover short stalls without discarding movement/combat time. Bound the
  // budget so a long suspension cannot create a catch-up spiral.
  let dt=Math.min(.1,Math.max(0,(now-state.last)/1000));
  state.last=now;
  while(dt>1e-10&&state.game?.mode==='playing'){
    const step=Math.min(dt,1/60);update(step);dt-=step;
  }
  if(paintOwner!==state.game){paintOwner=state.game;lastMobilePaint=null;}
  if(state.deviceMode==='mobile'){
    const elapsed=lastMobilePaint===null?Infinity:now-lastMobilePaint;
    if(elapsed<1000/60-.5)return;
    lastMobilePaint=lastMobilePaint===null||elapsed>100?now:lastMobilePaint+Math.max(1,Math.floor((elapsed+.5)/(1000/60)))*(1000/60);
  }else lastMobilePaint=null;
  draw(state.game);
  updateFPSCounter(now);
}


document.addEventListener('visibilitychange',()=>{state.last=performance.now();lastMobilePaint=null;});
export { loop };
