// Rectangles exclude the source sheets' labels. Anchors are relative to each rectangle.
// boxes: array of [x, w] - x is ignored if yOffset provided (for vertical layouts)
// yOffset: optional function(index) => y coordinate for vertical sheet layouts
const frames=(boxes,y,h,anchor,yOffset)=>boxes.map(([x,w],i)=>({
  x: yOffset ? 0 : x,
  y: yOffset ? yOffset(i) : y,
  w, h,
  ax: anchor ? anchor(w,i)[0] : w/2,
  ay: anchor ? anchor(w,i)[1] : h/2
}));
const body={
  idle:frames([[214,96],[359,97],[503,96],[642,100]],10,128),
  run:frames([[198,142],[371,140],[552,131],[732,135],[903,128],[1066,139]],139,131),
  rise:frames([[205,108],[363,121],[534,118],[692,136]],276,132),
  fall:frames([[205,122],[367,125],[538,129],[709,131]],410,125),
  dash:frames([[196,156],[374,229],[616,278],[921,240],[1180,202],[1410,241]],535,108,w=>[w-58,59]),
  hurt:frames([[210,109],[367,97],[522,99]],645,100,w=>[w/2,53]),
  death:frames([[220,85],[378,119],[553,148],[727,158],[909,158],[1089,215]],749,88,w=>[w/2,67])
};
// Registered to the chest, using the visor as a stable landmark in every pose.
// Sheet-cell centers drift as legs, helmets and dash flames change silhouette.
const chestAnchors={
  idle:[[54,75],[52,74],[54,74],[56,76]],
  run:[[96,69],[96,69],[89,67],[92,68],[87,66],[95,64]],
  rise:[[67,64],[79,63],[77,65],[93,61]],
  fall:[[78,68],[82,69],[86,73],[86,74]],
  dash:[[114,65],[172,63],[236,63],[195,65],[160,64],[177,60]],
  hurt:[[54,50],[51,55],[58,53]],
  death:[[43,36],[53,36],[60,36],[100,36],[100,36],[130,36]]
};
for(const [name,anchors]of Object.entries(chestAnchors))body[name].forEach((frame,i)=>{[frame.ax,frame.ay]=anchors[i];});
const ark={
  closed:frames([[58,118],[218,111],[364,118],[511,134],[659,148]],45,184,w=>[w*.5,164]),
  open:frames([[846,181],[1038,187],[1227,196],[1425,210]],39,196,()=>[36,153]),
  slash:frames([[25,252],[279,252],[532,262],[796,260],[1058,282],[1342,313]],250,157,()=>[34,126]),
  spin:frames([[25,254],[282,258],[546,263],[813,282],[1100,272],[1376,274]],430,158),
  snap:frames([[28,162],[194,176],[372,193],[570,205]],613,163),
  rip:frames([[786,183],[972,185],[1159,205],[1367,280]],613,163),
  bolt:frames([[28,105],[134,100],[235,101],[337,124],[463,135]],811,123),
  impact:frames([[622,122],[746,141],[889,143],[1034,153]],811,123),
  fire:frames([[1218,109],[1329,108]],813,121),
  star:frames([[1447,85],[1534,105]],813,121)
};

// Wings of Rebirth (YharonBag drop) — native layout from WingsofRebirth_Wings_Real.rawimg
// 9 frames (0-8), each 180x174. Source: 180x1566 = 9 x 180x174 (VERTICAL layout)
// Frame 0: grounded, Frame 1: gliding, Frame 2: falling
// Frames 3-8: active flight loop (enters at 7, then 8, then 1..8 looping)
// Pivot: texture.Width/2, texture.Height/18 = 90, 87 (from WingsofRebirthLayer.cs)
// Frame rate: advances every 5 source ticks = 12 FPS at 60Hz (WingUpdate: frameRate=5)
// Frame rect: x=0, y=index*174, w=180, h=174
const wings={
  grounded:frames([[0,180],[0,180],[0,180],[0,180],[0,180],[0,180],[0,180],[0,180],[0,180]],0,174,()=>[90,87], (i)=>i*174),
  gliding:frames([[0,180],[0,180],[0,180],[0,180],[0,180],[0,180],[0,180],[0,180],[0,180]],0,174,()=>[90,87], (i)=>i*174),
  falling:frames([[0,180],[0,180],[0,180],[0,180],[0,180],[0,180],[0,180],[0,180],[0,180]],0,174,()=>[90,87], (i)=>i*174),
  flight:frames([[0,180],[0,180],[0,180],[0,180],[0,180],[0,180],[0,180],[0,180],[0,180]],0,174,()=>[90,87], (i)=>i*174)
};

// RendingNeedle (Ark Beam) — native texture from RendingNeedle.rawimg (14x88)
// Single texture, centered. Scale 2.4f, opacity 0.6f in source.
// Rotation: velocity.ToRotation() + PiOver2
const rendingNeedle={
  fly:frames([[0,14]],0,88,()=>[7,44])
};

// GalaxiaBolt / EonBolt (Ark Star/homing) — native texture from GalaxiaBolt.rawimg (22x34)
// Single texture, centered. Used by EonBolt projectile for homing stars.
const galaxiaBolt={
  fly:frames([[0,22]],0,34,()=>[11,17])
};

export const meleeSpriteConfig=Object.freeze({body,ark,wings,rendingNeedle,galaxiaBolt,bodyScale:.38});
