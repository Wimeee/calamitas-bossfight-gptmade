import {addCalamitasEffect as add,calamitasVisualRandom as random} from './calamitas-effects.js?v=29.0.0';
import {heartSpawnPositions} from '../world/heart-layout.js?v=29.0.0';
function orb(g,x,y,scale,life=20,color='#ff2020',vx=0,vy=0){add(g,{kind:'orb',x,y,vx,vy,scale,life,color});}
function flame(g,x,y,count){for(let i=0;i<count;i++)add(g,{kind:'flame',x:x+(random(g)-.5)*60,y:y+(random(g)-.5)*60,vx:(random(g)-.5)*.5,vy:-(3+random(g)*1.45),scale:1.35+random(g)*.25,life:40,color:'#ff2020',frame:i%3});}
function catmull(p0,p1,p2,p3,t){return .5*((2*p1)+(-p0+p2)*t+(2*p0-5*p1+4*p2-p3)*t*t+(-p0+3*p1-3*p2+p3)*t*t*t);}
function path(a,b,t){return {x:catmull(a.x,a.x,b.x,b.x,t),y:catmull(a.y+1000,a.y,b.y,b.y+1000,t)};}
export function emitSeekerMagic(g,s,event){const a=Math.atan2(g.player.y-s.y,g.player.x-s.x);
 if(event==='warning'){for(const [scale,color]of [[.03,'#ff2020'],[.025,'#ff004c']])add(g,{kind:'staticPulse',x:s.x,y:s.y,vx:0,vy:0,angle:0,squish:2,start:scale,end:.005,life:8,color});}
 else if(event==='charge'){const speed=5*(.6+random(g)*.5)*1.8;orb(g,s.x+Math.cos(a)*35,s.y+Math.sin(a)*35,.7+random(g)*.05,15,random(g)<.5?'#ff004c':'#ff2020',Math.cos(a)*speed,Math.sin(a)*speed);}
 else for(let i=0;i<(event==='shot'?5:10);i++){const angle=a+(random(g)*2-1)*(event==='shot'?1:Math.PI),speed=event==='shot'?5*(2.2+random(g)*1.6):3*(.5+random(g)*.8);orb(g,s.x,s.y,.2,10,'#ff2020',Math.cos(angle)*speed,Math.sin(angle)*speed);}
}
export function updateSummonCast(dt,g,cs){cs.fxRemainder=(cs.fxRemainder||0)+dt;cs.fxTicks??=Math.round(cs.remaining*60);cs.fxStart??={x:g.boss.x,y:g.boss.y};
 while(cs.fxRemainder+1e-10>=1/60&&cs.fxTicks>0){cs.fxRemainder=Math.max(0,cs.fxRemainder-1/60);const left=--cs.fxTicks,b=g.boss;
  if(cs.type==='sepulcher'){
   const from={x:b.x+(g.player.x>=b.x?8:-8),y:b.y},t=Math.max(0,Math.min(1,(50-left)/50));
   for(const to of heartSpawnPositions(g)){const p=path(from,to,t);add(g,{kind:'point',x:p.x,y:p.y,vx:0,vy:0,scale:.6,life:12,color:'#ff2020'});if(left===0)flame(g,to.x,to.y,20);}
  }else if(cs.type==='brothers'){
   for(const side of [-1,1]){const to={x:cs.fxStart.x+side*500,y:cs.fxStart.y},color=side<0?'#00bfff':'#79154d';
    if(left<105&&left>=60){const p=path({x:b.x+side*44*.45,y:b.y+21},to,(105-left)/45);orb(g,p.x,p.y,2.8-left*.01,20);}
    if(left===59)for(const end of [1.4,1])add(g,{kind:'bloom',x:to.x,y:to.y,vx:0,vy:0,start:0,end,life:59,color});
    if(left<60&&left>0){const power=Math.min(1,(60-left)/40),count=Math.ceil(1+5*power);for(let i=0;i<count;i++){const a=random(g)*Math.PI*2,speed=2+random(g)*11;add(g,{kind:'void',x:to.x+Math.cos(a)*speed*4.5,y:to.y+Math.sin(a)*speed*4.5,vx:-Math.cos(a)*speed*.25,vy:-Math.sin(a)*speed*.25,scale:(.08+random(g)*.08-left*.002)*.357,life:9,color:random(g)<.2?color:'#ff2020'});}}
    if(left===0)for(let i=0;i<30;i++){const a=random(g)*Math.PI*2,speed=Math.SQRT2*5*(.5+random(g));add(g,{kind:'spark',x:to.x,y:to.y,vx:Math.cos(a)*speed,vy:Math.sin(a)*speed,scale:1.2+random(g)*.25,life:35,color:random(g)<.5?color:'#ff2020'});}
   }
  }
 }
}
export function emitSeekerDeath(g,s){if(s.deathVisualEmitted)return;s.deathVisualEmitted=true;g.helperGore??=[];for(let i=1;i<=5;i++)g.helperGore.push({x:s.x,y:s.y,vx:(random(g)-.5)*240,vy:-100-random(g)*160,spin:(random(g)-.5)*4,angle:0,life:3,kind:'seekerGore'+i});g.helperGore=g.helperGore.slice(-80);flame(g,s.x,s.y,25);}
