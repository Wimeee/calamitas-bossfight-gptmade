import {drawTerrain} from './terrain.js?v=26.1.0';
import {drawBackdropBase,drawArenaLayer} from './arena-cache.js?v=26.1.0';
export function drawBackdrop(g){drawBackdropBase();drawTerrain(g);drawArenaLayer(g);}
