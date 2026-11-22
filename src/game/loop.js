import { state } from '../core/state.js?v=31.1.4';
import { update } from './update.js?v=31.1.4';
import { draw } from '../render/scene.js?v=31.1.4';
import { updateFPSCounter } from '../ui/fps.js?v=31.1.4';
import {pausePerformanceTrace,recordPerformanceFrame} from '../core/frame-trace.js?v=31.1.4';


let lastMobilePaint=null,paintOwner=null;
function loop(now){
  if(state.screen!=='game'){state.raf=0;pausePerformanceTrace();updateFPSCounter(now);return;}
  state.raf=requestAnimationFrame(loop);
  if(document.hidden){lastMobilePaint=null;state.last=now;pausePerformanceTrace();updateFPSCounter(now);return;}
  const capture=state.game?.mode==='playing',start=performance.now();let steps=0;
  // Recover short stalls without discarding movement/combat time. Bound the
  // budget so a long suspension cannot create a catch-up spiral.
  let dt=Math.min(.1,Math.max(0,(now-state.last)/1000));
  state.last=now;
  while(dt>1e-10&&state.game?.mode==='playing'){
    const step=Math.min(dt,1/60);update(step);dt-=step;steps++;
  }
  const logicEnd=performance.now();
  if(paintOwner!==state.game){paintOwner=state.game;lastMobilePaint=null;}
  if(state.deviceMode==='mobile'){
    const elapsed=lastMobilePaint===null?Infinity:now-lastMobilePaint;
    if(elapsed<1000/60-.5){if(capture)recordPerformanceFrame(state.game,now,start,logicEnd,logicEnd,steps,false);else pausePerformanceTrace();return;}
    lastMobilePaint=lastMobilePaint===null||elapsed>100?now:lastMobilePaint+Math.max(1,Math.floor((elapsed+.5)/(1000/60)))*(1000/60);
  }else lastMobilePaint=null;
  draw(state.game);
  if(capture)recordPerformanceFrame(state.game,now,start,logicEnd,performance.now(),steps,true);else pausePerformanceTrace();
  updateFPSCounter(now);
}


document.addEventListener('visibilitychange',()=>{state.last=performance.now();lastMobilePaint=null;pausePerformanceTrace();});
export { loop };
