import {drawTerrain} from './terrain.js?v=29.1.1';
import {drawBackdropBase,drawArenaLayer} from './arena-cache.js?v=29.1.1';
export function drawBackdrop(g){drawBackdropBase();drawTerrain(g);drawArenaLayer(g);}
