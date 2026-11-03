import { worldConfig } from '../../config/world.js?v=26.3.0';
import { movementConfig as config } from '../../config/movement.js?v=26.3.0';

let cached=null,key='';
export function getTerrain(){
  const half=(worldConfig.normalBlocks*worldConfig.tile/2)*1.6;
  const bounds={l:500-half,r:500+half,t:300-half,b:300+half};
  const next='fixed-world';
  if(next!==key){
    key=next;const floorY=bounds.b-18,spacing=worldConfig.platformSpacing;
    const platforms=[
      {id:'lower',l:bounds.l+65,r:bounds.r-65,y:335+spacing},
      {id:'middle',l:bounds.l+90,r:bounds.r-90,y:335},
      {id:'upper',l:bounds.l+145,r:bounds.r-145,y:335-spacing}
    ];
    for(let y=335-spacing*2;y>bounds.t+100;y-=spacing)platforms.push({id:'high-'+y,l:bounds.l+100,r:bounds.r-100,y});
    for(let y=335+spacing*2;y<floorY-100;y+=spacing)platforms.push({id:'low-'+y,l:bounds.l+80,r:bounds.r-80,y});
    const platform=id=>platforms.find(p=>p.id===id);
    cached={key,bounds,floorY,altar:{x:500,y:platform('middle').y},platforms,
      campfire:{x:230,y:platform('lower').y},lantern:{x:750,y:platform('upper').y+16+32}};

  }
  return cached;
}
