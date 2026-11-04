import {ctx} from '../core/dom.js?v=27.0.0';
import {helperImage} from './helper-atlas.js?v=27.0.0';
export function drawHelperEffects(g){
 ctx.save();for(const p of g.helperGore||[]){const image=helperImage(p.kind);if(image){ctx.save();ctx.translate(p.x,p.y);ctx.rotate(p.angle);ctx.globalAlpha=Math.min(1,p.life);ctx.drawImage(image,-image.width/2,-image.height/2);ctx.restore();}}for(let bin=0;bin<24;bin++){let any=false;ctx.beginPath();for(const a of g.helperAshes||[])if(Math.min(23,Math.floor(a.gray/8))===bin){const size=a.scale*7;ctx.rect(a.x-size/2,a.y-size/2,size,size);any=true;}if(any){const gray=Math.min(255,bin*8+4);ctx.fillStyle='rgb('+gray+','+gray+','+gray+')';ctx.fill();}}
 const image=helperImage('brimstone');if(image)for(const p of g.helperDust||[]){ctx.globalAlpha=Math.min(1,p.life*2);const size=10*p.scale;ctx.drawImage(image,0,p.frame*10,10,10,p.x-size/2,p.y-size/2,size,size);}ctx.restore();
}
