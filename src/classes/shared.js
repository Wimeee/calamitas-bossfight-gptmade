import { classRegistry, weapons } from './registry.js?v=26.0.4';
import { state } from '../core/state.js?v=26.0.4';


function kit(){
  const p=state.game.player;
  return p.kit||(p.kit={heat:0,overheat:0,abilityCd:0,resonance:0,lastFire:-99,rail:null,zones:[],blades:[],recallFlash:0});
}


function classAbility(){
  if(!state.game||state.game.ritual||state.game.mode!=='playing'||state.game.stage==='accept')return;
  const handler=classRegistry[weapons[state.game.player.weapon].id];
  if(kit().abilityCd>0&&state.game.player.weapon!==0&&state.game.player.weapon!==3)return;
  handler.activate();
}


function updateClassKit(dt){
  const g=state.game,p=g.player,k=kit(),id=weapons[p.weapon].id;
  k.abilityCd=Math.max(0,k.abilityCd-dt);
  k.overheat=Math.max(0,k.overheat-dt);
  k.recallFlash=Math.max(0,k.recallFlash-dt);
  if(k.rail&&(k.rail.time-=dt)<=0)k.rail=null;
  classRegistry[id].update?.(dt);
}


function kitHint(){
  if(!state.game)return '';
  const p=state.game.player,k=kit();
  if(k.abilityCd>0)return 'ПКМ · '+k.abilityCd.toFixed(1)+'с';
  return p.weapon===1?(k.heat>=.35?'ПКМ · EXO SHOT':'НАГРІВАЙ ПРОМІНЬ'):p.weapon===2?(k.resonance>=1?'ПКМ · DRAGON NOVA':'НАКОПИЧУЙ РЕЗОНАНС'):p.weapon===3?'ПКМ · МІТКА + ЗАЛП':p.weapon===4?'ПКМ · ПОВЕРНЕННЯ':'';
}


function beginAttack(w){
  const p=state.game.player;
  if(p.mana<w.mana)return false;
  kit().lastFire=state.game.t;
  p.weaponKick=.12;
  return true;
}


export { kit, classAbility, updateClassKit, kitHint, beginAttack };
