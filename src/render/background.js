import {drawTerrain} from './terrain.js?v=26.0.5';
import {drawBackdropBase,drawArenaLayer} from './arena-cache.js?v=26.0.5';
export function drawBackdrop(g){drawBackdropBase();drawTerrain(g);drawArenaLayer(g);}
