import { activateMage, attackMage, updateMage } from './mage.js?v=21.1.1';
import { arkAbility, attackMelee, updateSword } from './melee.js?v=21.1.1';
import { activateRanger, attackRanger, updateRanger } from './ranger.js?v=21.1.1';
import { activateRogue, attackRogue, updateRogue } from './rogue.js?v=21.1.1';
import { activateSummoner, attackSummoner, updateCosmic } from './summoner.js?v=21.1.1';

import { weapons } from '../../config/classes.js?v=21.1.1';

const classRegistry={
  melee:{attack:attackMelee,activate:arkAbility,updateCombat:updateSword},
  ranger:{attack:attackRanger,activate:activateRanger,update:updateRanger},
  mage:{attack:attackMage,activate:activateMage,update:updateMage},
  summon:{attack:attackSummoner,activate:activateSummoner,updateCombat:updateCosmic},
  rogue:{attack:attackRogue,activate:activateRogue,update:updateRogue}
};


export { weapons, classRegistry };
