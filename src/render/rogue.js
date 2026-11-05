import {ctx} from '../core/dom.js?v=30.0.0';
import {W} from '../core/config.js?v=30.0.0';
import {renderQuality} from '../core/settings.js?v=30.0.0';
import {nativeText} from './hud-atlas.js?v=30.0.0';
import {circleVisible} from './visibility.js?v=30.0.0';
import {helperImage,helperTint} from './helper-atlas.js?v=30.0.0';
const images={};let loading;
export function rogueImage(name){return images[name];}
export function initializeRogueAtlas(){if(loading)return loading;if(typeof Image==='undefined')return Promise.resolve(false);return loading=Promise.all(['celestus','celestus-glow','mini','nano','heal','item','item-glow','nanotech','sheath','emblem','stealth-border','stealth-fill','stealth-full','stealth-strike'].map(name=>new Promise(resolve=>{const im=new Image();im.onload=()=>{images[name]=im;resolve(true);};im.onerror=()=>resolve(false);im.src=new URL('../../assets/rogue-original/'+name+'.png?v=30.0.0',import.meta.url).href;}))).then(r=>r.every(Boolean));}
function sprite(name,x,y,angle,alpha=1,scale=1){const im=images[name];if(!im)return;ctx.save();ctx.translate(x,y);ctx.rotate(angle);ctx.globalAlpha*=alpha;ctx.drawImage(im,-im.width*scale/2,-im.height*scale/2,im.width*scale,im.height*scale);ctx.restore();}
export function drawNativeRogue(g){
 const p=g.player,k=p.kit?.rogue;if(p.weapon!==4||!k||g.mode==='dead'||g.mode==='won')return;const low=renderQuality()==='low';ctx.save();ctx.imageSmoothingEnabled=false;
 for(const q of [...p.kit.blades,...k.shots]){ctx.globalAlpha=1;if(q.dead||!circleVisible(ctx,q.x,q.y,q.kind==='blade'?200:80))continue;const name=q.kind==='blade'?'celestus':q.kind,opacity=q.kind==='mini'?.39*Math.max(0,q.left/85):q.opacity??1;
  if(q.kind==='flare'||q.kind==='spark'){const spark=helperImage('nativeSpark');if(spark)for(let i=0;i<q.trail.length;i+=low?2:1){const t=q.trail[i];ctx.globalAlpha=.3+.6*i/q.trail.length;ctx.drawImage(spark,t.x-4,t.y-8,8,q.kind==='flare'?16:8);}continue;}
  for(let i=0;i<q.trail.length;i+=low?3:1){const t=q.trail[i];sprite(name,t.x,t.y,q.rotation,opacity*(i+1)/q.trail.length*.35);}sprite(name,q.x,q.y,q.rotation,opacity);if(q.kind==='blade')sprite('celestus-glow',q.x,q.y,q.rotation);
 }
 const heal=helperTint('nativeSpark','#ff334e');if(heal)for(const h of k.heals){ctx.globalAlpha=.8;ctx.drawImage(heal,h.x-3,h.y-3,6,6);}
 const spark=helperImage('nativeSpark');if(spark)for(const e of k.effects){const age=k.clock-e.time,fade=Math.max(0,1-age/.5);for(let i=0;i<(low?3:7);i++){const a=i*2.39996,r=age*(e.kind==='flare'?180:70);ctx.globalAlpha=fade;ctx.drawImage(spark,e.x+Math.cos(a)*r-3,e.y+Math.sin(a)*r-3,6,6);}}
 ctx.restore();
}
export function drawRogueHUD(g){
 const p=g.player,k=p.kit?.rogue,border=images['stealth-border'];if(p.weapon!==4||!k||!border)return;const x=W-128,y=61,s=2,ratio=Math.max(0,Math.min(1,p.stealth)),fill=images[ratio>=1?'stealth-full':'stealth-fill'];ctx.save();ctx.imageSmoothingEnabled=false;ctx.drawImage(border,x,y,border.width*s,border.height*s);
 if(fill&&ratio>0)ctx.drawImage(fill,0,0,fill.width*ratio,fill.height,x+8*s,y,fill.width*ratio*s,fill.height*s);
 const indicator=images['stealth-strike'];if(indicator&&ratio>=.5)ctx.drawImage(indicator,x,y,indicator.width*s,indicator.height*s);
 nativeText(ctx,Math.round(ratio*100)+'%',x+52,y+43,{align:'center',scale:.55,color:ratio>=.5?'#e4c3ff':'#aeb7cb'});
 nativeText(ctx,k.chargeMode?'STEALTH':'AUTO',x+52,y+57,{align:'center',scale:.5,color:'#d7b8f5'});ctx.restore();
}
