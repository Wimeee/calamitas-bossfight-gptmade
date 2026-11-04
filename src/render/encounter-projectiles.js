import {renderQuality} from '../core/settings.js?v=29.1.0';
import {drawBrotherProjectile} from './brother-projectiles.js?v=29.1.0';
import {encounterProjectiles as spec} from '../../config/encounter-projectiles.js?v=29.1.0';
import {ctx} from '../core/dom.js?v=29.1.0';
import {settings} from '../core/settings.js?v=29.1.0';
import {line} from './primitives.js?v=29.1.0';
import {paintProjectileFrame} from './encounter-projectiles-atlas.js?v=29.1.0';
import {TAU} from '../core/config.js?v=29.1.0';

// Source-accurate projectile kind mapping:
// - 'dart' → 'barrage' (BrimstoneBarrage.cs) - used by Sepulcher, seekers, fireblast/gigablast explosions
// - 'sepulcherDart' → 'barrage' with source-accurate AI (BrimstoneBarrage.cs ai[1]==3): custom frame, scale=0.85, opacity fade
// - 'fire' → SCalBrimstoneFireblast (SupremeCalamitas.cs:503), 5 frames
// - 'giga' → 'gigablast' (SCalBrimstoneGigablast.cs) - phase 2 blast, 6 frames
// - 'hellblast' → 'hellblast' (BrimstoneHellblast.cs) - hellblast attack, 4 frames
// - 'hellblast2' → 'hellblast2' (BrimstoneHellblast2.cs) - Cal Clone bullet hell, 4 frames
// - 'fist' → 'cataclysmFist' (SupremeCataclysmFist.cs) - brother attack
// - 'slash' → 'catastropheSlash' (SupremeCatastropheSlash.cs) - brother attack
// - 'wave' → 'wave' (BrimstoneWave.cs) - skull projectile in BH5, sine motion
// 'skull' is not a source projectile type; legacy alias removed
const kinds={
  dart:'barrage',
  sepulcherDart:'barrage',
  fire:'scalfireblast',
  giga:'gigablast',
  hellblast:'hellblast',
  hellblast2:'hellblast2',
  fist:'cataclysmFist',
  slash:'catastropheSlash',
  wave:'wave',
  skull:'wave', // Alias for skull projectiles in BH5
  maelstrom:'monster',
  maelstrom2:'monster2'
};
export function encounterProjectileKind(kind){return kinds[kind]||kind;}
export function encounterProjectileFrame(q,g){
  const kind=encounterProjectileKind(q.kind);
  const s=spec[kind];
  if(!s) return 0;
  // Sepulcher darts use their own frame counter (15fps, 4 frames) set in updateBullets
  if(q.kind==='sepulcherDart') return q.frame||0;
  // Hellblast/hellblast2 use their own frame counter
  if(q.sourceCalamitas&&(q.kind==='fire'||q.kind==='giga'))return q.frame||0;
  if(q.kind==='hellblast') return q.frame||0;
  if(q.kind==='hellblast2')return q.sourceCalamitas?(q.frame||0):Math.floor((q.t??0)*6)%s.frames;
  // Wave/skull uses own frame counter
  if(q.kind==='wave' || q.kind==='skull') return q.frame||0;
  return Math.floor((q.t??g.t)*(s.fps||12))%s.frames;
}

// Native trail is straight; only the emitted SparkParticles form a helix.
function drawHellblast(q,g,kind,frame,angle){
 const facing=q.vx<0?-1:1,rotation=Math.atan2(q.vy*facing,q.vx*facing),opacity=q.opacity??1;
 if(renderQuality()!=='low'){const old=q.nativeTrail?.[1];if(old)paintProjectileFrame(ctx,kind,frame,old.x,old.y,1,opacity*.25,facing,rotation);}
 paintProjectileFrame(ctx,kind,frame,q.x,q.y,1,opacity,facing,rotation);
}
function drawHellblast2(q,g,kind,frame,angle){const facing=q.vx<0?-1:1;paintProjectileFrame(ctx,kind,frame,q.x,q.y,1,q.opacity??1,facing,Math.atan2(q.vy*facing,q.vx*facing));}

/**
 * Draw BrimstoneWave (skull projectile) with sine wave motion
 * Source: BrimstoneWave.cs - ai[0] = wave phase, ai[1] = wave amplitude
 * Position oscillates perpendicular to velocity: offset = sin(ai[0]) * ai[1]
 * ai[0] increases by ~0.1 per tick, ai[1] = 30f (source)
 */
