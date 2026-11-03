import {initializeAsgardianAtlas} from './render/asgardian.js?v=26.0.3';
import {initializeLocalization} from './core/localization.js?v=26.0.3';
import {initializeHelperAtlas} from './render/helper-atlas.js?v=26.0.3';
import { initializeViewport } from './world/viewport.js?v=26.0.3';
import { initializeArenaAtlas } from './render/arena-atlas.js?v=26.0.3';
import { initializeHUDAtlas } from './render/hud-atlas.js?v=26.0.3';
import { initializeCalamitasAtlas } from './render/calamitas-atlas.js?v=26.0.3';
import { initializeMeleeAtlas } from './render/melee-atlas.js?v=26.0.3';
import { initializeMinionAtlas } from './render/minion-atlas.js?v=26.0.3';
import { initializeEncounterProjectileAtlas } from './render/encounter-projectiles-atlas.js?v=26.0.3';
import { initializeWorldDecorationAtlas } from './render/world-decorations.js?v=26.0.3';
import { initializeMenu } from './ui/menu.js?v=26.0.3';
import { configureArena } from './core/arena.js?v=26.0.3';
import { MOBILE_CONTROLS_ENABLED } from './core/settings.js?v=26.0.3';
import { VERSION } from './core/config.js?v=26.0.3';
import { $, root } from './core/dom.js?v=26.0.3';
import { initializeDesktop } from './input/desktop.js?v=26.0.3';
import { initializeFullscreen } from './input/fullscreen.js?v=26.0.3';
import { initializeMobile, setDeviceMode, updateMobileLabels } from './input/mobile.js?v=26.0.3';
import { draw } from './render/scene.js?v=26.0.3';
import { initializeSprites } from './render/sprites.js?v=26.0.3';
import { initializeControls } from './ui/controls.js?v=26.0.3';
import { initializeUpdates } from './ui/updates.js?v=26.0.3';


function initializeGame(){
  if(root.dataset.ready)return;
  configureArena('normal');
  initializeViewport();
  initializeArenaAtlas();
  initializeHelperAtlas();
  initializeSprites();
  initializeMeleeAtlas();
  initializeCalamitasAtlas();
  initializeMinionAtlas();
  initializeEncounterProjectileAtlas();
  initializeWorldDecorationAtlas();
  initializeHUDAtlas();
  initializeAsgardianAtlas();
  initializeControls();
  initializeDesktop();
  if(MOBILE_CONTROLS_ENABLED)initializeMobile();
  initializeFullscreen();
  try{
    setDeviceMode(localStorage.getItem('calamitas_device_mode')||((window.matchMedia('(pointer:coarse)').matches||navigator.maxTouchPoints>0)?'mobile':'desktop'))
  }catch(_){
    setDeviceMode(window.matchMedia('(pointer:coarse)').matches?'mobile':'desktop')
  }
  $('weapons').querySelector('[data-weapon="0"]').classList.add('on');
  updateMobileLabels();
  draw(null);
  $('runtime-status').textContent='✅ v'+VERSION+': TERRARIA MOVEMENT · ЛКМ — атака · ПКМ — уміння класу'+(MOBILE_CONTROLS_ENABLED?' · На телефоні: рух стіком, автоатака й окрема кнопка уміння.':'');
  $('runtime-status').classList.add('ok');
  root.dataset.ready='yes';
  initializeUpdates();
  initializeMenu();
  initializeLocalization();
}
initializeGame();


export { initializeGame };
