import { enemyBullet } from '../combat/projectiles.js?v=18.0.0';
import { arena } from '../core/arena.js?v=18.0.0';
import { clamp, norm, rnd } from '../core/math.js?v=18.0.0';
import { state } from '../core/state.js?v=18.0.0';
import { enter } from '../game/phases.js?v=18.0.0';

const hellDirections=[
  [['down','right','left'],['right','left'],['down','right','left']],
  [['up'],['right'],['right','left']],
  [['down'],['left'],['right','left']],
  [['up'],['right'],['right','left']],
  [['down'],['right','left'],['down','right','left']]
];

const hellSymbols={up:'↑',down:'↓',right:'→',left:'←'};


function hellPlan(g,upcoming){
  const segment=Math.min(2,Math.floor(g.stageT/5)),n=g.phaseN;
  const dirs=hellDirections[n-1][segment];
  const slots=[];
  // The gap cycles with the wave; it is NOT centered on the player.
  const indexGap=upcoming*5+n*2+segment;
  for(const side of dirs){
    const vert=side==='up'||side==='down',N=vert?13:9;
    const span=vert?arena.r-arena.l:arena.b-arena.t;
    const step=span/(N+1);
    const shift=Math.sin((upcoming+n*3)*.83)*step*.46;
    for(let i=0;i<N;i++){
      // Moving two-lane gap gives the player a legible passage across the stream.
      let hole=indexGap%(N-1);
      if(i===hole||i===hole+1)continue;
      let point=vert?arena.l+step*(i+1)+shift:arena.t+step*(i+1)+shift;
      if(side==='down')slots.push({x:point,y:arena.t-12,vx:0,vy:1,side});
      if(side==='up')slots.push({x:point,y:arena.b+12,vx:0,vy:-1,side});
      if(side==='right')slots.push({x:arena.l-12,y:point,vx:1,vy:0,side});
      if(side==='left')slots.push({x:arena.r+12,y:point,vx:-1,vy:0,side});
    }
  }
  return {dirs,slots,segment};
}


function bulletHell(dt){
  const g=state.game,n=g.phaseN,T=g.stageT;
  const segment=Math.min(2,Math.floor(T/5));
  g.boss.x=500;
  g.boss.y=220;
  const interval=g.difficulty==='death'?.96:g.difficulty==='revenge'?1.10:1.23;
  const speed=(g.difficulty==='death'?240:g.difficulty==='revenge'?213:192)+n*5;
  if(g.hellSegment!==segment){
    g.hellSegment=segment;
    // Short breath when switching direction; no unfair instant crossfire.
    g.hellTimer=Math.max(g.hellTimer,.56);
  }
  g.hellTimer-=dt;
  if(g.hellTimer<=0){
    const wave=++g.hellWave;
    for(const spec of hellPlan(g,wave).slots){
      // Purely cardinal: every Hellblast crosses the ENTIRE arena on a straight line.
      let q=enemyBullet(spec.x,spec.y,spec.vx,spec.vy,speed,6.3,'hellblast',35);
      if(q){
        q.straight=true;
        q.turn=0;
        q.life=10;
        q.waveIndex=wave;
      }
    }
    g.hellTimer+=interval;
  }
  // A locked, telegraphed shot crosses the player's last position in EVERY hell.
  // It never homes after launch: moving out of the marked line is always useful.
  g.huntTimer-=dt;
  if(g.huntWarning){
    g.huntWarning.left-=dt;
    if(g.huntWarning.left<=0){
      const w=g.huntWarning,d=norm(w.tx-w.x,w.ty-w.y);
      const q=enemyBullet(w.x,w.y,d.x,d.y,255+n*7,7,'skull',35);
      if(q){
        q.straight=true;
        q.life=7;
      }
      g.huntWarning=null;
    }
  }
  if(g.huntTimer<=0&&!g.huntWarning){
    const side=(g.hellWave+n+Math.floor(T))%4,p=g.player;
    const x=side===0?arena.l-18:side===1?arena.r+18:clamp(p.x+Math.sin(T*2.7)*130,arena.l+25,arena.r-25);
    const y=side===2?arena.t-18:side===3?arena.b+18:clamp(p.y+Math.cos(T*2.3)*95,arena.t+25,arena.b-25);
    g.huntWarning={x,y,tx:p.x,ty:p.y,left:.7};
    g.huntTimer=g.difficulty==='death'?1.65:g.difficulty==='revenge'?1.9:2.2;
  }
  // Additional blast projectiles introduced by later Bullet Hells remain aimed.
  if(n>1&&Math.floor((T-dt)/4.0)!==Math.floor(T/4.0)){
    const side=Math.floor(T/4)%4;
    const x=side===0?arena.l-9:side===1?arena.r+9:rnd(arena.l+60,arena.r-60);
    const y=side===2?arena.t-9:side===3?arena.b+9:rnd(arena.t+55,arena.b-55);
    const aim=norm(g.player.x-x,g.player.y-y);
    enemyBullet(x,y,aim.x,aim.y,145,10,n>=3&&Math.floor(T/4)%2===0?'giga':'fire',51);
  }
  if(n===5&&Math.floor((T-dt)/2.5)!==Math.floor(T/2.5)){
    const left=Math.floor(T/2.5)%2===0;
    enemyBullet(left?arena.l-8:arena.r+8,rnd(arena.t+70,arena.b-70),left?1:-1,0,154,12,'skull',43);
  }
  const directions=hellDirections[n-1][segment];
  g.hint='HELLBLASTS '+directions.map(x=>hellSymbols[x]).join(' ')+' • рухайся між проходами / уникай лінії черепа';
  if(T>=15){
    g.projectiles=[];
    g.done.add(g.marker);
    if(n===1)enter('hearts','opening','SEPULCHER I');
    else
    if(n===3)enter('brothers','bros','THE BROTHERS');
    else
    if(n===5)enter('hearts','sep2','SEPULCHER II');
    else
    {
      enter('normal',n===2?'h75':'h30',n===2?'CALAMITAS':'WHISPERING MAELSTROM');
      g.hint='АТАКУЙ CALAMITAS';
    }
  }
}


export { hellDirections, hellSymbols, hellPlan, bulletHell };
