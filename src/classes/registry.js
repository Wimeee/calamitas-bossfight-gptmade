import { activateMage, attackMage, updateMage, updateMageCombat } from './mage.js?v=30.0.0';
import { arkAbility, attackMelee, updateSword } from './melee.js?v=30.0.0';
import { activateRanger, attackRanger, updateRanger, updateRangerCombat } from './ranger.js?v=30.0.0';
import { activateRogue, attackRogue, updateRogue,updateRogueCombat } from './rogue.js?v=30.0.0';
import { activateSummoner, attackSummoner, updateCosmic } from './summoner.js?v=30.0.0';

import { weapons } from '../../config/classes.js?v=30.0.0';

const classRegistry={
  melee:{attack:attackMelee,activate:arkAbility,updateCombat:updateSword},
  ranger:{attack:attackRanger,activate:activateRanger,update:updateRanger,updateCombat:updateRangerCombat},
  mage:{attack:attackMage,activate:activateMage,update:updateMage,updateCombat:updateMageCombat},
  summon:{attack:attackSummoner,activate:activateSummoner,updateCombat:updateCosmic},
  rogue:{attack:attackRogue,activate:activateRogue,update:updateRogue,updateCombat:updateRogueCombat}
};


export { weapons, classRegistry };
