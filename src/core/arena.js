import { worldConfig } from '../../config/world.js?v=29.0.1';
import { state } from './state.js?v=29.0.1';
import { ARENA_SCALE, VIEW_X, VIEW_Y, W, H, ZOOM_DEFAULT, ZOOM_MIN, ZOOM_MAX } from './config.js?v=29.0.1';
import { cameraView } from '../world/camera.js?v=29.0.1';
import { clamp } from './math.js?v=29.0.1';

const arena={l:57,r:943,t:35,b:565};


function configureArena(difficulty){
  const half=(difficulty==='death'?worldConfig.deathBlocks:worldConfig.normalBlocks)*worldConfig.tile/2;
  arena.l=500-half;arena.r=500+half;arena.t=300-half;arena.b=300+half;
}


function screenToWorld(x,y,camera,zoom){
  const g=state.game;
  const c=camera||g?.camera||{x:500,y:300};
  const z=zoom||g?.camera?.zoom||ZOOM_DEFAULT;
  return{x:(x-W/2)/z+c.x,y:(y-H/2)/z+c.y}
}


export { arena, configureArena, screenToWorld };

export function canvasPointToWorld(clientX,clientY,rect,contain=false){
  const g = state.game;
  const view = cameraView(g);
  const zoom = view.zoom || ZOOM_DEFAULT;
  const camera = g?.camera || {x:500,y:300};

  let width=rect.width,height=rect.height,left=rect.left,top=rect.top;
  if(contain){
    const scale=Math.min(width/W,height/H);
    const drawW=W*scale, drawH=H*scale;
    left+=(width-drawW)/2; top+=(height-drawH)/2;
    width=drawW; height=drawH;
  }
  // Map from canvas to viewport (0..W, 0..H) then to world with zoom
  const vx = (clientX - left) / width * W;
  const vy = (clientY - top) / height * H;
  return screenToWorld(vx, vy, camera, zoom);
}

export function worldToCanvasPoint(worldX, worldY, rect, contain=false) {
  const g = state.game;
  const view = cameraView(g);
  const zoom = view.zoom || ZOOM_DEFAULT;
  const camera = g?.camera || {x:500,y:300};

  let width=rect.width,height=rect.height,left=rect.left,top=rect.top;
  if(contain){
    const scale=Math.min(width/W,height/H);
    const drawW=W*scale, drawH=H*scale;
    left+=(width-drawW)/2; top+=(height-drawH)/2;
    width=drawW; height=drawH;
  }
  // World to viewport (0..W, 0..H) then to canvas
  const vx = (worldX - camera.x) * zoom + W/2;
  const vy = (worldY - camera.y) * zoom + H/2;
  return {x: left + vx / W * width, y: top + vy / H * height};
}
