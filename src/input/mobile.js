import { updateSettings,controlHint } from '../core/settings.js?v=21.1.0';
import { queueJump } from '../game/movement.js?v=21.1.0';
import { releaseArk } from '../classes/melee.js?v=21.1.0';
import { classAbility } from '../classes/shared.js?v=21.1.0';
import { markCosmicTarget } from '../classes/summoner.js?v=21.1.0';
import { shoot } from '../combat/attacks.js?v=21.1.0';
import { dash, drinkRegeneration, heal } from '../combat/player.js?v=21.1.0';
import { possibleTargets } from '../combat/targets.js?v=21.1.0';
import { arena } from '../core/arena.js?v=21.1.0';
import { H, VIEW_X, VIEW_Y, W } from '../core/config.js?v=21.1.0';
import { $, canvas, root } from '../core/dom.js?v=21.1.0';
import { clamp, norm } from '../core/math.js?v=21.1.0';
import { state } from '../core/state.js?v=21.1.0';
import { togglePause } from '../game/session.js?v=21.1.0';

let mobileAimTouch=null;

const aimCanvas=e=>{
  const r=canvas.getBoundingClientRect();
  const originalRatio=W/H, displayRatio=r.width/r.height;
  let ox=0,oy=0,sw=r.width,sh=r.height;
  if(root.classList.contains('focus-mode')){
    if(displayRatio>originalRatio){
      sw=r.height*originalRatio;
      ox=(r.width-sw)/2;
    }else
    {
      sh=r.width/originalRatio;
      oy=(r.height-sh)/2;
    }
  }
  state.pointer.x=clamp((e.clientX-r.left-ox)/sw*W-VIEW_X,arena.l,arena.r);
  state.pointer.y=clamp((e.clientY-r.top-oy)/sh*H-VIEW_Y,arena.t,arena.b);
};

const endAim=e=>{
  if(e.pointerId===mobileAimTouch)mobileAimTouch=null
};

const sticks=[];


function resetTouchInput(){
  state.moveAxis={x:0,y:0};
  state.aimAxis={x:0,y:0};
  state.aimHeld=false;
  state.mobileFire=false;
  state.mobileJump=false;state.mobileFlight=false;
  if(state.game?.player){state.game.player.dashTapDirection=0;state.game.player.dashTapAt=-Infinity;}
  state.pointer.fire=false;
  for(const obj of sticks){
    obj.id=null;
    obj.touchId=null;
    obj.el.classList.remove('active');
    obj.knob.style.transform='translate(0,0)'
  }
  root.querySelectorAll('[data-mobile-action]').forEach(b=>b.classList.remove('held'))
}


