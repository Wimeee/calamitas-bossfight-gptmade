import { worldConfig } from '../../config/world.js?v=22.1.0';
import { arena } from '../core/arena.js?v=22.1.0';
import { movementConfig as config } from '../../config/movement.js?v=22.1.0';

let cached=null,key='';
export function getTerrain(){
  const next=[arena.l,arena.r,arena.t,arena.b].join('|');
  if(next!==key){
    key=next;const floorY=arena.b-18,spacing=worldConfig.platformSpacing;
    const platforms=[
      {id:'lower',l:arena.l+65,r:arena.r-65,y:335+spacing},
      {id:'middle',l:arena.l+90,r:arena.r-90,y:335},
      {id:'upper',l:arena.l+145,r:arena.r-145,y:335-spacing}
    ];
    for(let y=335-spacing*2;y>arena.t+100;y-=spacing)platforms.push({id:'high-'+y,l:arena.l+100,r:arena.r-100,y});
    for(let y=335+spacing*2;y<floorY-100;y+=spacing)platforms.push({id:'low-'+y,l:arena.l+80,r:arena.r-80,y});
    cached={key,floorY,altar:{x:500,y:300},platforms,
      campfire:{x:230,y:558},lantern:{x:750,y:285}};

  }
  return cached;
}
