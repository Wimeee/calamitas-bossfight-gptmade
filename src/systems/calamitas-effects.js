// Native particle counts/origins/lifetimes: SupremeCalamitas.cs at pinned1a8cebd.
// Particle compositing is a bounded Canvas adaptation of Calamity's particle engine.
const LIMIT=480;
function random(g){let n=g.calamitasFxSeed??0x71ad2a;n^=n<<13;n^=n>>>17;n^=n<<5;g.calamitasFxSeed=n>>>0;return (n>>>0)/4294967296;}
function add(g,p){const list=g.calamitasEffects??=[];if(list.length<LIMIT)list.push({...p,age:0});}
function hand(g,offset){const b=g.boss,side=g.player.x>=b.x?1:-1;return {x:b.x+side*offset,y:b.y+2};}
export function emitCalamitasCast(g,kind,second=g.thresholds.has('40')){
 const b=g.boss,p=g.player,angle=Math.atan2(p.y-b.y,p.x-b.x),h=hand(g,kind==='hellblast'?18:22);
 const above=g.boss.castKind==='darts';
 if(second&&(kind==='giga'||kind==='fire')){const life=above?55:60,first=above?(kind==='fire'?.95:.92):.9,last=first+.03;for(const [color,speed,start,end] of [['#ff2020',above?12:9,first,0],['#ff00ff',above?10:8,last,.4]])add(g,{kind:'pulse',event:kind,x:b.x,y:b.y,vx:Math.cos(angle)*speed,vy:Math.sin(angle)*speed,angle,life,start,end,color});return;}
 if(above)return;
 const count=kind==='hellblast'?(second?9:6):kind==='giga'?25:6;
 const life=kind==='hellblast'?(second?9:18):9;
 for(let i=0;i<count;i++){
  const a=angle+(random(g)*2-1)*.6,speed=5+random(g)*8,vx=Math.cos(a)*speed,vy=Math.sin(a)*speed;
  add(g,{kind:kind==='giga'?'orb':'point',event:kind,x:h.x+vx*2,y:h.y+vy*2,vx:vx*1.5,vy:vy*1.5,life,scale:(second&&kind==='hellblast'?.5:.4)+random(g)*.25,color:random(g)<1/3?'#ff004c':'#ff2020'});
 }
}
export function emitCalamitasAmbient(g,act){
 const second=g.thresholds.has('40');
 if(act==='hellblast'&&random(g)<.5){const h=hand(g,18),a=-Math.PI/2+(random(g)*2-1)*.4,speed=6*(.8+random(g)*.6);add(g,{kind:'orb',x:h.x,y:h.y,vx:Math.cos(a)*speed,vy:Math.sin(a)*speed,life:15,scale:(second?.95:.85)+random(g)*(second?.5:.35),color:random(g)<.5?'#ff2020':second?'#ff0080':'#ff004c'});}
 if(g.dashActive>0){
  const b=g.boss,a=b.shieldRotation||0;
  // Native eye-socket trail positions; PointParticle replaces vanilla dust atlas cells.
  for(let i=1;i<16;i++)add(g,{kind:'point',x:b.x-(b.vx||0)/60*i/16+Math.cos(a)*42+Math.sin(a)*Math.cos(Math.atan2(b.vy,b.vx))*-4,y:b.y-(b.vy||0)/60*i/16+Math.sin(a)*42-Math.cos(a)*Math.cos(Math.atan2(b.vy,b.vx))*-4,vx:(b.vx||0)/60,vy:(b.vy||0)/60,life:10,scale:(.6+.25*(1-i/16))*6/22,color:'#ff2020',shieldDust:true});
 }
}
export function updateCalamitasEffects(dt,g){
 if(!g||g.mode!=='playing'||g.ritual)return;
 g.calamitasFxRemainder=(g.calamitasFxRemainder||0)+dt;
 while(g.calamitasFxRemainder+1e-10>=1/60){g.calamitasFxRemainder=Math.max(0,g.calamitasFxRemainder-1/60);for(const p of g.calamitasEffects||[]){p.age++;p.x+=p.vx;p.y+=p.vy;p.vx*=.95;p.vy*=.95;if(p.scale!==undefined)p.scale*=p.kind==='orb'?.93:p.kind==='void'?.9:.95;}g.calamitasEffects=(g.calamitasEffects||[]).filter(p=>p.age<p.life);}
}

export {add as addCalamitasEffect,random as calamitasVisualRandom};
