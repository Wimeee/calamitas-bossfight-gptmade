import { drawGlowCircle } from './glow-cache.js?v=20.0.1';
import { drawWarriorBody, drawWarriorIdleWeapon } from './warrior.js?v=20.0.1';
import { settings } from '../core/settings.js?v=20.0.1';
import { ctx } from '../core/dom.js?v=20.0.1';
import { W,H,TAU } from '../core/config.js?v=20.0.1';
import { clamp } from '../core/math.js?v=20.0.1';
import { nearAltar,ritualConfig } from '../game/ritual.js?v=20.0.1';
import { line,pixel,round,text } from './primitives.js?v=20.0.1';

const ease=(t,a,b)=>clamp((t-a)/(b-a),0,1);

function sigil(radius,time,alpha){
  ctx.save();ctx.globalAlpha=alpha;ctx.rotate(time);
  ctx.strokeStyle='#ff7d65';ctx.lineWidth=1.5;
  ctx.beginPath();ctx.arc(0,0,radius,0,TAU);ctx.stroke();
  ctx.beginPath();ctx.arc(0,0,radius-9,0,TAU);ctx.stroke();
  for(let i=0;i<8;i++){
    const a=i*TAU/8,x=Math.cos(a)*radius,y=Math.sin(a)*radius;
    line(x*.85,y*.85,x*1.13,y*1.13,'#ffc593',2);
    line(x,y,Math.cos(a+TAU*3/8)*radius,Math.sin(a+TAU*3/8)*radius,'#ff405d66',1);
  }
  ctx.restore();
}

export function drawRitualWorld(g){
  const r=g.ritual,t=r.ambient,s=r.elapsed,charging=r.phase==='summoning';
  const power=charging?ease(s,0,2):.12;
  ctx.save();ctx.translate(ritualConfig.x,ritualConfig.y);
  if(settings.screenShake&&charging){const q=ease(s,0,2)*(1-ease(s,2,2.8))*4;ctx.translate(Math.sin(s*51)*q,Math.cos(s*67)*q);}
  const glow=ctx.createRadialGradient(0,0,4,0,0,190+power*50);
  glow.addColorStop(0,`rgba(240,45,67,${.18+power*.3})`);glow.addColorStop(1,'rgba(150,0,35,0)');
  ctx.fillStyle=glow;ctx.fillRect(-250,-250,500,500);
  sigil(72+power*54,t*.13,.25+power*.65);
  if(charging)sigil(152,s*-.3,power*.7);
  // Stone plinth, flared bronze urn, lid and luminous brimstone seams.
  ctx.fillStyle='#241723';ctx.fillRect(-45,25,90,10);ctx.fillRect(-35,16,70,10);
  line(-44,25,44,25,'#8c5260',2);
  ctx.beginPath();ctx.moveTo(-23,-24);ctx.lineTo(23,-24);ctx.lineTo(28,-12);ctx.lineTo(18,15);ctx.lineTo(-18,15);ctx.lineTo(-28,-12);ctx.closePath();
  ctx.fillStyle='#3e1c29';ctx.fill();ctx.strokeStyle='#bd745e';ctx.lineWidth=2;ctx.stroke();
  line(-29,-26,29,-26,'#d39c72',4);line(-18,-31,18,-31,'#8c4a45',4);
  for(const side of [-1,1]){line(side*25,-17,side*35,-28,'#b16c54',3);line(side*35,-28,side*30,-36,'#b16c54',2);}
  ctx.shadowColor='#ff4b5c';ctx.shadowBlur=settings.quality==='low'?0:18;
  line(0,-18,-7,-3,'#ff9c75',2);line(-7,-3,5,2,'#ff5c61',2);line(5,2,0,11,'#ff9c75',2);
  ctx.shadowBlur=0;
  const count=settings.quality==='low'?24:72;
  for(let i=0;i<count;i++){
    // Deterministic decorative motion never consumes combat randomness.
    const f=(t*(charging?.42:.16)+i*.6180339)%1,a=i*2.39996+t*.6;
    const radius=charging?(1-f)*(125+power*65):12+f*24;
    const x=Math.cos(a)*radius,y=charging?Math.sin(a)*radius:-30-f*65;
    ctx.globalAlpha=Math.sin(f*Math.PI)*(.4+power*.6);
    drawGlowCircle(x,y,1+(i%3)*.55,i%3?'#ff6b51':'#ffe5a5',settings.quality==='low'?0:18,'',1,'#ff4b5c');
  }
  ctx.globalAlpha=1;ctx.shadowBlur=0;
  if(!charging){text('ALTAR OF THE ACCURSED',0,-107,14,'#d49c90');text(nearAltar(g)?'E / ENTER · ВИКЛИКАТИ':'ПІДІЙДИ БЛИЖЧЕ',0,64,11,'#ffcca2');}
  ctx.restore();
  if(!charging||s<2.7){
    if(drawWarriorBody(g))drawWarriorIdleWeapon(g);
    else{round(g.player.x,g.player.y,10,'#78cdd5','#fff3df',2);round(g.player.x+3,g.player.y,3,'#1e4157');}
  }
  if(charging&&s>4.5){
    ctx.save();ctx.globalAlpha=ease(s,4.5,5.2);ctx.translate(500,210);
    const halo=ctx.createRadialGradient(0,0,8,0,0,120);
    halo.addColorStop(0,'#ff745a99');halo.addColorStop(1,'#b00b3700');
    ctx.fillStyle=halo;ctx.fillRect(-125,-125,250,250);
    sigil(77,s*.32,.6);
    for(let i=0;i<(settings.quality==='low'?18:48);i++){
      const f=(s*.65+i*.618)%1,a=i*2.4;
      ctx.globalAlpha=(1-f)*ease(s,4.5,5.2);
      round(Math.cos(a)*(28+f*100),Math.sin(a)*(28+f*100)-f*25,1.7,i%3?'#ff6650':'#ffdf9c');
    }
    ctx.globalAlpha=ease(s,4.5,5.2);
    pixel('witch'+Math.floor(s*7)%3,0,0,1.65+Math.sin(s*4)*.03);ctx.restore();
  }
}

