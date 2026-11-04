import {drawTerrain} from './terrain.js?v=28.0.0';
import {drawBackdropBase,drawArenaLayer} from './arena-cache.js?v=28.0.0';
export function drawBackdrop(g){drawBackdropBase();drawTerrain(g);drawArenaLayer(g);}
