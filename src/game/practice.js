import {practicePhases,practiceAttacks} from '../../config/practice.js?v=31.1.0';
import {enterCalamitas} from '../boss/phases.js?v=31.1.0';
import {spawnMaelstrom,updateMaelstrom} from '../boss/maelstrom.js?v=31.1.0';
import {resetArenaState} from '../world/arena-state.js?v=31.1.0';

export function configurePractice(g,options){
 const phase=practicePhases.find(item=>item.id===options?.id);if(!phase)return false;
 g.boss.hp=g.boss.max*phase.hp;
 g.thresholds=new Set(['75','50','40','30','20','10'].filter(value=>Number(value)/100>=phase.hp));
 g.done=new Set([...g.thresholds].map(value=>'h'+value));
 if(phase.id!=='bh1')g.done.add('opening');
 if(phase.hp<.5)g.done.add('bros');
 if(phase.hp<.2)g.done.add('seek');
 g.phaseN=phase.phaseN-(phase.stage==='hell'?1:0);
 g.boss.x=g.player.x+600;g.boss.y=g.player.y-180;
 enterCalamitas(phase.stage,phase.marker,phase.label);
 resetArenaState(g);
 if(['maelstrom','seekers','bh5','sep2','desperation'].includes(phase.id)){
  const m=spawnMaelstrom(g,g.player.x-1300,g.player.y),iframes=g.player.iframes;
  g.player.iframes=Infinity;updateMaelstrom(8);g.player.iframes=iframes;
  // Replay native growth, then place the persistent hazard at a safe drill entry.
  m.x=g.player.x-650;m.y=g.player.y;m.vx=0;m.vy=0;
 }
 const attack=phase.stage==='normal'?practiceAttacks.find(item=>item.index===options.attackIndex):null;
 const attackIndex=attack?.index??null;
 if(attackIndex!==null)g.attackIndex=attackIndex;
 if(g.player.weapon===4)g.player.stealth=1;
 const label=phase.label+(attackIndex===null?'':' · '+attack.label);
 g.practice={id:phase.id,label,attackIndex,invincible:options.invincible===true,completed:false};
 return true;
}
