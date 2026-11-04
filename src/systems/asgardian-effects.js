import {audio} from '../core/audio.js?v=28.0.1';
const LIMIT=256;
function random(g){let n=g.aegisFxSeed??0x6a7f98d;n^=n<<13;n^=n>>>17;n^=n<<5;g.aegisFxSeed=n>>>0;return(n>>>0)/4294967296;}
function add(g,p,born=g.t){const list=g.aegisEffects??=[];if(list.length>=LIMIT)list.shift();list.push({vx:0,vy:0,rotation:0,...p,born});}
export function emitAsgardianTrail(g,x,y,vx,vy,born=g.t){
 if(g.ritual)return;
 const speed=Math.hypot(vx,vy)/60,angle=Math.atan2(-vy,-vx)+(random(g)*2-1)*Math.PI/18,k=.1+random(g)*.7;
 add(g,{kind:'mark',x:x+(random(g)*12-6)-vx/60*1.2,y:y+(random(g)*30-15)-vy/60*1.2,vx:Math.cos(angle)*speed*k,vy:Math.sin(angle)*speed*k,scale:1.15+random(g)*.1,color:random(g)<.5?'#ff00ff':'#00ffff',life:17/60,stretch:[1.3,.5]},born);
 for(let i=0;i<4;i++){const a=random(g)*Math.PI*2,s=.6+random(g)*.8;add(g,{kind:'dust',x:x+Math.cos(a)*6-vx/30,y:y+Math.sin(a)*6-vy/30,vx:-vx/60*s,vy:-vy/60*s,scale:.18+random(g)*.16,color:i%2?'#8ffaff':'#f06dff',life:(12+random(g)*8)/60},born);}
}
export function emitAsgardianImpact(g,x,y){
 add(g,{kind:'pulse',x,y,life:36/60,scale:.1,endScale:.85,color:'#00ffff'});add(g,{kind:'explosion',x,y,life:26/60,scale:.65,color:'#ff00ff',rotation:random(g)*10-5});
 for(let i=0;i<35;i++){const a=random(g)*Math.PI*2,s=Math.SQRT2*4.5*(.2+random(g)*1.7);add(g,{kind:'dust',x,y,vx:Math.cos(a)*s,vy:Math.sin(a)*s,scale:.2+random(g)*.25,color:'#d76aff',life:(18+random(g)*12)/60});}
 for(let i=0;i<14;i++){const a=random(g)*Math.PI*2,s=Math.SQRT2*6*(.5+random(g)*.7);for(const color of ['#6cffff','#a44aff'])add(g,{kind:'mark',x:x+Math.cos(a)*s*2,y:y+Math.sin(a)*s*2,vx:Math.cos(a)*s,vy:Math.sin(a)*s,scale:.45,color,life:20/60,stretch:[1,.5]});}
 add(g,{kind:'sound',x,y,life:.15},g.t+3/60);
}
export function emitAsgardianInferno(g,target){const a=random(g)*Math.PI*2,r=random(g)*(target.r||20);add(g,{kind:'dust',x:target.x+Math.cos(a)*r,y:target.y+Math.sin(a)*r,vx:0,vy:-(1+random(g)*4),scale:.12+random(g)*.15,color:random(g)<1/7?'#00ffff':'#ff00ff',life:12/60});}
export function updateAsgardianEffects(dt,g){if(g.mode!=='playing'||g.ritual)return;for(const p of g.aegisEffects||[])if(p.kind==='sound'&&!p.played&&g.t>=p.born){p.played=true;audio.fx('aegisImpact');audio.fx('aegisExplosion');}if(g.aegisEffects)g.aegisEffects=g.aegisEffects.filter(p=>g.t<p.born+p.life);}
