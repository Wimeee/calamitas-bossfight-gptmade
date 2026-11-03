// Bounded presentation simulation with its own RNG; never consumes combat rolls.
export function updateRipperVisuals(g,dt){
 const r=g.rippers;if(!r?.enabled||g.mode!=='playing'||g.ritual)return;
 const v=r.visuals??={particles:[],pulses:[],remainder:0,rageTicks:0,seed:14791};
 const random=()=>{v.seed=(Math.imul(v.seed,1664525)+1013904223)>>>0;return v.seed/4294967296;};
 v.remainder+=Math.max(0,dt);
 while(v.remainder+1e-10>=1/60){v.remainder=Math.max(0,v.remainder-1/60);
  for(const p of v.particles){p.x+=p.vx/60;p.y+=p.vy/60;p.life-=1/60;p.scale*=p.kind==='adrenaline'?.94:.97;if(p.kind==='adrenaline'){p.vx*=.9;p.vy*=.9;}}
  v.particles=v.particles.filter(p=>p.life>0&&p.scale>(p.kind==='adrenaline'?.4:.06));
  for(const ring of v.pulses)ring.age+=1/60;v.pulses=v.pulses.filter(p=>p.age<p.life);
  const player=g.player;
  if(r.rageTime>0){
   v.rageTicks++;const cycle=v.rageTicks%90;if(cycle===60||cycle===0)v.pulses.push({age:0,life:(cycle===60?40:30)/60,endScale:cycle===60?.23:.18});
   if(v.particles.length<120)v.particles.push({kind:'rage',x:player.x+(random()-.5)*20,y:player.y+(random()-.5)*36,vx:-(player.vx||0)/3,vy:-(player.vy||0)/3,scale:.3+random()*.15,frame:Math.floor(random()*3),life:.6});
  }else v.rageTicks=0;
  if(r.adrenalineTime>0)for(let i=0;i<4&&v.particles.length<120;i++){
   const oldPosition=random()>=.2;
   v.particles.push({kind:'adrenaline',x:player.x+(random()-.5)*20-(oldPosition?(player.vx||0)/40:0),y:player.y+(random()-.5)*36-(oldPosition?(player.vy||0)/40:0),vx:(player.vx||0)*.25,vy:(player.vy||0)*.25,scale:.4+random()*.8,frame:Math.floor(random()*3),life:1});
  }
  if(v.pulses.length>4)v.pulses.splice(0,v.pulses.length-4);
 }
}
