import {drawNativeMaelstrom} from './maelstrom.js?v=27.1.0';
import {minionImage} from './minion-atlas.js?v=27.1.0';
import { calamitasImage } from './calamitas-atlas.js?v=27.1.0';
import { drawOfficialCalamitas } from './calamitas.js?v=27.1.0';
import { TAU } from '../core/config.js?v=27.1.0';
import { ctx } from '../core/dom.js?v=27.1.0';
import { hpMini, line, pixel, round, text } from './primitives.js?v=27.1.0';
import { drawBrother, drawSepulcher, drawSeeker, drawHeart, triggerSepulcherSegmentHit, triggerHeartHit } from './minion.js?v=27.1.0';


function drawCalamitas(g){
  const b=g.boss,inv=g.stage!=='normal';
  if(inv&&!calamitasImage('shield')){
    ctx.save();
    ctx.strokeStyle='#f4496666';
    ctx.lineWidth=2;
    ctx.beginPath();
    ctx.arc(b.x,b.y,53,0,TAU);
    ctx.stroke();
    ctx.restore();
  }
  if(!drawOfficialCalamitas(g))pixel('witch'+(Math.floor(g.t*7)%3),b.x,b.y,1.65,0,g.player.x<b.x);
  if(g.t<(b.hitFlash||0)){
    ctx.strokeStyle='#fff5d8';
    ctx.strokeRect(b.x-33,b.y-48,66,96);
  }
  if(inv&&g.stage!=='accept')text('IMMUNE',b.x,b.y-61,10,'#ffadb5');
}


function drawMaelstrom(g){drawNativeMaelstrom(g);}



export { drawBrother, drawCalamitas, drawSepulcher, drawSeeker, drawHeart, drawMaelstrom, triggerSepulcherSegmentHit, triggerHeartHit };