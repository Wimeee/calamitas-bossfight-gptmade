import { worldConfig } from '../../config/world.js?v=22.1.0';
import { state } from './state.js?v=22.1.0';
import { ARENA_SCALE, VIEW_X, VIEW_Y, W, H } from './config.js?v=22.1.0';

const arena={l:57,r:943,t:35,b:565};


function configureArena(difficulty){
  const half=(difficulty==='death'?worldConfig.deathBlocks:worldConfig.normalBlocks)*worldConfig.tile/2;
  arena.l=500-half;arena.r=500+half;arena.t=300-half;arena.b=300+half;
}


function screenToWorld(x,y){
  const camera=state.game?.camera||{x:500,y:300};
  return{x:x-W/2+camera.x,y:y-H/2+camera.y}
}


export { arena, configureArena, screenToWorld };

export function canvasPointToWorld(clientX,clientY,rect,contain=false){
  let width=rect.width,height=rect.height,left=rect.left,top=rect.top;
  if(contain){
    const scale=Math.min(width/W,height/H),drawW=W*scale,drawH=H*scale;
    left+=(width-drawW)/2;top+=(height-drawH)/2;width=drawW;height=drawH;
  }
  return screenToWorld((clientX-left)/width*W,(clientY-top)/height*H);
}
