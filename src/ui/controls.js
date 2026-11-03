import { initializeRitual } from '../game/ritual.js?v=26.0.2';
import { weapons } from '../classes/registry.js?v=26.0.2';
import { audio } from '../core/audio.js?v=26.0.2';
import { $, root } from '../core/dom.js?v=26.0.2';
import { state } from '../core/state.js?v=26.0.2';
import { changeWeapon, start, togglePause } from '../game/session.js?v=26.0.2';


function initializeControls(){
  initializeRitual();
  $('soundtoggle').addEventListener('click',()=>{
      audio.init();
      audio.setSound(!audio.sfx);
      if(audio.sfx)audio.fx('menu')
  });
  $('musictoggle').addEventListener('click',()=>{
      audio.init();
      audio.setMusic(!audio.music);
      if(audio.music)audio.fx('menu')
  });
  $('volume').addEventListener('input',e=>{
      audio.init();
      audio.vol(Number(e.target.value)/100)
  });
  if(!audio.supported){
    $('soundtoggle').disabled=true;
    $('musictoggle').disabled=true;
    $('volume').disabled=true;
    $('soundtoggle').textContent='🔇 Браузер без Web Audio'
  }
  $('start').addEventListener('click',()=>start({ritual:true}));
  $('overlaybtn').addEventListener('click',()=>{
      if(state.game&&state.game.mode==='paused')togglePause();else
      start({ritual:true})
  });
  $('pause').addEventListener('click',togglePause);
  $('weapons').innerHTML=weapons.map((w,i)=>`<button type="button" class="wp" data-weapon="${i}">${w.label}</button>`).join('');
  root.querySelectorAll('[data-weapon]').forEach(b=>b.addEventListener('click',()=>changeWeapon(+b.dataset.weapon)));
}


export { initializeControls };
