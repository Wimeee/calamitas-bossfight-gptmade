// Browser-arena adaptation of the current Calamity encounter, not vanilla pixel speeds.
export const encounterBalance=Object.freeze({
  hellDuration:15,edgeWarning:.42,segmentBreath:.65,
  hell:Object.freeze({normal:{interval:.28,speed:175},revenge:{interval:.245,speed:185},death:{interval:.215,speed:200}}),
  dartSpacing:.18,dartInterval:.7,hellblastInterval:.23,hellblastCount:9,
  blastInterval:1.2,attackBreath:.72,
  dashWarning:.32,dashSpeed:1000,dashDuration:.64,dashRecovery:.13,
  blastPause:.65,fireFuse:2.3,gigaFuse:2.9,
  fireDarts:Object.freeze({normal:12,revenge:14,death:16}),
  gigaDarts:Object.freeze({normal:28,revenge:32,death:36}),
  seekerInterval:3,maelstromGrace:1.6,
  sources:Object.freeze(['https://calamitymod.wiki.gg/wiki/Supreme_Calamitas','https://calamitymod.wiki.gg/wiki/Guide:Supreme_Witch,_Calamitas_strategies'])
});
