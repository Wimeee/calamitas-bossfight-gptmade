import { minionSprites as spec } from '../../config/minion-sprites.js?v=26.1.1';

const images = new Map();
let ready = null;
export const minionAssetStatus = { state: 'idle', loaded: 0, failed: 0 };

function load(name, file) {
  return new Promise(resolve => {
    const image = new Image();
    image.onload = () => {
      try {
        images.set(name, image);
        minionAssetStatus.loaded++;
      } catch {
        minionAssetStatus.failed++;
      }
      resolve();
    };
    image.onerror = () => { minionAssetStatus.failed++; resolve(); };
    image.src = new URL('../../assets/calamitas/encounter/' + file, import.meta.url).href;
  });
}

export function initializeMinionAtlas() {
  if (ready) return ready;
  if (typeof Image === 'undefined') { minionAssetStatus.state = 'unsupported'; return Promise.resolve(); }
  minionAssetStatus.state = 'loading';

  ready = Promise.all([
    // Brothers
    load('cataclysm', spec.cataclysm.file),
    load('cataclysmGlow', spec.cataclysm.glowFile),
    load('cataclysmHead', spec.cataclysm.headFile),
    load('catastrophe', spec.catastrophe.file),
    load('catastropheGlow', spec.catastrophe.glowFile),
    load('catastropheHead', spec.catastrophe.headFile),
    // Sepulcher
    load('sepulcherHead', spec.sepulcher.head.file),
    load('sepulcherBody', spec.sepulcher.body.file),
    load('sepulcherBodyAlt', spec.sepulcher.bodyAlt.file),
    load('sepulcherEnergyBall', spec.sepulcher.energyBall.file),
    load('sepulcherArm', spec.sepulcher.arm.file),
    load('sepulcherForearm', spec.sepulcher.forearm.file),
    load('sepulcherHand', spec.sepulcher.hand.file),
    load('sepulcherTail', spec.sepulcher.tail.file),
    // Seeker
    load('seeker', spec.seeker.file),
    load('seekerGlow', spec.seeker.glowFile),
    // Heart
    load('heart', spec.heart.file),
    // Maelstrom extras
    load('soulVortex', spec.soulVortex.file),
    load('largeBloom', spec.largeBloom.file)
  ]).then(() => {
    minionAssetStatus.state = minionAssetStatus.failed ? 'fallback' : 'ready';
  });
  return ready;
}

function getRect(s,clip,frame){
 const sequence=s.sequences?.[clip]||s.sequences?.idle;
 const index=sequence?sequence[Math.max(0,frame|0)%sequence.length]:(s.clips[clip]||0)*s.framesPerClip+Math.max(0,frame|0)%s.framesPerClip;
 return {sx:Math.floor(index/s.rows)*s.cellW,sy:(index%s.rows)*s.cellH,w:s.cellW,h:s.cellH};
}

export function minionFrameRect(kind, clip, frame) {
  const spriteSpec = spec[kind];
  if (!spriteSpec) return { sx: 0, sy: 0, w: 64, h: 64 };
  return getRect(spriteSpec, clip, frame);
}

export function minionImage(name) { return images.get(name); }

export function paintMinionFrame(ctx, kind, clip, frame, x, y, scale, alpha, facing, angle, skin) {
  const spriteSpec = spec[kind];
  if (!spriteSpec) return false;
  const image = images.get(kind + (skin === 'glow' ? 'Glow' : ''));
  if (!image) return false;
  const rect = minionFrameRect(kind, clip, frame);
  ctx.save();
  ctx.globalAlpha *= alpha;
  ctx.translate(x, y);
  if (angle) ctx.rotate(angle);
  if (facing !== 1) ctx.scale(facing, 1);
  ctx.imageSmoothingEnabled = false;
  const s = (spriteSpec.scale || 1) * (scale || 1);
  ctx.drawImage(image, rect.sx, rect.sy, rect.w, rect.h, -spriteSpec.anchor.x * s, -spriteSpec.anchor.y * s, rect.w * s, rect.h * s);
  ctx.restore();
  return true;
}

// Sepulcher segment drawing helpers
export function paintSepulcherSegment(ctx, segmentType, x, y, angle, scale, alpha, frame, facing = 1) {
  const part = spec.sepulcher[segmentType];
  if (!part) return false;
  const image = images.get('sepulcher' + segmentType.charAt(0).toUpperCase() + segmentType.slice(1));
  if (!image) return false;
  ctx.save();
  ctx.globalAlpha *= alpha;
  ctx.translate(x, y);
  ctx.rotate(angle);
  // Arm sprite uses vertical flip (source: SepulcherArm.cs:196 - SpriteEffects.FlipVertically)
  // Hand sprite uses direction-based horizontal flip (source: SepulcherArm.cs:199)
  if (segmentType === 'arm') {
    ctx.scale(1, -1); // Vertical flip
  } else if (segmentType === 'hand' && facing === -1) {
    ctx.scale(-1, 1); // Horizontal flip for direction
  }
  ctx.imageSmoothingEnabled = false;
  const s = scale || 1;
  let sx = 0, sy = 0, sw = part.width, sh = part.height;
  if (segmentType === 'energyBall' && part.cellH && part.frames) {
    // Source: SepulcherBodyEnergyBall.cs FindFrame - 5 frames, 24px each, 5 ticks/frame at 60Hz = 12fps
    // Frame index passed in; sprite sheet is 22x120 (5 frames vertical)
    const f = Math.max(0, Math.min(part.frames - 1, frame | 0));
    sy = f * part.cellH;
    sh = part.cellH;
  }
  ctx.drawImage(image, sx, sy, sw, sh, -part.anchor.x * s, -part.anchor.y * s, sw * s, sh * s);
  ctx.restore();
  return true;
}

