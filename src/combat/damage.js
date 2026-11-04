import {warriorBalance} from '../../config/warrior-balance.js?v=27.0.0';
import { applyPlayerHex } from './debuffs.js?v=27.0.0';
import { ripperDamage,ripperHit,ripperCombat } from '../systems/rippers.js?v=27.0.0';
import { audio } from '../core/audio.js?v=27.0.0';
import { rnd } from '../core/math.js?v=27.0.0';
import { state } from '../core/state.js?v=27.0.0';
import { finish } from '../game/session.js?v=27.0.0';
import { weaponImpact } from '../render/effects.js?v=27.0.0';


function hitTarget(t,amount,x,y,color,attack='melee',visual=true){
  const g=state.game;
  if(t===g.boss&&(g.stage!=='normal'||g.phase2Intro>0||g.castDelayState||t.dontTakeDamage))return;
  const balance=g.player.weapon===0&&attack!=='shield'?warriorBalance.outgoingMultiplier:1;
  const actual=amount*balance*(t===g.boss?.72:1)*ripperDamage(g);
  ripperCombat(g);
  if(visual)weaponImpact(x,y,attack);
  const oldHP=t.hp;
  t.hp=Math.max(t===g.boss?1:0,t.hp-actual);
  const inflicted=Math.max(0,Math.ceil(oldHP-t.hp));
  if(inflicted&&g.floaters.length<140)g.floaters.push({x,y:y-12,life:.85,text:String(inflicted),col:'#fff1b5'});
  t.hitFlash=g.t+.115;
  if(g.brothers?.includes(t))audio.minion('brotherHurt',g);
  if(attack!=='mage')audio.fx(g.player.weapon===0?'arkHit':'swordhit');
  for(let i=0;i<(visual?4:0);i++)g.sparks.push({x,y,vx:rnd(-90,90),vy:rnd(-90,90),life:.29,max:.29,c:color});
}


function hurt(dmg,source='projectile',cause='Brimstone projectile',hexDuration=0){
  if(dmg<=0)return;
  let g=state.game,p=g.player;
  if(source==='contact'&&(p.dashT>0&&!p.aegisDash||p.contactGuard>0))return;
  if(p.iframes>0||g.mode!=='playing')return;
  const actual=ripperHit(g,Math.round(dmg*g.scale));
  p.hp=Math.max(0,p.hp-actual);
  g.lastCause=cause;
  if(actual>0)applyPlayerHex(g,hexDuration);
  p.hits++;
  audio.fx('damage');
  p.iframes=.8;
  p.lastHit=g.t;
  g.floaters.push({x:p.x,y:p.y-15,life:1.1,text:'-'+actual,col:'#ffb1a1'});
  if(p.hp<=0)finish(false)
}


export { hitTarget, hurt };
