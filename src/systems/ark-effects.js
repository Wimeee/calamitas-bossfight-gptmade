// Native Ark particle contracts: pinned SwungBlade/ParryHoldout/BlastAttack and Particles/*.
// Separate deterministic visual RNG; positions and damping use native px/tick units.
import {arkSwingGeometry} from '../classes/ark-motion.js?v=25.0.0';
const LIMIT=640,TAU=Math.PI*2,actions=new WeakMap();
const clamp=x=>Math.max(0,Math.min(1,x));
function rand(g){let n=g.arkFxSeed??0x79a45e3;n^=n<<13;n^=n>>>17;n^=n<<5;g.arkFxSeed=n>>>0;return(n>>>0)/4294967296;}
const between=(g,a,b)=>a+(b-a)*rand(g),integer=(g,a,b)=>Math.floor(between(g,a,b+1));
function vector(g,rx,ry=rx,edge=false){const a=rand(g)*TAU,r=edge?1:Math.sqrt(rand(g));return{x:Math.cos(a)*rx*r,y:Math.sin(a)*ry*r};}
function add(g,p,born=g.t){
 const list=g.arkEffects??=[];p={vx:0,vy:0,rotation:0,scale:1,color:'#ffffff',bloom:'#ff4500',...p,born,id:g.arkFxSerial=(g.arkFxSerial||0)+1};
 if(list.length>=LIMIT){const i=list.findIndex(x=>x.kind==='smoke');if(i>=0)list.splice(i,1);else list.shift();}list.push(p);return p;
}
export function updateArkEffects(dt,g){if(g.mode!=='playing'||g.ritual)return;if(g.arkEffects)g.arkEffects=g.arkEffects.filter(p=>g.t<p.born+p.life);if(g.arkRifts)g.arkRifts=g.arkRifts.filter(p=>g.t-p.born<1.4);}
function travel(v,d,n){return d===1?v*n:v*(1-Math.pow(d,n))/(1-d);}
export function arkParticlePose(p,time){
 const age=(time-p.born)*60,total=p.life*60;if(age<0||age>=total)return null;const u=clamp(age/total),n=Math.floor(age),f=age-n;
 let damping=p.kind==='smoke'?.85:p.kind==='star'?.95:.8,dx,dy,vx,vy;
 if(p.kind==='light'){
  const first=Math.min(n,Math.ceil(total*.34)),last=n-first,mult=Math.pow(1.02,first)*Math.pow(.93,last),d=n<Math.ceil(total*.34)?1.02:.93;
  dx=travel(p.vx,1.02,first)+travel(p.vx*Math.pow(1.02,first),.93,last)+p.vx*mult*f;
  dy=travel(p.vy,1.02,first)+travel(p.vy*Math.pow(1.02,first),.93,last)+p.vy*mult*f;vx=p.vx*mult;vy=p.vy*mult;damping=d;
 }else{const mult=Math.pow(damping,n);dx=travel(p.vx,damping,n)+p.vx*mult*f;dy=travel(p.vy,damping,n)+p.vy*mult*f;vx=p.vx*mult;vy=p.vy*mult;}
 let scale=p.scale,alpha=1;
 if(p.kind==='smoke'){const grow=Math.min(n,Math.ceil(total*.2));scale=(scale+grow*.01)*Math.pow(.975,n-grow);alpha=(p.opacity??.3)*Math.pow(.98,n)*clamp((1-u)/.15);}
 else if(p.kind==='light'){scale*=Math.pow(.95,age);alpha=u>.5?Math.sin(u*Math.PI)*.2+.8:Math.sin(u*Math.PI);}
 else if(p.kind==='star')alpha=Math.sin(u*Math.PI);
 else if(p.kind==='flare'||p.kind==='crit')alpha=Math.cos(u*Math.PI/2);
 else if(p.kind==='pulse')alpha=1-u;
 const spin=(p.spin||0)*age*(p.vx>0?1:-1);
 return{x:p.x+dx,y:p.y+dy,vx,vy,scale,alpha,u,age,rotation:p.rotation+spin,color:p.color,bloom:p.bloom};
}
export function emitArkParry(g,target=null,angle=0){
 const p=g.player;for(let i=0;i<5;i++){const v=vector(g,40,50.4),k=between(g,.5,1.4),delay=integer(g,0,6)*2;
  add(g,{kind:'flare',x:p.x+v.x,y:p.y+v.y,vx:v.x*.01,vy:v.y*.01,scale:k,life:integer(g,20,25)/60,bloom:'#ff2020',from:[.6,1],to:[1.5,2.7]},g.t+delay/60);
 }
 if(target){const x=target.r<70?target.x:p.x+Math.cos(angle)*60,y=target.r<70?target.y:p.y+Math.sin(angle)*60;
  add(g,{kind:'star',x,y,scale:1.2,life:35/60,spin:.1,bloom:'#ff69b4',bloomScale:2});
  for(let i=0;i<10;i++){const v=vector(g,1,1,true),speed=between(g,2.6,4);add(g,{kind:'light',x,y,vx:v.x*speed,vy:v.y*speed,scale:between(g,.3,.6),color:'#00ffff',life:1,hueShift:.02,squish:1,maxSquish:1.5});}
 }
}
export function emitArkHit(g,x,y,angle=0,rip=false){
 for(let i=0;i<(rip?10:5);i++){const a=angle+between(g,-Math.PI*.2,Math.PI*.2),speed=between(g,rip?2.6:3.6,rip?4:8);
  add(g,{kind:'light',x,y,vx:Math.cos(a)*speed,vy:Math.sin(a)*speed,scale:between(g,.3,.6),color:rip?'#ff2020':'#ff4500',life:1,hueShift:rip?.002:.06,squish:rip?1:2,maxSquish:rip?1.5:2.5});
 }
 if(rip)add(g,{kind:'pulse',x,y,scale:.05,endScale:between(g,.2,1.2),life:.5,color:'#ff7f50'});
}
export function emitArkSnap(g,s,finish=false){
 if(finish){add(g,{kind:'slice',x:s.x-Math.cos(s.angle)*40,y:s.y-Math.sin(s.angle)*40,angle:s.angle,length:80,expansion:250,scale:.2,life:10/60,color:'#ffa500'});return;}
 const p=g.player;add(g,{kind:'star',x:s.x,y:s.y,vx:(p.vx||0)/60-Math.cos(s.angle),vy:(p.vy||0)/60-Math.sin(s.angle),scale:between(g,1,2),life:integer(g,10,19)/60,spin:.1,bloom:'#ff4500',bloomScale:3});
}
export function emitArkReady(g,s){add(g,{kind:'pulse',x:s.x,y:s.y,scale:.05,endScale:1.8,life:8/60,color:'#ff4500'});}
export function emitArkRipBurst(g,r){
 (g.arkRifts??=[]).push({x:r.x,y:r.y,ex:r.ex,ey:r.ey,born:g.t});if(g.arkRifts.length>8)g.arkRifts.shift();
 for(let i=0;i<20;i++){const u=rand(g),color=['#ff4500','#ffffff','#ffa500'][integer(g,0,2)],scale=between(g,.05,.4)*(.4+.6*Math.sin(u*Math.PI)),kind=['bloom','bloom','crit'][integer(g,0,2)];
  add(g,{kind,x:r.x+(r.ex-r.x)*u,y:r.y+(r.ey-r.y)*u,vy:between(g,kind==='crit'?-10:-4,-1),scale:kind==='crit'?scale*7:scale,life:integer(g,10,29)/60,color:kind==='crit'?'#fff':color,bloom:color,spin:.1,bloomScale:3});
 }
}
export function emitArkStitch(g,r,index){const u=(index+.5)/10;add(g,{kind:'crit',x:r.x+(r.ex-r.x)*u,y:r.y+(r.ey-r.y)*u,scale:3,life:8/60,color:'#fff',bloom:'#00ffff',spin:.1,bloomScale:3});}
function smoke(g,x,y,vx,vy,scale,life,opacity,color,born,glowing=false){add(g,{kind:'smoke',x,y,vx,vy,scale,life:life/60,opacity,color,variant:integer(g,0,6),glowing},born);}
export function sampleArkEffects(g,s,kind,dt){
 if(g.mode!=='playing'||dt<=0)return;const hz=kind==='rip'?60:120,elapsed=kind==='throw'?s.age:s.max-s.time,max=s.max||1;
 let a=actions.get(s);if(!a){a={tick:0,origin:g.t-dt-elapsed,x:g.player.x,y:g.player.y};actions.set(s,a);}
 const end=Math.min(Math.floor(Math.min(max,elapsed+dt)*hz+1e-7),a.tick+480),p=g.player;
 for(let tick=a.tick+1;tick<=end;tick++){
  const time=tick/hz,progress=clamp(time/max),u=clamp((time-elapsed)/dt),owner={...p,x:a.x+(p.x-a.x)*u,y:a.y+(p.y-a.y)*u},born=a.origin+time;
  if(kind==='rip'){
   if(time>32.5/60)for(let i=0;i<2;i++){const ratio=rand(g),v=vector(g,4,4,true);smoke(g,s.x+(s.ex-s.x)*ratio,s.y+(s.ey-s.y)*ratio,v.x,v.y,.8,12,.6,'#752420',born,true);}continue;
  }
  if(kind==='swing'&&!s.wide)continue;
  if(kind==='throw'&&s.snapped)continue;
  const pose=kind==='swing'?arkSwingGeometry(s,progress,owner):null;
  const angle=pose?pose.angle:s.angle-(time-elapsed)*Math.PI/4*.3*120;
  const scale=kind==='swing'?1.6+Math.sin(progress*Math.PI)+(s.charge||0)/10*.05:1+.5*Math.sin(progress*Math.PI);
  const center=pose?owner:{x:s.x,y:s.y},factor=kind==='swing'?Math.max(0,Math.sin((progress-.2)*Math.PI)):.7,dir=s.direction||1;
  if(rand(g)<.5){const v=vector(g,scale*78),length=Math.hypot(v.x,v.y)||1,tangent=kind==='swing'?dir:-1,rotation=Math.atan2(v.y,v.x)+Math.PI/2*tangent,speed=2*(1+length/15);
   add(g,{kind:'crit',x:center.x+v.x,y:center.y+v.y,vx:(p.vx||0)/60+Math.cos(rotation)*speed,vy:(p.vy||0)/60+Math.sin(rotation)*speed,scale:1+length/(scale*78),life:10/60,spin:.05,bloom:kind==='swing'?(rand(g)<1/3?'#40e0d0':'#ff7f50'):'hsl('+Math.floor(rand(g)*360)+' 100% 50%)',bloomScale:3},born);
  }
  if(rand(g)<.5)for(let i=kind==='swing'?0:.5;i<=1;i+=.5){const along=(kind==='swing'?30+50*i:60*i)*scale,offset=30*factor*rand(g),nx=-Math.sin(angle),ny=Math.cos(angle);
   const x=center.x+Math.cos(angle)*along-nx*offset,y=center.y+Math.sin(angle)*along-ny*offset,spin=kind==='swing'?-dir:1,vx=nx*spin*20*factor+(p.vx||0)/60,vy=ny*spin*20*factor+(p.vy||0)/60;
   const opacity=kind==='swing'?Math.min(1,factor*2)*.25:.25;
   smoke(g,x,y,vx,vy,factor*between(g,2.8,3.1),integer(g,kind==='swing'?6:10,kind==='swing'?10:14),opacity+between(g,0,.2),i<.5?'#1e90ff':i<1?'#7353d1':'#c71585',born);
   if(rand(g)<1/3)smoke(g,x,y,vx,vy,factor*between(g,2,2.4),kind==='swing'?5:7,opacity*2.5,rand(g)<.2?'#ffd700':'#d2691e',born,true);
  }
 }
 a.tick=end;a.x=p.x;a.y=p.y;
}
export function emitArkProjectileSmoke(g,s,x,y,born=g.t){
 if(rand(g)>=.5)return;const color=Math.sin(born*6)>0?'#c71585':'#1e90ff';
 smoke(g,x,y,s.vx/120,s.vy/120,between(g,.6,1.2),20,.28,color,born);
 if(rand(g)<1/3)smoke(g,x,y,s.vx/120,s.vy/120,between(g,.4,.7),15,.8,'#d88bf2',born,true);
}
