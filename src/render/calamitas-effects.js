import {ctx} from '../core/dom.js?v=27.0.0';
import {helperTint,helperImage} from './helper-atlas.js?v=27.0.0';
export function drawCalamitasEffects(g){
 ctx.save();ctx.globalCompositeOperation='lighter';
 for(const p of g.calamitasEffects||[]){
  const name={pulse:'pulse',staticPulse:'staticPulse',bloom:'castBloom',void:'void',spark:'nativeSpark',orb:'orb',flame:'brimstone'}[p.kind]||'point';
  const image=p.kind==='flame'?helperImage(name):helperTint(name,p.color);if(!image)continue;
  const native=helperImage(name)||image,nw=native.width,nh=native.height,t=p.age/p.life;
  ctx.save();ctx.translate(p.x,p.y);ctx.globalAlpha*=p.opacity??1;if(p.shieldDust)ctx.globalAlpha*=.5;
  if(['pulse','staticPulse','bloom'].includes(p.kind)){
   const scale=p.start+(p.end-p.start)*(1-Math.pow(1-t,4));
   if(p.kind==='pulse'){ctx.globalAlpha*=Math.pow(Math.cos(t*Math.PI/2),2);ctx.rotate(p.angle);ctx.scale(.5,1);}
   else if(p.kind==='staticPulse')ctx.scale(p.squish||1,p.squish||1);
   ctx.drawImage(image,-nw*scale/2,-nh*scale/2,nw*scale,nh*scale);
  }else if(p.kind==='flame'){
   ctx.globalAlpha*=1-t;const size=10*p.scale;ctx.drawImage(image,0,(p.frame||0)*10,10,10,-size/2,-size/2,size,size);
  }else{
   ctx.rotate(Math.atan2(p.vy,p.vx)+Math.PI/2);ctx.globalAlpha*=1-(p.kind==='orb'?.8:1)*Math.pow(t,3);const size=Math.abs(p.scale);
   if(p.kind==='void')ctx.scale(.6*Math.pow(.7,p.age),Math.pow(1.25,p.age));
   else if(p.kind!=='orb')ctx.scale(.5,1.6);
   ctx.drawImage(image,-nw*size/2,-nh*size/2,nw*size,nh*size);
   if(p.kind==='void'){const core=helperTint('void','#000000');if(core){ctx.globalCompositeOperation='source-over';ctx.scale(.75,.9);ctx.drawImage(core,-nw*size/2,-nh*size/2,nw*size,nh*size);}}
   else if(p.kind!=='orb'){ctx.scale(.45,1);ctx.drawImage(image,-nw*size/2,-nh*size/2,nw*size,nh*size);}
   else{const white=helperTint('orb','#ffffff');if(white){ctx.globalAlpha*=Math.max(0,1-p.age*.1);ctx.drawImage(white,-nw*size/4,-nh*size/4,nw*size/2,nh*size/2);}}
  }
  ctx.restore();
 }
 ctx.restore();
}
