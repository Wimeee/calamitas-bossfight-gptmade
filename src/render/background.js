import {drawTerrain} from './terrain.js?v=30.2.0';
import {drawBackdropBase,drawArenaLayer} from './arena-cache.js?v=30.2.0';
export function drawBackdrop(g){drawBackdropBase();drawTerrain(g);drawArenaLayer(g);}