function stickSetup(id,axisName){
  const el=$(id),knob=el.querySelector('.knob'),o={el,knob,id:null,touchId:null};
  sticks.push(o);
  const input=(x0,y0)=>{
    const r=el.getBoundingClientRect(),size=Math.min(r.width,r.height),radius=size*.32;
    let x=(x0-(r.left+r.width/2))/radius,y=(y0-(r.top+r.height/2))/radius;
    const l=Math.hypot(x,y);
    if(l>1){
      x/=l;
      y/=l
    }
    if(l<.14){
      x=0;
      y=0
    }
    knob.style.transform=`translate(${x*radius}px,${y*radius}px)`;
    if(axisName==='move')state.moveAxis={x,y};else
    {
      state.aimAxis={x,y};
      state.aimHeld=Math.hypot(x,y)>.14
    }
  };
  const clear=()=>{
    o.id=null;
    o.touchId=null;
    el.classList.remove('active');
    knob.style.transform='translate(0,0)';
    if(axisName==='move')state.moveAxis={x:0,y:0};else
    {
      state.aimAxis={x:0,y:0};
      state.aimHeld=false;
      releaseArk();
    }
  };
  el.addEventListener('pointerdown',e=>{
      if(state.deviceMode!=='mobile'||o.id!==null)return;
      e.preventDefault();
      o.id=e.pointerId;
      el.classList.add('active');
      try{
        el.setPointerCapture(e.pointerId)
      }catch(_){
      }
      input(e.clientX,e.clientY)
  });
  el.addEventListener('pointermove',e=>{
      if(e.pointerId!==o.id)return;
      e.preventDefault();
      input(e.clientX,e.clientY)
  });
  const end=e=>{
    if(e.pointerId!==o.id)return;
    e.preventDefault();
    clear()
  };
  el.addEventListener('pointerup',end);
  el.addEventListener('pointercancel',end);
  // iPhone / embedded WebKit fallback: touch events keep both joysticks independent.
  el.addEventListener('touchstart',e=>{
      if(state.deviceMode!=='mobile')return;
      e.preventDefault();
      if(o.id!==null)return;
      const t=e.changedTouches[0];
      if(!t)return;
      o.touchId=t.identifier;
      el.classList.add('active');
      input(t.clientX,t.clientY)
    },{passive:false});
  el.addEventListener('touchmove',e=>{
      if(o.id!==null||o.touchId===null)return;
      const t=Array.from(e.changedTouches).find(t=>t.identifier===o.touchId);
      if(!t)return;
      e.preventDefault();
      input(t.clientX,t.clientY)
    },{passive:false});
  const touchEnd=e=>{
    if(o.id!==null||o.touchId===null)return;
    const t=Array.from(e.changedTouches).find(t=>t.identifier===o.touchId);
    if(!t)return;
    e.preventDefault();
    clear()
  };
  el.addEventListener('touchend',touchEnd,{passive:false});
  el.addEventListener('touchcancel',touchEnd,{passive:false});
}

const touchButtons=root.querySelectorAll('[data-mobile-action]');


function updateMobileLabels(){
  const fire=root.querySelector('[data-mobile-action="fire"]'),auto=root.querySelector('[data-mobile-action="auto"]');
  if(fire)fire.textContent=state.game&&state.game.player.weapon===3?'🪢 ХЛИСТ':'⚔ АТАКА';
  if(auto){
    auto.textContent=state.mobileAutoAim?'🤖 АВТО ON':'🎯 РУЧНЕ';
    auto.setAttribute('aria-pressed',String(state.mobileAutoAim));
  }
}

const feedback=label=>{
  const el=$('touch-status');
  el.textContent='✅ Натиснуто: '+label+' · Стік — біг / спуск; стрибок і крила — окремими кнопками';
};

const takeAction=action=>{
  if(action==='pause')togglePause();
  else
  if(action==='fullscreen')$('fullscreen').click();
  else
  if(action==='menu')$('device').scrollIntoView({block:'start',behavior:'smooth'});
  else
  if(action==='jump'){state.mobileJump=true;queueJump();}else
  if(action==='flight'){state.mobileFlight=true;queueJump();}else
  if(action==='dash')dash();else
  if(action==='heal')heal();else
  if(action==='regen')drinkRegeneration();
  else
  if(action==='auto'){
    state.mobileAutoAim=!state.mobileAutoAim;updateSettings({autoAim:state.mobileAutoAim});
    updateMobileLabels();
    releaseArk();
  }
  else
  if(action==='target'&&state.game?.player.weapon!==3)classAbility();
  else
  if(action==='target'&&state.game){
    if(!state.game.player.cosmic||!state.game.player.cosmic.length)return;
    const targets=possibleTargets();
    if(!targets.length)return;
    const p=state.game.player;
    const dir=norm(state.pointer.x-p.x,state.pointer.y-p.y);
    const chosen=targets.slice().sort((a,b)=>Math.hypot(a.x-(p.x+dir.x*220),a.y-(p.y+dir.y*220))-Math.hypot(b.x-(p.x+dir.x*220),b.y-(p.y+dir.y*220)))[0];
    markCosmicTarget(chosen.x,chosen.y)
  }
};


