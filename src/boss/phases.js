import { getTerrain } from '../world/terrain.js?v=22.1.0';
import { calamitasConfig as config } from '../../config/calamitas.js?v=22.1.0';
import { arena } from '../core/arena.js?v=22.1.0';
import { audio } from '../core/audio.js?v=22.1.0';
import { TAU } from '../core/config.js?v=22.1.0';
import { state } from '../core/state.js?v=22.1.0';


function enterCalamitas(stage,marker,label){
  if(state.game&&state.game.t>.4){
    if(marker==='h40')audio.calamitas('laugh',state.game);
    else audio.fx(marker==='h30'?'maelstrom':'phase')
  }
  let g=state.game;
  g.stage=stage;
  g.stageT=0;
  g.player.beamPulse=null;
  g.player.swing=null;
  g.player.arkThrow=null;
  g.player.arkParry=null;
  g.player.arkRip=null;
  g.player.arkBuffered=false;
  g.player.combo=0;
  if(g.player.kit){
    g.player.kit.blades=[];
    g.player.kit.zones=[];
    g.player.kit.rail=null;
    g.player.kit.heat=0;
    g.player.kit.resonance=0;
    g.player.kit.overheat=0;
  }
  g.patternWarnings=[];
  g.patternTimer=2.6;
  g.patternIndex=0;
  g.attackTimer=.8;
  g.attackTick=0;
  g.dashActive=0;
  g.dashWind=0;
  g.dashCount=0;
  g.marker=marker;
  g.label=label||stage.toUpperCase();
  g.hint='';
  if(stage==='hell'){
    g.phaseN++;
    g.hellField=null;
    g.hellTimer=.56;
    g.hellWave=0;
    g.hellSegment=-1;
    g.huntTimer=1.0;
    g.huntWarning=null;
    g.projectiles=[];
    g.boss.x=500;
    g.boss.y=210;
    g.hint='BULLET HELL — не атакуй';
    g.dialog='BULLET HELL '+g.phaseN;
    g.dialogT=2.8;
    if(marker!=='opening')g.done.add(marker)
  }
  if(stage==='hearts'){
    g.hearts=[];
    for(let i=0;i<10;i++){
      const x=i<5?arena.l+130+i*100:arena.r-130-(i-5)*100;
      g.hearts.push({x,y:95-Math.floor(i%5/2)*240,hp:config.heartHP,max:config.heartHP,r:16})
    }
    g.hint='SEPULCHER: 10/10 сердець — Calamitas невразлива';
    g.dialog='SEPULCHER AWAKENS';
    g.dialogT=2.3;
    if(marker==='sep2')g.done.add('h10')
  }
  if(stage==='brothers'){
    g.brothers=[{x:680,y:260,hp:config.brotherHP,max:config.brotherHP,r:25,kind:0},{x:320,y:260,hp:config.brotherHP,max:config.brotherHP,r:25,kind:1}];
    g.projectiles=[];
    g.hint='CATACLYSM + CATASTROPHE';
    g.done.add('h50');
    g.done.add('bros');
    g.dialog='THE BROTHERS RETURN';
    g.dialogT=2.5
  }
  if(stage==='seekers'){
    g.seekers=[];
    for(let i=0;i<10;i++)g.seekers.push({angle:i*TAU/10,hp:config.seekerHP,max:config.seekerHP,r:13,x:g.boss.x+Math.cos(i*TAU/10)*126,y:g.boss.y+Math.sin(i*TAU/10)*126});
    g.hint='ЗНИЩИ 10 SOUL SEEKERS';
    g.done.add('seek');
    g.dialog='SUPREME SOUL SEEKERS';
    g.dialogT=2.5
  }
  if(stage==='accept'){
    g.projectiles=[];
    g.monsters=[];
    g.maelstrom=null;
    g.shots=[];
    g.boss.x=500;
    g.boss.y=getTerrain().altar.y-45;
    g.acceptT=0;
    g.hint='ACCEPTANCE';
    g.done.add('sep2');
    g.done.add('finish');
    g.dialog='ACCEPTANCE';
    g.dialogT=5
  }
}


function transitionCalamitas(){
  let g=state.game,b=g.boss;
  if(g.stage!=='normal')return;
  let pct=b.hp/b.max;
  if(pct<=config.thresholds.hell2&&!g.thresholds.has('75')){
    g.thresholds.add('75');
    g.done.add('opening');
    enterCalamitas('hell','h75','BULLET HELL II');
    return
  }
  if(pct<=config.thresholds.hell3&&!g.thresholds.has('50')){
    g.thresholds.add('50');
    enterCalamitas('hell','h50','BULLET HELL III');
    return
  }
  if(pct<=config.thresholds.phase2&&!g.thresholds.has('40')){
    g.thresholds.add('40');
    g.done.add('h40');
    g.dialog='SECOND PHASE — NO MERCY';
    g.dialogT=3;
    g.hint='PHASE II — ШВИДШІ АТАКИ';
    g.attackTimer=0;
    return
  }
  if(pct<=config.thresholds.maelstrom&&!g.thresholds.has('30')){
    g.thresholds.add('30');
    g.maelstrom={x:getTerrain().altar.x,y:getTerrain().altar.y,vx:0,vy:0,r:70,pulse:0,age:0};
    enterCalamitas('hell','h30','BULLET HELL IV · MAELSTROM');
    g.hint='WHISPERING MAELSTROM ПРОБУДЖЕНО';
    return
  }
  if(pct<=config.thresholds.seekers&&!g.thresholds.has('20')){
    g.thresholds.add('20');
    enterCalamitas('seekers','seek','SOUL SEEKERS');
    return
  }
  if(pct<=config.thresholds.hell5&&!g.thresholds.has('10')){
    g.thresholds.add('10');
    enterCalamitas('hell','h10','FINAL BULLET HELL');
    return
  }
  if(b.hp<=1&&!g.thresholds.has('end')){
    g.thresholds.add('end');
    enterCalamitas('accept','finish','ACCEPTANCE')
  }
}


export { enterCalamitas, transitionCalamitas };
