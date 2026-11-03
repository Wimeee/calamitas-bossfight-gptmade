import {heartSpawnPositions} from '../world/heart-layout.js?v=26.3.0';
import {updateSummonCast} from '../systems/summon-effects.js?v=26.3.0';
import {initializeSeekers} from './seekers.js?v=26.3.0';
import {sayCalamitas,updateDesperationDialogue} from './dialogue.js?v=26.3.0';
import {beginAcceptance} from './acceptance.js?v=26.3.0';
import { getTerrain } from '../world/terrain.js?v=26.3.0';
import { calamitasConfig as config } from '../../config/calamitas.js?v=26.3.0';
import { arena } from '../core/arena.js?v=26.3.0';
import { audio } from '../core/audio.js?v=26.3.0';
import { TAU } from '../core/config.js?v=26.3.0';
import { state } from '../core/state.js?v=26.3.0';
import { rnd } from '../core/math.js?v=26.3.0';

// Source: SupremeCalamitas.cs phase transitions
// sepulcherSpawnCastTime = 75 ticks (1.25s)
// brothersSpawnCastTime = 150 ticks (2.5s)
// During cast: NPC.dontTakeDamage = true, NPC.velocity *= 0.94, FrameType = Casting
// Particles: DirectionalPulseRing (red/cyan), Dust (60/114), Sound: BulletHellEndSound, DD2_DarkMageCastHeal

