import {retireBulletHellProjectiles} from '../combat/projectile-retirement.js?v=26.0.2';
import {spawnMaelstrom} from './maelstrom.js?v=26.0.2';
import { enemyBullet } from '../combat/projectiles.js?v=26.0.2';
import { arena } from '../core/arena.js?v=26.0.2';
import { rnd } from '../core/math.js?v=26.0.2';
import { state } from '../core/state.js?v=26.0.2';
import { enter } from '../game/phases.js?v=26.0.2';
import { startCastDelay } from './phases.js?v=26.0.2';

// SupremeCalamitas.cs 939-1644. The end counters 900/1800/... are cumulative:
// all five Bullet Hells last 900 ticks, not 15/30/45/60/75 seconds.
const hellDirections = [
  [['down'], ['right','left'], ['down','right','left']],
  [['up'], ['right'], ['right','left']],
  [['down'], ['left'], ['right','left']],
  [['up'], ['right'], ['right','left']],
  [['down'], ['right','left'], ['down','right','left']]
];
const hellSymbols = {up:'↑',down:'↓',right:'→',left:'←'};

function hellPlan(g, upcoming) {
  const segment = Math.min(2, Math.floor(g.stageT / 5));
  const dirs = hellDirections[g.phaseN - 1][segment], slots = [];
  const p = g.player;
  // Preview uses a stable hash; actual emissions below use combat RNG.
  for (let i=0;i<dirs.length;i++) {
    const side=dirs[i], hash=Math.sin((upcoming+1)*127.1+g.phaseN*311.7+i*74.7)*43758.5453;
    const offset=((hash-Math.floor(hash))*2-1)*1000;
    slots.push({x:p.x+(side==='right'?-1000:side==='left'?1000:offset),y:p.y+(side==='down'?-1000:side==='up'?1000:offset),vx:side==='right'?1:side==='left'?-1:0,vy:side==='down'?1:side==='up'?-1:0,side});
  }
  return {dirs,slots,segment};
}

function edge(g, side, speed, kind='hellblast2', damage=35, offset) {
  const p=g.player, vertical=side==='up'||side==='down', random=offset??rnd(-1000,1000);
  const dx=side==='right'?1:side==='left'?-1:0, dy=side==='down'?1:side==='up'?-1:0;
  const q=enemyBullet(p.x+(vertical?random:-dx*1000),p.y+(vertical?-dy*1000:random),dx,dy,speed,kind==='giga'?25:kind==='fire'?18:kind==='skull'?15:6.3,kind,damage);
  if(q){q.sourceCalamitas=true;q.straight=kind==='hellblast2';q.life=kind==='hellblast2'?25:kind==='skull'?20:kind==='fire'?2.5:2;q.opacity=kind==='giga'?1:0;q.waveIndex=g.hellWave;}
  return q;
}

function finishHell(g) {
  const n=g.phaseN;
  // Native bulletHellCounter is shared across all five attacks, including cast delays.
  g.hellEdgeCounter=g.hellTimers?.edgeHellblast??g.hellEdgeCounter??0;
  retireBulletHellProjectiles(g);g.done.add(g.marker);g.hellTeleported=false;g.hellTimers=undefined;g.maelstromSpawned=false;
  g.boss.vx=0;g.boss.vy=0;g.boss.contactDamage=0;
  if(n===1||n===5)startCastDelay(g,'hearts',n===1?'opening':'sep2',n===1?'SEPULCHER I':'SEPULCHER II',75/60,'sepulcher');
  else if(n===3)startCastDelay(g,'brothers','bros','THE BROTHERS',150/60,'brothers');
  else enter('normal',n===2?'h75':'h30',n===2?'CALAMITAS':'WHISPERING MAELSTROM');
}

function bulletHell(dt) {
  const g=state.game,n=g.phaseN;
  if(!g.hellTeleported){
    g.boss.x=(arena.l+arena.r)/2;g.boss.y=(arena.t+arena.b)/2;
    g.boss.vx=0;g.boss.vy=0;g.boss.contactDamage=0;g.hellTeleported=true;
  }
  const timers=g.hellTimers??={ticks:0,remainder:0,edgeHellblast:g.hellEdgeCounter||0,passedVar:0};
  // Supports fresh legacy saves/controlled fixtures without inheriting stale counters.
  timers.ticks??=0;timers.remainder??=0;timers.edgeHellblast??=0;
  timers.remainder+=dt;
  const gate=(g.difficulty==='normal'?9:8)+[0,1,4,6,8][n-1];
  while(timers.remainder+1e-10>=1/60&&timers.ticks<900){
    timers.remainder=Math.max(0,timers.remainder-1/60);timers.ticks++;timers.passedVar=timers.ticks;
    const absolute=(n-1)*900+timers.ticks, segment=Math.min(2,Math.floor(timers.ticks/300));
    g.hellSegment=segment;
    g.hellField={l:g.player.x-1000,r:g.player.x+1000,t:g.player.y-1000,b:g.player.y+1000};
    if(n>=2&&absolute%(n===5?240:180)===0){
      edge(g,n===2&&segment===1?'left':'down',300,'fire',38);
    }
    if(n>=3&&absolute%(n===5?360:240)===0)edge(g,'down',600,'giga',50);
    if(n===4&&timers.ticks===180&&!g.maelstrom)g.maelstromWarning={x:(arena.l+arena.r)/2,y:(arena.t+arena.b)/2};
    if(n===4&&timers.ticks===420&&!g.maelstrom){
      spawnMaelstrom(g,(arena.l+arena.r)/2,(arena.t+arena.b)/2);g.maelstromWarning=null;g.maelstromSpawned=true;
    }
    if(n===5&&absolute%30===0){
      const random=rnd(-500,500);
      edge(g,'left',300,'skull',43,random);edge(g,'right',300,'skull',43,-random);
    }
    timers.edgeHellblast++;
    if(timers.edgeHellblast>=gate){
      timers.edgeHellblast=0;g.hellWave++;
      if(absolute%(gate*6)===0)edge(g,Math.random()<.5?'right':'left',240,'hellblast2',35,0);
      const speed=segment===0?240:segment===1||n===3||n===4?210:180;
      for(const dir of hellDirections[n-1][segment])edge(g,dir,speed);
    }
  }
  const segment=Math.min(2,Math.floor(g.stageT/5));
  g.hint='HELLBLASTS '+hellDirections[n-1][segment].map(x=>hellSymbols[x]).join(' ')+' • короткі рухи між снарядами, бережи політ';
  if(timers.ticks>=900||g.stageT>=15-1e-9)finishHell(g);
}

export {hellDirections,hellSymbols,hellPlan,bulletHell};
