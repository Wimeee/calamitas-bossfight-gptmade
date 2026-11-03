import {drawTerrain} from './terrain.js?v=26.0.4';
import {drawBackdropBase,drawArenaLayer} from './arena-cache.js?v=26.0.4';
export function drawBackdrop(g){drawBackdropBase();drawTerrain(g);drawArenaLayer(g);}
