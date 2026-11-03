import {enemyBullet} from '../combat/projectiles.js?v=26.2.0';
import {audio} from '../core/audio.js?v=26.2.0';
import {emitSeekerMagic} from '../systems/summon-effects.js?v=26.2.0';
export function initializeSeekers(g){for(let i=0;i<g.seekers.length;i++){const s=g.seekers[i];Object.assign(s,{initialized:true,degree:i*36,nativeTimer:0,nativeTicks:0,nativeFrame:i%6,frameOffset:i%6,r:20,warning:false});s.x=g.boss.x-Math.cos(s.degree*Math.PI/180)*225;s.y=g.boss.y-Math.sin(s.degree*Math.PI/180)*225;}g.seekerStepRemainder=0;}
export function updateSeekers(dt,g){if(g.stage!=='seekers'||g.mode!=='playing')return;if(g.seekers[0]&&!g.seekers[0].initialized)initializeSeekers(g);g.seekerStepRemainder=(g.seekerStepRemainder||0)+dt;
 while(g.seekerStepRemainder+1e-10>=1/60){g.seekerStepRemainder=Math.max(0,g.seekerStepRemainder-1/60);for(const [i,s]of g.seekers.entries()){
  s.nativeTimer++;s.nativeTicks++;s.warning=s.nativeTimer>=145;s.nativeFrame=(s.frameOffset+Math.floor((s.nativeTicks+1)/5))%6;
  if(s.nativeTimer===145)emitSeekerMagic(g,s,'warning');
  if(s.warning)emitSeekerMagic(g,s,'charge');
  if(s.nativeTimer>180){if(i===0)audio.calamitas('cast',g);const dx=g.player.x-s.x,dy=g.player.y-s.y,d=Math.hypot(dx,dy);if(d>160&&d<1952){const q=enemyBullet(s.x,s.y,dx/d,dy/d,150,8.5,'sepulcherDart',29);if(q)Object.assign(q,{ai0:0,ai1:3,ai2:900,life:11.5,scale:.85,opacity:1,frame:0,sourceCalamitas:true,nativeSeeker:true});emitSeekerMagic(g,s,'shot');}else emitSeekerMagic(g,s,'fail');s.nativeTimer=0;s.warning=false;}
  s.previousX=s.x;s.previousY=s.y;s.x=g.boss.x-Math.cos(s.degree*Math.PI/180)*225;s.y=g.boss.y-Math.sin(s.degree*Math.PI/180)*225;s.degree+=.5;
 }}
}
