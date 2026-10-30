import { paintAltar } from './altar.js?v=22.0.0';
import { arena } from '../core/arena.js?v=22.0.0';
import { ctx } from '../core/dom.js?v=22.0.0';
import { getTerrain } from '../world/terrain.js?v=22.0.0';
import { cameraView } from '../world/camera.js?v=22.0.0';

let key='',strips=new Map(),altar=null;
function strip(width,ground=false){
  const id=width+'|'+ground;if(strips.has(id))return strips.get(id);
  const s=document.createElement('canvas');s.width=Math.ceil(width);s.height=18;const c=s.getContext('2d');
  c.fillStyle=ground?'#211920':'#211623';c.fillRect(0,0,width,ground?18:8);
  c.fillStyle=ground?'#a37560':'#bd9675';c.fillRect(0,0,width,2);
  c.fillStyle='#68444d';c.fillRect(0,4,width,2);
  for(let x=8;x<width;x+=26){c.fillStyle='#d4ae8470';c.fillRect(x,2,2,3);}
  if(!ground){c.fillStyle='#6a414a';c.fillRect(5,8,5,7);c.fillRect(width-10,8,5,7);}
  strips.set(id,s);return s;
}
export function drawTerrain(){
  const t=getTerrain(),v=cameraView();
  if(key!==t.key){key=t.key;strips.clear();altar=document.createElement('canvas');altar.width=100;altar.height=90;paintAltar(altar.getContext('2d'),50,48);}
  if(t.floorY>=v.y-20&&t.floorY<=v.y+v.h+20)ctx.drawImage(strip(arena.r-arena.l,true),arena.l,t.floorY);
  for(const p of t.platforms)if(p.y>=v.y-20&&p.y<=v.y+v.h+20)ctx.drawImage(strip(p.r-p.l),p.l,p.y);
  ctx.drawImage(altar,t.altar.x-50,t.altar.y-48);
}
