import {audio} from '../core/audio.js?v=26.0.5';
import {rnd} from '../core/math.js?v=26.0.5';
export function spawnBrotherProjectile(g,kind,x,y,vx,vy,variant=2,side=0,damage=100){
 if(g.projectiles.length>=1000)return null;const q={nativeBrother:true,kind,x,y,vx:vx*60,vy:vy*60,variant,side,damage,t:0,life:25,nativeLife:kind==='fist'?1200:1500,nativeTime:0,remainder:0,opacity:0,frame:0,scale:1,r:kind==='fist'?35:43,canHit:false};g.projectiles.push(q);return q;
}
const clamp=n=>Math.max(0,Math.min(1,n));
function childFist(g,q,angle){const a=angle+(Math.random()*2-1),speed=5+Math.random()*10,cos=Math.cos(a),sin=Math.sin(a),x=-q.shootVX/60*1.5,y=-q.shootVY/60*1.5,rx=x*cos-y*sin,ry=x*sin+y*cos,k=rnd(.75,1)*Math.min(1.8,Math.max(.1,q.nativeTime*.02));const vx=-q.shootVX/60*k,vy=-q.shootVY/60*k;spawnBrotherProjectile(g,'fist',q.x+rx*speed,q.y+ry*speed,vx*Math.cos(angle)-vy*Math.sin(angle),vx*Math.sin(angle)+vy*Math.cos(angle),0,Math.random()<.5?0:1,q.damage);}
export function updateBrotherProjectile(q,g,dt){
 if(q.finalTick){q.life=0;return;}q.remainder+=dt;
 while(q.remainder+1e-10>=1/60&&q.nativeLife>0){q.remainder=Math.max(0,q.remainder-1/60);
  const fist=q.kind==='fist',ownerAlive=g.brothers?.some(b=>b.kind===(fist?0:1)&&b.hp>0);if(!ownerAlive){q.nativeLife=0;q.life=0;return;}
  const updates=fist?(q.variant<2?3:1):(q.variant===3?6:q.variant===1?3:q.variant>=4?1:2);
  for(let i=0;i<updates&&q.nativeLife>0;i++){
   if(!fist)q.nativeTime++;
   if(fist){
    if(q.variant>=3){
     if(q.nativeLife>240){q.shootVX=q.vx*.4;q.shootVY=q.vy*.4;q.nativeLife=240;q.vx*=5.5;q.vy*=5.5;q.solo=!g.brothers.some(b=>b.kind===1&&b.hp>0);}else{q.vx*=.945;q.vy*=.945;}
     if(q.nativeLife<=200&&q.nativeTime%3===0){childFist(g,q,0);if(q.solo){childFist(g,q,Math.PI*2/3);childFist(g,q,-Math.PI*2/3);}audio.minion('brotherBigShot',g,{volume:1.2,pitch:.55});}
     q.r=90;q.canHit=true;
    }else{
     if(q.variant!==1){q.vx*=1.0055;q.vy*=1.0055;}if(q.variant===0){q.scale=.8;q.nativeLife=Math.min(q.nativeLife,300);q.vx*=1.006;q.vy*=1.006;}
     q.opacity=clamp(q.nativeLife/12)*clamp((1200-q.nativeLife)/7);q.canHit=q.opacity===1;q.r=35*q.scale;
    }
    q.frame=Math.floor((q.nativeTime+1)/5)%4;q.nativeTime++;
   }else{
    if(q.variant===50){q.nativeLife=Math.min(q.nativeLife,30);q.opacity=0;const speed=Math.hypot(q.vx,q.vy)||1;spawnBrotherProjectile(g,'slash',q.x,q.y,q.vx/speed*.1,q.vy/speed*.1,3+q.nativeTime,5,q.damage);q.canHit=false;}
    else if(q.variant>=4){
     if(q.nativeLife===1500)q.nativeLife=(q.side===5?(g.difficulty==='death'?35:45):40)-(q.variant-4);
     q.canHit=q.nativeLife===1;q.exploding=q.canHit;q.opacity=0;q.r=q.side===5?70:100;
     if(q.canHit)audio.minion('brotherDash',g,{pitch:.8});
    }else{
     if(q.variant===2||q.variant===3&&q.nativeTime>30){const mult=q.variant===2?1.0045:1.015;q.vx*=mult;q.vy*=mult;}
     q.opacity=clamp(q.nativeLife/8)*clamp((1500-q.nativeLife)/8);q.canHit=q.opacity===1;q.r=43;
    }
    q.frame=Math.floor(q.nativeTime/7)%4;
   }
   q.x+=q.vx/60;q.y+=q.vy/60;q.nativeLife--;if(q.nativeLife<=0&&q.exploding)q.finalTick=true;
  }q.t+=1/60;
 }q.life=q.finalTick?1/60:q.nativeLife/(60*(q.kind==='fist'?(q.variant<2?3:1):(q.variant===3?6:q.variant===1?3:q.variant>=4?1:2)));
}