function drawWave(q, g, kind, frame, angle) {
  if(q.sourceCalamitas){
    // Native wave physics already moves the hitbox. Never apply a second visual wave.
    paintProjectileFrame(ctx,kind,frame,q.x,q.y,1,q.opacity??1,1,angle);return;
  }
  const s = spec[kind];
  const time = q.t ?? g.t;

  // Source: ai[0] = wave phase (radians), ai[1] = amplitude (30f)
  // We simulate with time-based wave - compute purely from projectile age to avoid mutating combat state
  const wavePhase = time * 6; // 0.1 * 60 = 6 rad/s
  const waveAmplitude = q.ai1 ?? 30; // Source uses 30f

  // Perpendicular offset
  const perpX = -Math.sin(angle);
  const perpY = Math.cos(angle);
  const waveOffset = Math.sin(wavePhase) * waveAmplitude;

  const drawX = q.x + perpX * waveOffset;
  const drawY = q.y + perpY * waveOffset;

  // Draw trail for wave motion
  if (renderQuality() !== 'low') {
    for (let i = 1; i <= 3; i++) {
      const prevPhase = wavePhase - i * 0.5;
      const prevOffset = Math.sin(prevPhase) * waveAmplitude;
      const tx = q.x - Math.cos(angle) * i * 6 + perpX * prevOffset;
      const ty = q.y - Math.sin(angle) * i * 6 + perpY * prevOffset;
      const trailAlpha = 0.2 * (1 - i / 4);
      paintProjectileFrame(ctx, kind, frame, tx, ty, 0.9, trailAlpha, 1, angle);
    }
  }

  // Draw main projectile at wave position
  paintProjectileFrame(ctx, kind, frame, drawX, drawY, 1, 1, 1, angle);
}

/**
 * Draw Maelstrom (BrimstoneMonster) - large rotating entity
 * Source: BrimstoneMonster.cs - rotates, pulses, spawns projectiles
 */
function drawMaelstrom(q, g, kind, frame, angle) {
  const s = spec[kind];
  const time = q.t ?? g.t;

  // Maelstrom rotates slowly
  const rotation = time * 0.3;
  const pulse = 1 + Math.sin(time * 2) * 0.1;

  ctx.save();
  ctx.translate(q.x, q.y);
  ctx.rotate(rotation);
  ctx.globalAlpha *= 0.8;
  paintProjectileFrame(ctx, kind, frame, 0, 0, s.scale * pulse, 1, 1, 0);
  ctx.restore();
}

export function drawEnemyProjectiles(g){
  ctx.shadowBlur=0;
  for(const q of g.projectiles){
    if(q.spawnDelay>0){
      ctx.save();
      ctx.globalAlpha=0.65;
      line(q.x,q.y,q.x+q.vx*0.16,q.y+q.vy*0.16,'#ffdda1',2);
      ctx.restore();
      continue;
    }
    if(q.detonating&&!q.sourceCalamitas){
      ctx.strokeStyle='#ffe9b2';
      ctx.lineWidth=2;
      ctx.beginPath();
      ctx.arc(q.x,q.y,q.r+8+Math.max(0,q.burstAt-q.t)*20,0,Math.PI*2);
      ctx.stroke();
    }

    if(q.nativeBrother){drawBrotherProjectile(q);continue;}
    const kind=encounterProjectileKind(q.kind);
    const frame=encounterProjectileFrame(q,g);
    const angle=Math.atan2(q.vy,q.vx);

    // Source-accurate rendering per projectile type
    switch (q.kind) {
      case 'hellblast':
        drawHellblast(q, g, kind, frame, angle);
        break;
      case 'hellblast2':
        drawHellblast2(q, g, kind, frame, angle);
        break;
      case 'wave':
      case 'skull':
        drawWave(q, g, kind, frame, angle);
        break;
      case 'maelstrom':
      case 'maelstrom2':
        drawMaelstrom(q, g, kind, frame, angle);
        break;
      case 'fire':
      case 'giga':
        if(q.sourceCalamitas){paintProjectileFrame(ctx,kind,frame,q.x,q.y,1,q.opacity??1,1,angle);break;}
        // Legacy non-native shots continue through the generic renderer.
      default:
        // Standard rendering for other projectiles
        // Sepulcher darts use custom scale (0.85) and opacity (fade in last 1s) from projectile
        const scale = (q.kind==='sepulcherDart' && q.scale!==undefined) ? q.scale : 1;
        const alpha = ((q.kind==='sepulcherDart'||q.sourceCalamitas) && q.opacity!==undefined) ? q.opacity : 1;
        if(renderQuality()!=='low'){
          for(let i=2;i>0;i--){
            paintProjectileFrame(ctx,kind,frame,q.x-q.vx*i*0.015,q.y-q.vy*i*0.015,scale,0.12*alpha,1,angle);
          }
        }
        if(!paintProjectileFrame(ctx,kind,frame,q.x,q.y,scale,alpha,1,angle)){
          line(q.x-q.vx*0.03,q.y-q.vy*0.03,q.x,q.y,'#ff895b',Math.max(2,q.r*0.6));
        }
        break;
    }
  }
}
export function triggerProjectileImpact(){}
export function encounterProjectileVisualCacheSize(){return 0;}