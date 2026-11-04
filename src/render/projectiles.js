import { settings } from '../core/settings.js?v=27.0.0';
import { ctx } from '../core/dom.js?v=27.0.0';
import { TAU } from '../core/config.js?v=27.0.0';
import { line,pixel } from './primitives.js?v=27.0.0';
import { drawGlowCircle } from './glow-cache.js?v=27.0.0';
import { drawEnemyProjectiles as drawEncounterProjectiles } from './encounter-projectiles.js?v=27.0.0';

// Re-export the new encounter projectiles renderer as the main drawEnemyProjectiles
export { drawEncounterProjectiles as drawEnemyProjectiles };