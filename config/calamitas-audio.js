export const calamitasAudio=Object.freeze({
  altar:{file:'altar.ogg',gain:.60,interval:1},laugh:{file:'laugh.ogg',gain:.72,interval:1},
  dash:{file:'dash.ogg',gain:.50,interval:.15},cast:{file:'cast.ogg',gain:.38,interval:.12},
  bigCast:{file:'big-cast.ogg',gain:.48,interval:.3},hellblast:{file:'hellblast.ogg',gain:.35,interval:.12}
});

// Original Calamity clips and lossless PCM sounds from installed Terraria.
export const meleeAudio=Object.freeze({
 aegisImpact:{file:'../asgardian-original/impact.ogg',gain:.3,interval:.08},
 aegisExplosion:{file:'../asgardian-original/explosion.wav',gain:.5,interval:.08},
 adrenalineLost:{file:'../hud-original/AdrenalineMajorLoss.ogg',gain:.7,interval:.25},
 rageReady:{file:'../hud-original/FullRage.ogg',gain:.6,interval:.3},
 adrenalineReady:{file:'../hud-original/FullAdrenaline.ogg',gain:.6,interval:.3},
 rageActivate:{file:'../hud-original/RageActivate.ogg',gain:.65,interval:.3},
 adrenalineActivate:{file:'../hud-original/AdrenalineActivate.ogg',gain:.65,interval:.3},
 rageEnd:{file:'../hud-original/RageEnd.ogg',gain:.55,interval:.3},
 playerHurt:{files:['vanilla-player-hit-0.wav','vanilla-player-hit-1.wav','vanilla-player-hit-2.wav'],gain:1,interval:.25},
 arkSwing:{file:'vanilla-item-71.wav',gain:.48,interval:.13},
 arkThrow:{files:['phantom-phoenix-1.ogg','phantom-phoenix-2.ogg','phantom-phoenix-3.ogg'],gain:.55,interval:.15},
 arkSnap:{file:'scissor-snap.ogg',gain:.7,interval:.2},
 arkSnapReady:{file:'vanilla-item-4.wav',gain:.35,interval:.2},
 arkSnapEnd:{file:'vanilla-item-84.wav',gain:.35,interval:.2},
 arkParry:{file:'vanilla-item-84.wav',gain:.3,interval:.15},
 arkParrySuccess:{files:['vanilla-dd2-wither-beast-crystal-impact-0.wav','vanilla-dd2-wither-beast-crystal-impact-1.wav','vanilla-dd2-wither-beast-crystal-impact-2.wav'],layers:['scissor-snap.ogg'],gain:.6,interval:.3},
 arkRecharge:{file:'vanilla-item-35.wav',gain:.4,interval:.3},
 arkBigRip:{file:'vanilla-item-84.wav',gain:.3,interval:.4},
 arkRipWindup:{file:'meaty-slash.ogg',gain:.5,pitch:-.5,interval:.4},
 arkRipSlice:{file:'swift-slice.ogg',gain:.65,interval:.4},
 arkStitch:{files:['vanilla-item-63.wav','vanilla-item-64.wav','vanilla-item-65.wav'],gain:.3,interval:.035},
 arkHit:{file:'meaty-slash.ogg',gain:.2,interval:.1}
});
