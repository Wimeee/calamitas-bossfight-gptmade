import { settings } from '../core/settings.js?v=26.0.3';
import { ctx } from '../core/dom.js?v=26.0.3';
import { TAU } from '../core/config.js?v=26.0.3';
import { line,pixel } from './primitives.js?v=26.0.3';
import { drawGlowCircle } from './glow-cache.js?v=26.0.3';
import { drawEnemyProjectiles as drawEncounterProjectiles } from './encounter-projectiles.js?v=26.0.3';

// Re-export the new encounter projectiles renderer as the main drawEnemyProjectiles
export { drawEncounterProjectiles as drawEnemyProjectiles };