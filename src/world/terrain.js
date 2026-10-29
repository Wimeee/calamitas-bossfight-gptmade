import { arena } from '../core/arena.js?v=21.0.0';
import { movementConfig as config } from '../../config/movement.js?v=21.0.0';

let cached=null,key='';
export function getTerrain(){
  const next=[arena.l,arena.r,arena.t,arena.b].join('|');
  if(next!==key){
    key=next;const floorY=arena.b-18,spacing=Math.min(config.platformSpacing,(floorY-arena.t-70)/4);
    cached={key,floorY,platforms:[
      {id:'lower',l:arena.l+65,r:arena.r-65,y:floorY-spacing},
      {id:'middle-left',l:arena.l+90,r:440,y:floorY-spacing*2},
      {id:'middle-right',l:560,r:arena.r-90,y:floorY-spacing*2},
      {id:'upper',l:arena.l+145,r:arena.r-145,y:floorY-spacing*3}
    ]};
  }
  return cached;
}
