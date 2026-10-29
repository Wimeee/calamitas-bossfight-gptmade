import { weapons } from '../classes/registry.js?v=21.1.0';
import { audio } from '../core/audio.js?v=21.1.0';
import { VERSION } from '../core/config.js?v=21.1.0';
import { $, root } from '../core/dom.js?v=21.1.0';
import { state } from '../core/state.js?v=21.1.0';
import { settings,updateSettings,resetSettings,subscribeSettings,keyLabel,controlHint,bindKey } from '../core/settings.js?v=21.1.0';
import { start,togglePause } from '../game/session.js?v=21.1.0';
import { loop } from '../game/loop.js?v=21.1.0';
import { setFocusMode } from '../input/fullscreen.js?v=21.1.0';
import { resetTouchInput,setDeviceMode } from '../input/mobile.js?v=21.1.0';
import { createMenuBackground } from '../render/menu-background.js?v=21.1.0';
import { pixelArt } from '../render/sprites.js?v=21.1.0';

const byId=id=>document.getElementById(id);
const model={panel:'home',selectedClass:'melee',difficulty:'revenge',listening:null,background:null};
const bindingLabels={dash:'Ривок · клавіша / миша',heal:'Лікування',regen:'Регенерація',pause:'Пауза',restart:'Новий бій',attack:'Атака з клавіатури'};
const classNames={melee:'Melee',ranger:'Ranger',mage:'Mage',summon:'Summoner',rogue:'Rogue'};
const classSymbols={melee:'⚔',ranger:'⌖',mage:'✧',summon:'☄',rogue:'✦'};

