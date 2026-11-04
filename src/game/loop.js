import { state } from '../core/state.js?v=29.1.0';
import { update } from './update.js?v=29.1.0';
import { draw } from '../render/scene.js?v=29.1.0';
import { updateFPSCounter } from '../ui/fps.js?v=29.1.0';


let lastMobilePaint=null,paintOwner=null;
function loop(now){
  if(state.screen!=='game'){state.raf=0;updateFPSCounter(now);return;}
  state.raf=requestAnimationFrame(loop);
  if(document.hidden){lastMobilePaint=null;state.last=now;updateFPSCounter(now);return;}
  let dt=Math.min(.034,(now-state.last)/1000||.016);
  state.last=now;
  if(state.game&&state.game.mode==='playing')update(dt);
  if(paintOwner!==state.game){paintOwner=state.game;lastMobilePaint=null;}
  if(state.deviceMode==='mobile'){
    const elapsed=lastMobilePaint===null?Infinity:now-lastMobilePaint;
    if(elapsed<1000/60-.5)return;
    lastMobilePaint=lastMobilePaint===null||elapsed>100?now:lastMobilePaint+Math.max(1,Math.floor((elapsed+.5)/(1000/60)))*(1000/60);
  }else lastMobilePaint=null;
  draw(state.game);
  updateFPSCounter(now);
}


export { loop };
