import {ctx} from '../core/dom.js?v=28.0.1';
import {paintProjectileFrame,paintProjectileFrameAlt} from './encounter-projectiles-atlas.js?v=28.0.1';
import {helperTint} from './helper-atlas.js?v=28.0.1';
function glow(x,y,w,h,angle,color,alpha){const image=helperTint('largeBloom',color);if(!image)return;ctx.save();ctx.translate(x,y);ctx.rotate(angle);ctx.globalAlpha=alpha;ctx.globalCompositeOperation='lighter';ctx.drawImage(image,-w/2,-h/2,w,h);ctx.restore();}
export function drawBrotherProjectile(q){
 const fist=q.kind==='fist',angle=Math.atan2(q.vy,q.vx),facing=q.vx<0?-1:1,rotation=q.vx<0?Math.atan2(-q.vy,-q.vx):angle;
 if(fist&&q.variant>=3){
  const scale=.8+.4*(.5+.5*Math.sin((q.nativeTime||0)*.71));glow(q.x,q.y,612*scale,612*scale,0,'#ff007f',.65);glow(q.x,q.y,504*scale,504*scale,0,'#ffffff',.75);
  if(q.nativeLife<=205&&q.nativeLife>198)for(const offset of q.solo?[0,Math.PI*2/3,-Math.PI*2/3]:[0]){
   const a=Math.atan2(-q.shootVY,-q.shootVX)+offset,d=Math.hypot(q.shootVX,q.shootVY)/60*Math.min(1.8,Math.max(1,(q.nativeTime||0)*.1));
   for(let k=0;k<28;k++){const radius=d*(9+k*11);glow(q.x+Math.cos(a)*radius,q.y+Math.sin(a)*radius,26,4,a,'#ff007f',.35);}
  }return;
 }
 if(!fist&&q.variant>=4){const alpha=q.exploding?1:.25;glow(q.x,q.y,q.exploding?q.r*2:140,q.exploding?q.r*2:8,angle,'#00bfff',alpha);return;}
 const alt=fist?q.side===1:q.side===0,paint=alt?paintProjectileFrameAlt:paintProjectileFrame,kind=fist?'cataclysmFist':'catastropheSlash';
 const speed=Math.hypot(q.vx,q.vy)||1,x=q.x-(fist?0:q.vx/speed*38),y=q.y-(fist?0:q.vy/speed*38),alpha=q.opacity??1;
 if(!fist)for(let i=0;i<3;i++)paint(ctx,kind,q.frame||0,x-q.vx/60*i*4,y-q.vy/60*i*4,q.scale||1,alpha*(1-i/3)*.5,facing,rotation);
 paint(ctx,kind,q.frame||0,x,y,q.scale||1,alpha,facing,rotation);
}