function renderSelection(){
  const weapon=weapons.find(w=>w.id===model.selectedClass)||weapons[0];
  byId('menu-class-description').textContent=weapon.name+' — '+weapon.desc;
  byId('title-menu').querySelectorAll('[data-menu-class]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.menuClass===model.selectedClass)));
  byId('title-menu').querySelectorAll('[data-difficulty]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.difficulty===model.difficulty)));
}
function selectClass(id){if(!weapons.some(w=>w.id===id))return false;model.selectedClass=id;renderSelection();return true;}
function selectDifficulty(id){if(!['normal','revenge','death'].includes(id))return false;model.difficulty=id;renderSelection();return true;}
function showPanel(name){
  if(!['home','bosses','setup','settings','credits'].includes(name))return;
  model.panel=name;model.listening=null;
  byId('title-menu').querySelectorAll('[data-menu-panel]').forEach(panel=>panel.hidden=panel.dataset.menuPanel!==name);
  byId('menu-resume').hidden=!(state.game?.mode==='paused');
  byId('title-menu').scrollTop=0;
  byId('keybinding-status').textContent='';
  renderSelection();
  if(name==='settings')syncSettings();
}
function showMenu(panel='home'){
  if(state.game?.mode==='playing')togglePause();
  state.keys={};resetTouchInput();setFocusMode(false);
  if(document.fullscreenElement&&document.fullscreenElement!==byId('title-menu'))document.exitFullscreen?.().catch(()=>{});
  state.screen='menu';root.hidden=true;byId('title-menu').hidden=false;
  document.body.classList.add('menu-open');model.background?.start();showPanel(panel);
}
function revealGame(){
  model.background?.stop();byId('title-menu').hidden=true;root.hidden=false;
  document.body.classList.remove('menu-open');state.screen='game';
}
function effectiveDevice(){return settings.device==='auto'?((window.matchMedia('(pointer:coarse)').matches||navigator.maxTouchPoints>0)?'mobile':'desktop'):settings.device;}
async function launchBattle(){
  if(document.fullscreenElement===byId('title-menu'))await document.exitFullscreen?.();
  $('class').value=model.selectedClass;$('diff').value=model.difficulty;
  setDeviceMode(effectiveDevice());revealGame();start({ritual:true});
}
async function resumeBattle(){
  if(!state.game||state.game.mode!=='paused')return;
  if(document.fullscreenElement===byId('title-menu'))await document.exitFullscreen?.();
  revealGame();togglePause();state.last=performance.now();
  if(state.deviceMode==='mobile')setFocusMode(true);
  if(!state.raf)state.raf=requestAnimationFrame(loop);
}
function syncSettings(){
  for(const [id,value] of Object.entries({'setting-sfx':settings.sfxVolume*100,'setting-music':settings.musicVolume*100,'setting-quality':settings.quality,'setting-device':settings.device,'setting-touch-scale':settings.touchScale}))byId(id).value=String(value);
  for(const [id,value]of Object.entries({'setting-sfx-enabled':settings.sfxEnabled,'setting-music-enabled':settings.musicEnabled,'setting-shake':settings.screenShake,'setting-doubletap':settings.doubleTapDash,'setting-autoaim':settings.autoAim}))byId(id).checked=value;
  byId('setting-sfx-value').textContent=Math.round(settings.sfxVolume*100)+'%';
  byId('setting-music-value').textContent=Math.round(settings.musicVolume*100)+'%';
  byId('menu-keybindings').innerHTML=Object.entries(bindingLabels).map(([name,label])=>`<div class="binding-row"><span>${label}</span><button class="binding-key ${model.listening===name?'listening':''}" data-binding="${name}">${model.listening===name?'…':keyLabel(settings.bindings[name])}</button></div>`).join('');
  byId('setup-controls-hint').textContent=controlHint()+'\nНа телефоні: рух стіком, автоатака й кнопки дій.';
  byId('desktop-control-summary').textContent='ПК: '+controlHint();
  root.dataset.quality=settings.quality;root.style.setProperty?.('--touch-scale',settings.touchScale);
  audio.sfx=settings.sfxEnabled;audio.music=settings.musicEnabled;
  $('soundtoggle').textContent=audio.sfx?'🔊 Звуки: УВІМК':'🔇 Звуки: ВИМК';
  $('musictoggle').textContent=audio.music?'♫ Музика: УВІМК':'♫ Музика: ВИМК';
  $('soundtoggle').setAttribute('aria-pressed',String(audio.sfx));$('musictoggle').setAttribute('aria-pressed',String(audio.music));
  $('soundtoggle').classList.toggle('sound-muted',!audio.sfx);$('musictoggle').classList.toggle('sound-muted',!audio.music);
  $('volume').value=String(Math.round(settings.sfxVolume*100));
  state.mobileAutoAim=settings.autoAim;
}
function initializeMenu(){
  model.selectedClass=$('class').value||'melee';model.difficulty=$('diff').value||'revenge';
  byId('menu-version').textContent='v'+VERSION;
  model.background=createMenuBackground(byId('menu-embers'));
  byId('menu-class-choices').innerHTML=weapons.map(w=>`<button class="class-option" data-menu-class="${w.id}" aria-pressed="false"><span class="class-symbol">${classSymbols[w.id]}</span><strong>${classNames[w.id]}</strong><small>${w.name}</small></button>`).join('');
  const portrait=byId('menu-boss-preview').getContext('2d');portrait.imageSmoothingEnabled=false;
  const witch=pixelArt.witch0;if(witch)portrait.drawImage(witch,42,28,96,128);
  const menu=byId('title-menu');
  menu.querySelectorAll('[data-menu-target]').forEach(b=>b.addEventListener('click',()=>{audio.init();audio.fx('menu');showPanel(b.dataset.menuTarget);}));
  menu.querySelectorAll('[data-menu-class]').forEach(b=>b.addEventListener('click',()=>{audio.fx('menu');selectClass(b.dataset.menuClass);}));
  menu.querySelectorAll('[data-difficulty]').forEach(b=>b.addEventListener('click',()=>{audio.fx('menu');selectDifficulty(b.dataset.difficulty);}));
  byId('choose-calamitas').addEventListener('click',()=>{audio.fx('menu');showPanel('setup');});
  byId('menu-launch').addEventListener('click',launchBattle);byId('menu-resume').addEventListener('click',resumeBattle);
  byId('return-menu').addEventListener('click',()=>showMenu());
  const values={'setting-sfx':['sfxVolume',v=>Number(v)/100],'setting-music':['musicVolume',v=>Number(v)/100],'setting-quality':['quality',String],'setting-device':['device',String],'setting-touch-scale':['touchScale',Number]};
  for(const [id,[name,convert]]of Object.entries(values))byId(id).addEventListener(id.includes('sfx')||id==='setting-music'?'input':'change',e=>{audio.init();updateSettings({[name]:convert(e.target.value)});});
  for(const [id,name]of Object.entries({'setting-sfx-enabled':'sfxEnabled','setting-music-enabled':'musicEnabled','setting-shake':'screenShake','setting-doubletap':'doubleTapDash','setting-autoaim':'autoAim'}))byId(id).addEventListener('change',e=>{audio.init();updateSettings({[name]:e.target.checked});});
  byId('menu-reset-settings').addEventListener('click',()=>{model.listening=null;resetSettings();audio.fx('menu');});
  byId('menu-keybindings').addEventListener('click',e=>{
    const button=e.target.closest?.('[data-binding]');if(!button)return;model.listening=button.dataset.binding;syncSettings();
    byId('keybinding-status').textContent='Натисни нову клавішу. Escape — скасувати. Space — стрибок; WASD — рух. Для ривка можна натиснути коліщатко або бічну кнопку миші.';
  });
  window.addEventListener('keydown',e=>{
    if(state.screen!=='menu'){if(e.code==='Escape'){e.preventDefault();showMenu();}return;}
    if(model.listening){
      e.preventDefault();e.stopImmediatePropagation?.();
      if(e.code==='Escape'){model.listening=null;syncSettings();byId('keybinding-status').textContent='Зміну скасовано.';return;}
      if(bindKey(model.listening,e.code)){model.listening=null;syncSettings();byId('keybinding-status').textContent='Клавішу збережено.';}
      else byId('keybinding-status').textContent='Ця клавіша зайнята або зарезервована. Обери іншу.';
      return;
    }
    if(e.code==='Escape'&&model.panel!=='home'){e.preventDefault();showPanel(model.panel==='setup'?'bosses':'home');}
  },true);
  window.addEventListener('pointerdown',e=>{
    if(state.screen!=='menu'||!model.listening)return;
    const code=({1:'MouseMiddle',3:'MouseBack',4:'MouseForward'})[e.button];if(!code)return;
    e.preventDefault();
    if(bindKey(model.listening,code)){model.listening=null;model.mouseBoundAt=performance.now();syncSettings();byId('keybinding-status').textContent='Кнопку миші збережено.';}
    else byId('keybinding-status').textContent='Кнопки миші доступні для ривка; для інших дій обери клавішу.';
  },true);
  window.addEventListener('auxclick',e=>{if(state.screen==='menu'&&performance.now()-(model.mouseBoundAt??-9999)<500)e.preventDefault();},true);
  byId('menu-fullscreen').addEventListener('click',async()=>{
    try{if(document.fullscreenElement)await document.exitFullscreen();else if(menu.requestFullscreen)await menu.requestFullscreen();else byId('keybinding-status').textContent='Меню вже займає весь доступний екран браузера.';}catch{}
  });
  if(!audio.supported)for(const id of ['setting-sfx-enabled','setting-music-enabled','setting-sfx','setting-music'])byId(id).disabled=true;
  subscribeSettings(syncSettings);syncSettings();showMenu();
}
export {initializeMenu,showMenu,showPanel,launchBattle,resumeBattle,selectClass,selectDifficulty,model};