function enterCalamitas(stage, marker, label) {
  if (state.game && state.game.t > 0.4) {
    if (marker === 'h40') audio.calamitas('laugh', state.game);
    else audio.fx(marker === 'h30' ? 'maelstrom' : 'phase');
  }
  let g = state.game;
  g.stage = stage;
  if(stage!=='normal'){g.nativeDialogue=false;delete g.dialogKey;}
  g.boss.dontTakeDamage = stage !== 'normal';
  g.hellTeleported = false;
  g.hellTimers = undefined;
  g.stageT = 0;
  g.player.beamPulse = null;
  g.player.swing = null;
  g.player.arkThrow = null;
  g.player.arkParry = null;
  g.player.arkRip = null;
  g.player.arkBuffered = false;
  g.player.combo = 0;
  if (g.player.kit) {
    g.player.kit.blades = [];
    g.player.kit.zones = [];
    g.player.kit.rail = null;
    g.player.kit.heat = 0;
    g.player.kit.resonance = 0;
    g.player.kit.overheat = 0;
  }
  g.patternWarnings = [];
  g.patternTimer = 2.6;
  g.patternIndex = 0;
  g.attackTimer = 0.8;
  g.calamitasAI = null;
  g.boss.contactDamage = 0;
  g.attackTick = 0;
  g.dashActive = 0;
  g.dashWind = 0;
  g.dashCount = 0;
  g.marker = marker;
  g.label = label || stage.toUpperCase();
  g.hint = '';
  if (stage === 'hell') {
    g.phaseN++;
    g.hellField = null;
    g.hellTimer = 0.56;
    g.hellWave = 0;
    g.hellSegment = -1;
    g.huntTimer = 1.0;
    g.huntWarning = null;
    g.projectiles = [];
    g.boss.x = 500;
    g.boss.y = 210;
    g.hint = 'BULLET HELL — не атакуй';
    g.dialog = 'BULLET HELL ' + g.phaseN;
    g.dialogT = 2.8;
    if (marker !== 'opening') g.done.add(marker);
  }
  if (stage === 'hearts') {
    g.sepulcherDefeated=false;
    g.hearts = [];
    for (const [i,point] of heartSpawnPositions(g).entries()) {
      g.hearts.push({tendrilIndex:i,...point,hp:config.heartHP,max:config.heartHP,r:16});
    }
    g.hint = 'SEPULCHER: 10/10 сердець — Calamitas невразлива';
    g.dialog = 'SEPULCHER AWAKENS';
    g.dialogT = 2.3;
    if (marker === 'sep2') g.done.add('h10');
    audio.minion('sepulcherSpawn', g);
  }
  if (stage === 'brothers') {
    const origin=g.brotherSummonOrigin||g.boss;
    const movingUp=Math.random()<.5;g.brotherStepRemainder=0;g.brotherRespawnAvailable=g.difficulty==='death';
    g.brothers = [
      {x:origin.x+500,y:origin.y,hp:config.brotherHP,max:config.brotherHP,r:60,kind:0,movingUp},
      {x:origin.x-500,y:origin.y,hp:config.brotherHP,max:config.brotherHP,r:60,kind:1,movingUp:!movingUp}
    ];
    g.projectiles = [];
    delete g.brotherSummonOrigin;
    g.hint = 'CATACLYSM + CATASTROPHE';
    g.done.add('h50');
    g.done.add('bros');
    g.dialog = 'THE BROTHERS RETURN';
    g.dialogT = 2.5;
    audio.minion('brotherSpawn', g);
  }
  if (stage === 'seekers') {
    g.seekers = [];
    for (let i = 0; i < 10; i++) g.seekers.push({
      angle: i * TAU / 10,
      hp: config.seekerHP, max: config.seekerHP, r: 13,
      x: g.boss.x + Math.cos(i * TAU / 10) * 126,
      y: g.boss.y + Math.sin(i * TAU / 10) * 126
    });
    initializeSeekers(g);
    g.hint = 'ЗНИЩИ 10 SOUL SEEKERS';
    g.done.add('seek');
    g.dialog = 'SUPREME SOUL SEEKERS';
    g.dialogT = 2.5;
    audio.minion('seekerSpawn', g);
  }
  if (stage === 'accept') {
    g.projectiles = [];
    g.monsters = [];
    if(g.maelstrom){g.maelstrom.despawning=true;g.maelstrom.timeLeft=Math.min(g.maelstrom.timeLeft||36000,90);}g.maelstromWarning=null;
    g.shots = [];
    g.boss.x = 500;
    g.boss.y = getTerrain().altar.y - 45;
    g.acceptT = 0;
    g.hint = 'ACCEPTANCE';
    g.done.add('sep2');
    g.done.add('finish');
    g.dialog = 'ACCEPTANCE';
    g.dialogT = 5;
    beginAcceptance(g);
  }
  if(stage==='hell'){const key={opening:'SCalSummonText',h75:'SCalBH2Text',h50:'SCalBH3Text',h30:'SCalBH4Text',h10:'SCalBH5Text'}[marker];if(key)sayCalamitas(g,key);}
  if(stage==='normal'&&marker==='h40')sayCalamitas(g,'SCalPhase2Text');
  if(stage==='brothers')sayCalamitas(g,'SCalBrothersText');
  if(stage==='hearts')sayCalamitas(g,marker==='sep2'?'SCalSepulcher2Text':'SCalStartText');
  if(stage==='seekers')sayCalamitas(g,'SCalSeekerRingText');
}

// Cast delay state is stored in g.castDelayState (per-battle)

function startCastDelay(g, stage, marker, label, castTime, type) {
  if(type==='brothers')g.brotherSummonOrigin={x:g.boss.x,y:g.boss.y};
  g.attackCastDelay = castTime;
  g.label = label;
  g.hint = type === 'sepulcher' ? 'ПРИКЛИКАННЯ SEPULCHER' : type === 'brothers' ? 'ПРИКЛИКАННЯ БРАТІВ' : '';
  g.calamitasAI = null;g.dashWind = 0;g.dashActive = 0;g.boss.contactDamage = 0;
  g.stage = stage;
  g.stageT = 0;
  g.castDelayState = { stage, marker, label, remaining: castTime, type, startTime: g.t };
  // Visual: FrameType = Casting, velocity *= 0.94, dontTakeDamage = true
  g.boss.dontTakeDamage = true;
  // Play cast start sound
  audio.fx('cast');
}

