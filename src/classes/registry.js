import { activateMage, attackMage, updateMage } from './mage.js?v=17.0.0';
import { arkAbility, attackMelee, updateSword } from './melee.js?v=17.0.0';
import { activateRanger, attackRanger, updateRanger } from './ranger.js?v=17.0.0';
import { activateRogue, attackRogue, updateRogue } from './rogue.js?v=17.0.0';
import { activateSummoner, attackSummoner, updateCosmic } from './summoner.js?v=17.0.0';

const weapons=[
  {
    id:'melee',
    name:'Ark of the Cosmos',
    label:'1 ⚔ Melee',
    desc:'ПКМ: 4 удари + кидок; відпусти для SNAP • ЛКМ: парирування / Big Rip',
    mana:0,
    cool:.265,
    dmg:950,
    speed:830,
    rad:8,
    col:'#91e7ff'
  },
  {
    id:'ranger',
    name:'Photoviscerator',
    label:'2 🔫 Ranger',
    desc:'ПКМ: промінь з нагрівом • ЛКМ: пробивний Exo Shot, скидання нагріву',
    mana:0,
    cool:.085,
    dmg:470,
    speed:1050,
    rad:5,
    col:'#ffbc5c'
  },
  {
    id:'mage',
    name:"Yharim's Crystal",
    label:'3 ✧ Mage',
    desc:'ПКМ: 6 Dragonfire-променів • ЛКМ: Nova за повний резонанс, +75 мани',
    mana:4.5,
    cool:.065,
    dmg:300,
    speed:1160,
    rad:8,
    col:'#d991ff'
  },
  {
    id:'summon',
    name:'Cosmic Immaterializer',
    label:'4 ☄ Summon',
    desc:'4 міньйони + хлист (+35%) • ЛКМ: мітка та командний залп кожні 4 с',
    mana:10,
    cool:.4,
    dmg:560,
    speed:570,
    rad:7,
    col:'#c0f6a9'
  },
  {
    id:'rogue',
    name:'Celestus',
    label:'5 ✦ Rogue',
    desc:'ПКМ: поворотні Celestus, подвійне влучання • ЛКМ: відкликання • ловіння заряджає stealth',
    mana:0,
    cool:.28,
    dmg:950,
    speed:880,
    rad:9,
    col:'#f7b3eb'
  }
];

const classRegistry={
  melee:{attack:attackMelee,activate:arkAbility,updateCombat:updateSword},
  ranger:{attack:attackRanger,activate:activateRanger,update:updateRanger},
  mage:{attack:attackMage,activate:activateMage,update:updateMage},
  summon:{attack:attackSummoner,activate:activateSummoner,updateCombat:updateCosmic},
  rogue:{attack:attackRogue,activate:activateRogue,update:updateRogue}
};


export { weapons, classRegistry };
