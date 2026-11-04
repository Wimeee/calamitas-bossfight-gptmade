import {ctx} from '../core/dom.js?v=27.1.1';
import {helperImage,helperTint} from './helper-atlas.js?v=27.1.1';
import {drawHellBall} from './hellball.js?v=27.1.1';
function bloom(x,y,size,alpha,color){const image=helperTint('largeBloom',color);if(!image)return;ctx.save();ctx.globalAlpha=alpha;ctx.globalCompositeOperation=color==='#000000'?'source-over':'lighter';ctx.drawImage(image,x-size/2,y-size/2,size,size);ctx.restore();}
export function drawNativeMaelstrom(g){
 const m=g.maelstrom,w=g.maelstromWarning;if(!m){if(w&&g.phaseN===4){const progress=Math.max(0,Math.min(1,((g.hellTimers?.ticks||180)-180)/240));bloom(w.x,w.y,522*progress,.5,'#ff004d');bloom(w.x,w.y,486*progress,.4,'#ffffff');}return;}
 const opacity=m.opacity??Math.min(1,(m.age||0)/1.5),scale=m.scale??1.9,time=g.t||0;if(opacity<=0)return;
 drawHellBall(ctx,helperImage('screamyFace'),m.x,m.y,512*.715*scale*opacity,(m.timeLeft??36000)/60*.24,opacity);
 const native=helperImage('soulVortex');if(native)for(let i=0;i<5;i++){const color='#ff00'+Math.round(255*Math.min(1,i*.15)).toString(16).padStart(2,'0'),image=helperTint('soulVortex',color);if(!image)continue;const angle=Math.PI*2*i/3+time*Math.PI*2,size=408*scale*(1-i*.05)*opacity;ctx.save();ctx.translate(m.x+Math.cos(angle+time*i/16)*6,m.y+Math.sin(angle+time*i/16)*6);ctx.rotate(-angle+Math.PI/2);ctx.globalCompositeOperation='lighter';ctx.globalAlpha=.5*(1-i*.2)*opacity;ctx.drawImage(image,-size/2,-size/2,size,size);ctx.restore();}
 bloom(m.x,m.y,360*scale*.9*opacity,opacity,'#000000');
 if((m.ticks||0)<120){const alpha=1-(m.ticks||0)/120;bloom(m.x,m.y,522,alpha*.4,'#ff004d');bloom(m.x,m.y,486,alpha*.5,'#ffffff');}
}
