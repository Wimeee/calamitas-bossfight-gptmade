import {state} from '../core/state.js?v=29.0.1';
import {renderQuality} from '../core/settings.js?v=29.0.1';
import {ctx} from '../core/dom.js?v=29.0.1';
import {circleVisible} from './visibility.js?v=29.0.1';
import {settings} from '../core/settings.js?v=29.0.1';
import {arkParticlePose} from '../systems/ark-effects.js?v=29.0.1';
import {arkEffectTexture,arkFrameTexture,drawNativeArkSpark,drawNativeRipMask,drawNativeArkLight} from './ark-native.js?v=29.0.1';

function image(name,x,y,sx,sy,angle,alpha,color='#fff',frame=null){
 const texture=frame?arkFrameTexture(name,color,frame):arkEffectTexture(name,color);if(!texture||sx<=0||sy<=0||alpha<=0)return;
 if(!circleVisible(ctx,x,y,Math.hypot((frame?80:texture.width)*sx,(frame?80:texture.height)*sy)/2))return;
 ctx.save();ctx.translate(x,y);ctx.rotate(angle);ctx.globalAlpha*=Math.min(1,alpha);
 if(frame){ctx.drawImage(texture,-40*sx,-40*sy,80*sx,80*sy);}
 else ctx.drawImage(texture,-texture.width*sx/2,-texture.height*sy/2,texture.width*sx,texture.height*sy);
 ctx.restore();
}
function hue(color){if(color.startsWith('hsl'))return parseFloat(color.slice(4))||0;const hex=color.replace('#','').padEnd(6,'0'),r=parseInt(hex.slice(0,2),16)/255,g=parseInt(hex.slice(2,4),16)/255,b=parseInt(hex.slice(4,6),16)/255,max=Math.max(r,g,b),d=max-Math.min(r,g,b);if(!d)return 0;return((max===r?(g-b)/d:max===g?(b-r)/d+2:(r-g)/d+4)*60+360)%360;}
export function drawArkEffects(g,layer='front'){
 if(g.mode==='dead')return;
 if(layer==='smoke')for(const r of g.arkRifts||[]){const age=(g.t-r.born)*60,width=Math.pow(.925,Math.max(0,age-15));drawNativeRipMask(r,width,1);}
 if(!g.arkEffects)return;
 for(const p of g.arkEffects){const smoke=p.kind==='smoke';if((layer==='smoke')!==smoke)continue;if(smoke&&renderQuality()==='low'&&!p.glowing&&p.id%2)continue;
  if(state.deviceMode==='mobile'&&(p.kind==='light'||p.kind==='crit'||p.kind==='flare'||p.kind==='smoke')&&p.id%2)continue;
  const a=arkParticlePose(p,g.t);if(!a)continue;
  const color=p.hueShift?'hsl('+((hue(p.color)+a.age*p.hueShift*360)%360)+' 100% 65%)':p.color;
  ctx.save();ctx.globalCompositeOperation=smoke&&!p.glowing?'source-over':'lighter';
  if(smoke){const frame=Math.min(5,Math.floor(a.u*6)),variant=p.variant||0;image('heavy-smoke',a.x,a.y,a.scale,a.scale,a.rotation,a.alpha,color,[variant*80,frame*80,variant===6?79:80,80]);}
  else if(p.kind==='star')drawNativeArkSpark(a.x,a.y,a.scale,a.rotation,a.alpha,p.bloom,p.bloomScale||1);
  else if(p.kind==='crit'||p.kind==='flare'){
   const curve=1-Math.pow(1-a.u,4),sx=p.kind==='flare'?a.scale*(.6+.9*curve):a.scale,sy=p.kind==='flare'?a.scale*(1+1.7*curve):a.scale;
   image('bloom-circle',a.x,a.y,sx*13/256*(p.bloomScale||3),sy*13/256*(p.bloomScale||3),0,a.alpha*.5,p.bloom);
   image('thin-sparkle',a.x,a.y,sx,sy,a.rotation,a.alpha,p.color);
  }else if(p.kind==='light'){
   const squish=Math.max(1,Math.min(p.maxSquish||3,Math.hypot(a.vx,a.vy)/10*(p.squish||1))),sx=a.scale*(1-squish*.3),sy=a.scale*squish,angle=Math.atan2(a.vy,a.vx)+Math.PI/2;
   drawNativeArkLight(a.x,a.y,sx,sy,angle,a.alpha,color);
  }else if(p.kind==='bloom')image('bloom-circle',a.x,a.y,a.scale,a.scale,0,Math.sin(a.u*Math.PI),p.color);
  else if(p.kind==='pulse'){const scale=p.scale+(p.endScale-p.scale)*(1-Math.pow(1-a.u,4));image('pulse-ring',a.x,a.y,scale,scale,0,Math.pow(Math.cos(a.u*Math.PI/2),2),p.color);}
  else if(p.kind==='slice'){
   const expansion=Math.sqrt(1-Math.pow(a.u-1,2))*p.expansion,length=p.length+expansion,x=a.x+Math.cos(p.angle)*p.length/2,y=a.y+Math.sin(p.angle)*p.length/2;
   image('slice-line',x,y,p.scale,length/84,p.angle+Math.PI/2,.7,p.color);
  }
  ctx.restore();
 }
}
