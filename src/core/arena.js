import { getDifficulty } from '../../config/difficulty.js?v=21.1.1';
import { ARENA_SCALE, VIEW_X, VIEW_Y, W, H } from './config.js?v=21.1.1';

const arena={l:57,r:943,t:35,b:565};


function configureArena(difficulty){
  const settings=getDifficulty(difficulty);
  const halfW=settings.arenaHalfWidth*ARENA_SCALE,halfH=settings.arenaHalfHeight*ARENA_SCALE;
  arena.l=500-halfW;
  arena.r=500+halfW;
  arena.t=300-halfH;
  arena.b=300+halfH;
}


function screenToWorld(x,y){
  return{x:x-VIEW_X,y:y-VIEW_Y}
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
