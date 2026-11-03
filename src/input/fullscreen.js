import { $, root } from '../core/dom.js?v=26.1.1';
import { state } from '../core/state.js?v=26.1.1';
import { resetTouchInput } from './mobile.js?v=26.1.1';


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
function requestMobileFullscreen(){
  const target=document.documentElement;
  if(typeof target?.requestFullscreen!=='function')return Promise.resolve(false);
  // Stay in the initiating tap, before waiting for resource preparation.
  try{return Promise.resolve(target.requestFullscreen({navigationUI:'hide'})).then(()=>{
    nativeActive=true;try{globalThis.screen?.orientation?.lock?.('landscape')?.catch?.(()=>{});}catch{}return true;
  },()=>false);}catch{return Promise.resolve(false);}
}
async function toggleFullscreen(){
  if(root.classList.contains('focus-mode')){
    if(document.fullscreenElement)await document.exitFullscreen();
    setFocusMode(false);return;
  }
  setFocusMode(true);
  if(state.deviceMode==='mobile')await requestMobileFullscreen();
  else if(typeof root.requestFullscreen==='function'){
    try{await root.requestFullscreen();nativeActive=true;}catch(_){/* Full-viewport fallback remains active. */}
  }
}
function initializeFullscreen(){
  $('focus-exit').addEventListener('click',toggleFullscreen);
  $('fullscreen').addEventListener('click',toggleFullscreen);
  document.addEventListener('fullscreenchange',()=>{
    if(document.fullscreenElement===root||document.fullscreenElement&&document.fullscreenElement===document.documentElement)nativeActive=true;
    else if(nativeActive){nativeActive=false;setFocusMode(false);}
  });
  window.addEventListener('keydown',e=>{
    if(e.code==='Escape'&&root.classList.contains('focus-mode')){
      if(document.fullscreenElement===root)document.exitFullscreen().catch(()=>{});
      setFocusMode(false);
    }
  });
}
export {setFocusMode,toggleFullscreen,initializeFullscreen,requestMobileFullscreen};
