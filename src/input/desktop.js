import { resolveGameKey } from '../core/settings.js?v=18.0.0';
import { releaseArk } from '../classes/melee.js?v=18.0.0';
import { classAbility } from '../classes/shared.js?v=18.0.0';
import { shoot } from '../combat/attacks.js?v=18.0.0';
import { dash, drinkRegeneration, heal } from '../combat/player.js?v=18.0.0';
import { arena } from '../core/arena.js?v=18.0.0';
import { H, VIEW_X, VIEW_Y, W } from '../core/config.js?v=18.0.0';
import { canvas, root } from '../core/dom.js?v=18.0.0';
import { clamp } from '../core/math.js?v=18.0.0';
import { state } from '../core/state.js?v=18.0.0';
import { changeWeapon, start, togglePause } from '../game/session.js?v=18.0.0';
import { resetTouchInput } from './mobile.js?v=18.0.0';


function eventPos(e){
  let rect=canvas.getBoundingClientRect();
  state.pointer.x=clamp((e.clientX-rect.left)/rect.width*W-VIEW_X,arena.l,arena.r);
  state.pointer.y=clamp((e.clientY-rect.top)/rect.height*H-VIEW_Y,arena.t,arena.b)
}

const mouseRelease=e=>{
  if(e.button!==2)return;
  state.pointer.fire=false;
  releaseArk();
};

const codes={
  KeyW:'w',
  KeyA:'a',
  KeyS:'s',
  KeyD:'d',
  ArrowUp:'ArrowUp',
  ArrowDown:'ArrowDown',
  ArrowLeft:'ArrowLeft',
  ArrowRight:'ArrowRight',
  Space:' ',
  KeyH:'h',
  KeyB:'b',
  KeyJ:'j',
  KeyP:'p',
  KeyR:'r',
  Digit1:'1',
  Digit2:'2',
  Digit3:'3',
  Digit4:'4',
  Digit5:'5'
};


function gameKey(e){
  return resolveGameKey(e.code,codes)
}

const kd=e=>{
  if(state.screen!=='game')return;
  let tag=(e.target&&e.target.tagName)||'';
  if(['INPUT','TEXTAREA','SELECT'].includes(tag))return;
  let k=gameKey(e);
  if(!k||e.ctrlKey||e.metaKey||e.altKey)return;
  if(root.isConnected&&state.game)e.preventDefault();else
  return;
  state.keys[k]=true;
  if(e.repeat)return;
  if(k==='j')shoot();
  if(k===' ')dash();
  if(k==='h')heal();
  if(k==='b')drinkRegeneration();
  if(k==='p')togglePause();
  if(k==='r')start();
  if('12345'.includes(k))changeWeapon(Number(k)-1)
};


function initializeDesktop(){
  canvas.addEventListener('pointermove',e=>{
      if(state.deviceMode==='mobile')return;
      eventPos(e);
      state.pointer.inside=true
  });
  canvas.addEventListener('pointerdown',e=>{
      if(state.deviceMode==='mobile'||e.button!==0&&e.button!==2)return;
      e.preventDefault();
      eventPos(e);
      state.pointer.inside=true;
      if(e.button===0){
        classAbility();
        return;
      }
      state.pointer.fire=true;
      if(state.game?.mode==='playing')shoot();
      try{
        canvas.setPointerCapture(e.pointerId)
      }catch(_){
      }
  });
  canvas.addEventListener('pointerup',mouseRelease);
  window.addEventListener('pointerup',mouseRelease);
  canvas.addEventListener('pointercancel',()=>{
      state.pointer.fire=false;
      if(state.game?.player.arkThrow)state.game.player.arkThrow.returning=true;
  });
  canvas.addEventListener('lostpointercapture',()=>{
      state.pointer.fire=false;
  });
  canvas.addEventListener('contextmenu',e=>e.preventDefault());
  window.addEventListener('keydown',kd);
  window.addEventListener('keyup',e=>{
      let k=gameKey(e);
      if(k)state.keys[k]=false;
      if(k==='j')releaseArk()
  });
  window.addEventListener('blur',()=>{
      state.keys={};
      state.pointer.fire=false;
      resetTouchInput();
      if(state.game&&state.game.mode==='playing')togglePause()
  });
}


export { eventPos, mouseRelease, codes, gameKey, kd, initializeDesktop };
