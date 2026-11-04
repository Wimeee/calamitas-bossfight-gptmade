import { movementConfig } from '../../config/movement.js?v=28.0.0';
import { ctx } from '../core/dom.js?v=28.0.0';
import { state } from '../core/state.js?v=28.0.0';
import { meleeAtlasReady, drawMeleeFrame, meleeFrameCount } from './melee-atlas.js?v=28.0.0';
import { warriorPose } from './warrior.js?v=28.0.0';

const wingClocks = new WeakMap();

export function drawFlightWings(g){
  const p=g.player; if(!p.physics) return;

  // All classes equip the same Wings of Rebirth.
  if(!meleeAtlasReady('wings')){
    drawFlightWingsFallback(g);
    return;
  }

  const t = g.ritual?.ambient ?? g.t;

  // Get or create wing clock for this game instance (presentation-only, must not mutate simulation)
  let clock = wingClocks.get(g);
  if(!clock){
    clock = { flightStartTime: 0, inPoweredFlight: false, frameIndex: 0, lastFrameTime: t, lastPlayer: p };
    wingClocks.set(g, clock);
  }

  // Reset clock if time rewound or player identity changed
  if(t < clock.lastFrameTime || clock.lastPlayer !== p){
    clock.flightStartTime = t;
    clock.inPoweredFlight = false;
    clock.frameIndex = 0;
    clock.lastPlayer = p;
  }

  // Pause must freeze presentation timers
  if(g.mode === 'paused'){
    clock.lastFrameTime = t;
    // Draw current frame without advancing
    drawWarriorWings(g, p, clock.frameIndex);
    return;
  }

  // Determine flight state using existing game flight flags (not vy<0 assumption)
  const holdingJump = (state.keys?.w || state.keys?.ArrowUp || state.keys?.Space);
  const poweredFlight = p.flying && p.flightRemaining > 0 && p.vy !== 0;
  const gliding = holdingJump && p.vy > 0;
  const falling = p.flying && p.vy > 0 && !holdingJump;
  const grounded = p.grounded;

  // Source WingUpdate logic:
  // - When jump + remainingwingtime + nonzero vy: animate 7,8,1..6 at 12fps (INCLUDING downward powered flight)
  // - Otherwise: grounded=0, airborne holding jump=1, airborne vy!=0 (falling/rising)=2, passive hover=1
  // Entry time should start at 7 when powered flight begins

  let frameIndex;
  const frameRate = 12; // FPS (5 source ticks per frame at 60Hz)

  if(grounded){
    // Grounded pose (frame 0)
    frameIndex = 0;
    clock.inPoweredFlight = false;
  }else if(poweredFlight){
    // Powered flight (rising OR downward powered flight) - use flight animation loop
    // Source: starts at frame 7, then 8, then loops 1-6
    if(!clock.inPoweredFlight){
      // Powered flight just began - reset to entry frame 7
      clock.inPoweredFlight = true;
      clock.flightStartTime = t;
      clock.frameIndex = 7;
    }else{
      // Continue flight animation at 12 FPS
      const flightFrames = [7, 8, 1, 2, 3, 4, 5, 6]; // 8 frames: 7,8 then 1-6 loop
      const elapsed = t - clock.flightStartTime;
      const cycleIndex = Math.floor(elapsed * frameRate) % flightFrames.length;
      clock.frameIndex = flightFrames[cycleIndex];
    }
    frameIndex = clock.frameIndex;
  }else if(gliding){
    // Gliding (holding jump while falling) - frame 1
    frameIndex = 1;
    clock.inPoweredFlight = false;
  }else if(falling){
    // Falling (not holding jump) - frame 2
    frameIndex = 2;
    clock.inPoweredFlight = false;
  }else if(p.vy !== 0){
    // Airborne with nonzero vy (rising or falling) but not powered flight - frame 2 (passive fall)
    frameIndex = 2;
    clock.inPoweredFlight = false;
  }else{
    // Airborne hover (vy == 0) - passive glide frame 1
    frameIndex = 1;
    clock.inPoweredFlight = false;
  }

  // Store frameIndex after EVERY pose so pause freezes actual pose
  clock.frameIndex = frameIndex;
  clock.lastFrameTime = t;

  // Draw wings ONCE at center offset/pivot 90,87 and mirror according to actual player facing/aim
  drawWarriorWings(g, p, frameIndex);
}

function drawWarriorWings(g, p, frameIndex){
  // Reuse warriorPose facing logic for consistent mirroring
  const pose = warriorPose(g);
  const flip = pose.flip;

  // Native pivot from source: 90, 87 (texture.Width/2, texture.Height/18)
  // Draw single full wing sprite at player position with presentation scale
  // Source offset: x - 2 * direction, y - 2 (from WingsOfRebirth.cs draw position adjustment)
  const scale = 1; // Native DrawData scale, shared by all classes
  const pivotX = 90;
  const pivotY = 87;
  const sourceOffsetX = -2 * (flip ? -1 : 1); // x - 2 * direction
  const sourceOffsetY = -2; // y - 2
  const offsetX = sourceOffsetX * scale;
  const offsetY = sourceOffsetY * scale;

  drawMeleeFrame('wings', 'flight', frameIndex, p.x + offsetX, p.y + offsetY, scale, 0, flip);
}

function drawFlightWingsFallback(g){
  const p=g.player; if(!p.physics) return;
  // Other classes only show procedural wings when actually flying (p.flying guard)
  if(!p.flying) return;
  const t=g.ritual?.ambient??g.t, flap=Math.sin(t*24)*5;
  ctx.save(); ctx.translate(p.x,p.y-5); ctx.shadowBlur=0;
  for(const side of [-1,1])for(let i=0;i<3;i++){
    ctx.fillStyle=i===0?'#d9b576b8':i===1?'#90c8edaa':'#8660b8a0';
    ctx.beginPath(); ctx.moveTo(side*4,5); ctx.lineTo(side*(32-i*6),-15+i*8+flap);
    ctx.lineTo(side*(24-i*5),8+i*3+flap*.4); ctx.closePath(); ctx.fill();
  }
  ctx.restore();
}

export function drawFlightGauge(g){
  const p=g.player; if(!p.physics||p.grounded) return;
  const ratio=p.flightRemaining/movementConfig.flightTime;
  ctx.fillStyle='#0d0818dd'; ctx.fillRect(p.x+26,p.y-20,5,34);
  ctx.fillStyle=ratio>.2?'#a5d9f1':'#e7937a'; ctx.fillRect(p.x+27,p.y+13-ratio*32,3,ratio*32);
}

// Reset wing presentation cache on new game/player
export function resetWingClock(g){
  wingClocks.delete(g);
}