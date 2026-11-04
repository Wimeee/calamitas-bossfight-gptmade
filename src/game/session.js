import {initializeMage} from '../classes/mage.js?v=27.1.1';
import {hasDefeatedCalamitas,rememberCalamitasVictory} from '../core/progress.js?v=27.1.1';
import { resetArenaState } from '../world/arena-state.js?v=27.1.1';
import { resizeViewport } from '../world/viewport.js?v=27.1.1';
import { makeRippers } from '../systems/rippers.js?v=27.1.1';
import { updateCamera } from '../world/camera.js?v=27.1.1';
import { spawnNearAltar } from './movement.js?v=27.1.1';
import { prepareRitual, syncRitualControls } from './ritual.js?v=27.1.1';
import { settings } from '../core/settings.js?v=27.1.1';
import { playerConfig } from '../../config/player.js?v=27.1.1';
import { getDifficulty } from '../../config/difficulty.js?v=27.1.1';
import { getEncounter } from '../boss/registry.js?v=27.1.1';
import { weapons } from '../classes/registry.js?v=27.1.1';
import { summonSquad } from '../classes/summoner.js?v=27.1.1';
import { configureArena } from '../core/arena.js?v=27.1.1';
import { audio } from '../core/audio.js?v=27.1.1';
import { $ } from '../core/dom.js?v=27.1.1';
import { state } from '../core/state.js?v=27.1.1';
import { loop } from './loop.js?v=27.1.1';
import { enter } from './phases.js?v=27.1.1';
import { setFocusMode } from '../input/fullscreen.js?v=27.1.1';
import { resetTouchInput, updateMobileLabels } from '../input/mobile.js?v=27.1.1';
import { showOverlay, ui } from '../ui/hud.js?v=27.1.1';


function makeGame(encounterId='supreme-calamitas'){
  const encounter=getEncounter({encounterId});
  const difficulty=$('diff').value,scale=getDifficulty(difficulty).incomingDamage;
  return {
    mode:'playing',
    encounterId:encounter.config.id,
    rematch:hasDefeatedCalamitas(),
    difficulty,
    rippers:makeRippers(difficulty),
    scale,
    t:0,
    totalTime:0,
    stage:'hell',
    stageT:0,
    phaseN:0,
    thresholds:new Set(),
    done:new Set(),
    marker:'opening',
    label:'BULLET HELL I',
    hint:'УХИЛЯЙСЯ — бос невразливий',
    boss:{...encounter.createBoss(),skin:hasDefeatedCalamitas()?'unhooded':'hooded'},
    player:{
      x:500,
      y:410,
      vx:0,
      vy:0,
      hp:playerConfig.hp,
      maxHp:playerConfig.hp,
      mana:playerConfig.mana,
      maxMana:playerConfig.mana,
      weapon:weapons.findIndex(x=>x.id===$('class').value),
      fireCd:0,
      dashCd:0,
      dashT:0,
      contactGuard:0,
      dashX:0,
      dashY:0,
      potions:playerConfig.potions,
      potionCd:0,
      iframes:playerConfig.spawnInvulnerability,
      hits:0,
      dashes:0,
      stealth:0,
      lastHit:0,
      regenRate:3,
      regenPotions:playerConfig.regenerationPotions,
      regenPotionT:0,
      pickupsTaken:0,
      cosmic:[],
      cosmicMark:null,
      whip:null,
      combo:0,
      swing:null,
      comboExpire:0,
      arkThrow:null,
      arkCharges:0,
      arkParryCd:0,
      arkParry:null,
      arkRip:null,
      arkBuffered:false
    },
    impacts:[],
    patternWarnings:[],
    patternTimer:2.6,
    patternIndex:0,
    pickups:[],
    pickupStepRemainder:0,
    projectiles:[],
    shots:[],
    hearts:[],
    seekers:[],
    brothers:[],
    monsters:[],
    maelstrom:null,
    sparks:[],
    dashGhosts:[],
    floaters:[],
    attackIndex:0,
    attackTimer:0,
    attackTick:0,
    lastCause:"",
    dashCount:0,
    dashWind:0,
    dashActive:0,
    dashVector:{x:0,y:0},
    dialog:'',
    dialogT:0,
    acceptT:0,
    killCount:0
  };
}


function start(options={}){
  audio.stopMusic();
  state.screen='game';
  audio.stopCalamitas();
  audio.init();
  audio.fx('phase');
  state.keys={};
  resetTouchInput();
  if(state.deviceMode==='mobile')state.mobileAutoAim=settings.autoAim;
  state.game=makeGame();
  initializeMage(state.game);
  configureArena(state.game.difficulty);
  resetArenaState(state.game,true);
  setFocusMode(true);resizeViewport();
  spawnNearAltar(state.game);
  delete state.pointer.viewX;delete state.pointer.viewY;delete state.pointer.u;delete state.pointer.v;
  updateCamera(state.game,0,true);
  const opening=getEncounter().config.opening;
  if(options.ritual)prepareRitual(state.game);
  else enter(opening.stage,opening.marker,opening.label);
  syncRitualControls();
  $('diff').disabled=true;
  $('class').disabled=true;
  $('overlay').hidden=true;
  $('start').textContent='↻ Новий бій';
  state.pointer.fire=false;
  if(state.game.player.weapon===3)summonSquad();
  ui();
  if(state.deviceMode==='mobile'){
    setFocusMode(true)
  }
  updateMobileLabels();
  if(!state.raf)state.raf=requestAnimationFrame(loop)
}


function finish(win){
  if(!win)audio.stopMusic();
  audio.stopCalamitas();
  resetTouchInput();
  audio.fx(win?'victory':'death');
  let g=state.game;
  g.mode=win?'won':'dead';
  if(win)audio.syncMusic();
  if(win)rememberCalamitasVictory(g);
  g.player.debuffs={};
  state.pointer.fire=false;
  $('diff').disabled=false;
  $('class').disabled=false;
  showOverlay(win?'THE BRIMSTONE WITCH':'YOU WERE SLAIN',win?'CALAMITAS ПЕРЕМОЖЕНА!':'ТИ ЗАГИНУВ',win?`Перемога! Час: ${Math.floor(g.totalTime)} с · Отримано ударів: ${g.player.hits}. Всі п'ять Bullet Hell пройдені.`:`Здоров'я боса: ${(g.boss.hp/g.boss.max*100).toFixed(1)}%. Останній удар: ${g.lastCause||'невідомо'}. Отримано ударів: ${g.player.hits}.`, '↻ ЩЕ ОДНА СПРОБА');
  ui()
}


function changeWeapon(n){
  if(n<0||n>=5||!state.game)return;
  if(state.game.mode==='playing'||state.game.mode==='paused'){
    state.game.floaters.push({x:state.game.player.x,y:state.game.player.y-38,life:.7,text:'КЛАС ЗАФІКСОВАНО',col:'#ffc7a5'});
    return;
  }
  state.game.player.weapon=n;
  ui()
}


function togglePause(){
  if(!state.game||state.game.mode==='dead'||state.game.mode==='won')return;
  state.game.mode=state.game.mode==='paused'?'playing':'paused';
  if(state.game.mode==='paused'){audio.stopCalamitas();audio.pauseMusic();}
  else audio.syncMusic();
  syncRitualControls();
  $('pause').textContent=state.game.mode==='paused'?'▶ Продовжити':'⏸ Пауза'
}


export { makeGame, start, finish, changeWeapon, togglePause };
