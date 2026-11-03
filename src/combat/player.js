import {startAsgardianDash} from '../game/asgardian-dash.js?v=26.0.5';
import { playerConfig } from '../../config/player.js?v=26.0.5';
import { audio } from '../core/audio.js?v=26.0.5';
import { state } from '../core/state.js?v=26.0.5';


function heal(){
  if(!state.game||state.game.ritual||state.game.mode!=='playing')return;
  let p=state.game.player;
  if(p.potions>0&&p.potionCd<=0&&p.hp<p.maxHp){
    p.potions--;
    audio.fx('heal');
    p.potionCd=playerConfig.healingCooldown;
    p.hp=Math.min(p.maxHp,p.hp+playerConfig.healingAmount);
    state.game.floaters.push({x:p.x,y:p.y-20,life:1.3,text:'+'+playerConfig.healingAmount,col:'#94f8b0'})
  }
}


function drinkRegeneration(){
  if(!state.game||state.game.ritual||state.game.mode!=='playing')return;
  let p=state.game.player;
  if(p.regenPotions>0&&p.regenPotionT<=0){
    p.regenPotions--;
    audio.fx('regen');
    p.regenPotionT=playerConfig.regenerationDuration;
    state.game.floaters.push({x:p.x,y:p.y-25,life:1.3,text:'REGENERATION +',col:'#a3ffc5'});
  }
}


function dash(direction=0){
  if(!state.game||state.game.ritual?.phase==='summoning'||state.game.mode!=='playing')return;
  let p=state.game.player;
  if(p.dashCd>0)return;
  const dx=direction||(state.keys.d||state.keys.ArrowRight?1:0)-(state.keys.a||state.keys.ArrowLeft?1:0)+state.moveAxis.x;
  const dashDirection=Math.abs(dx)>.1?Math.sign(dx):state.pointer.x<p.x?-1:1;
  if(!startAsgardianDash(state.game,dashDirection))return;
  if(!state.game.ritual)p.dashes++;
  // Native Asgardian startup is silent; the ram explosion supplies impact audio.
}


export { heal, drinkRegeneration, dash };
