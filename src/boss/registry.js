import {updateAcceptance} from './acceptance.js?v=27.1.1';
import { calamitasConfig } from '../../config/calamitas.js?v=27.1.1';
import { state } from '../core/state.js?v=27.1.1';
import { finish } from '../game/session.js?v=27.1.1';
import { bulletHell } from './bullet-hell.js?v=27.1.1';
import { bossAttack } from './calamitas.js?v=27.1.1';
import { updateMaelstrom } from './maelstrom.js?v=27.1.1';
import { updateMinions } from './minions.js?v=27.1.1';
import { enterCalamitas, transitionCalamitas, updatePhaseTransitions } from './phases.js?v=27.1.1';
import { drawCalamitasEncounter } from '../render/encounter.js?v=27.1.1';

export const encounterRegistry = {
  'supreme-calamitas': {
    config: calamitasConfig,
    createBoss() {
      const c = calamitasConfig;
      return {x: c.spawnX, y: c.spawnY, hp: c.hp, max: c.hp, r: c.radius, alpha: 0, vx: 0, vy: 0};
    },
    enter: enterCalamitas,
    draw: drawCalamitasEncounter,
    update(dt, motion=null) {
      const g = state.game;
      // Update phase transitions (cast delays) every frame
      if(g.castDelayState){updatePhaseTransitions(dt, g);return;}
      if (g.stage === 'hell') bulletHell(dt);
      else if (g.stage === 'accept') {
        updateAcceptance(dt,g);
      } else {
        // Don't run bossAttack during cast delay (g.castDelayState is set)
        if ((g.stage === 'normal' || g.stage === 'hearts' || g.stage === 'seekers') && !g.castDelayState) {
          bossAttack(dt,motion);
        }
        updateMinions(dt);
      }
    },
    updateHazards(dt) {
      updateMaelstrom(dt);
    },
    afterProjectiles() {
      if (state.game.stage === 'normal') transitionCalamitas(state.game);
    }
  }
};

export function getEncounter(game = state.game) {
  const id = game?.encounterId || 'supreme-calamitas';
  const encounter = encounterRegistry[id];
  if (!encounter) throw new Error('Unknown encounter: ' + id);
  return encounter;
}
