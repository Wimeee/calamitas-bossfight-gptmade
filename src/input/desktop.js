import { activateRipper } from '../systems/rippers.js?v=29.0.0';
import { cameraView } from '../world/camera.js?v=29.0.0';
import { beginRitual, skipRitual } from '../game/ritual.js?v=29.0.0';
import { queueJump } from '../game/movement.js?v=29.0.0';
import { directionTap } from './dash-gesture.js?v=29.0.0';
import { resolveGameKey } from '../core/settings.js?v=29.0.0';
import { releaseArk } from '../classes/melee.js?v=29.0.0';
import { classAbility } from '../classes/shared.js?v=29.0.0';
import { shoot } from '../combat/attacks.js?v=29.0.0';
import { dash, drinkRegeneration, heal } from '../combat/player.js?v=29.0.0';
import { arena, canvasPointToWorld } from '../core/arena.js?v=29.0.0';
import { H, VIEW_X, VIEW_Y, W } from '../core/config.js?v=29.0.0';
import { canvas, root } from '../core/dom.js?v=29.0.0';
import { clamp } from '../core/math.js?v=29.0.0';
import { state } from '../core/state.js?v=29.0.0';
import { changeWeapon, start, togglePause } from '../game/session.js?v=29.0.0';
import { resetTouchInput } from './mobile.js?v=29.0.0';


function eventPos(e){
  const point=canvasPointToWorld(e.clientX,e.clientY,canvas.getBoundingClientRect(),root.classList.contains('focus-mode'));
  const view=cameraView();state.pointer.viewX=point.x-view.x;state.pointer.viewY=point.y-view.y;state.pointer.u=state.pointer.viewX/view.w;state.pointer.v=state.pointer.viewY/view.h;
  state.pointer.x=clamp(point.x,arena.l,arena.r);state.pointer.y=clamp(point.y,arena.t,arena.b);
}

const mouseRelease=e=>{
  if(e.button===2){state.pointer.altFire=false;return;}
  if(e.button!==0)return;
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
  Space:'jump',
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
  if(state.game?.ritual&&!e.ctrlKey&&!e.metaKey&&!e.altKey&&(['KeyE','Enter'].includes(e.code)||state.game.ritual.phase==='summoning'&&e.code==='Space')){
    e.preventDefault();
    if(!e.repeat){if(state.game.ritual.phase==='preparation'&&e.code!=='Space')beginRitual();else skipRitual();}
    return;
  }
  let k=gameKey(e);
  if(!k||e.ctrlKey||e.metaKey||e.altKey)return;
  if(root.isConnected&&state.game)e.preventDefault();else
  return;
  const wasHeld=state.keys[k];state.keys[k]=true;
  if(e.repeat||wasHeld)return;
  directionTap(k);
  if(k==='jump'||k==='w'||k==='ArrowUp')queueJump();
  if(k==='rage'||k==='adrenaline')activateRipper(k);
  if(k==='j')shoot();
  if(k===' ')dash();
  if(k==='h')heal();
  if(k==='b')drinkRegeneration();
  if(k==='p')togglePause();
  if(k==='r')start({ritual:true});
  if('12345'.includes(k))changeWeapon(Number(k)-1)
};


function initializeDesktop(){
  canvas.addEventListener('pointermove',e=>{
      if(state.deviceMode==='mobile')return;
      eventPos(e);
      state.pointer.inside=true
  });
  canvas.addEventListener('pointerdown',e=>{
      if(state.deviceMode==='mobile'||state.screen!=='game')return;
      const mouseCode=({1:'MouseMiddle',3:'MouseBack',4:'MouseForward'})[e.button];
      if(mouseCode){if(gameKey({code:mouseCode})===' '){e.preventDefault();dash();}return;}
      if(e.button!==0&&e.button!==2)return;
      e.preventDefault();
      eventPos(e);
      state.pointer.inside=true;
      if(e.button===2){
        if(state.game?.player.weapon===1)state.pointer.altFire=true;
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
      state.pointer.fire=false;state.pointer.altFire=false;
      if(state.game?.player.arkThrow)state.game.player.arkThrow.returning=true;
  });
  canvas.addEventListener('lostpointercapture',()=>{
      state.pointer.fire=false;state.pointer.altFire=false;
  });
  canvas.addEventListener('contextmenu',e=>e.preventDefault());
  canvas.addEventListener('auxclick',e=>{
    const code=({1:'MouseMiddle',3:'MouseBack',4:'MouseForward'})[e.button];
    if(code&&gameKey({code})===' ')e.preventDefault();
  });
  window.addEventListener('keydown',kd);
  window.addEventListener('keyup',e=>{
      let k=gameKey(e);
      if(k)state.keys[k]=false;
      if(k==='j')releaseArk()
  });
  window.addEventListener('blur',()=>{
      state.keys={};
      state.pointer.fire=false;state.pointer.altFire=false;
      resetTouchInput();
      if(state.game&&state.game.mode==='playing')togglePause()
  });
}


export { eventPos, mouseRelease, codes, gameKey, kd, initializeDesktop };
