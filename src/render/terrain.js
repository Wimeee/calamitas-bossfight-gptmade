import { arena } from '../core/arena.js?v=21.0.0';
import { ctx } from '../core/dom.js?v=21.0.0';
import { W,H,VIEW_X,VIEW_Y } from '../core/config.js?v=21.0.0';
import { getTerrain } from '../world/terrain.js?v=21.0.0';

let cached=null,key='';
export function drawTerrain(){
  const terrain=getTerrain();
  if(key!==terrain.key){
    key=terrain.key;cached=document.createElement('canvas');cached.width=W;cached.height=H;
    const c=cached.getContext('2d');c.translate(VIEW_X,VIEW_Y);
    c.fillStyle='#211920';c.fillRect(arena.l,terrain.floorY,arena.r-arena.l,arena.b-terrain.floorY-5);
    c.fillStyle='#a37560';c.fillRect(arena.l,terrain.floorY,arena.r-arena.l,3);
    for(let x=arena.l+7;x<arena.r;x+=24){c.fillStyle='#69404b';c.fillRect(x,terrain.floorY+6,15,3);}
    for(const p of terrain.platforms){
      c.fillStyle='#211623';c.fillRect(p.l,p.y,p.r-p.l,8);
      c.fillStyle='#bd9675';c.fillRect(p.l,p.y,p.r-p.l,2);
      c.fillStyle='#68444d';c.fillRect(p.l,p.y+4,p.r-p.l,2);
      for(let x=p.l+8;x<p.r;x+=26){c.fillStyle='#d4ae8470';c.fillRect(x,p.y+2,2,3);}
      c.fillStyle='#6a414a';c.fillRect(p.l+5,p.y+8,5,7);c.fillRect(p.r-10,p.y+8,5,7);
    }
  }
  ctx.drawImage(cached,-VIEW_X,-VIEW_Y);
}
