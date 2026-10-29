import { weapons } from '../classes/registry.js?v=18.0.0';
import { audio } from '../core/audio.js?v=18.0.0';
import { $, root } from '../core/dom.js?v=18.0.0';
import { state } from '../core/state.js?v=18.0.0';
import { changeWeapon, start, togglePause } from '../game/session.js?v=18.0.0';


function initializeControls(){
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
  $('start').addEventListener('click',start);
  $('overlaybtn').addEventListener('click',()=>{
      if(state.game&&state.game.mode==='paused')togglePause();else
      start()
  });
  $('pause').addEventListener('click',togglePause);
  $('weapons').innerHTML=weapons.map((w,i)=>`<button type="button" class="wp" data-weapon="${i}">${w.label}</button>`).join('');
  root.querySelectorAll('[data-weapon]').forEach(b=>b.addEventListener('click',()=>changeWeapon(+b.dataset.weapon)));
}


export { initializeControls };
