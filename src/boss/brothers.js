import {audio} from '../core/audio.js?v=26.1.1';
import {rnd} from '../core/math.js?v=26.1.1';
import {spawnBrotherProjectile} from '../combat/brother-projectiles.js?v=26.1.1';
const clamp=n=>Math.max(0,Math.min(1,n)),lerp=(a,b,t)=>a+(b-a)*t,remap=(n,a,b,c,d)=>lerp(c,d,clamp((n-a)/(b-a)));
const roundEven=n=>Math.abs(n-Math.floor(n)-.5)<1e-10?(Math.floor(n)%2?Math.ceil(n):Math.floor(n)):Math.round(n);
function direction(x,y){const d=Math.hypot(x,y)||1;return{x:x/d,y:y/d};}
function rotate(v,a){return{x:v.x*Math.cos(a)-v.y*Math.sin(a),y:v.x*Math.sin(a)+v.y*Math.cos(a)};}
export function brotherSmoothVelocity(dx,dy,speed){const d=Math.hypot(dx,dy);if(!d)return{x:0,y:0};const min=Math.min(d,speed),max=Math.min(d/24,speed*3),v=lerp(min,max,clamp(d/2400))*60;return{x:dx/d*v,y:dy/d*v};}
function spawn(g,b,variant,speed,d,position,damage=100,side){const p=position||b;return spawnBrotherProjectile(g,b.kind===0?'fist':'slash',p.x,p.y,d.x*speed,d.y*speed,variant,side??(b.nativeAI.fromRight?1:0),damage);}
function shoot(g,b,a,p,phase){
 const cat=b.kind===0,dir=direction(p.x-b.x,p.y-b.y),face=p.x>b.x?1:-1,position={x:b.x+(cat?74:125)*face,y:b.y};
 if(cat){audio.minion('brotherFist',g);if(phase&&a.doubleCounter>=2){spawn(g,b,2,15,rotate(dir,a.broAlive?.55:.48),position);spawn(g,b,2,15,rotate(dir,a.broAlive?-.55:-.48),position);a.doubleCounter=0;}else{spawn(g,b,2,15,dir,position);if(phase)a.doubleCounter++;}}
 else{audio.minion('brotherSlash',g,{pitch:a.fromRight?.2:-.2});const leading=a.broAlive?dir:direction(dir.x+(p.vx||0)/60*.0305,dir.y+(p.vy||0)/60*.0305);if(phase&&a.doubleCounter>=2){spawn(g,b,3,.2,leading,position);a.doubleCounter=0;audio.minion('brotherHeavySlash',g,{pitch:.4});}else{spawn(g,b,2,phase?5.5:8,phase?leading:dir,position);if(phase)a.doubleCounter++;}}
 a.fromRight=!a.fromRight;b.nativeFrame=0;a.broAlive=g.brothers.some(other=>other!==b&&other.hp>0);
}
function bigShot(g,b,a,p,phase,death){
 const cat=b.kind===0,dir=direction(p.x-b.x,p.y-b.y),leading=a.broAlive?dir:direction(dir.x+(p.vx||0)/60*.032,dir.y+(p.vy||0)/60*.032),position={x:b.x+(cat?74:0)*(p.x>b.x?1:-1),y:b.y};
 const special=death&&(a.broAlive?a.bigLimit===1:a.bigLimit>0&&a.bigLimit<=3);
 if(special){if(cat){for(const sign of [-1,1])spawn(g,b,2,11,rotate(dir,sign*(.6-a.bigLimit*.16)),position,100,0);audio.minion('brotherHeavyFist',g,{pitch:-.8-a.bigLimit*.1});}else{const v=phase?dir:leading;spawn(g,b,50,90,v,{x:b.x+leading.x*130,y:b.y+leading.y*130},120,5);audio.minion('brotherHeavySlash',g,{pitch:-.3-a.bigLimit*.1});}}
 else if(phase&&a.bigLimit===0){if(cat){spawn(g,b,3,9.5,dir,position);audio.minion('brotherBigShot',g,{volume:1.8,pitch:.5});audio.minion('brotherOrb',g);}else{b.vx=leading.x*90*60;b.vy=leading.y*90*60;a.dashTimer=30;a.dashes=0;audio.minion('brotherDash',g,{pitch:-.5});}}
 else if(cat){const offset=rnd(-25,25)*1.5;spawn(g,b,1,7.5-(phase?(29-a.bigLimit)*.13:(8-a.bigLimit)*.15),dir,{x:b.x-dir.y*offset,y:b.y+dir.x*offset});audio.minion('brotherBigShot',g,{volume:1.2,pitch:.4});}
 else{spawn(g,b,1,8,dir);audio.minion('brotherSlash',g,{pitch:a.fromRight?.2:-.2});}
 a.fromRight=!a.fromRight;b.nativeFrame=0;if(a.bigLimit>0)a.bigLimit--;else{a.bigTimer=500;a.delay=0;a.bigLimit=7;a.targetSide=!a.targetSide;}
}
function step(g,b){
 const p=g.player,cat=b.kind===0,death=g.difficulty==='death';
 const a=b.nativeAI??=( {bigTimer:500,bigLimit:7,delay:0,counter:0,vertical:0,movingUp:b.movingUp??cat,fromRight:false,targetSide:false,doubleCounter:0,broAlive:true,roar:true,offsetX:0,offsetY:0,dashTimer:0,dashes:0,frameCounter:0} );
 b.vx??=0;b.vy??=0;b.nativeFrame??=0;if(a.bigTimer>0)a.bigTimer--;
 if(death&&g.brotherRespawnAvailable===false&&!a.broAlive)b.hp=Math.min(b.hp,b.max*.65);
 const other=g.brothers.find(x=>x!==b&&x.hp>0),ratio=(b.hp/b.max+(other?other.hp/other.max:0))*.5;
 let phase=!a.broAlive;if(b.hp/b.max<(death?.6:.4)&&!phase){phase=true;if(a.roar){a.roar=false;audio.minion('brotherEnrage',g,{volume:1.5,pitch:.3});}}
 a.empowered=phase;if(phase&&a.bigTimer>400)a.bigTimer=400;
 if(a.bigTimer>0){if(cat&&!a.broAlive)a.bigLimit=Math.max(a.bigLimit,29);else if(!cat&&phase)a.bigLimit=Math.max(a.bigLimit,11);else a.bigLimit=Math.max(a.bigLimit,7);}
 const dir=direction(p.x-b.x,p.y-b.y);
 if(a.bigTimer>50){
  const verticalSpeed=roundEven(lerp(2,6.5,1-ratio)),verticalStep=phase?Math.trunc(verticalSpeed*1.5):verticalSpeed;
  if(a.movingUp){if(a.vertical<400)a.vertical+=verticalStep;else a.movingUp=false;}else{if(a.vertical> -400)a.vertical-=verticalStep;else a.movingUp=true;}
  const horizontal=(cat?1:-1)*(a.targetSide?-750:750);
  if(phase){
   if(a.counter<=15&&a.dashTimer===0){const v=brotherSmoothVelocity(p.x+horizontal-b.x,p.y+a.vertical-b.y,remap(a.delay,10,120,20,80));b.vx=v.x;b.vy=v.y;}
   else if(cat||a.dashTimer===0){b.vx*=.85;b.vy*=.85;}
   else{
    a.dashTimer--;const velocity=direction(b.vx,b.vy);spawn(g,b,4+a.dashes,.1,velocity,null,120);a.dashes++;
    if(a.dashes===30&&!a.broAlive){for(const angle of [-.34,.34]){const d=rotate(dir,angle);spawn(g,b,50,90,d,{x:b.x+d.x*130,y:b.y+d.y*130},120,0);}audio.minion('brotherHeavySlash',g,{pitch:-.3});}
    b.vx*=.975;b.vy*=.975;
   }
  }else{
   if(a.counter<=15){const distance=70*(a.bigTimer<=60?-4:1);a.offsetX=dir.x*distance;a.offsetY=dir.y*distance;}else{a.offsetX*=.9;a.offsetY*=.9;}
   const v=brotherSmoothVelocity(p.x+horizontal-b.x-a.offsetX,p.y+a.vertical-b.y-a.offsetY,17);b.vx=v.x;b.vy=v.y;
  }
 }else{b.vx*=.9;b.vy*=.9;}
 if(a.delay<120)a.delay+=death?1.5:1;
 else if(a.bigTimer>50){const rate=lerp(1.5,2,1-ratio)*(a.broAlive?1:cat?(death?1.32:1.1):(death?1.25:1.05));a.counter=Math.fround(a.counter+rate);if(a.counter>=50){a.counter=0;shoot(g,b,a,p,phase);}}
 else if(a.bigTimer>0){if(a.bigTimer===50)audio.minion('brotherCharge',g);a.bigTimer--;}
 else{let rate=lerp(2.5,3,1-ratio);if(!a.broAlive)rate=cat?lerp(3,4+(29-a.bigLimit)*.45,1-ratio)*1.2:rate*1.35;if(phase&&a.bigLimit===0)rate=1;a.counter=Math.fround(a.counter+rate);if(a.counter>=50){a.counter=0;bigShot(g,b,a,p,phase,death);}}
 b.x+=b.vx/60;b.y+=b.vy/60;b.phase=a.dashTimer>0?'dash':a.bigTimer>50?'hover':a.bigTimer>0?'windup':'burst';
 if(a.delay<120){a.frameCounter+=.15;if(a.frameCounter>=1){b.nativeFrame=(b.nativeFrame+1)%(cat?12:6);a.frameCounter=0;}}
 else{const value=a.counter+(a.fromRight?0:50),f=cat?clamp((value-10)/90):clamp(value/100);b.nativeFrame=roundEven(lerp(cat?12:6,cat?21:15,f));}
}
export function updateBrothers(dt,g){
 if(g.mode!=='playing'||g.castDelayState||g.stage!=='brothers')return;g.brotherStepRemainder=(g.brotherStepRemainder||0)+dt;
 while(g.brotherStepRemainder+1e-10>=1/60){g.brotherStepRemainder=Math.max(0,g.brotherStepRemainder-1/60);for(const b of g.brothers)if(b.hp>0)step(g,b);}
}
