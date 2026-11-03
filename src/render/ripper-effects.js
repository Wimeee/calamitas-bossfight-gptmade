import { ctx } from '../core/dom.js?v=26.0.3';
import { hudImage,tintedHUDImage } from './hud-atlas.js?v=26.0.3';
export function drawRipperPlayerEffects(g,front=false){
 const r=g.rippers,v=r?.visuals;if(!v||g.mode==='dead'||g.mode==='won')return;const p=g.player;
 ctx.save();ctx.imageSmoothingEnabled=false;
 if(!front){
  ctx.globalCompositeOperation='lighter';
  if(r.adrenalineTime>0){const glow=tintedHUDImage('ripperLight','#18c98d');if(glow){ctx.globalAlpha=.16;ctx.drawImage(glow,p.x-32,p.y-32,64,64);}}
  const ring=tintedHUDImage('ragePulse','#ff0000');if(ring)for(const pulse of v.pulses){const t=Math.min(1,pulse.age/pulse.life),scale=pulse.endScale*(1-Math.pow(1-t,4)),size=ring.width*scale;ctx.globalAlpha=Math.pow(Math.cos(t*Math.PI/2),2);ctx.drawImage(ring,p.x-size/2,p.y-size/2,size,size);}
 }else{
  for(const dust of v.particles){const image=hudImage(dust.kind==='rage'?'rageDust':'adrenDust');if(!image)continue;const size=8*dust.scale;
   ctx.globalAlpha=dust.kind==='adrenaline'?.8:Math.min(1,dust.life/.15);ctx.drawImage(image,0,dust.frame*(dust.kind==='rage'?8:10),8,8,dust.x-size/2,dust.y-size/2,size,size);
  }
 }
 ctx.restore();
}
