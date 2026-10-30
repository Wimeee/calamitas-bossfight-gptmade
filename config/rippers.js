// Base Calamity rules, without permanent boosters or accessory exceptions.
export const rippersConfig=Object.freeze({
  rageDuration:9,rageMultiplier:1.35,rageBossCharge:15,rageEnemyCharge:45,
  rageNear:160,rageFar:800,rageFadeDelay:10,rageFadeTime:30,
  adrenalineCharge:30,adrenalineDuration:5,adrenalineMultiplier:2.5,
  adrenalinePause:1,adrenalineMinLoss:.25,adrenalineFullLossHP:.05,fullAdrenalineDR:.5,
  sources:['https://calamitymod.wiki.gg/wiki/Rage_Bar','https://calamitymod.wiki.gg/wiki/Adrenaline_Bar',
  'https://github.com/CalamityTeam/CalamityModPublic/blob/1.4.4/CalPlayer/CalamityPlayerMiscEffects.cs']
});
