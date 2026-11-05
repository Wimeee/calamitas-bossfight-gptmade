import {initializeSummonerAtlas} from '../render/summoner.js?v=30.0.0';
import {initializeIntroAtlas} from '../render/intro-title.js?v=30.0.0';
import {initializeRogueAtlas} from '../render/rogue.js?v=30.0.0';
import {helperTint} from '../render/helper-atlas.js?v=30.0.0';
import {initializePhotoAtlas} from '../render/ranger.js?v=30.0.0';
import {initializeMageAtlas} from '../render/mage.js?v=30.0.0';
import {initializeArenaAtlas} from '../render/arena-atlas.js?v=30.0.0';
import {initializeHelperAtlas} from '../render/helper-atlas.js?v=30.0.0';
import {initializeHUDAtlas} from '../render/hud-atlas.js?v=30.0.0';
import {initializeCalamitasAtlas} from '../render/calamitas-atlas.js?v=30.0.0';
import {initializeMeleeAtlas} from '../render/melee-atlas.js?v=30.0.0';
import {initializeMinionAtlas} from '../render/minion-atlas.js?v=30.0.0';
import {initializeEncounterProjectileAtlas} from '../render/encounter-projectiles-atlas.js?v=30.0.0';
import {initializeWorldDecorationAtlas} from '../render/world-decorations.js?v=30.0.0';
import {initializeAsgardianAtlas} from '../render/asgardian.js?v=30.0.0';
import {warmNativeArkEffects} from '../render/ark-native.js?v=30.0.0';
let preparation;
export const battlePreparationStatus={state:'idle',failed:0};
export function prepareBattleAssets(){
 if(preparation)return preparation;battlePreparationStatus.state='loading';
 const loaders=[initializeRogueAtlas,initializeIntroAtlas,initializeSummonerAtlas,initializePhotoAtlas,initializeMageAtlas,initializeArenaAtlas,initializeHelperAtlas,initializeHUDAtlas,initializeCalamitasAtlas,initializeMeleeAtlas,initializeMinionAtlas,initializeEncounterProjectileAtlas,initializeWorldDecorationAtlas,initializeAsgardianAtlas];
 preparation=Promise.allSettled(loaders.map(load=>{try{return load();}catch(e){return Promise.reject(e);}})).then(async results=>{
  battlePreparationStatus.failed=results.filter(r=>r.status==='rejected').length;
  for(const color of ['#ff004d','#fff0f2','#79154d','#ff1238'])helperTint('largeBloom',color);
  for(const color of ['#ff2535','#79154d'])helperTint('pulse',color);
  helperTint('nativeSpark','#ff334e');
  try{await warmNativeArkEffects();}catch{battlePreparationStatus.failed++;}
  battlePreparationStatus.state='ready';return battlePreparationStatus;
 });return preparation;
}
