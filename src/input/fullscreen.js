import { $, root } from '../core/dom.js?v=19.1.1';
import { state } from '../core/state.js?v=19.1.1';
import { resetTouchInput } from './mobile.js?v=19.1.1';


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


function initializeFullscreen(){
  $('focus-exit').addEventListener('click',()=>setFocusMode(false));
  $('fullscreen').addEventListener('click',async()=>{
      if(root.classList.contains('focus-mode')){
        setFocusMode(false);
        return
      }
      if(document.fullscreenElement){
        await document.exitFullscreen();
        return
      }
      // Mobile Safari on iPhone doesn't support element.requestFullscreen(); use a full-viewport arena.
      if(state.deviceMode==='mobile'||typeof root.requestFullscreen!=='function'){
        setFocusMode(true);
        return
      }
      try{
        await root.requestFullscreen()
      }catch(_){
        setFocusMode(true)
      }
  });
  document.addEventListener('fullscreenchange',()=>{
      if(document.fullscreenElement)$('fullscreen').textContent='⤢ Згорнути';
      else
      if(!root.classList.contains('focus-mode'))$('fullscreen').textContent='⛶ Екран';
  });
  window.addEventListener('keydown',e=>{
      if(e.code==='Escape'&&root.classList.contains('focus-mode'))setFocusMode(false)
  });
}


export { setFocusMode, initializeFullscreen };
