import { $, root } from '../core/dom.js?v=26.1.2';
import { state } from '../core/state.js?v=26.1.2';
import { resetTouchInput } from './mobile.js?v=26.1.2';


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
export const nativeFullscreenState={phase:'idle',error:''};
const nativeElement=()=>document.fullscreenElement||document.webkitFullscreenElement;
function syncNativeFullscreen(){const active=!!nativeElement();root.classList.toggle('native-fullscreen',active);root.dataset.fullscreenState=nativeFullscreenState.phase;return active;}
function requestMobileFullscreen(){
  if(nativeElement()){nativeFullscreenState.phase='active';syncNativeFullscreen();return Promise.resolve(true);}
  const target=document.documentElement,request=target?.requestFullscreen||target?.webkitRequestFullscreen;
  if(typeof request!=='function'){nativeFullscreenState.phase='unsupported';syncNativeFullscreen();return Promise.resolve(false);}
  const failed=error=>{nativeFullscreenState.phase='denied';nativeFullscreenState.error=String(error?.message||error||'Fullscreen refused');syncNativeFullscreen();return false;};
  nativeFullscreenState.phase='pending';nativeFullscreenState.error='';syncNativeFullscreen();
  // Parameterless request also supports browsers which reject FullscreenOptions.
  // Keep this synchronous with the trusted click; resource waits happen later.
  try{return Promise.resolve(request.call(target)).then(()=>{
    nativeActive=!!nativeElement();nativeFullscreenState.phase=nativeActive?'active':'idle';syncNativeFullscreen();
    if(nativeActive)try{globalThis.screen?.orientation?.lock?.('landscape')?.catch?.(()=>{});}catch{}return nativeActive;
  },failed);}catch(error){return Promise.resolve(failed(error));}
}
async function toggleFullscreen(){
  if(state.deviceMode==='mobile'){
    setFocusMode(true);
    if(nativeElement())await(document.exitFullscreen||document.webkitExitFullscreen)?.call(document);
    else await requestMobileFullscreen();
    syncNativeFullscreen();return;
  }
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
  const changed=()=>{const active=!!nativeElement();nativeFullscreenState.phase=active?'active':'idle';syncNativeFullscreen();
    if(active)nativeActive=true;
    else if(nativeActive){nativeActive=false;setFocusMode(state.deviceMode==='mobile'&&state.screen==='game');}
  };
  document.addEventListener('fullscreenchange',changed);document.addEventListener('webkitfullscreenchange',changed);
  window.addEventListener('keydown',e=>{
    if(e.code==='Escape'&&root.classList.contains('focus-mode')){
      if(document.fullscreenElement===root)document.exitFullscreen().catch(()=>{});
      setFocusMode(false);
    }
  });
}
export {setFocusMode,toggleFullscreen,initializeFullscreen,requestMobileFullscreen};
