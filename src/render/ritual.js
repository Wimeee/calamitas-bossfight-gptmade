import {renderQuality,settings} from '../core/settings.js?v=29.1.0';
import {drawOfficialCalamitas} from './calamitas.js?v=29.1.0';
import {drawFlightWings,drawFlightGauge} from './mobility.js?v=29.1.0';
import {drawGlowCircle} from './glow-cache.js?v=29.1.0';
import {drawWarriorBody,drawWarriorIdleWeapon} from './warrior.js?v=29.1.0';
import {helperTint} from './helper-atlas.js?v=29.1.0';
import {drawInfernumTitle} from './intro-title.js?v=29.1.0';
import {ctx} from '../core/dom.js?v=29.1.0';
import {W,H} from '../core/config.js?v=29.1.0';
import {clamp} from '../core/math.js?v=29.1.0';
import {nearAltar,ritualConfig} from '../game/ritual.js?v=29.1.0';
import {round,text} from './primitives.js?v=29.1.0';
const ease=(t,a,b)=>clamp((t-a)/(b-a),0,1);
function bloom(x,y,r,color,opacity){const im=helperTint('largeBloom',color);if(!im)return;ctx.save();ctx.globalAlpha=opacity;ctx.globalCompositeOperation='lighter';ctx.drawImage(im,x-r,y-r,r*2,r*2);ctx.restore();}
export function ritualScreenShake(g){
 const r=g?.ritual;if(!settings.screenShake||r?.phase!=='summoning')return{x:0,y:0};const s=r.elapsed,after=s-ritualConfig.spawnAt;
 const distance=Math.hypot(g.player.x-ritualConfig.x,g.player.y-ritualConfig.y),range=ease(distance,3400,1560),power=after<0?ease(s,1.5,245/60)*4:16*(1-ease(after,0,.65));
 return{x:Math.sin(s*137.2)*power*range,y:Math.cos(s*103.7)*power*range};
}
export function drawRitualWorld(g){
 const r=g.ritual,s=r.elapsed,charging=r.phase==='summoning',after=s-ritualConfig.spawnAt,x=ritualConfig.x,y=ritualConfig.y,low=renderQuality()==='low';
 if(charging&&after<0){
  const power=ease(s,0,4.5),pulse=1+Math.sin(s*7)*.035;bloom(x,y,(45+power*150)*pulse,'#ff004d',.55);bloom(x,y,35+power*70,'#fff0f2',.45);if(s>3)bloom(x,y,80+ease(s,3,4.5)*120,'#79154d',.7);
  const count=low?25:72;for(let i=0;i<count;i++){const born=i*.061,age=(s-born)%1.15;if(s<born||age<0)continue;const variance=Math.sin(i*174.71)*25,velocity=(1.1+(i%11)/10)*s*.023*60,px=x+variance-Math.sin(variance*.02)*velocity*age,py=y+20-Math.cos(variance*.02)*velocity*age;ctx.save();ctx.globalAlpha=(1-age/1.15)*.85;drawGlowCircle(px,py,1+(i%4)*.4,i%2?'#ff0000':'#79154d',low?0:7);ctx.restore();}
 }
 if(charging&&after>=0){
  const fade=1-ease(after,.2,2),count=low?32:90;
  for(let i=0;i<count;i++){const a=i*2.399963,speed=2+(i%17)*2.1,drag=(1-Math.exp(-after*2.8))/.046,px=x+Math.cos(a)*speed*drag,py=y+Math.sin(a)*speed*drag;ctx.save();ctx.globalAlpha=fade;drawGlowCircle(px,py,1.2+(i%4)*.35,i%3?'#ff323a':'#79154d',low?0:8);ctx.restore();}
  for(const [radius,color]of [[2.7,'#ff2535'],[2.1,'#79154d']]){const im=helperTint('pulse',color);if(im&&after<1){const size=240*radius*ease(after,0,1);ctx.save();ctx.globalAlpha=1-after;ctx.drawImage(im,x-size/2,y-size/2,size,size);ctx.restore();}}
  bloom(x,y,180*(1+after*.4),'#ff1238',fade*.7);drawOfficialCalamitas(g,{x:x-53,y:y-39,aura:false});
 }
 drawFlightWings(g);drawFlightGauge(g);if(drawWarriorBody(g))drawWarriorIdleWeapon(g);else round(g.player.x,g.player.y,10,'#78cdd5','#fff3df',2);
 if(!charging){text('ALTAR OF THE ACCURSED',x,y-100,14,'#d49c90');text(nearAltar(g)?'E / ENTER · ВИКЛИКАТИ':'ПІДІЙДИ БЛИЖЧЕ',x,y-76,11,'#ffcca2');}
}
export function drawRitualOverlay(g){
 const r=g.ritual,s=r.elapsed;ctx.save();
 if(r.phase==='summoning'){
  const after=s-ritualConfig.spawnAt,darkness=ease(s,1.5,245/60)*(1-ease(after,0,1));ctx.fillStyle=`rgba(8,0,4,${darkness*.72})`;ctx.fillRect(0,0,W,H);
  const flash=after>=0?1-ease(after,0,.22):0;if(flash>0){ctx.fillStyle=`rgba(255,25,45,${flash*.3})`;ctx.fillRect(0,0,W,H);}drawInfernumTitle(after);
 }
 if(g.mode==='paused'){ctx.globalAlpha=1;ctx.fillStyle='#07040bc9';ctx.fillRect(0,0,W,H);text('ПАУЗА',W/2,H/2,32,'#ffdbc0');}ctx.restore();
}
