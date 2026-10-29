import { kit } from './shared.js?v=21.1.0';
import { hitTarget } from '../combat/damage.js?v=21.1.0';
import { possibleTargets } from '../combat/targets.js?v=21.1.0';
import { arena } from '../core/arena.js?v=21.1.0';
import { audio } from '../core/audio.js?v=21.1.0';
import { clamp, norm } from '../core/math.js?v=21.1.0';
import { state } from '../core/state.js?v=21.1.0';


function summonSquad(){
  const p=state.game.player;
  if(p.cosmic&&p.cosmic.length)return;
  p.mana=Math.max(0,p.mana-28);
  p.cosmic=Array.from({length:4},(_,i)=>({x:p.x+Math.cos(i*Math.PI/2)*44,y:p.y+Math.sin(i*Math.PI/2)*44-27,phase:i*Math.PI/2,boltCd:.15+i*.19,starCd:1.4+i*.59,orbit:0}));
  state.game.floaters.push({x:p.x,y:p.y-35,life:1.3,text:'4 COSMIC SPIRITS',col:'#d4ffb3'});
  audio.fx('summon');
}


function lashWhip(){
  const g=state.game,p=g.player;
  if(p.fireCd>0||g.mode!=='playing'||g.stage==='accept')return;
  p.fireCd=.42;
  p.weaponKick=.15;
  audio.fx('sword');
  const angle=Math.atan2(state.pointer.y-p.y,state.pointer.x-p.x),range=178;
  p.whip={time:.28,max:.28,angle,range};
  let nearest=null,nearestD=Infinity;
  for(const t of possibleTargets()){
    const dx=t.x-p.x,dy=t.y-p.y,d=Math.hypot(dx,dy);
    const delta=Math.atan2(Math.sin(Math.atan2(dy,dx)-angle),Math.cos(Math.atan2(dy,dx)-angle));
    if(d<range+t.r&&Math.abs(delta)<.49){
      hitTarget(t,850,t.x,t.y,'#ffe49f','summon');
      t.whipMarkedUntil=g.t+4.8;
      if(d<nearestD){
        nearest=t;
        nearestD=d
      }
    }
  }
  if(nearest){
    p.cosmicMark=nearest;
    g.floaters.push({x:nearest.x,y:nearest.y-26,life:1,text:'WHIP TAG +35%',col:'#ffda93'});
  }
}


function commandVolley(target){
  const g=state.game,p=g.player,k=kit();
  if(k.abilityCd>0||!p.cosmic.length)return;
  k.abilityCd=4;
  target.whipMarkedUntil=Math.max(target.whipMarkedUntil||0,g.t+4);
  for(const m of p.cosmic){
    const d=norm(target.x-m.x,target.y-m.y);
    g.shots.push({x:m.x,y:m.y,vx:d.x*700,vy:d.y*700,r:8,dmg:1200,life:2,col:'#ecffaf',id:'cosmicBolt',pierce:0,hitIds:new Set(),homing:true,wave:0});
  }
  g.floaters.push({x:target.x,y:target.y-40,life:.8,text:'FOCUS VOLLEY',col:'#d5ffac'});
  audio.fx('summon');
}


function markCosmicTarget(x,y){
  if(!state.game||state.game.mode!=='playing')return;
  const p=state.game.player,targets=possibleTargets();
  let chosen=null,near=Number.POSITIVE_INFINITY;
  for(const t of targets){
    const d=Math.hypot(t.x-x,t.y-y);
    if(d<near){
      near=d;
      chosen=t
    }
  }
  if(chosen&&near<90){
    p.cosmicMark=chosen;
    if(p.weapon===3)commandVolley(chosen);
    state.game.floaters.push({x:chosen.x,y:chosen.y-31,life:.8,text:'TARGET',col:'#b8ffb2'});
  }
  else
  p.cosmicMark=null;
}


