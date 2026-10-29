import { playerConfig } from '../../config/player.js?v=20.0.0';
import { audio } from '../core/audio.js?v=20.0.0';
import { norm } from '../core/math.js?v=20.0.0';
import { state } from '../core/state.js?v=20.0.0';


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


function dash(){
  if(!state.game||state.game.ritual||state.game.mode!=='playing')return;
  let p=state.game.player;
  if(p.dashCd>0)return;
  let dx=(state.keys.d||state.keys.ArrowRight?1:0)-(state.keys.a||state.keys.ArrowLeft?1:0)+state.moveAxis.x,dy=(state.keys.s||state.keys.ArrowDown?1:0)-(state.keys.w||state.keys.ArrowUp?1:0)+state.moveAxis.y;
  let d=norm(dx,dy);
  if(!Math.hypot(dx,dy))d=norm(state.pointer.x-p.x,state.pointer.y-p.y);
  p.dashX=d.x;
  p.dashY=d.y;
  p.dashCd=playerConfig.dashCooldown;
  p.dashT=playerConfig.dashDuration;
  p.contactGuard=playerConfig.contactGuardDuration;
  p.dashes++;
  audio.fx('dash')
}


export { heal, drinkRegeneration, dash };
