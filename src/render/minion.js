import {renderQuality} from '../core/settings.js?v=28.0.0';
import {heartTendrilAnchors} from '../world/arena-state.js?v=28.0.0';
import { minionSprites as spec } from '../../config/minion-sprites.js?v=28.0.0';
import {ctx} from '../core/dom.js?v=28.0.0';
import {settings} from '../core/settings.js?v=28.0.0';
import {hpMini,pixel,text} from './primitives.js?v=28.0.0';
import {minionImage,paintMinionFrame,paintSepulcherSegment} from './minion-atlas.js?v=28.0.0';
import {lerp, clamp} from '../core/math.js?v=28.0.0';
const clocks=new WeakMap();
const now=g=>g.ritual?g.ritual.ambient:g.t;

export function brotherPoseState(br,g){
 const time=now(g),kind=br.kind===0?'cataclysm':'catastrophe',s=spec[kind];
 const idleCount=br.kind===0?12:6,absolute=br.nativeFrame??Math.floor(time*60/7)%idleCount,clip=absolute>=idleCount?'attack':'idle';
 let c=clocks.get(br);if(!c){c={clip,entered:time,last:time,facing:1,trail:[]};clocks.set(br,c);}
 if(c.clip!==clip||time<c.last){c.clip=clip;c.entered=time;c.trail.length=0;}
 if(Math.abs(g.player.x-br.x)>12)c.facing=g.player.x>br.x?-1:1;
 if(time>c.last){c.trail.unshift({x:br.x,y:br.y});if(c.trail.length>4)c.trail.pop();}c.last=time;
 const frame=absolute-(clip==='attack'?idleCount:0);
 return {specKind:kind,clip,frame,facing:c.facing,trail:c.trail};
}

export function drawBrother(br,g){
 const p=brotherPoseState(br,g);
 if(renderQuality()!=='low')for(let i=p.trail.length-1;i>0;i--)paintMinionFrame(ctx,p.specKind,p.clip,p.frame,p.trail[i].x,p.trail[i].y,1,.08*(4-i),p.facing,0);
 if(!paintMinionFrame(ctx,p.specKind,p.clip,p.frame,br.x,br.y,1,1,p.facing,0))pixel('brother'+br.kind,br.x,br.y,1.6,0,br.x>g.player.x);
 if(minionImage(p.specKind+'Glow'))paintMinionFrame(ctx,p.specKind,p.clip,p.frame,br.x,br.y,1,.8,p.facing,0,'glow');
 text(br.kind?'CATASTROPHE':'CATACLYSM',br.x,br.y-112,11,'#ffd4ca');hpMini(br.x,br.y-105,br.hp,br.max,65,'#ed9e8b');
}

