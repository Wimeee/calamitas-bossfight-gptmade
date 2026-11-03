import {addCalamitasEffect as add,calamitasVisualRandom as random} from './calamitas-effects.js?v=26.1.0';
export function emitProjectileMagic(g,q,event){
 const giga=q.kind==='giga',opacity=q.opacity??1;
 if(event==='bloom'){const left=q.nativeLife;if(left===30)for(let i=0;i<2;i++)add(g,{kind:'bloom',x:q.x,y:q.y,vx:0,vy:0,start:.1,end:giga?.85:.7,life:30,color:'#79154d'});if(left===15||left===8)add(g,{kind:'bloom',x:q.x,y:q.y,vx:0,vy:0,start:.1,end:left===15?(giga?.8:.65):(giga?.7:.5),life:left,color:left===15?'#ff2020':'#ffffff'});return;}
 if(event==='impact'){for(let i=0;i<18;i++){const a=random(g)*Math.PI*2,v=Math.SQRT2*12,s=.3+random(g)*.7;add(g,{kind:'point',x:q.x+Math.cos(a)*v,y:q.y+Math.sin(a)*v,vx:Math.cos(a)*v*s,vy:Math.sin(a)*v*s,scale:giga?1.25:1.1,opacity:.6,life:15,color:random(g)<.5?'#ff0080':'#ff2020'});}return;}
 if(event==='skull'){
  if(Math.hypot(g.player.x-q.x,g.player.y-q.y)>=1400)return;const v=Math.hypot(q.vx,q.vy)||1,sine=Math.sin(q.life*60*.575/Math.PI)*16,dx=-q.vy/v*sine,dy=q.vx/v*sine;
  for(const sign of [-1,1])add(g,{kind:'spark',x:q.x+dx*sign,y:q.y+dy*sign,vx:-q.vx/60*.05,vy:-q.vy/60*.05,scale:.8,life:8,color:random(g)<.5?'#ff2020':'#ff0080'});return;
 }
 if(event==='trail'&&!q.detonating&&opacity>0&&random(g)<.5){const a=random(g)*Math.PI*2,r=(giga?30:20)*Math.sqrt(random(g)),speed=.1+random(g)*.9;add(g,{kind:'spark',x:q.x-q.vx/60+Math.cos(a)*r,y:q.y-q.vy/60+Math.sin(a)*r,vx:-q.vx/60*speed,vy:-q.vy/60*speed,scale:(giga?.5:.35)+random(g)*.25,opacity,life:14,color:random(g)<.5?'#ff0080':'#ff2020'});}
}