function updateCastDelay(dt, g) {
  const cs = g.castDelayState;
  if (!cs) return null;

  updateSummonCast(dt,g,cs);
  cs.remaining -= dt;
  if(cs.remaining<1e-10)cs.remaining=0;
  g.attackCastDelay = Math.max(0, cs.remaining);

  // Visual: velocity *= 0.94 during cast (source: NPC.velocity *= 0.94f)
  g.boss.dontTakeDamage = true;
  const decay = Math.pow(.94, dt * 60);
  // Integrate the same damped velocity at any frame rate (native tick: *= .94, move).
  const travel = .94 * (1 - decay) / (.06 * 60);
  g.boss.x += g.boss.vx * travel;g.boss.y += g.boss.vy * travel;
  g.boss.vx *= decay;g.boss.vy *= decay;

  // Spawn particles during cast windup (source: DoHeartsSpawningCastAnimation / DoBrothersSpawningCastAnimation)
  if (cs.remaining > 0) {
    // Emit dust particles around boss - handled in render
  }

  if (cs.remaining <= 0) {
    // Cast finished, transition to the actual phase
    const { stage, marker, label, type } = cs;
    g.castDelayState = null;
    g.boss.dontTakeDamage = false;

    // End cast particles (source: pulse rings + dust burst)
    if (type === 'sepulcher') {
      // DirectionalPulseRing (red), 100 dust particles
      // Sound: BulletHellEndSound, DD2_DarkMageCastHeal
      audio.fx('phase');
    } else if (type === 'brothers') {
      // DirectionalPulseRing (red), dust
      audio.fx('phase');
    }

    return { stage, marker, label };
  }
  return null;
}

function transitionCalamitas(g) {
  let b = g.boss;
  if (g.stage !== 'normal') return;

  let pct = b.hp / b.max;
  // 75% -> Bullet Hell II (no cast delay in source)
  if (pct <= config.thresholds.hell2 && !g.thresholds.has('75')) {
    g.thresholds.add('75');
    g.done.add('opening');
    enterCalamitas('hell', 'h75', 'BULLET HELL II');
    return;
  }
  if (pct <= config.thresholds.hell3 && !g.thresholds.has('50')) {
    g.thresholds.add('50');
    // Start cast delay for Bullet Hell III
    startCastDelay(g, 'hell', 'h50', 'BULLET HELL III', 0, 'bullethell'); // No cast delay for bullet hells
    return;
  }
  if (pct <= config.thresholds.phase2 && !g.thresholds.has('40')) {
    g.thresholds.add('40');
    g.done.add('h40');
    g.marker = 'h40';
    sayCalamitas(g,'SCalPhase2Text');
    g.hint = 'PHASE II — ШВИДШІ АТАКИ';
    g.attackTimer = 0;
    return;
  }
  if (pct <= config.thresholds.maelstrom && !g.thresholds.has('30')) {
    g.thresholds.add('30');
    // The real Maelstrom spawns at BH4 tick 420, not at the HP threshold.
    // Start cast delay for Bullet Hell IV + Maelstrom
    startCastDelay(g, 'hell', 'h30', 'BULLET HELL IV · MAELSTROM', 0, 'bullethell');
    g.hint = 'WHISPERING MAELSTROM ПРОБУДЖЕНО';
    return;
  }
  if (pct <= config.thresholds.seekers && !g.thresholds.has('20')) {
    g.thresholds.add('20');
    // Start cast delay for Seekers (no cast delay in source)
    enterCalamitas('seekers', 'seek', 'SOUL SEEKERS');
    return;
  }
  if (pct <= config.thresholds.hell5 && !g.thresholds.has('10')) {
    g.thresholds.add('10');
    // Start cast delay for Final Bullet Hell (no cast delay in source)
    enterCalamitas('hell', 'h10', 'FINAL BULLET HELL');
    return;
  }
  updateDesperationDialogue(g);
  if (b.hp <= 1 && !g.thresholds.has('end')) {
    g.thresholds.add('end');
    enterCalamitas('accept', 'finish', 'ACCEPTANCE');
  }
}

// Export a function to be called from game loop to update cast delays
function updatePhaseTransitions(dt, g) {
  const result = updateCastDelay(dt, g);
  if (result) {
    enterCalamitas(result.stage, result.marker, result.label);
  }
}

export { enterCalamitas, transitionCalamitas, updatePhaseTransitions, startCastDelay, updateCastDelay };