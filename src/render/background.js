import {drawTerrain} from './terrain.js?v=26.2.1';
import {drawBackdropBase,drawArenaLayer} from './arena-cache.js?v=26.2.1';
export function drawBackdrop(g){drawBackdropBase();drawTerrain(g);drawArenaLayer(g);}
