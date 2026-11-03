import { movementConfig } from '../../config/movement.js?v=25.0.0';
import { weapons } from '../classes/registry.js?v=25.0.0';
import { milestones } from '../core/config.js?v=25.0.0';
import { $, root } from '../core/dom.js?v=25.0.0';
import { state } from '../core/state.js?v=25.0.0';

function syncFlightHUD(g=state.game){
  if(!g)return;
  const label='✦ Крила '+(g.player.flightRemaining??movementConfig.flightTime).toFixed(1)+' с';
  if($('wingstatus').textContent!==label)$('wingstatus').textContent=label;
}

const ui=()=>{
  if(!state.game)return;
  let g=state.game,p=g.player;
  let bar=$('hpbar');
  bar.style.width=(p.hp/p.maxHp*100)+'%';
  $('hptxt').textContent=`${Math.ceil(p.hp)} / ${p.maxHp}`;
  $('manabar').style.width=(p.mana/p.maxMana*100)+'%';
  $('manatxt').textContent=`${Math.floor(p.mana)} / ${p.maxMana}`;
  $('potion').textContent=p.potions?`🧪 HP ×${p.potions} ${p.potionCd>0?'('+Math.ceil(p.potionCd)+' с)':''}`:'🧪 HP порожньо';
  $('regenstatus').textContent=`♻ +${p.regenRate.toFixed(1)} HP/с`;
  $('regenpotionstatus').textContent=p.regenPotionT>0?`🌿 Регенерація ${Math.ceil(p.regenPotionT)} с`:`🌿 Зілля ×${p.regenPotions} · B`;
  $('phase').textContent=g.label;
  $('timer').textContent=String(Math.floor(g.totalTime/60)).padStart(2,'0')+':'+String(Math.floor(g.totalTime%60)).padStart(2,'0');
  $('bosshp').textContent=(g.boss.hp/g.boss.max*100).toFixed(1)+'%';
  $('hits').textContent=p.hits;
  $('dashes').textContent=p.dashes;
  $('statehint').textContent=g.hint;
  syncFlightHUD(g);
  for(const kind of ['rage','adrenaline']){
    const button=root.querySelector('[data-mobile-action="'+kind+'"]'),r=g.rippers;
    if(button){button.hidden=!r?.enabled;button.disabled=!r?.enabled||r[kind]<1||r[kind+'Time']>0||g.mode!=='playing'||!!g.ritual||g.stage==='accept';button.textContent=(kind==='rage'?'RAGE':'ADREN')+' '+(r?.[kind+'Time']>0?Math.ceil(r[kind+'Time'])+'с':Math.floor((r?.[kind]||0)*100)+'%');}
  }
  $('weaponname').textContent=weapons[p.weapon].name;
  $('weapondesc').textContent=weapons[p.weapon].desc;
  const dashButton=root.querySelector('[data-mobile-action="dash"]'),healButton=root.querySelector('[data-mobile-action="heal"]'),regenButton=root.querySelector('[data-mobile-action="regen"]'),targetButton=root.querySelector('[data-mobile-action="target"]');
  if(dashButton)dashButton.textContent=p.dashCd>0?'💨 '+p.dashCd.toFixed(1)+'с':'💨 РИВОК';
  if(healButton)healButton.textContent=p.potionCd>0?'❤️ '+Math.ceil(p.potionCd)+'с':'❤️ ×'+p.potions;
  if(regenButton)regenButton.textContent=p.regenPotionT>0?'🌿 '+Math.ceil(p.regenPotionT)+'с':'🌿 ×'+p.regenPotions;
  if(targetButton){
    targetButton.hidden=false;
    targetButton.textContent=p.weapon===0?(p.arkCharges?'✦ BIG RIP':'✂ PARRY'):p.weapon===1?'⚡ EXO SHOT':p.weapon===2?'✧ NOVA':p.weapon===3?'🎯 ЗАЛП':'↩ КЛИНКИ';
  }
  root.querySelectorAll('[data-weapon]').forEach(e=>{
      e.classList.toggle('on',Number(e.dataset.weapon)===p.weapon);
      e.disabled=['playing','paused'].includes(g.mode);
      e.title=e.disabled?'Клас зафіксовано до кінця бою':'Обрати початковий клас';
  });
  (()=>{
      const labels=milestones.map(m=>`<span class="chip ${g.done.has(m.id)?'done':g.marker===m.id?'active':''}">${m.label}</span>`).join('');
      if($('markers').innerHTML!==labels)$('markers').innerHTML=labels;
  })()
};


function showOverlay(tag,title,desc,button){
  $('overlaytag').textContent=tag;
  $('overlaytitle').textContent=title;
  $('overlaydesc').textContent=desc;
  $('overlaybtn').textContent=button;
  $('overlay').hidden=false
}


export { ui, showOverlay, syncFlightHUD };
