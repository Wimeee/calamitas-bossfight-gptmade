import { arena } from '../core/arena.js?v=17.0.0';
import { audio } from '../core/audio.js?v=17.0.0';
import { TAU } from '../core/config.js?v=17.0.0';
import { state } from '../core/state.js?v=17.0.0';


function enter(stage,marker,label){
  if(state.game&&state.game.t>.4){
    audio.fx(marker==='h30'?'maelstrom':'phase')
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
  g.attackTimer=0;
  g.attackTick=0;
  g.dashActive=0;
  g.dashWind=0;
  g.marker=marker;
  g.label=label||stage.toUpperCase();
  g.hint='';
  if(stage==='hell'){
    g.phaseN++;
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
      const x=i<5?arena.l+50+i*54:arena.r-50-(i-5)*54;
      g.hearts.push({x,y:arena.t+49+(i%2)*33,hp:7200,max:7200,r:16})
    }
    g.hint='SEPULCHER: 10/10 сердець — Calamitas невразлива';
    g.dialog='SEPULCHER AWAKENS';
    g.dialogT=2.3;
    if(marker==='sep2')g.done.add('h10')
  }
  if(stage==='brothers'){
    g.brothers=[{x:320,y:260,hp:65000,max:65000,r:25,kind:0},{x:680,y:260,hp:65000,max:65000,r:25,kind:1}];
    g.projectiles=[];
    g.hint='CATACLYSM + CATASTROPHE';
    g.done.add('h50');
    g.done.add('bros');
    g.dialog='THE BROTHERS RETURN';
    g.dialogT=2.5
  }
  if(stage==='seekers'){
    g.seekers=[];
    for(let i=0;i<10;i++)g.seekers.push({angle:i*TAU/10,hp:4900,max:4900,r:13,x:0,y:0});
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
    g.boss.y=270;
    g.acceptT=0;
    g.hint='ACCEPTANCE';
    g.done.add('sep2');
    g.done.add('finish');
    g.dialog='ACCEPTANCE';
    g.dialogT=5
  }
}


function transitionHealth(){
  let g=state.game,b=g.boss;
  if(g.stage!=='normal')return;
  let pct=b.hp/b.max;
  const checks=[['75',.75,'h75'],['50',.50,'h50'],['40',.40,'h40'],['30',.30,'h30'],['20',.20,'seek'],['10',.10,'h10']];
  if(pct<=.75&&!g.thresholds.has('75')){
    g.thresholds.add('75');
    g.done.add('opening');
    enter('hell','h75','BULLET HELL II');
    return
  }
  if(pct<=.50&&!g.thresholds.has('50')){
    g.thresholds.add('50');
    enter('hell','h50','BULLET HELL III');
    return
  }
  if(pct<=.40&&!g.thresholds.has('40')){
    g.thresholds.add('40');
    g.done.add('h40');
    g.dialog='SECOND PHASE — NO MERCY';
    g.dialogT=3;
    g.hint='PHASE II — ШВИДШІ АТАКИ';
    g.attackTimer=0;
    return
  }
  if(pct<=.30&&!g.thresholds.has('30')){
    g.thresholds.add('30');
    g.maelstrom={x:500,y:320,vx:0,vy:0,r:88,pulse:0};
    enter('hell','h30','BULLET HELL IV · MAELSTROM');
    g.hint='WHISPERING MAELSTROM ПРОБУДЖЕНО';
    return
  }
  if(pct<=.20&&!g.thresholds.has('20')){
    g.thresholds.add('20');
    enter('seekers','seek','SOUL SEEKERS');
    return
  }
  if(pct<=.10&&!g.thresholds.has('10')){
    g.thresholds.add('10');
    enter('hell','h10','FINAL BULLET HELL');
    return
  }
  if(b.hp<=1&&!g.thresholds.has('end')){
    g.thresholds.add('end');
    enter('accept','finish','ACCEPTANCE')
  }
}


export { enter, transitionHealth };
