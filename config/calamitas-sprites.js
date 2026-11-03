// Official sheet layout: 2 columns x 21 rows = 7 animations x 6 frames.
export const calamitasSprites=Object.freeze({
  hooded:{file:'hooded.png',width:120,height:1302,cellW:60,cellH:62},
  unhooded:{file:'unhooded.png',width:120,height:1260,cellW:60,cellH:60},
  shieldTop:{file:'shield-top.png',width:76,height:86},
  shieldBottom:{file:'shield-bottom.png',width:50,height:42},
  forcefield:{file:'forcefield.png',width:72,height:72},
  columns:2,rows:21,framesPerClip:6,scale:1,
  // Source: native 60×62 body; forcefield diameter 72×3=216px, immune smear 156×1.35=210.6px at scale 1.
  fieldRadius:108,immuneRadius:105.3,chargeScale:.45,fieldResponse:5,
  // Aura noise animation: 24 frames at 128×128, cached at load.
  auraFrames:24,auraCacheSize:128,
  clips:{idle:0,dash:1,casting:2,blast:3,blastPunch:4,handCast:5,handPunch:6},
  source:'https://github.com/CalamityTeam/CalamityModPublic/blob/1.4.4/NPCs/SupremeCalamitas/SupremeCalamitas.cs'
});
