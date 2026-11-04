import {arenaImage} from './arena-atlas.js?v=28.0.0';
import { arena } from '../core/arena.js?v=28.0.0';
import { ctx } from '../core/dom.js?v=28.0.0';
import { getTerrain } from '../world/terrain.js?v=28.0.0';
import { cameraView } from '../world/camera.js?v=28.0.0';
import { drawWorldDecorations, initializeWorldDecorationAtlas } from './world-decorations.js?v=28.0.0';

let key='',strips=new Map();
function strip(width,ground=false){
  const original=arenaImage('platforms');
  const id=width+'|'+ground+'|'+!!original;if(strips.has(id))return strips.get(id);
  const s=document.createElement('canvas');s.width=Math.ceil(width);s.height=18;const c=s.getContext('2d');
  c.fillStyle=ground?'#211920':'#211623';c.fillRect(0,0,width,ground?18:8);
  c.fillStyle=ground?'#a37560':'#bd9675';c.fillRect(0,0,width,2);
  c.fillStyle='#68444d';c.fillRect(0,4,width,2);
  for(let x=8;x<width;x+=26){c.fillStyle='#d4ae8470';c.fillRect(x,2,2,3);}
  if(!ground){c.fillStyle='#6a414a';c.fillRect(5,8,5,7);c.fillRect(width-10,8,5,7);}
  if(original){c.clearRect(0,0,width,18);for(let x=0;x<width;x+=16)c.drawImage(original,0,0,16,16,x,0,Math.min(16,width-x),16);}
  strips.set(id,s);return s;
}
export function drawTerrain(g){
  const t=getTerrain(),v=cameraView();
  if(key!==t.key){key=t.key;strips.clear();}
  if(t.floorY>=v.y-20&&t.floorY<=v.y+v.h+20)ctx.drawImage(strip(t.bounds.r-t.bounds.l,true),t.bounds.l,t.floorY);
  for(const p of t.platforms)if(p.y>=v.y-20&&p.y<=v.y+v.h+20)ctx.drawImage(strip(p.r-p.l),p.l,p.y);
  // Draw world decorations (altar, campfire, heart lantern, urn) using original assets
  drawWorldDecorations(g);
}

export { initializeWorldDecorationAtlas };
