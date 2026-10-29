import { weapons } from './registry.js?v=19.1.1';
import { beginAttack } from './shared.js?v=19.1.1';
import { addShot } from '../combat/attacks.js?v=19.1.1';
import { hitTarget } from '../combat/damage.js?v=19.1.1';
import { possibleTargets } from '../combat/targets.js?v=19.1.1';
import { audio } from '../core/audio.js?v=19.1.1';
import { TAU } from '../core/config.js?v=19.1.1';
import { clamp, dist, lerp, norm, segmentDistance } from '../core/math.js?v=19.1.1';
import { state } from '../core/state.js?v=19.1.1';
import { muzzlePoint, weaponAim } from '../render/weapons.js?v=19.1.1';


function arkHeld(){
  return state.pointer.fire||state.keys.j||state.mobileFire||state.aimHeld||(state.deviceMode==='mobile'&&state.mobileAutoAim&&possibleTargets().length>0)
}


function arkBolts(x,y,angle,count,damage){
  for(let i=0;i<count;i++){
    const a=angle+(i-(count-1)/2)*.24;
    addShot(x,y,Math.cos(a),Math.sin(a),{...weapons[0],id:'arkStar',dmg:damage,speed:510,rad:5});
    state.game.shots[state.game.shots.length-1].homing=true;
  }
}


function fireArk(){
  const g=state.game,p=g.player;
  if(p.swing||p.arkThrow||p.arkParry||p.arkRip)return;
  if(g.t>p.comboExpire)p.combo=0;
  const id=p.combo,wide=id===1||id===3,a=weaponAim(g),boost=p.arkCharges>0?1.35:1;
  p.combo=(id+1)%5;
  p.comboExpire=g.t+1.5;
  if(p.arkCharges>0)p.arkCharges--;
  audio.fx('sword');
  if(id===4){
    p.arkThrow={x:p.x,y:p.y,age:0,life:2.33,max:2.33,angle:a,boost,hitIds:new Map(),chainHits:new Map(),returning:false,snapped:false};
    p.fireCd=.1;
    return;
  }
  const duration=wide?.34:.25;
  p.fireCd=duration;
  p.swing={time:duration,max:duration,angle:a,arc:wide?TAU*.94:2.45,wide,dmg:(wide?2300:2000)*boost,boost,hitIds:new Set(),id};
  const d=norm(state.pointer.x-p.x,state.pointer.y-p.y);
  addShot(p.x+d.x*35,p.y+d.y*35,d.x,d.y,{...weapons[0],id:'arkBeam',dmg:700*boost,speed:1000,rad:7});
  if(wide)arkBolts(p.x,p.y,a,6,117*boost);
}


function arkAngle(s,progress){
  const eased=progress*progress*(3-2*progress);
  return s.angle+(eased-.5)*s.arc*(s.wide?1:-1)
}


function releaseArk(force=false){
  if(!state.game||state.game.mode!=='playing'||(!force&&arkHeld()))return;
  const p=state.game.player,s=p.arkThrow;
  if(!s||s.returning)return;
  if(s.age>=s.max*.2&&s.age<=s.max*.75){
    s.snapped=true;
    s.snapLife=.22;
    audio.fx('big');
    for(const t of possibleTargets())if(dist(t,s)<t.r+94)hitTarget(t,3630*s.boost,t.x,t.y,'#fff0b5');
    arkBolts(s.x,s.y,weaponAim(state.game),3,100*s.boost);
    state.game.floaters.push({x:s.x,y:s.y-65,life:.65,text:'SNAP!',col:'#fff2b1'});
  }
  s.returning=true;
}


function arkAbility(){
  if(!state.game||state.game.mode!=='playing'||state.game.stage==='accept'||state.game.player.weapon!==0)return;
  const p=state.game.player;
  if(p.swing||p.arkThrow){
    p.arkBuffered=true;
    return;
  }
  if(p.arkRip||p.arkParry)return;
  const a=weaponAim(state.game);
  if(p.arkCharges>0){
    p.arkCharges=0;
    const end=muzzlePoint(p,a,360);
    p.arkRip={x:p.x,y:p.y,ex:end.x,ey:end.y,angle:a,time:.65,max:.65};
    for(const t of possibleTargets())if(segmentDistance(t.x,t.y,p.x,p.y,end.x,end.y)<t.r+42)hitTarget(t,5100,t.x,t.y,'#ffb9ed');
    audio.fx('big');
    return;
  }
  if(p.arkParryCd>0)return;
  p.arkParryCd=5.66;
  p.arkParry={angle:a,time:.25,max:.25,success:false};
  audio.fx('sword');
}


