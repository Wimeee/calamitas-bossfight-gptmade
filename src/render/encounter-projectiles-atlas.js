import { encounterProjectiles as spec } from '../../config/encounter-projectiles.js?v=28.1.0';
import {circleVisible} from './visibility.js?v=28.1.0';

const images = new Map();
let ready = null;
export const encounterProjectileAssetStatus = { state: 'idle', loaded: 0, failed: 0 };

function load(name, file) {
  return new Promise(resolve => {
    const image = new Image();
    image.onload = () => {
      try {
        images.set(name, image);
        encounterProjectileAssetStatus.loaded++;
      } catch {
        encounterProjectileAssetStatus.failed++;
      }
      resolve();
    };
    image.onerror = () => { encounterProjectileAssetStatus.failed++; resolve(); };
    image.src = new URL('../../assets/calamitas/encounter/' + file, import.meta.url).href;
  });
}

export function initializeEncounterProjectileAtlas() {
  if (ready) return ready;
  if (typeof Image === 'undefined') { encounterProjectileAssetStatus.state = 'unsupported'; return Promise.resolve(); }
  encounterProjectileAssetStatus.state = 'loading';

  ready = Promise.all([
    load('barrage', spec.barrage.file),
    load('hellblast', spec.hellblast.file),
    load('hellblast2', spec.hellblast2.file),
    load('fireblast', spec.fireblast.file),
    load('scalfireblast', spec.scalfireblast.file),
    load('gigablast', spec.gigablast.file),
    load('cataclysmFist', spec.cataclysmFist.file),
    load('cataclysmFistAlt', spec.cataclysmFist.altFile),
    load('catastropheSlash', spec.catastropheSlash.file),
    load('catastropheSlashAlt', spec.catastropheSlash.altFile),
    load('ray', spec.ray.file),
    load('wave', spec.wave.file),
    load('monster', spec.monster.file),
    load('monster2', spec.monster2.file)
  ]).then(() => {
    encounterProjectileAssetStatus.state = encounterProjectileAssetStatus.failed ? 'fallback' : 'ready';
  });
  return ready;
}

function getRect(spriteSpec, frame) {
  const row = Math.floor(frame / spriteSpec.columns);
  const col = frame % spriteSpec.columns;
  return {
    sx: col * spriteSpec.cellW,
    sy: row * spriteSpec.cellH,
    w: spriteSpec.cellW,
    h: spriteSpec.cellH
  };
}

export function projectileFrameRect(kind, frame) {
  const spriteSpec = spec[kind];
  if (!spriteSpec) return { sx: 0, sy: 0, w: 32, h: 32 };
  return getRect(spriteSpec, frame);
}

export function projectileImage(name) { return images.get(name); }

export function paintProjectileFrame(ctx, kind, frame, x, y, scale, alpha, facing, angle) {
  const spriteSpec = spec[kind];
  if (!spriteSpec) return false;
  const image = images.get(kind);
  if (!image) return false;
  const rect = projectileFrameRect(kind, frame);
  const factor=Math.abs((spriteSpec.scale||1)*(scale||1)),pivot=spriteSpec.anchor||{x:rect.w/2,y:rect.h/2};
  if(!circleVisible(ctx,x,y,Math.hypot(Math.max(Math.abs(pivot.x),Math.abs(rect.w-pivot.x)),Math.max(Math.abs(pivot.y),Math.abs(rect.h-pivot.y)))*factor))return true;
  ctx.save();
  ctx.globalAlpha *= alpha;
  ctx.translate(x, y);
  ctx.rotate((angle || 0) + (spriteSpec.facingOffset || 0));
  if (facing !== 1) ctx.scale(facing, 1);
  ctx.imageSmoothingEnabled = false;
  const s = (spriteSpec.scale || 1) * (scale || 1);
  const anchor = spriteSpec.anchor || { x: rect.w / 2, y: rect.h / 2 };
  ctx.drawImage(image, rect.sx, rect.sy, rect.w, rect.h, -anchor.x * s, -anchor.y * s, rect.w * s, rect.h * s);
  ctx.restore();
  return true;
}

// For projectiles with alt versions (fist/slash)
export function paintProjectileFrameAlt(ctx, kind, frame, x, y, scale, alpha, facing, angle) {
  const spriteSpec = spec[kind];
  if (!spriteSpec || !spriteSpec.altFile) return paintProjectileFrame(ctx, kind, frame, x, y, scale, alpha, facing, angle);
  const image = images.get(kind + 'Alt');
  if (!image) return paintProjectileFrame(ctx, kind, frame, x, y, scale, alpha, facing, angle);
  const w=spriteSpec.altWidth||image.naturalWidth||spriteSpec.cellW,h=(spriteSpec.altHeight||image.naturalHeight||spriteSpec.height)/spriteSpec.frames;
  const rect={sx:0,sy:(frame%spriteSpec.frames)*h,w,h};
  const factor=Math.abs((spriteSpec.scale||1)*(scale||1)),pivot=spriteSpec.altAnchor||spriteSpec.anchor||{x:rect.w/2,y:rect.h/2};
  if(!circleVisible(ctx,x,y,Math.hypot(Math.max(Math.abs(pivot.x),Math.abs(rect.w-pivot.x)),Math.max(Math.abs(pivot.y),Math.abs(rect.h-pivot.y)))*factor))return true;
  ctx.save();
  ctx.globalAlpha *= alpha;
  ctx.translate(x, y);
  ctx.rotate((angle || 0) + (spriteSpec.facingOffset || 0));
  if (facing !== 1) ctx.scale(facing, 1);
  ctx.imageSmoothingEnabled = false;
  const s = (spriteSpec.scale || 1) * (scale || 1);
  const anchor = spriteSpec.altAnchor || spriteSpec.anchor || { x: rect.w / 2, y: rect.h / 2 };
  ctx.drawImage(image, rect.sx, rect.sy, rect.w, rect.h, -anchor.x * s, -anchor.y * s, rect.w * s, rect.h * s);
  ctx.restore();
  return true;
}

