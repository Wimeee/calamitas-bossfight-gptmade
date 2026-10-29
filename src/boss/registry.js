import { calamitasConfig } from '../../config/calamitas.js?v=19.0.0';
import { state } from '../core/state.js?v=19.0.0';
import { finish } from '../game/session.js?v=19.0.0';
import { bulletHell } from './bullet-hell.js?v=19.0.0';
import { bossAttack } from './calamitas.js?v=19.0.0';
import { updateMaelstrom } from './maelstrom.js?v=19.0.0';
import { updateMinions } from './minions.js?v=19.0.0';
import { updateExtraPatterns } from './patterns.js?v=19.0.0';
import { enterCalamitas, transitionCalamitas } from './phases.js?v=19.0.0';
import { drawCalamitasEncounter } from '../render/encounter.js?v=19.0.0';

export const encounterRegistry = {
  'supreme-calamitas': {
    config: calamitasConfig,
    createBoss() {
      const c = calamitasConfig;
      return {x: c.spawnX, y: c.spawnY, hp: c.hp, max: c.hp, r: c.radius, alpha: 0};
    },
    enter: enterCalamitas,
    draw: drawCalamitasEncounter,
    update(dt) {
      const g = state.game;
      if (g.stage === 'hell') bulletHell(dt);
      else if (g.stage === 'accept') {
        g.acceptT += dt;
        if (g.acceptT > 9.4) finish(true);
      } else {
        if (g.stage === 'normal' || g.stage === 'hearts') bossAttack(dt);
        updateMinions(dt);
      }
    },
    updateHazards(dt) {
      updateExtraPatterns(dt);
      updateMaelstrom(dt);
    },
    afterProjectiles() {
      if (state.game.stage === 'normal') transitionCalamitas();
    }
  }
};

export function getEncounter(game = state.game) {
  const id = game?.encounterId || 'supreme-calamitas';
  const encounter = encounterRegistry[id];
  if (!encounter) throw new Error('Unknown encounter: ' + id);
  return encounter;
}
