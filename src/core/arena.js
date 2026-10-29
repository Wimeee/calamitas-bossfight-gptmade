import { getDifficulty } from '../../config/difficulty.js?v=20.0.0';
import { ARENA_SCALE, VIEW_X, VIEW_Y } from './config.js?v=20.0.0';

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
