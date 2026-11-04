import { updateCamera } from '../world/camera.js?v=29.1.0';
import { updatePlayerMovement,spawnNearAltar } from './movement.js?v=29.1.0';
import { getTerrain } from '../world/terrain.js?v=29.1.0';
import { playerConfig } from '../../config/player.js?v=29.1.0';
import { getEncounter } from '../boss/registry.js?v=29.1.0';
import { audio } from '../core/audio.js?v=29.1.0';
import { $ } from '../core/dom.js?v=29.1.0';
import { state } from '../core/state.js?v=29.1.0';
import { resetTouchInput } from '../input/mobile.js?v=29.1.0';
import { ui,syncFlightHUD } from '../ui/hud.js?v=29.1.0';
import { enter } from './phases.js?v=29.1.0';
import {settings,defaults,updateSettings} from '../core/settings.js?v=29.1.0';
import {infernumIntroState} from './intro-timeline.js?v=29.1.0';

export const ritualConfig=Object.freeze({x:500,get y(){return getTerrain().altar.y-24;},range:86,spawnAt:270/60,duration:(270+300)/60,skipAfter:.8});

function clearRitualInput(){
  state.keys={};
  state.pointer.fire=false;
  resetTouchInput();
}

export function nearAltar(g=state.game){
  return !!g&&Math.hypot(g.player.x-ritualConfig.x,g.player.y-ritualConfig.y)<ritualConfig.range;
}

function setControl(id,property,value){
  const element=$(id);
  if(element[property]!==value)element[property]=value;
}

export function syncRitualControls(){
  const g=state.game,r=g?.ritual,active=!!r&&g.mode==='playing';
  const adjustable=active&&r.phase==='preparation',zoom=settings[state.deviceMode==='mobile'?'cameraZoomMobile':'cameraZoomDesktop'];
  setControl('camera-preview','hidden',!adjustable);
  setControl('camera-zoom','disabled',!adjustable);
  setControl('camera-zoom','value',String(Math.round(zoom*100)));
  setControl('camera-zoom-value','textContent',Math.round(zoom*100)+'%');
  setControl('ritual-controls','hidden',!r);
  setControl('ritual-summon','hidden',!r||r.phase!=='preparation');
  setControl('ritual-summon','disabled',!active||!nearAltar(g));
  const label=nearAltar(g)?'Викликати · E / Enter':'Підійди до вівтаря';
  if($('ritual-summon').textContent!==label)$('ritual-summon').textContent=label;
  setControl('ritual-skip','hidden',!r||r.phase!=='summoning');
  setControl('ritual-skip','disabled',!active||r.elapsed<ritualConfig.skipAfter);
}

export function prepareRitual(g){
  g.ritual={phase:'preparation',elapsed:0,ambient:0};
  g.stage='preparation';
  g.label='ALTAR OF THE ACCURSED';
  g.hint='Підійди до вівтаря та натисни E / Enter або кнопку виклику.';
  syncRitualControls();
}

export function beginRitual(){
  const g=state.game;
  if(!g?.ritual||g.mode!=='playing'||g.ritual.phase!=='preparation'||!nearAltar(g))return false;
  g.ritual.phase='summoning';
  g.ritual.elapsed=0;
  g.stage='ritual';
  g.label='THE BRIMSTONE WITCH';
  g.hint='Ритуал розпочато. Enter / Space — пропустити.';
  clearRitualInput();
  audio.calamitas('altar',g);
  syncRitualControls();
  ui();
  return true;
}

export function completeRitual(){
  const g=state.game;
  if(!g?.ritual||g.mode!=='playing'||g.ritual.phase!=='summoning')return false;
  const laughed=g.ritual.laughPlayed;
  audio.stopCalamitas('altar');
  delete g.ritual;
  clearRitualInput();
  // Every attempt enters the encounter from the same original spawn and resources.
  spawnNearAltar(g,500);
  updateCamera(g,0,true);
  g.player.iframes=playerConfig.spawnInvulnerability;
  const opening=getEncounter(g).config.opening;
  enter(opening.stage,opening.marker,opening.label);
  if(!laughed)audio.calamitas('laugh',g);
  syncRitualControls();
  ui();
  return true;
}

export function skipRitual(){
  if(!state.game?.ritual||state.game.ritual.elapsed<ritualConfig.skipAfter)return false;
  return completeRitual();
}

export function updateRitual(dt){
  const g=state.game,r=g?.ritual;
  if(!r||g.mode!=='playing')return;
  r.ambient+=dt;
  if(r.phase==='preparation'){
    updatePlayerMovement(g,dt);
    updateCamera(g,dt);
    syncFlightHUD(g);
  }else{
    r.elapsed+=dt;
    if(!r.laughPlayed&&r.elapsed>=4.5){r.laughPlayed=true;audio.stopCalamitas('altar');audio.calamitas('laugh',g);}
    const letters=infernumIntroState(r.elapsed-ritualConfig.spawnAt).letters;
    if(letters>(r.titleLetters||0)){r.titleLetters=letters;audio.calamitas('introLetter',g);}
    if(r.elapsed>=ritualConfig.duration){completeRitual();return;}
  }
  syncRitualControls();
}

export function initializeRitual(){
  const adjust=value=>{if(state.game?.mode!=='playing'||state.game.ritual?.phase!=='preparation')return;const key=state.deviceMode==='mobile'?'cameraZoomMobile':'cameraZoomDesktop';updateSettings({[key]:value});syncRitualControls();};
  $('camera-zoom').addEventListener('input',e=>adjust(Number($('camera-zoom').value)/100));
  $('camera-zoom').addEventListener('pointerup',()=>$('camera-zoom').blur?.());
  $('camera-zoom-reset').addEventListener('click',()=>adjust(defaults[state.deviceMode==='mobile'?'cameraZoomMobile':'cameraZoomDesktop']));
  $('camera-zoom-reset').addEventListener('keydown',e=>{if(e.code==='Enter'||e.code==='Space')e.stopPropagation();});
  $('ritual-summon').addEventListener('click',beginRitual);
  $('ritual-skip').addEventListener('click',skipRitual);
  syncRitualControls();
}
