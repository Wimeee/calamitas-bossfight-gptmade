import { ripperDamage,ripperHit,ripperCombat } from '../systems/rippers.js?v=22.0.0';
import { audio } from '../core/audio.js?v=22.0.0';
import { rnd } from '../core/math.js?v=22.0.0';
import { state } from '../core/state.js?v=22.0.0';
import { finish } from '../game/session.js?v=22.0.0';
import { weaponImpact } from '../render/effects.js?v=22.0.0';


function hitTarget(t,amount,x,y,color,attack='melee',visual=true){
  const g=state.game,actual=amount*(t===g.boss?.72:1)*ripperDamage(g);
  ripperCombat(g);
  if(visual)weaponImpact(x,y,attack);
  t.hp=Math.max(t===g.boss?1:0,t.hp-actual);
  t.hitFlash=g.t+.115;
  audio.fx('swordhit');
  for(let i=0;i<(visual?4:0);i++)g.sparks.push({x,y,vx:rnd(-90,90),vy:rnd(-90,90),life:.29,max:.29,c:color});
}


function hurt(dmg,source='projectile',cause='Brimstone projectile'){
  if(dmg<=0)return;
  let g=state.game,p=g.player;
  if(source==='contact'&&(p.dashT>0||p.contactGuard>0))return;
  if(p.iframes>0||g.mode!=='playing')return;
  const actual=ripperHit(g,Math.round(dmg*g.scale));
  p.hp=Math.max(0,p.hp-actual);
  g.lastCause=cause;
  p.hits++;
  audio.fx('damage');
  p.iframes=.8;
  p.lastHit=g.t;
  g.floaters.push({x:p.x,y:p.y-15,life:1.1,text:'-'+actual,col:'#ffb1a1'});
  if(p.hp<=0)finish(false)
}


export { hitTarget, hurt };
