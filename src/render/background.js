import {drawTerrain} from './terrain.js?v=26.0.6';
import {drawBackdropBase,drawArenaLayer} from './arena-cache.js?v=26.0.6';
export function drawBackdrop(g){drawBackdropBase();drawTerrain(g);drawArenaLayer(g);}
