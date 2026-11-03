import { $, root } from '../core/dom.js?v=25.0.1';
import { state } from '../core/state.js?v=25.0.1';
import { resetTouchInput } from './mobile.js?v=25.0.1';


function setFocusMode(active){
  root.classList.toggle('focus-mode',active);
  document.body.classList.toggle('calamitas-focus-body',active);
  $('fullscreen').textContent=active?'⤢ Згорнути':'⛶ Екран';
  const mobileFull=root.querySelector('[data-mobile-action="fullscreen"]');
  if(mobileFull)mobileFull.textContent=active?'⤢ ВИЙТИ':'⛶ ЕКРАН';
  if(active){
    window.scrollTo(0,0);
    resetTouchInput();
  }else
  resetTouchInput();
}


let nativeActive=false;
async function toggleFullscreen(){
  if(root.classList.contains('focus-mode')){
    if(document.fullscreenElement===root)await document.exitFullscreen();
    setFocusMode(false);return;
  }
  setFocusMode(true);
  if(state.deviceMode!=='mobile'&&typeof root.requestFullscreen==='function'){
    try{await root.requestFullscreen();nativeActive=true;}catch(_){/* Full-viewport fallback remains active. */}
  }
}
function initializeFullscreen(){
  $('focus-exit').addEventListener('click',toggleFullscreen);
  $('fullscreen').addEventListener('click',toggleFullscreen);
  document.addEventListener('fullscreenchange',()=>{
    if(document.fullscreenElement===root)nativeActive=true;
    else if(nativeActive){nativeActive=false;setFocusMode(false);}
  });
  window.addEventListener('keydown',e=>{
    if(e.code==='Escape'&&root.classList.contains('focus-mode')){
      if(document.fullscreenElement===root)document.exitFullscreen().catch(()=>{});
      setFocusMode(false);
    }
  });
}
export {setFocusMode,toggleFullscreen,initializeFullscreen};
