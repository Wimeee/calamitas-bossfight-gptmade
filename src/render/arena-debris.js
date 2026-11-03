import {ctx} from '../core/dom.js?v=26.0.6';
import {arenaImage} from './arena-atlas.js?v=26.0.6';
export function drawArenaDebris(g){for(const p of g.arenaDebris||[]){ctx.save();ctx.globalAlpha=Math.min(1,p.life*2);ctx.translate(p.x,p.y);ctx.rotate(p.rotation);const image=p.kind&&arenaImage(p.kind);if(image)ctx.drawImage(image,-image.width/2,-image.height/2);else{ctx.fillStyle='#9e1830';ctx.fillRect(-1,-2,2,5);}ctx.restore();}}
