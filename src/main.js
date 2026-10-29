import { initializeMeleeAtlas } from './render/melee-atlas.js?v=21.0.0';
import { initializeMenu } from './ui/menu.js?v=21.0.0';
import { configureArena } from './core/arena.js?v=21.0.0';
import { VERSION } from './core/config.js?v=21.0.0';
import { $, root } from './core/dom.js?v=21.0.0';
import { initializeDesktop } from './input/desktop.js?v=21.0.0';
import { initializeFullscreen } from './input/fullscreen.js?v=21.0.0';
import { initializeMobile, setDeviceMode, updateMobileLabels } from './input/mobile.js?v=21.0.0';
import { draw } from './render/scene.js?v=21.0.0';
import { initializeSprites } from './render/sprites.js?v=21.0.0';
import { initializeControls } from './ui/controls.js?v=21.0.0';
import { initializeUpdates } from './ui/updates.js?v=21.0.0';


function initializeGame(){
  if(root.dataset.ready)return;
  configureArena('normal');
  initializeSprites();
  initializeMeleeAtlas();
  initializeControls();
  initializeDesktop();
  initializeMobile();
  initializeFullscreen();
  try{
    setDeviceMode(localStorage.getItem('calamitas_device_mode')||((window.matchMedia('(pointer:coarse)').matches||navigator.maxTouchPoints>0)?'mobile':'desktop'))
  }catch(_){
    setDeviceMode(window.matchMedia('(pointer:coarse)').matches?'mobile':'desktop')
  }
  $('weapons').querySelector('[data-weapon="0"]').classList.add('on');
  updateMobileLabels();
  draw(null);
  $('runtime-status').textContent='✅ v'+VERSION+': TERRARIA MOVEMENT · ЛКМ — атака · ПКМ — уміння класу · На телефоні: рух стіком, автоатака й окрема кнопка уміння.';
  $('runtime-status').classList.add('ok');
  root.dataset.ready='yes';
  initializeUpdates();
  initializeMenu();
}
initializeGame();


export { initializeGame };
