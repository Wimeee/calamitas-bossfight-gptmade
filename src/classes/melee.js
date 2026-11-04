import {sampleArkEffects,emitArkReady,emitArkParry,emitArkHit,emitArkSnap,emitArkRipBurst,emitArkStitch} from '../systems/ark-effects.js?v=29.0.1';
import {damageSepulcherArea,damageSepulcherWhere,sepulcherCapsuleHits} from '../combat/sepulcher-damage.js?v=29.0.1';
import { arkAngle, arkSwingGeometry, arkParryGeometry } from './ark-motion.js?v=29.0.1';
import { weapons } from './registry.js?v=29.0.1';
import { beginAttack } from './shared.js?v=29.0.1';
import { addShot } from '../combat/attacks.js?v=29.0.1';
import { hitTarget } from '../combat/damage.js?v=29.0.1';
import { possibleTargets } from '../combat/targets.js?v=29.0.1';
import { audio } from '../core/audio.js?v=29.0.1';
import { TAU } from '../core/config.js?v=29.0.1';
import { clamp, dist, lerp, norm, segmentDistance } from '../core/math.js?v=29.0.1';
import { state } from '../core/state.js?v=29.0.1';
import { muzzlePoint, weaponAim } from '../render/weapons.js?v=29.0.1';
import { getSepulcherBlockers, checkSepulcherCollision } from '../combat/sepulcher-blocking.js?v=29.0.1';


function arkHeld(){
  return state.pointer.fire||state.keys.j||state.mobileFire||state.aimHeld||(state.deviceMode==='mobile'&&state.mobileAutoAim&&possibleTargets().length>0)
}


// EonBolt.cs + ArkOfTheCosmos_SwungBlade.cs (pinned 1a8cebd).
function arkBolts(x,y,angle,count,damage,speed=1200,turn=Math.PI*.05){
  for(let i=0;i<count;i++){
    const a=angle+(count>1?TAU*i/count:0),offset=count>1?30:0;
    addShot(x+Math.cos(a)*offset,y+Math.sin(a)*offset,Math.cos(a),Math.sin(a),{...weapons[0],id:'arkStar',dmg:damage,speed,rad:15});
    Object.assign(state.game.shots[state.game.shots.length-1],{homing:true,nativeEon:true,eonTurn:turn,eonLifetime:100,life:100/60});
  }
}


function fireArk(){
  const g=state.game,p=g.player;
  if(p.swing||p.arkThrow||p.arkParry||p.arkRip)return;
  if(g.t>p.comboExpire)p.combo=0;
  const charge=p.arkCharges||0;
  const id=p.combo,wide=id===1||id===3,a=weaponAim(g),boost=p.arkCharges>0?1.35:1;
  p.combo=(id+1)%5;
  p.comboExpire=g.t+1.5;
  if(p.arkCharges>0)p.arkCharges--;
  audio.fx(id===4||boost>1?'arkThrow':'arkSwing');
  if(id===4){
    p.arkThrow={x:p.x,y:p.y,age:0,life:140/120,max:140/120,angle:a,initialAngle:a,boost,charge,hitIds:new Map(),chainHits:new Map(),returning:false,snapped:false};
    p.fireCd=.1;
    return;
  }
  const duration=(wide?55:35)/120;
  p.fireCd=duration;
  p.swing={time:duration,max:duration,angle:a,arc:wide?TAU*.94:2.45,wide,dmg:1700*boost,boost,hitIds:new Set(),hitCooldowns:new Map(),direction:Math.cos(a)<0?-1:1,charge,boltsFired:0,id};
  const d=norm(state.pointer.x-p.x,state.pointer.y-p.y);
  addShot(p.x+d.x*35,p.y+d.y*35,d.x,d.y,{...weapons[0],id:'arkBeam',dmg:1190*boost,speed:2352,rad:7});

}


