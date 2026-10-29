import { ARENA_SCALE, VIEW_X, VIEW_Y } from './config.js?v=17.0.0';

const arena={l:57,r:943,t:35,b:565};


function configureArena(difficulty){
  const halfW=(difficulty==='death'?355:443)*ARENA_SCALE,halfH=(difficulty==='death'?212:265)*ARENA_SCALE;
  arena.l=500-halfW;
  arena.r=500+halfW;
  arena.t=300-halfH;
  arena.b=300+halfH;
}


function screenToWorld(x,y){
  return{x:x-VIEW_X,y:y-VIEW_Y}
}


export { arena, configureArena, screenToWorld };