function setDeviceMode(mode){
  state.deviceMode=mode==='mobile'?'mobile':'desktop';
  root.classList.toggle('mobile',state.deviceMode==='mobile');
  $('device').value=state.deviceMode;
  resetTouchInput();
  $('overlaydesc').textContent=state.deviceMode==='mobile'?'📱 Стік — біг / спуск. Окремі кнопки стрибка, крил і ривка. Автоприціл і стрільба увімкнені. Торкайся арени для ручного прицілу. Самонер: 4 міньйони та хлист. Краще грати горизонтально.':'💻 '+controlHint();
  try{
    localStorage.setItem('calamitas_device_mode',state.deviceMode)
  }catch(_){
  }
}


function initializeMobile(){
  canvas.addEventListener('pointerdown',e=>{
      if(state.deviceMode!=='mobile')return;
      mobileAimTouch=e.pointerId;
      state.mobileAutoAim=false;
      updateMobileLabels();
      aimCanvas(e);
      try{
        canvas.setPointerCapture(e.pointerId)
      }catch(_){
      }
      ;
      if(state.game?.player.weapon===3&&state.game.mode==='playing')markCosmicTarget(state.pointer.x,state.pointer.y)
  });
  canvas.addEventListener('pointermove',e=>{
      if(state.deviceMode==='mobile'&&e.pointerId===mobileAimTouch)aimCanvas(e)
  });
  canvas.addEventListener('pointerup',endAim);
  canvas.addEventListener('pointercancel',endAim);
  stickSetup('move-stick','move');
  stickSetup('aim-stick','aim');
  touchButtons.forEach(b=>{
      let activeId=null,activeTouch=null,lastTrigger=-10000,handledPress=false;
      const action=b.dataset.mobileAction;
      const begin=(source,id)=>{
        if(state.deviceMode!=='mobile')return;
        const now=performance.now();
        // Safari may dispatch PointerEvent + TouchEvent + click for one tap.
        if(now-lastTrigger<110)return;
        lastTrigger=now;
        handledPress=true;
        b.classList.add('held');
        feedback(b.textContent.trim());
        if(action==='fire'){
          state.mobileFire=true;
          // Immediate first shot, not only on the following animation frame.
          if(state.game&&state.game.mode==='playing')shoot();
        }else
        takeAction(action);
      };
      const release=()=>{
        b.classList.remove('held');
        if(action==='jump')state.mobileJump=false;
        if(action==='flight')state.mobileFlight=false;
        if(action==='fire'){
          state.mobileFire=false;
          releaseArk();
        }
      };
      b.addEventListener('pointerdown',e=>{
          if(state.deviceMode!=='mobile')return;
          e.preventDefault();
          activeId=e.pointerId;
          begin('pointer',e.pointerId);
          try{
            b.setPointerCapture(e.pointerId)
          }catch(_){
          }
      });
      b.addEventListener('pointerup',e=>{
          if(activeId!==e.pointerId)return;
          activeId=null;
          release()
      });
      b.addEventListener('pointercancel',e=>{
          if(activeId!==e.pointerId)return;
          activeId=null;
          release()
      });
      b.addEventListener('touchstart',e=>{
          if(state.deviceMode!=='mobile')return;
          e.preventDefault();
          const t=e.changedTouches[0];
          if(!t)return;
          activeTouch=t.identifier;
          begin('touch',t.identifier)
        },{passive:false});
      const touchEnd=e=>{
        if(activeTouch===null)return;
        if(!Array.from(e.changedTouches).some(t=>t.identifier===activeTouch))return;
        e.preventDefault();
        activeTouch=null;
        release()
      };
      b.addEventListener('touchend',touchEnd,{passive:false});
      b.addEventListener('touchcancel',touchEnd,{passive:false});
      // CLICK fallback for webviews that do not deliver PointerEvents or TouchEvents.
      b.addEventListener('click',e=>{
          if(state.deviceMode!=='mobile')return;
          e.preventDefault();
          const now=performance.now();
          if(now-lastTrigger<110)return;
          begin('click',null);
          if(['fire','jump','flight'].includes(action))requestAnimationFrame(release);else
          release()
      });
  });
  $('device').addEventListener('change',e=>setDeviceMode(e.target.value));
}


export { mobileAimTouch, aimCanvas, endAim, sticks, resetTouchInput, stickSetup, touchButtons, updateMobileLabels, feedback, takeAction, setDeviceMode, initializeMobile };