export function drawRitualOverlay(g){
  const r=g.ritual,s=r.elapsed;
  ctx.save();
  if(r.phase==='summoning'){
    const darkness=ease(s,1.5,2.6)*(1-ease(s,4.5,6.4));
    ctx.fillStyle=`rgba(4,1,7,${darkness*.97})`;ctx.fillRect(0,0,W,H);
    const flash=(1-ease(s,4.5,4.82))*ease(s,4.48,4.5);
    if(flash>0){ctx.fillStyle=`rgba(255,62,59,${flash*.6})`;ctx.fillRect(0,0,W,H);}
    if(s>2.6){
      ctx.globalAlpha=ease(s,2.6,2.9)*(1-ease(s,5.5,6.35));
      text('THE BRIMSTONE WITCH',W/2,H*.39,13,'#dca995');
      const title='SUPREME CALAMITAS',visible=Math.floor(ease(s,2.75,4.35)*title.length),step=34,start=W/2-(title.length-1)*step/2;
      ctx.shadowColor='#fd334e';ctx.shadowBlur=settings.quality==='low'?0:24;
      for(let i=0;i<visible;i++)text(title[i],start+i*step,H*.5,39,'#ffe0c9');
      ctx.shadowBlur=0;line(W*.32,H*.55,W*.68,H*.55,'#c64b6266',1);
      text('Your sins are beyond redemption.',W/2,H*.6,15,'#cf9a9a');
    }
  }
  if(g.mode==='paused'){ctx.globalAlpha=1;ctx.fillStyle='#07040bc9';ctx.fillRect(0,0,W,H);text('ПАУЗА',W/2,H/2,32,'#ffdbc0');}
  ctx.restore();
}
