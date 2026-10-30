import { encounterBalance as c } from '../../config/encounter-balance.js?v=22.1.0';
import { enemyBullet } from '../combat/projectiles.js?v=22.1.0';
import { arena } from '../core/arena.js?v=22.1.0';
import { clamp, norm, rnd } from '../core/math.js?v=22.1.0';
import { state } from '../core/state.js?v=22.1.0';
import { enter } from '../game/phases.js?v=22.1.0';

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
  const field=g.hellField||arena;
  // Stable pseudo-random edge coordinates: previews never consume combat RNG.
  for(let i=0;i<dirs.length;i++){
    const side=dirs[i],u=Math.sin((upcoming+1)*127.1+(n+1)*311.7+i*74.7)*43758.5453;
    const f=.035+(u-Math.floor(u))*.93;
    const x=field.l+(field.r-field.l)*f,y=field.t+(field.b-field.t)*f;
    if(side==='down')slots.push({x,y:field.t-12,vx:0,vy:1,side});
    if(side==='up')slots.push({x,y:field.b+12,vx:0,vy:-1,side});
    if(side==='right')slots.push({x:field.l-12,y,vx:1,vy:0,side});
    if(side==='left')slots.push({x:field.r+12,y,vx:-1,vy:0,side});
  }
  return {dirs,slots,segment};
}


function bulletHell(dt){
  const g=state.game,n=g.phaseN,T=g.stageT;
  const segment=Math.min(2,Math.floor(T/5));
  g.boss.x=500;
  g.boss.y=220;
  const tuning=c.hell[g.difficulty],interval=tuning.interval*(n>=4?1.5:1),speed=tuning.speed;
  if(g.hellSegment!==segment){
    g.hellSegment=segment;
    // Waves enter a broad combat field outside the viewport, never on top of the player.
    const x=g.player.x,y=g.player.y;
    g.hellField={l:Math.max(arena.l,x-820),r:Math.min(arena.r,x+820),t:Math.max(arena.t,y-550),b:Math.min(arena.b,y+550)};
    // Short breath when switching direction; no unfair instant crossfire.
    g.hellTimer=Math.max(g.hellTimer,c.segmentBreath);
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
        q.life=20;
        q.waveIndex=wave;
        q.spawnDelay=c.edgeWarning;
      }
    }
    g.hellTimer+=interval;
  }
  // Additional blast projectiles introduced by later Bullet Hells remain aimed.
  if(n>1&&Math.floor((T-dt)/4.0)!==Math.floor(T/4.0)){
    const side=Math.floor(T/4)%4,field=g.hellField||arena;
    const x=side===0?field.l-9:side===1?field.r+9:rnd(field.l+60,field.r-60);
    const y=side===2?field.t-9:side===3?field.b+9:rnd(field.t+55,field.b-55);
    const aim=norm(g.player.x-x,g.player.y-y);
    const giga=n>=3&&Math.floor(T/4)%2===0;
    const count=giga?2:1;
    for(let i=0;i<count;i++){
      const offset=(i-(count-1)/2)*70;
      const q=enemyBullet(x-aim.y*offset,y+aim.x*offset,aim.x,aim.y,125,giga?13:10,giga?'giga':'fire',51);
      if(q)q.spawnDelay=.45;
    }
  }
  if(n===5&&Math.floor((T-dt)/2.5)!==Math.floor(T/2.5)){
    const left=Math.floor(T/2.5)%2===0;
    enemyBullet(left?g.hellField.l-8:g.hellField.r+8,rnd(g.hellField.t+70,g.hellField.b-70),left?1:-1,0,154,10,'skull',43);
  }
  const directions=hellDirections[n-1][segment];
  g.hint='HELLBLASTS '+directions.map(x=>hellSymbols[x]).join(' ')+' • короткі рухи між снарядами, бережи політ';
  if(T>=c.hellDuration){
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
