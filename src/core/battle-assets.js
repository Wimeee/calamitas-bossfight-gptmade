import {initializeArenaAtlas} from '../render/arena-atlas.js?v=26.0.4';
import {initializeHelperAtlas} from '../render/helper-atlas.js?v=26.0.4';
import {initializeHUDAtlas} from '../render/hud-atlas.js?v=26.0.4';
import {initializeCalamitasAtlas} from '../render/calamitas-atlas.js?v=26.0.4';
import {initializeMeleeAtlas} from '../render/melee-atlas.js?v=26.0.4';
import {initializeMinionAtlas} from '../render/minion-atlas.js?v=26.0.4';
import {initializeEncounterProjectileAtlas} from '../render/encounter-projectiles-atlas.js?v=26.0.4';
import {initializeWorldDecorationAtlas} from '../render/world-decorations.js?v=26.0.4';
import {initializeAsgardianAtlas} from '../render/asgardian.js?v=26.0.4';
import {warmNativeArkEffects} from '../render/ark-native.js?v=26.0.4';
let preparation;
export const battlePreparationStatus={state:'idle',failed:0};
export function prepareBattleAssets(){
 if(preparation)return preparation;battlePreparationStatus.state='loading';
 const loaders=[initializeArenaAtlas,initializeHelperAtlas,initializeHUDAtlas,initializeCalamitasAtlas,initializeMeleeAtlas,initializeMinionAtlas,initializeEncounterProjectileAtlas,initializeWorldDecorationAtlas,initializeAsgardianAtlas];
 preparation=Promise.allSettled(loaders.map(load=>{try{return load();}catch(e){return Promise.reject(e);}})).then(async results=>{
  battlePreparationStatus.failed=results.filter(r=>r.status==='rejected').length;
  try{await warmNativeArkEffects();}catch{battlePreparationStatus.failed++;}
  battlePreparationStatus.state='ready';return battlePreparationStatus;
 });return preparation;
}