function updateSword(dt){
  const g=state.game,p=g.player;
  p.arkParryCd=Math.max(0,(p.arkParryCd||0)-dt);
  if(p.arkRip){
    p.arkRip.time-=dt;
    if(p.arkRip.time<=0)p.arkRip=null;
  }
  if(p.arkParry){
    const s=p.arkParry,end=muzzlePoint(p,s.angle,135);
    let success=false,body=false;
    for(const t of possibleTargets())if(!s.success&&segmentDistance(t.x,t.y,p.x,p.y,end.x,end.y)<t.r+22){
      hitTarget(t,2000,t.x,t.y,'#cfffff');
      success=body=true;
    }
    for(const q of g.projectiles)if(q.r<=13&&segmentDistance(q.x,q.y,p.x,p.y,end.x,end.y)<q.r+22){
      q.arkWeakenedUntil=g.t+1;
      success=true;
    }
    if(success&&!s.success){
      s.success=true;
      p.arkCharges=16;
      if(body)p.iframes=Math.max(p.iframes,1);
      g.floaters.push({x:p.x,y:p.y-50,life:1,text:'PARRY · 16',col:'#a5fffa'});
      audio.fx('heal');
    }
    s.time-=dt;
    if(s.time<=0)p.arkParry=null;
  }
  if(p.swing){
    const s=p.swing,previous=clamp(1-s.time/s.max,0,1);
    s.time-=dt;
    const progress=clamp(1-s.time/s.max,0,1),a0=arkAngle(s,previous),a1=arkAngle(s,progress),reach=s.wide?146:124;
    // Sweep between rendered poses, so low frame rates cannot skip a target.
    for(const t of possibleTargets())if(!s.hitIds.has(t)){
      let hit=false;
      const steps=Math.max(1,Math.ceil(Math.abs(a1-a0)/.09));
      for(let i=0;i<=steps;i++){
        const a=lerp(a0,a1,i/steps),end=muzzlePoint(p,a,reach);
        if(segmentDistance(t.x,t.y,p.x,p.y,end.x,end.y)<t.r+12){
          hit=true;
          break;
        }
      }
      if(hit){
        hitTarget(t,s.dmg,t.x,t.y,'#b6eaff');
        s.hitIds.add(t);
      }
    }
    if(s.time<=0)p.swing=null;
  }
  if(p.arkThrow){
    const s=p.arkThrow;
    s.age+=dt;
    s.life-=dt;
    s.angle+=dt*19;
    s.snapLife=Math.max(0,(s.snapLife||0)-dt);
    const auto=state.deviceMode==='mobile'&&state.mobileAutoAim;
    if(auto&&s.age>=.9&&!s.returning&&!state.mobileFire&&!state.aimHeld)releaseArk(true);
    if(s.life<=0)s.returning=true;
    const d=norm(state.pointer.x-p.x,state.pointer.y-p.y),reach=Math.min(340,dist(state.pointer,p));
    const tx=s.returning?p.x:p.x+d.x*reach,ty=s.returning?p.y:p.y+d.y*reach;
    const step=1-Math.exp(-dt*(s.returning?19:13));
    s.x=lerp(s.x,tx,step);
    s.y=lerp(s.y,ty,step);
    if(!s.returning)for(const t of possibleTargets()){
      if(dist(t,s)<t.r+62&&g.t>=(s.hitIds.get(t)||0)){
        hitTarget(t,1650*s.boost,t.x,t.y,'#c9b8ff');
        s.hitIds.set(t,g.t+.31);
      }
      if(segmentDistance(t.x,t.y,p.x,p.y,s.x,s.y)<t.r+7&&g.t>=(s.chainHits.get(t)||0)){
        hitTarget(t,255*s.boost,t.x,t.y,'#c9b8ff');
        s.chainHits.set(t,g.t+.31);
      }
    }
    if(s.returning&&dist(s,p)<16&&!s.snapLife){
      p.arkThrow=null;
      p.fireCd=.12;
      p.comboExpire=g.t+1.5;
    }
  }
  if(p.arkBuffered&&!p.swing&&!p.arkThrow){
    p.arkBuffered=false;
    arkAbility();
  }
}


function attackMelee(w){
  if(beginAttack(w))fireArk();
}


export { arkHeld, arkBolts, fireArk, arkAngle, releaseArk, arkAbility, updateSword, attackMelee };