function lerpAngle(a, b, t) {
  // Shortest-path angle interpolation, normalized to positive modulo
  let diff = b - a;
  diff = ((diff % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2);
  if (diff > Math.PI) diff -= Math.PI * 2;
  return a + diff * t;
}
function lerpVal(a, b, t) {
  return a + (b - a) * t;
}

// Helper: compute limb geometry from a segment and arm pose (shared by sim/render)
function computeArmLimbs(segment, armPose, bodyScale) {
  const segRot = segment.rotation;
  const armRot = armPose.rotation; // arm rotation AT THE TICK (before next-tick advance)
  const dir = armPose.direction;
  const s = bodyScale;

  // offsetFromSegment (source: 92f raw pixels, no scale)
  const baseOffsetX = dir * 60;
  const baseOffsetY = 55;
  const rotAngle = segRot - (Math.PI/2 - armRot * 1.7 - 0.77) * dir;
  const cosR = Math.cos(rotAngle);
  const sinR = Math.sin(rotAngle);
  const rotX = baseOffsetX * cosR - baseOffsetY * sinR;
  const rotY = baseOffsetX * sinR + baseOffsetY * cosR;
  const len = Math.hypot(rotX, rotY) || 1;
  const normX = rotX / len;
  const normY = rotY / len;
  const offsetX = normX * 92; // Raw world pixels
  const offsetY = normY * 92;

  // Limb 0 (forearm)
  const forearmX = segment.x + offsetX;
  const forearmY = segment.y + offsetY;
  const forearmAngle = Math.atan2(offsetY, offsetX);

  // Limb 1 (arm/upper) - source: 84f raw pixels, no scale
  const armNpcX = armPose.x;
  const armNpcY = armPose.y;

  const upperAngle = Math.atan2(armNpcY - forearmY, armNpcX - forearmX);
  const toArmNpcX = armNpcX - forearmX;
  const toArmNpcY = armNpcY - forearmY;
  const toArmLen = Math.hypot(toArmNpcX, toArmNpcY) || 1;

  const upperX = forearmX + offsetX * 0.5 + (toArmNpcX / toArmLen) * 84; // Raw world pixels
  const upperY = forearmY + offsetY * 0.5 + (toArmNpcY / toArmLen) * 84;

  // Hand
  const handX = upperX;
  const handY = upperY;
  const handAngle = upperAngle - Math.PI/2;

  return {
    forearm: { x: forearmX, y: forearmY, rotation: forearmAngle },
    arm: { x: upperX, y: upperY, rotation: upperAngle },
    hand: { x: handX, y: handY, rotation: handAngle },
  };
}

export function drawSepulcher(g){
 const w=g.sepulcher;if(!w||!w.nodes?.length)return;
 const nodes=w.nodes;
 const headScale=w.headScale??1.6875, bodyScale=w.bodyScale??1.35;
 const t = now(g);
 const energySpec = spec.sepulcher.energyBall;
 const energyFps = 12; // 60/5 ticks per frame (source: frameCounter/5)
 const energyFrames = energySpec.frames || 5;

 // Rendering interpolation between simulation ticks
 // State snapshots are captured in minions.js at simulation tick boundaries (w._renderPrev, w._renderCurr)
 // We read them here without mutating game state
 let interpFactor = 0;
 if (w._renderPrev && w._renderCurr) {
   const simStep = 1/60;
   const stepRemainder = g.sepulcherStepRemainder || 0;
   interpFactor = Math.min(1, stepRemainder / simStep);
 }

 function getHead() {
   if (!w._renderPrev || !w._renderCurr) {
     return { x: w.x, y: w.y, rotation: w.rotation, alpha: w.alpha };
   }
   const prev = w._renderPrev.head;
   const curr = w._renderCurr.head;
   return {
     x: lerpVal(prev.x, curr.x, interpFactor),
     y: lerpVal(prev.y, curr.y, interpFactor),
     rotation: lerpAngle(prev.rotation, curr.rotation, interpFactor),
     alpha: lerpVal(prev.alpha, curr.alpha, interpFactor),
   };
 }
 function getNode(i) {
   const src = nodes[i];
   // Preserve immutable metadata (isTail, isEnergyBall, index, hasArms, etc.)
   // while interpolating transform fields
   if (!w._renderPrev || !w._renderCurr) {
     return { ...src, x: src.x, y: src.y, rotation: src.rotation, alpha: src.alpha };
   }
   const prev = w._renderPrev.nodes[i];
   const curr = w._renderCurr.nodes[i];
   return {
     ...src,
     x: lerpVal(prev.x, curr.x, interpFactor),
     y: lerpVal(prev.y, curr.y, interpFactor),
     rotation: lerpAngle(prev.rotation, curr.rotation, interpFactor),
     alpha: lerpVal(prev.alpha, curr.alpha, interpFactor),
   };
 }
 function getArmPose(i) {
   if (!w._renderPrev || !w._renderCurr) {
     const a = w.arms[i];
     // Use pose rotation/position (before oscillation advance) when available
     const rot = a.poseRotation ?? a.rotation;
     const x = a.poseX ?? a.x;
     const y = a.poseY ?? a.y;
     return { x, y, rotation: rot, direction: a.direction };
   }
   const prev = w._renderPrev.arms[i];
   const curr = w._renderCurr.arms[i];
   return {
     x: lerpVal(prev.x, curr.x, interpFactor),
     y: lerpVal(prev.y, curr.y, interpFactor),
     rotation: lerpAngle(prev.rotation, curr.rotation, interpFactor),
     direction: curr.direction, // direction doesn't interpolate
   };
 }

 // Use interpolated head for drawing
 const interpHead = getHead();

 // Draw segments from tail to head for proper layering
 for(let i=nodes.length-1;i>=0;i--){
   const n = getNode(i);
   const ahead = i===0 ? interpHead : getNode(i-1);
   const angle = Math.atan2(ahead.y - n.y, ahead.x - n.x) + Math.PI / 2;

   // Determine segment type and scale (source: SepulcherBody.cs:125-133 alternates texture via localAI[3])
   let segmentType, scale;
   if(n.isTail){
     segmentType = 'tail';
     scale = bodyScale;
   }else if(n.isEnergyBall){
     segmentType = 'energyBall';
     scale = bodyScale;
   }else{
     // Body alternates between body and bodyAlt based on index (SepulcherBody.cs:127)
     segmentType = (n.index / 2) % 2 === 0 ? 'body' : 'bodyAlt';
     scale = bodyScale;
   }

   // Energy ball frame animation (source: SepulcherBodyEnergyBall.cs FindFrame)
   // frameCounter increments per tick (60Hz), frame changes every 5 ticks = 12fps
   // Frame = ((frameCounter / 5) + whoAmI) % 6. We use segment index as phase offset.
   let energyFrame = 0;
   if(segmentType === 'energyBall'){
     energyFrame = Math.floor(t * energyFps + n.index) % energyFrames;
   }

   // Apply opacity cascade: segment alpha (0-255) -> opacity (0-1)
   const segAlpha = n.alpha !== undefined ? n.alpha : 255;
   const segOpacity = clamp(1 - segAlpha / 255, 0, 1);

   paintSepulcherSegment(ctx, segmentType, n.x, n.y, angle, scale, segOpacity, energyFrame);

   // Arms on every 4th segment starting at index 3 (SepulcherHead.cs:138-161)
   // Source arm geometry from SepulcherArm.cs UpdateLimbs() and AI()
   // Each segment has two arms (direction = 1 and -1) with rotationalOffset incrementing by Pi/6 per arm
   // offsetFromSegment = new Vector2(direction * 60f, 55f).RotatedBy(segment.rotation - (PiOver2 - arm.rotation * 1.7f - 0.77f) * direction).SafeNormalize(Vector2.UnitY) * 92f
   // Limb[0] (forearm): Center = segment.Center + offsetFromSegment, Rotation = offsetFromSegment.ToRotation()
   // Limb[1] (arm): Rotation = NPC.AngleFrom(Limb[0].Center), Center = Limb[0].Center + offsetFromSegment * 0.5f + (NPC.Center - Limb[0].Center).SafeNormalize(Vector2.UnitY) * 84f
   // Hand: drawn at Limb[1].Center with rotation Limb[1].Rotation - PiOver2

   if(n.hasArms && w.arms){
     // Find the two arms for this segment
     const segArms = w.arms.filter(a => a.segmentIndex === i);
     for(const arm of segArms){
       // Find the arm index in the w.arms array
       const armIndex = w.arms.indexOf(arm);
       const interpArmPose = getArmPose(armIndex);

       const dir = interpArmPose.direction; // 1 or -1
       const armAlpha = n.alpha !== undefined ? n.alpha : 255;
       const armOpacity = clamp(1 - armAlpha / 255, 0, 1);

       // Compute limbs using the interpolated arm pose (same pose used for simulation at this tick)
       const limbs = computeArmLimbs(n, interpArmPose, bodyScale);

       // Draw forearm
       paintSepulcherSegment(ctx, 'forearm', limbs.forearm.x, limbs.forearm.y, limbs.forearm.rotation + Math.PI/2, bodyScale, armOpacity);

       // Draw arm (upper)
       paintSepulcherSegment(ctx, 'arm', limbs.arm.x, limbs.arm.y, limbs.arm.rotation + Math.PI/2, bodyScale, armOpacity);

       // Draw hand - pass numeric direction (-1 or 1) for horizontal flip
       paintSepulcherSegment(ctx, 'hand', limbs.hand.x, limbs.hand.y, limbs.hand.rotation, bodyScale, armOpacity, 0, dir);
     }
   }
 }

 // Draw head (SepulcherHead.cs:362-376, rotation = atan2(velocity.Y, velocity.X) + PiOver2)
 const headAlpha = interpHead.alpha !== undefined ? interpHead.alpha : 255;
 const headOpacity = clamp(1 - headAlpha / 255, 0, 1);
 const headAngle = interpHead.rotation;
 paintSepulcherSegment(ctx, 'head', interpHead.x, interpHead.y, headAngle, headScale, headOpacity);

 // DO NOT mutate w._prevRenderState or any game state here - rendering is read-only
}

export function drawSeeker(s,g){
 const frame=s.nativeFrame??Math.floor(now(g)*12)%6,facing=g.player.x>s.x?1:-1;
 if(s.previousX!==undefined){paintMinionFrame(ctx,'seeker','orbit',frame,s.previousX,s.previousY,1,1/15,facing,0);}
 if(!paintMinionFrame(ctx,'seeker','orbit',frame,s.x,s.y,1,1,facing,0))pixel('seeker',s.x,s.y,1.25);
 if(minionImage('seekerGlow'))paintMinionFrame(ctx,'seeker','orbit',frame,s.x,s.y,1,.65,facing,0,'glow');
 hpMini(s.x,s.y-60,s.hp,s.max,27,'#db77a4');
}

export function drawHeart(h,g){
 const anchors=heartTendrilAnchors(h,h.tendrilIndex??g.hearts.indexOf(h));ctx.save();
 for(let i=0;i<anchors.length;i++){const a=anchors[i];ctx.strokeStyle='#8f172b';ctx.lineWidth=3+Math.pow(Math.max(0,Math.sin(now(g)*2.6+(h.tendrilIndex||0)*1.3)),16)*3.2;ctx.beginPath();ctx.moveTo(a.x,a.y);
  for(let j=1;j<=24;j++){const f=j/24,wave=Math.sin(now(g)*2.6+i+f*9)*5*Math.sin(f*Math.PI);ctx.lineTo(a.x+(h.x-a.x)*f+wave,a.y+(h.y-a.y)*f);}
  ctx.stroke();ctx.strokeStyle='#e33a4b';ctx.lineWidth=1;ctx.stroke();
 }ctx.restore();
 const index=h.tendrilIndex??g.hearts.indexOf(h),frame=Math.min(5,Math.round(Math.pow(Math.sin(now(g)*2.6+index*1.3),6)*6));
 if(!paintMinionFrame(ctx,'heart','idle',frame,h.x,h.y,1,1,1,0))pixel('heart',h.x,h.y,1.5);
 hpMini(h.x,h.y-37,h.hp,h.max,35,'#ed9e8b');
}

export function triggerHeartHit(){}
export function triggerSepulcherSegmentHit(){}
export function minionVisualCacheSize(){return 0;}