function updateCosmic(dt){
  const g=state.game,p=g.player,spirits=p.cosmic;
  if(!Array.isArray(spirits)||!spirits.length)return;
  const targets=possibleTargets();
  if(p.cosmicMark&&!targets.includes(p.cosmicMark))p.cosmicMark=null;
  for(let i=0;i<spirits.length;i++){
    const m=spirits[i];
    m.orbit+=dt*(1.38+(i%2)*.18);
    const angle=m.orbit+m.phase;
    const destX=clamp(p.x+Math.cos(angle)*68,arena.l+25,arena.r-25);
    const destY=clamp(p.y-29+Math.sin(angle)*53,arena.t+25,arena.b-25);
    const follow=Math.min(1,dt*10);
    m.x+=(destX-m.x)*follow;
    m.y+=(destY-m.y)*follow;
    if(!targets.length){
      m.boltCd=Math.min(m.boltCd,.22);
      m.starCd=Math.min(m.starCd,.75);
      continue;
    }
    const tar=p.cosmicMark||targets.reduce((best,t)=>Math.hypot(t.x-m.x,t.y-m.y)<Math.hypot(best.x-m.x,best.y-m.y)?t:best,targets[0]);
    m.boltCd-=dt;
    m.starCd-=dt;
    if(m.boltCd<=0){
      m.boltCd+=.82+i*.017;
      for(let j=-1;j<=1;j+=2){
        const aim=Math.atan2(tar.y-m.y,tar.x-m.x)+j*.09,
        tag=tar.whipMarkedUntil>g.t?1.35:1;
        g.shots.push({
            x:m.x+Math.cos(aim)*17,
            y:m.y+Math.sin(aim)*17,
            vx:Math.cos(aim)*555,
            vy:Math.sin(aim)*555,
            r:6,
            dmg:300*tag,
            life:2.5,
            col:['#b7f9b0','#b3f2ff','#f4a8ff','#ffe49c'][i],
            id:'cosmicBolt',
            pierce:0,
            hitIds:new Set(),
            homing:true,
            wave:0
        });
      }
      if(i===0)audio.fx('summon');
    }
    if(m.starCd<=0){
      m.starCd+=3.4+(i%2)*.4;
      const aim=Math.atan2(tar.y-m.y,tar.x-m.x),tag=tar.whipMarkedUntil>g.t?1.35:1;
      g.shots.push({
          x:m.x,
          y:m.y,
          vx:Math.cos(aim)*390,
          vy:Math.sin(aim)*390,
          r:10,
          dmg:750*tag,
          life:2.8,
          col:'#ffdc9f',
          id:'cosmicStar',
          pierce:0,
          hitIds:new Set(),
          homing:true,
          wave:0
      });
    }
  }
  if(g.shots.length>250)g.shots.splice(0,g.shots.length-250);
}


function cosmicStarBurst(s,hit){
  const g=state.game;
  for(const target of possibleTargets()){
    if(target===hit)continue;
    if(Math.hypot(target.x-s.x,target.y-s.y)<90+target.r)
    hitTarget(target,s.dmg*.48,s.x,s.y,'#ffe7a2','cosmicStar');
  }
  for(let i=0;i<24;i++){
    const a=i*Math.PI*2/24,vel=105+(i%4)*27;
    g.sparks.push({x:s.x,y:s.y,vx:Math.cos(a)*vel,vy:Math.sin(a)*vel,life:.50,max:.50,c:'#fff0ad'});
  }
  audio.fx('big');
}


function attackSummoner(w){
  const p=state.game.player;
  if(!p.cosmic||!p.cosmic.length){
    if(p.mana>=w.mana)summonSquad();
    return;
  }
  lashWhip();
}

function activateSummoner(){
  markCosmicTarget(state.pointer.x,state.pointer.y);
}


export { summonSquad, lashWhip, commandVolley, markCosmicTarget, updateCosmic, cosmicStarBurst, attackSummoner, activateSummoner };
