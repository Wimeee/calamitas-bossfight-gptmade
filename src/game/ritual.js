import { playerConfig } from '../../config/player.js?v=20.1.0';
import { getEncounter } from '../boss/registry.js?v=20.1.0';
import { arena } from '../core/arena.js?v=20.1.0';
import { audio } from '../core/audio.js?v=20.1.0';
import { $ } from '../core/dom.js?v=20.1.0';
import { clamp, norm } from '../core/math.js?v=20.1.0';
import { state } from '../core/state.js?v=20.1.0';
import { resetTouchInput } from '../input/mobile.js?v=20.1.0';
import { ui } from '../ui/hud.js?v=20.1.0';
import { enter } from './phases.js?v=20.1.0';

export const ritualConfig=Object.freeze({x:500,y:300,range:86,duration:6.4,skipAfter:.8});

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
  setControl('ritual-controls','hidden',!r);
  setControl('ritual-summon','hidden',!r||r.phase!=='preparation');
  setControl('ritual-summon','disabled',!active||!nearAltar(g));
  const label=nearAltar(g)?'Викликати · E / Enter':'Підійди до урни';
  if($('ritual-summon').textContent!==label)$('ritual-summon').textContent=label;
  setControl('ritual-skip','hidden',!r||r.phase!=='summoning');
  setControl('ritual-skip','disabled',!active||r.elapsed<ritualConfig.skipAfter);
}

export function prepareRitual(g){
  g.ritual={phase:'preparation',elapsed:0,ambient:0};
  g.stage='preparation';
  g.label='ALTAR OF THE ACCURSED';
  g.hint='Підійди до урни та натисни E / Enter або кнопку виклику.';
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
  audio.fx('phase');
  syncRitualControls();
  ui();
  return true;
}

export function completeRitual(){
  const g=state.game;
  if(!g?.ritual||g.mode!=='playing'||g.ritual.phase!=='summoning')return false;
  delete g.ritual;
  clearRitualInput();
  // Every attempt enters the encounter from the same original spawn and resources.
  g.player.x=500;g.player.y=410;
  g.player.iframes=playerConfig.spawnInvulnerability;
  const opening=getEncounter(g).config.opening;
  enter(opening.stage,opening.marker,opening.label);
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
    const k=state.keys;
    const dx=(k.d||k.ArrowRight?1:0)-(k.a||k.ArrowLeft?1:0)+state.moveAxis.x;
    const dy=(k.s||k.ArrowDown?1:0)-(k.w||k.ArrowUp?1:0)+state.moveAxis.y;
    if(dx||dy){
      const m=norm(dx,dy),p=g.player;
      p.x=clamp(p.x+m.x*playerConfig.movementSpeed*dt,arena.l+11,arena.r-11);
      p.y=clamp(p.y+m.y*playerConfig.movementSpeed*dt,arena.t+11,arena.b-11);
    }
  }else{
    r.elapsed+=dt;
    if(r.elapsed>=ritualConfig.duration){completeRitual();return;}
  }
  syncRitualControls();
}

export function initializeRitual(){
  $('ritual-summon').addEventListener('click',beginRitual);
  $('ritual-skip').addEventListener('click',skipRitual);
  syncRitualControls();
}