function releaseArk(force=false){
  if(!state.game||state.game.mode!=='playing'||(!force&&arkHeld()))return;
  const p=state.game.player,s=p.arkThrow;
  if(!s||s.returning)return;
  if(s.age>=s.max*.25&&s.age<s.max*.75){
    s.snapped=true;
    s.snapLife=s.snapMax=35/120;
    s.snapFrom={x:s.x-p.x,y:s.y-p.y};
    audio.fx('arkSnap');emitArkSnap(state.game,s);
    for(const t of possibleTargets())if(dist(t,s)<t.r+94)hitTarget(t,2040*s.boost,t.x,t.y,'#fff0b5');
    damageSepulcherArea(state.game,s.x,s.y,94,2040*s.boost);
    arkBolts(s.x,s.y,Math.random()*TAU,3,170*s.boost);
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
    const end=muzzlePoint(p,a,3.2*242);
    p.arkRip={x:p.x,y:p.y,ex:end.x,ey:end.y,angle:a,time:70/60,max:70/60,hit:false};
    audio.fx('arkBigRip');
    return;
  }
  if(p.arkParryCd>0)return;
  p.arkParryCd=340/60;
  p.arkParry={angle:a,time:.25,max:.25,success:false};
  audio.fx('arkParry');
}


function updateSword(dt){
  const g=state.game,p=g.player;
  const previousParryCd=p.arkParryCd||0;
  p.arkParryCd=Math.max(0,previousParryCd-dt);
  if(previousParryCd>0&&p.arkParryCd===0)audio.fx('arkRecharge');
  if(p.arkRip){
    const r=p.arkRip;
    sampleArkEffects(g,r,'rip',dt);
    r.time-=dt;
    const elapsed=r.max-r.time;
    if(!r.windupSound&&elapsed>=5/60){r.windupSound=true;audio.fx('arkRipWindup');}
    const stitchProgress=clamp((elapsed-32.5/60)/(r.max-32.5/60)*3,0,1);
    const stitches=Math.ceil((1-Math.sqrt(1-stitchProgress*stitchProgress))*10);
    while((r.stitches||0)<stitches){r.stitches=(r.stitches||0)+1;audio.fx('arkStitch');emitArkStitch(g,r,r.stitches-1);}
    if(!r.hit&&r.max-r.time>25/60){
      r.hit=true;audio.fx('arkRipSlice');emitArkRipBurst(g,r);
      const blockers=getSepulcherBlockers(g);
      const block=checkSepulcherCollision(r.x,r.y,r.ex,r.ey,30,blockers);
      for(const t of possibleTargets()){
        const entry=checkSepulcherCollision(r.x,r.y,r.ex,r.ey,30,[{x:t.x,y:t.y,radius:t.r}]);
        if(entry.hit&&(!block.hit||entry.t<=block.t)){const hp=t.hp;hitTarget(t,3400,t.x,t.y,'#ffb9ed');if(t.hp<hp)emitArkHit(g,t.x,t.y,r.angle,true);}
      }
      const endX=block.hit?block.point.x:r.ex,endY=block.hit?block.point.y:r.ey;
      if(block.hit){r.ex=endX;r.ey=endY;}
      for(let i=1;i<=5;i++)arkBolts(lerp(r.x,endX,i/5),lerp(r.y,endY,i/5),r.angle+i*TAU/5,1,680,1680,Math.PI*.07);
    }
    if(r.time<=0)p.arkRip=null;
  }
  if(p.arkParry){
    const s=p.arkParry,geometry=arkParryGeometry(s,p),end=geometry.end;
    let success=false,body=false,parryTarget=null;
    // Projectile AI resolves before NPC contact in the native holdout.
    for(const q of g.projectiles){
      const updates=q.extraUpdates!=null?q.extraUpdates+1:q.nativeBrother?
        (q.kind==='fist'?(q.variant<2?3:1):q.variant===3?6:q.variant===1?3:q.variant>=4?1:2):1;
      if(q.damage<=1||Math.hypot(q.vx||0,q.vy||0)*updates<=60||q.r*2*Math.SQRT2>=300||segmentDistance(q.x,q.y,geometry.start.x,geometry.start.y,end.x,end.y)>=q.r+12)continue;
      q.arkWeakenedUntil=g.t+1;
      if(!s.success&&p.vy!==0){
        const away=norm(p.x-q.x,p.y-q.y);
        p.vx+=away.x*120;p.vy+=away.y*120;
      }
      success=true;
      break;
    }
    if(!s.success&&!success)for(const t of possibleTargets())if(segmentDistance(t.x,t.y,geometry.start.x,geometry.start.y,end.x,end.y)<t.r+22){
      hitTarget(t,1700,t.x,t.y,'#cfffff');
      success=true;body=(t.contactDamage||0)>0;parryTarget=t;
      break;
    }
    if(success&&!s.success){
      s.success=true;
      p.arkCharges=16;p.combo=0;p.comboExpire=g.t+1.5;
      if(body)p.iframes=Math.max(p.iframes,1);
      g.floaters.push({x:p.x,y:p.y-50,life:1,text:'PARRY · 16',col:'#a5fffa'});
      audio.fx('arkParrySuccess');emitArkParry(g,parryTarget,s.angle);
    }
    s.time-=dt;
    if(s.time<=0)p.arkParry=null;
  }
  if(p.swing){
    sampleArkEffects(g,p.swing,'swing',dt);
    const s=p.swing,previous=clamp(1-s.time/s.max,0,1);
    s.time-=dt;
    const progress=clamp(1-s.time/s.max,0,1),a0=arkAngle(s,previous),a1=arkAngle(s,progress);
    if(s.wide){
      while((s.boltsFired||0)<6 && (s.max-s.time)*120>=4+(s.boltsFired||0)*10-1e-8){
        const index=s.boltsFired||0,eventProgress=(4+index*10)/55;
        const boltAngle=arkAngle(s,eventProgress)-Math.PI/4*1.15*(s.direction||1);
        arkBolts(p.x+Math.cos(boltAngle)*10,p.y+Math.sin(boltAngle)*10,boltAngle,1,1700*.7/6*s.boost);
        s.boltsFired=index+1;
      }
    }
    // Sweep between rendered poses, so low frame rates cannot skip a target.
    for(const t of possibleTargets())if(s.wide?g.t>=(s.hitCooldowns?.get(t)??-Infinity):!s.hitIds.has(t)){
      let hit=false;
      const steps=Math.max(1,Math.ceil(Math.abs(a1-a0)/.09));
      for(let i=0;i<=steps;i++){
        const sample=arkSwingGeometry(s,lerp(previous,progress,i/steps),p);
        if(segmentDistance(t.x,t.y,sample.start.x,sample.start.y,sample.end.x,sample.end.y)<t.r+12){
          hit=true;
          break;
        }
      }
      if(hit){
        const hp=t.hp;hitTarget(t,s.dmg,t.x,t.y,'#b6eaff');if(t.hp<hp)emitArkHit(g,t.x,t.y,s.angle);
        s.hitIds.add(t);
        if(s.wide){s.hitCooldowns??=new Map();s.hitCooldowns.set(t,g.t+13/120);}
      }
    }
    damageSepulcherWhere(g,t=>{
      const steps=Math.max(1,Math.ceil(Math.abs(a1-a0)/.09));
      for(let i=0;i<=steps;i++){const sample=arkSwingGeometry(s,lerp(previous,progress,i/steps),p);if(sepulcherCapsuleHits(t,sample.start.x,sample.start.y,sample.end.x,sample.end.y,12))return true;}return false;
    },s.dmg,{hitIds:s.wide?null:s.hitIds,cooldowns:s.wide?(s.hitCooldowns??=new Map()):null,interval:13/120});
    if(s.time<=0)p.swing=null;
  }
  if(p.arkThrow){
    const s=p.arkThrow;
    sampleArkEffects(g,s,'throw',dt);
    s.age+=dt;
    s.life-=dt;
    s.angle-=dt*Math.PI/4*.3*120;
    s.snapLife=Math.max(0,(s.snapLife||0)-dt);
    if(!s.readyChimed&&!s.returning&&s.age>=s.max*.25){s.readyChimed=true;audio.fx('arkSnapReady');emitArkReady(g,s);}
    const auto=state.deviceMode==='mobile'&&state.mobileAutoAim;
    if(auto&&s.age>=s.max*.5&&!s.returning&&!state.mobileFire&&!state.aimHeld)releaseArk(true);
    if(s.life<=0||(!s.snapped&&s.age>s.max*.75)){
      if(!s.returning){s.naturalReturn=true;s.returnFrom={x:s.x-p.x,y:s.y-p.y};}
      s.returning=true;
    }

    // Store previous position for swept collision
    const prevX = s.x, prevY = s.y;

    let nextX=s.x,nextY=s.y;
    if(s.snapped&&s.snapFrom){
      const u=clamp(1-s.snapLife/s.snapMax,0,1),ratio=1-.2*(1-Math.sqrt(1-u*u));
      nextX=p.x+s.snapFrom.x*ratio;nextY=p.y+s.snapFrom.y*ratio;
    }else if(s.naturalReturn&&s.returnFrom){
      const u=clamp((s.age/s.max-.75)/.25,0,1),ratio=Math.cos(u*Math.PI/2);
      nextX=p.x+s.returnFrom.x*ratio;nextY=p.y+s.returnFrom.y*ratio;
    }else if(s.returning){
      s.recallFrom??={x:s.x-p.x,y:s.y-p.y};
      s.recallAge=(s.recallAge||0)+dt;
      const ratio=Math.pow(1-clamp(s.recallAge/.22,0,1),3);
      nextX=p.x+s.recallFrom.x*ratio;nextY=p.y+s.recallFrom.y*ratio;
    }else{
      // Native projectile AI runs at120Hz: weighted cursor lerp plus MoveTowards.
      s.travelAccumulator=(s.travelAccumulator||0)+dt;
      while(s.travelAccumulator>=1/120-1e-10){
        const age=s.age-s.travelAccumulator+1/120,progress=clamp(age/s.max,0,1);
        const ratio=progress<.35?1-.2*Math.pow(progress/.35,3):.8;
        nextX=lerp(nextX,state.pointer.x,.025*ratio);nextY=lerp(nextY,state.pointer.y,.025*ratio);
        const dx=state.pointer.x-nextX,dy=state.pointer.y-nextY,distance=Math.hypot(dx,dy);
        if(distance>0){const travel=Math.min(distance,20*ratio);nextX+=dx/distance*travel;nextY+=dy/distance*travel;}
        const dxPlayer=nextX-p.x,dyPlayer=nextY-p.y,reach=Math.hypot(dxPlayer,dyPlayer);
        if(reach>760){nextX=p.x+dxPlayer/reach*760;nextY=p.y+dyPlayer/reach*760;}
        s.travelAccumulator-=1/120;
      }
    }

    // Sepulcher blocking for ark throw movement - find earliest hit along path
    // Compare target entry t vs blocker entry t; nearest wins
    let collisionPoint = { x: nextX, y: nextY };
    let blockedByWorm = false;

    // Check for worm blockers (hearts phase with live hearts)
    let blockers = [];
    let blockerT = Infinity;
    let blockerCollision = { hit: false };
    if (!s.returning && g.sepulcher && g.stage === 'hearts' && g.hearts?.some(h => h.hp > 0)) {
      blockers = getSepulcherBlockers(g);
      if (blockers.length > 0) {
        blockerCollision = checkSepulcherCollision(prevX, prevY, nextX, nextY, 62, blockers);
        blockerT = blockerCollision.hit ? blockerCollision.t : Infinity;
      }
    }

    // Process target hits along the path BEFORE blocker (if any)
    // Targets with entry t <= blockerT get hit; if blockerT is hit, clamp to blocker and start returning
    let bestTarget = null;
    let bestTargetT = Infinity;
    for (const t of possibleTargets()) {
      if (g.t < (s.hitIds.get(t) || 0)) continue;
      const collision = checkSepulcherCollision(prevX, prevY, nextX, nextY, 62, [{
        x: t.x, y: t.y, radius: t.r, type: 'target', ref: t
      }]);
      if (collision.hit && collision.t < bestTargetT) {
        bestTargetT = collision.t;
        bestTarget = t;
      }
    }

    // Default collision point is the intended destination (nextX, nextY)
    collisionPoint = { x: nextX, y: nextY };

    if (bestTargetT <= blockerT) {
      // Target hit first (or no blocker) - register hit at collision point
      if (bestTarget) {
        const hitX = prevX + (nextX - prevX) * bestTargetT;
        const hitY = prevY + (nextY - prevY) * bestTargetT;
        hitTarget(bestTarget, 1700*s.boost, hitX, hitY, '#c9b8ff');
        s.hitIds.set(bestTarget, g.t + .31);
        // Hit point is for damage registration; blade continues to nextX,nextY unless blocked by worm
      }
      // If blocker is also hit but after target, blade continues to blocker this frame
      // and gets absorbed there (no "next frame" - process in same tick)
      if (blockerCollision.hit && blockerT < Infinity && blockerT > bestTargetT) {
        blockedByWorm = true;
        collisionPoint = blockerCollision.point;
        s.returning = true;
      }
    } else if (blockerCollision.hit) {
      // Blocker hit first (or only blocker) - clamp to blocker and start returning
      blockedByWorm = true;
      collisionPoint = blockerCollision.point;
      s.returning = true;
    }

    // Apply clamped position
    s.x = collisionPoint.x;
    s.y = collisionPoint.y;

    // Chain hit from player to ark position - check blocker between player and ark
    // Trace player->ark line segment for each target; compare target entry along segment with earliest blocker
    if (!s.returning) {
      for(const t of possibleTargets()){
        // Direct hit check (ark body)
        if(dist(t,s)<t.r+62&&g.t>=(s.hitIds.get(t)||0)){
          hitTarget(t,1700*s.boost,t.x,t.y,'#c9b8ff');
          s.hitIds.set(t,g.t+.31);
        }
        // Chain hit check: trace from player to current ark position
        if(segmentDistance(t.x,t.y,p.x,p.y,s.x,s.y)<t.r+7&&g.t>=(s.chainHits.get(t)||0)){
          let chainBlocked = false;
          // Check if any blocker intersects player->ark line segment BEFORE the target's entry point
          if (blockers.length > 0) {
            // Use swept collision helper: player->ark with target as "blocker" to find target's entry t
            // Then compare with actual blocker entry along same segment
            const targetCollision = checkSepulcherCollision(p.x, p.y, s.x, s.y, 7, [{
              x: t.x, y: t.y, radius: t.r, type: 'target', ref: t
            }]);
            // Find earliest real blocker along player->ark
            let earliestBlockerAlongChain = Infinity;
            for (const b of blockers) {
              const bcoll = checkSepulcherCollision(p.x, p.y, s.x, s.y, 7, [b]);
              if (bcoll.hit && bcoll.t < earliestBlockerAlongChain) {
                earliestBlockerAlongChain = bcoll.t;
              }
            }
            // Target hit only if its entry is before any blocker entry
            if (!(targetCollision.hit && targetCollision.t <= earliestBlockerAlongChain)) {
              chainBlocked = true;
            }
          }
          if (!chainBlocked) {
            hitTarget(t,170*s.boost,t.x,t.y,'#c9b8ff');
            s.chainHits.set(t,g.t+.31);
          }
        }
      }
    }

    // No-worm combat path (original behavior when no worm blocking)
    // This runs when there's no worm OR worm not blocking (not in hearts phase, no live hearts, etc.)
    if (!blockedByWorm && (!g.sepulcher || g.stage !== 'hearts' || !g.hearts?.some(h => h.hp > 0))) {
      // Direct hit (ark body)
      for(const t of possibleTargets()){
        if(dist(t,s)<t.r+62&&g.t>=(s.hitIds.get(t)||0)){
          hitTarget(t,1700*s.boost,t.x,t.y,'#c9b8ff');
          s.hitIds.set(t,g.t+.31);
        }
        // Chain hit
        if(segmentDistance(t.x,t.y,p.x,p.y,s.x,s.y)<t.r+7&&g.t>=(s.chainHits.get(t)||0)){
          hitTarget(t,170*s.boost,t.x,t.y,'#c9b8ff');
          s.chainHits.set(t,g.t+.31);
        }
      }
    }

    if((s.snapped&&s.snapLife<=0)||(s.returning&&dist(s,p)<16&&!s.snapLife)){
      if(s.snapped){audio.fx('arkSnapEnd');emitArkSnap(g,s,true);}
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
