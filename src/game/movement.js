import { movementConfig as config } from '../../config/movement.js?v=21.1.1';
import { playerConfig } from '../../config/player.js?v=21.1.1';
import { arena } from '../core/arena.js?v=21.1.1';
import { state } from '../core/state.js?v=21.1.1';
import { clamp } from '../core/math.js?v=21.1.1';
import { getTerrain } from '../world/terrain.js?v=21.1.1';

const approach=(value,target,amount)=>value<target?Math.min(target,value+amount):Math.max(target,value-amount);
export function resetMovement(g,x=380){
  const p=g.player;
  Object.assign(p,{x:clamp(x,arena.l+11,arena.r-11),y:getTerrain().floorY-config.halfHeight,
    vx:0,vy:0,grounded:true,support:'ground',flying:false,flightRemaining:config.flightTime,
    jumpBuffer:0,jumpGrace:config.jumpGrace,jumpSustain:0,dropTimer:0,dropHeld:false,jumpWasHeld:false,
    dashT:0,dashCd:0,contactGuard:0,dashTapDirection:0,dashTapAt:-Infinity,physics:true});
}

export function spawnNearAltar(g,x=380){
  resetMovement(g,x);
  const platform=getTerrain().platforms.find(p=>p.id==='middle');
  g.player.y=platform.y-config.halfHeight;g.player.support=platform.id;
}

export function queueJump(g=state.game){
  if(!g||g.mode!=='playing'||g.ritual?.phase==='summoning')return false;
  g.player.jumpBuffer=config.jumpBuffer;return true;
}

export function movePlayerWithTerrain(g,dx,dy){
  const p=g.player,terrain=getTerrain(),oldFeet=p.y+config.halfHeight;
  p.x=clamp(p.x+dx,arena.l+11,arena.r-11);
  if(p.x<=arena.l+11||p.x>=arena.r-11)p.vx=0;
  p.y+=dy;p.grounded=false;p.support=null;
  if(p.y<arena.t+config.halfHeight){p.y=arena.t+config.halfHeight;p.vy=Math.max(0,p.vy);}
  let landing=terrain.floorY,support='ground';
  if(dy>=0&&p.dropTimer<=0&&!p.dropHeld)for(const platform of terrain.platforms){
    if(p.x+config.halfWidth>platform.l&&p.x-config.halfWidth<platform.r&&oldFeet<=platform.y+.5&&p.y+config.halfHeight>=platform.y&&platform.y<landing){
      landing=platform.y;support=platform.id;
    }
  }
  if(p.y+config.halfHeight>=landing){
    p.y=landing-config.halfHeight;p.vy=0;p.grounded=true;p.support=support;p.flying=false;
    p.flightRemaining=config.flightTime;
  }
}

export function updatePlayerMovement(g,dt){
  if(g.mode!=='playing'||g.ritual?.phase==='summoning')return;
  const p=g.player,k=state.keys;
  if(!p.physics)resetMovement(g,p.x);
  const horizontal=clamp((k.d||k.ArrowRight?1:0)-(k.a||k.ArrowLeft?1:0)+state.moveAxis.x,-1,1);
  const down=!!(k.s||k.ArrowDown||state.moveAxis.y>.5);
  const held=!!(k.jump||k.w||k.ArrowUp||state.mobileJump||state.mobileFlight);
  const flightHeld=!!(k.jump||k.w||k.ArrowUp||state.mobileFlight);
  p.dropHeld=down;
  if(held&&!p.jumpWasHeld)p.jumpBuffer=config.jumpBuffer;
  if(!held&&p.jumpWasHeld&&p.jumpSustain>0&&p.vy<0){p.vy*=config.jumpCut;p.jumpSustain=0;}
  p.jumpWasHeld=held;
  const duration=Math.min(Math.max(dt,0),.25),steps=Math.max(1,Math.ceil(duration/config.substep)),step=duration/steps;
  for(let i=0;i<steps;i++){
    p.dropTimer=Math.max(0,p.dropTimer-step);
    p.jumpBuffer=Math.max(0,p.jumpBuffer-step);
    p.jumpGrace=p.grounded?config.jumpGrace:Math.max(0,p.jumpGrace-step);
    p.jumpSustain=Math.max(0,p.jumpSustain-step);
    if(g.ritual)p.dashCd=Math.max(0,p.dashCd-step);
    if(down&&p.grounded&&p.support&&p.support!=='ground'){
      p.dropTimer=config.dropTime;p.y+=2;p.vy=80;p.jumpSustain=0;
      p.jumpBuffer=0;p.jumpGrace=0;p.grounded=false;p.support=null;
    }
    if(p.jumpBuffer>0&&p.jumpGrace>0){
      p.jumpBuffer=0;p.jumpGrace=0;
      if(down&&p.support&&p.support!=='ground'){
        p.dropTimer=config.dropTime;p.y+=2;p.vy=80;p.jumpSustain=0;
      }else{p.vy=-config.jumpSpeed;p.jumpSustain=config.jumpSustain;}
      p.grounded=false;p.support=null;
    }
    p.flying=false;
    if(flightHeld&&!down&&!p.grounded&&p.flightRemaining>0&&p.jumpSustain<=0){
      p.flying=true;p.flightRemaining=Math.max(0,p.flightRemaining-step);
      p.vy=approach(p.vy,-config.flightSpeed,config.flightAcceleration*step);
    }else p.vy=Math.min(down?config.fastFallSpeed:config.fallSpeed,p.vy+(down?config.gravity*1.8:config.gravity)*step);
    if(p.dashT>0){
      const active=Math.min(step,p.dashT);p.dashT=Math.max(0,p.dashT-step);
      p.vx=p.dashX*playerConfig.dashSpeed;
      movePlayerWithTerrain(g,p.vx*active,p.vy*step);
      if(!p.dashT)p.vx=clamp(p.vx,-config.runSpeed,config.runSpeed);
    }else{
      const acceleration=horizontal?config.acceleration:p.grounded?config.braking:config.airBraking;
      p.vx=approach(p.vx,horizontal*config.runSpeed,acceleration*step);
      movePlayerWithTerrain(g,p.vx*step,p.vy*step);
    }
  }
  if(!g.ritual&&p.dashT>0&&Math.floor(g.t*42)!==Math.floor((g.t-dt)*42))g.dashGhosts.push({x:p.x,y:p.y,life:.32,max:.32});
}
