import {ctx} from '../core/dom.js?v=25.0.1';
import {settings} from '../core/settings.js?v=25.0.1';

const images = new Map();
let ready = null;
export const worldDecorationAssetStatus = { state: 'idle', loaded: 0, failed: 0 };

function load(name, file) {
  return new Promise(resolve => {
    const image = new Image();
    image.onload = () => {
      try {
        images.set(name, image);
        worldDecorationAssetStatus.loaded++;
      } catch {
        worldDecorationAssetStatus.failed++;
      }
      resolve();
    };
    image.onerror = () => { worldDecorationAssetStatus.failed++; resolve(); };
    image.src = new URL('../../assets/world-original/' + file, import.meta.url).href;
  });
}

export function initializeWorldDecorationAtlas() {
  if (ready) return ready;
  if (typeof Image === 'undefined') { worldDecorationAssetStatus.state = 'unsupported'; return Promise.resolve(); }
  worldDecorationAssetStatus.state = 'loading';

  ready = Promise.all([
    load('altar', 'altar-assembled.png'),
    load('urn', 'CeremonialUrn.png'),
    load('campfire', 'campfire-assembled.png'),
    load('heartLantern', 'heart-lantern-assembled.png'),
    load('heartPickup', 'terraria-heart.png'),
    load('manaPickup', 'terraria-mana-star.png')
  ]).then(() => {
    worldDecorationAssetStatus.state = worldDecorationAssetStatus.failed ? 'fallback' : 'ready';
  });
  return ready;
}

export function worldDecorationImage(name) { return images.get(name); }

export function paintWorldDecoration(ctx, name, x, y, scale, alpha, frame, facing = 1) {
  const image = images.get(name);
  if (!image) return false;
  ctx.save();
  ctx.globalAlpha *= alpha;
  ctx.translate(x, y);
  if (facing !== 1) ctx.scale(facing, 1);
  ctx.imageSmoothingEnabled = false;
  const s = scale || 1;
  let sx = 0, sy = 0, sw = image.width, sh = image.height;
  if (name === 'campfire' && frame !== undefined) {
    const frameH = 32;
    sy = (frame % 8) * frameH;
    sh = frameH;
  }
  ctx.drawImage(image, sx, sy, sw, sh, -sw / 2 * s, -sh * s, sw * s, sh * s);
  ctx.restore();
  return true;
}

export function drawWorldDecorations(g) {
  if (!g) return;
  const t = g.terrain || { altar: {x: 500, y: 300}, campfire: {x: 230, y: 558}, lantern: {x: 750, y: 285} };
  const time = g.ritual ? g.ritual.ambient : (g.t || 0);

  // Draw campfire (animated, 8 frames at ~12fps)
  const campfireFrame = Math.floor(time * 12) % 8;
  paintWorldDecoration(ctx, 'campfire', t.campfire.x, t.campfire.y, 1, 1, campfireFrame);

  // Draw heart lantern (static)
  paintWorldDecoration(ctx, 'heartLantern', t.lantern.x, t.lantern.y, 1, 1);

  // Draw altar (always drawn, replaced procedural altar)
  paintWorldDecoration(ctx, 'altar', t.altar.x, t.altar.y, 1, 1);

  // Draw Ceremonial Urn during ritual preparation/summoning phases
  if (g.ritual && (g.ritual.phase === 'preparation' || g.ritual.phase === 'summoning')) {
    // Urn sits on top of the altar
    const urnX = t.altar.x;
    const urnY = t.altar.y - 48; // altar is 48px tall, urn is 54px tall
    paintWorldDecoration(ctx, 'urn', urnX, urnY, 1, 1);
  }
}