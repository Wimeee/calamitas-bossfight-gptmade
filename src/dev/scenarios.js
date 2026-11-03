import {startCastDelay} from '../boss/phases.js?v=26.0.2';
import {enterCalamitas} from '../boss/phases.js?v=26.0.2';
import {spawnMaelstrom} from '../boss/maelstrom.js?v=26.0.2';
import {arena} from '../core/arena.js?v=26.0.2';

// Debug entry points use real production phase setup; always call on a fresh game.
export function configureDebugScenario(g,id){
 g.debug=true;g.ritual=null;g.phase2Intro=0;g.castDelayState=null;g.attackCastDelay=0;
 g.thresholds=new Set(['75','50','40','30']);
 g.done=new Set(['opening','h75','h50','h40','h30','bros']);
 g.boss.hp=g.boss.max*.29;
 g.player.x=(arena.l+arena.r)/2;g.player.y=(arena.t+arena.b)/2;
 g.player.vx=0;g.player.vy=0;g.boss.x=g.player.x;g.boss.y=g.player.y-350;
 if(/^bh[1-5]$/.test(id)){
  const n=Number(id.slice(2));g.phaseN=n-1;
  enterCalamitas('hell',['opening','h75','h50','h30','h10'][n-1]);
 }else if(id==='brothers')enterCalamitas('brothers','bros');
 else if(id==='hearts')enterCalamitas('hearts','opening');
 else if(id==='seekers'){g.thresholds.add('20');g.boss.hp=g.boss.max*.19;enterCalamitas('seekers','seek');}
 else if(id==='accept-first'||id==='accept-rematch'){g.rematch=id==='accept-rematch';g.boss.skin=g.rematch?'unhooded':'hooded';enterCalamitas('accept','finish');}
 else if(id==='cast-hearts'||id==='cast-brothers'){const brother=id==='cast-brothers';startCastDelay(g,brother?'brothers':'hearts',brother?'bros':'opening','CAST',brother?2.5:1.25,brother?'brothers':'sepulcher');}
 else{
  enterCalamitas('normal','h30');
  if(id==='maelstrom')spawnMaelstrom(g,g.player.x-700,g.player.y);
 }
 g.player.iframes=0;
 return g;
}
