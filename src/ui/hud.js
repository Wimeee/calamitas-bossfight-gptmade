import { movementConfig } from '../../config/movement.js?v=31.1.2';
import { weapons } from '../classes/registry.js?v=31.1.2';
import { milestones } from '../core/config.js?v=31.1.2';
import { $, root } from '../core/dom.js?v=31.1.2';
import { state } from '../core/state.js?v=31.1.2';
import {translate} from '../core/localization.js?v=31.1.2';

// Compare the displayed locale, not the source string: replacing textContent
// recreates text nodes and wakes the localization observer even when unchanged.
function setText(element,value){const next=translate(value);if(element.textContent!==next)element.textContent=next;}
function setValue(element,key,value){if(element[key]!==value)element[key]=value;}

function syncFlightHUD(g=state.game){
  if(!g)return;
  const label='✦ Крила '+(g.player.flightRemaining??movementConfig.flightTime).toFixed(1)+' с';
  setText($('wingstatus'),label);
}

const ui=()=>{
  if(!state.game)return;
  let g=state.game,p=g.player;
  setValue($('practice-toolbar'),'hidden',!g.practice);
  if(g.practice)setText($('practice-label'),'Тренування · '+g.practice.label+' · Влучань: '+p.hits);
  let bar=$('hpbar');
  setValue(bar.style,'width',(p.hp/p.maxHp*100)+'%');
  setText($('hptxt'),`${Math.ceil(p.hp)} / ${p.maxHp}`);
  setValue($('manabar').style,'width',(p.mana/p.maxMana*100)+'%');
  setText($('manatxt'),`${Math.floor(p.mana)} / ${p.maxMana}`);
  setText($('potion'),p.potions?`🧪 HP ×${p.potions} ${p.potionCd>0?'('+Math.ceil(p.potionCd)+' с)':''}`:'🧪 HP порожньо');
  setText($('regenstatus'),`♻ +${p.regenRate.toFixed(1)} HP/с`);
  setText($('regenpotionstatus'),p.regenPotionT>0?`🌿 Регенерація ${Math.ceil(p.regenPotionT)} с`:`🌿 Зілля ×${p.regenPotions} · B`);
  setText($('phase'),g.label);
  setText($('timer'),String(Math.floor(g.totalTime/60)).padStart(2,'0')+':'+String(Math.floor(g.totalTime%60)).padStart(2,'0'));
  setText($('bosshp'),(g.boss.hp/g.boss.max*100).toFixed(1)+'%');
  setText($('hits'),p.hits);
  setText($('dashes'),p.dashes);
  setText($('statehint'),g.hint);
  syncFlightHUD(g);
  for(const kind of ['rage','adrenaline']){
    const button=root.querySelector('[data-mobile-action="'+kind+'"]'),r=g.rippers;
    if(button){setValue(button,'hidden',!r?.enabled);setValue(button,'disabled',!r?.enabled||r[kind]<1||r[kind+'Time']>0||g.mode!=='playing'||!!g.ritual||g.stage==='accept');setText(button,(kind==='rage'?'RAGE':'ADREN')+' '+(r?.[kind+'Time']>0?Math.ceil(r[kind+'Time'])+'с':Math.floor((r?.[kind]||0)*100)+'%'));}
  }
  setText($('weaponname'),weapons[p.weapon].name);
  setText($('weapondesc'),weapons[p.weapon].desc);
  const dashButton=root.querySelector('[data-mobile-action="dash"]'),healButton=root.querySelector('[data-mobile-action="heal"]'),regenButton=root.querySelector('[data-mobile-action="regen"]'),targetButton=root.querySelector('[data-mobile-action="target"]');
  if(dashButton)setText(dashButton,p.dashCd>0?'💨 '+p.dashCd.toFixed(1)+'с':'💨 РИВОК');
  if(healButton)setText(healButton,p.potionCd>0?'❤️ '+Math.ceil(p.potionCd)+'с':'❤️ ×'+p.potions);
  if(regenButton)setText(regenButton,p.regenPotionT>0?'🌿 '+Math.ceil(p.regenPotionT)+'с':'🌿 ×'+p.regenPotions);
  if(targetButton){
    setValue(targetButton,'hidden',p.weapon===2);
    setText(targetButton,p.weapon===0?(p.arkCharges?'✦ BIG RIP':'✂ PARRY'):p.weapon===1?'✦ ЗАРЯД':p.weapon===2?'✧ VOID VORTEX':p.weapon===3?'🎯 МІТКА':(p.kit?.rogue?.chargeMode?'✦ STEALTH':'✦ AUTO'));
  }
  root.querySelectorAll('[data-weapon]').forEach(e=>{
      e.classList.toggle('on',Number(e.dataset.weapon)===p.weapon);
      setValue(e,'disabled',['playing','paused'].includes(g.mode));
      setValue(e,'title',translate(e.disabled?'Клас зафіксовано до кінця бою':'Обрати початковий клас'));
  });
  (()=>{
      const labels=milestones.map(m=>`<span class="chip ${g.done.has(m.id)?'done':g.marker===m.id?'active':''}">${translate(m.label)}</span>`).join('');
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
