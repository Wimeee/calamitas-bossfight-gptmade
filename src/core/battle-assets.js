import {initializeSummonerAtlas} from '../render/summoner.js?v=29.1.1';
import {initializeIntroAtlas} from '../render/intro-title.js?v=29.1.1';
import {helperTint} from '../render/helper-atlas.js?v=29.1.1';
import {initializePhotoAtlas} from '../render/ranger.js?v=29.1.1';
import {initializeMageAtlas} from '../render/mage.js?v=29.1.1';
import {initializeArenaAtlas} from '../render/arena-atlas.js?v=29.1.1';
import {initializeHelperAtlas} from '../render/helper-atlas.js?v=29.1.1';
import {initializeHUDAtlas} from '../render/hud-atlas.js?v=29.1.1';
import {initializeCalamitasAtlas} from '../render/calamitas-atlas.js?v=29.1.1';
import {initializeMeleeAtlas} from '../render/melee-atlas.js?v=29.1.1';
import {initializeMinionAtlas} from '../render/minion-atlas.js?v=29.1.1';
import {initializeEncounterProjectileAtlas} from '../render/encounter-projectiles-atlas.js?v=29.1.1';
import {initializeWorldDecorationAtlas} from '../render/world-decorations.js?v=29.1.1';
import {initializeAsgardianAtlas} from '../render/asgardian.js?v=29.1.1';
import {warmNativeArkEffects} from '../render/ark-native.js?v=29.1.1';
let preparation;
export const battlePreparationStatus={state:'idle',failed:0};
export function prepareBattleAssets(){
 if(preparation)return preparation;battlePreparationStatus.state='loading';
 const loaders=[initializeIntroAtlas,initializeSummonerAtlas,initializePhotoAtlas,initializeMageAtlas,initializeArenaAtlas,initializeHelperAtlas,initializeHUDAtlas,initializeCalamitasAtlas,initializeMeleeAtlas,initializeMinionAtlas,initializeEncounterProjectileAtlas,initializeWorldDecorationAtlas,initializeAsgardianAtlas];
 preparation=Promise.allSettled(loaders.map(load=>{try{return load();}catch(e){return Promise.reject(e);}})).then(async results=>{
  battlePreparationStatus.failed=results.filter(r=>r.status==='rejected').length;
  for(const color of ['#ff004d','#fff0f2','#79154d','#ff1238'])helperTint('largeBloom',color);
  for(const color of ['#ff2535','#79154d'])helperTint('pulse',color);
  try{await warmNativeArkEffects();}catch{battlePreparationStatus.failed++;}
  battlePreparationStatus.state='ready';return battlePreparationStatus;
 });return preparation;
}
