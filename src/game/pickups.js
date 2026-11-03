import { getTerrain } from '../world/terrain.js?v=26.2.0';
import { movementConfig } from '../../config/movement.js?v=26.2.0';
import { audio } from '../core/audio.js?v=26.2.0';
import { weapons } from '../classes/registry.js?v=26.2.0';

// Native 60 Hz item-style motion, adapted to the game's one-way platforms.
// Player.defaultItemGrabRange=42; no Heartreach/Celestial Magnet equipment.
const STEP=1/60,RADIUS=9,GRAVITY=.1*60*60,MAX_FALL=7*60;
const GRAB_RANGE=42,PULL_SPEED=7*60,PULL_ACCEL=1*60*60;
export function isManaUser(player){return weapons[player.weapon]?.id==='mage';}
function needs(player,drop){return drop.kind==='heart'?player.hp<player.maxHp:
  drop.kind==='star'&&isManaUser(player)&&player.mana<player.maxMana;}
export function spawnPickup(game,kind,x,y){
  if(kind==='star'&&!isManaUser(game.player))return null;
  const drop={kind,x,y,vx:(Math.random()*4-2)*60,vy:-(Math.random()*3+1)*60,life:3600};
  game.pickups.push(drop);return drop;
}
function collect(game,drop){
  const p=game.player;if(!needs(p,drop))return false;
  if(Math.abs(drop.x-p.x)>movementConfig.halfWidth+RADIUS||Math.abs(drop.y-p.y)>movementConfig.halfHeight+RADIUS)return false;
  const heart=drop.kind==='heart',amount=heart?Math.min(20,p.maxHp-p.hp):Math.min(100,p.maxMana-p.mana);
  if(heart)p.hp+=amount;else p.mana+=amount;
  game.floaters.push({x:p.x,y:p.y-20,life:1.3,text:'+'+Math.ceil(amount)+(heart?' HP':' MANA'),col:heart?'#ffb5ad':'#a4c9ff'});
  p.pickupsTaken++;audio.fx('pickup');return true;
}
function tick(game){
  const p=game.player,terrain=getTerrain();
  for(let i=game.pickups.length-1;i>=0;i--){
    const d=game.pickups[i];d.vx??=0;d.vy??=0;d.life??=3600;d.life-=STEP;
    if(d.life<=0){game.pickups.splice(i,1);continue;}
    const pull=needs(p,d)&&Math.abs(d.x-p.x)<GRAB_RANGE+movementConfig.halfWidth+RADIUS&&Math.abs(d.y-p.y)<GRAB_RANGE+movementConfig.halfHeight+RADIUS;
    if(pull){
      const dx=p.x-d.x,dy=p.y-d.y,len=Math.hypot(dx,dy)||1;
      const approach=(v,target)=>v+Math.max(-PULL_ACCEL*STEP,Math.min(PULL_ACCEL*STEP,target-v));
      d.vx=approach(d.vx,dx/len*PULL_SPEED);d.vy=approach(d.vy,dy/len*PULL_SPEED);
    }else d.vy=Math.min(MAX_FALL,d.vy+GRAVITY*STEP);
    const oldX=d.x,oldY=d.y;d.x+=d.vx*STEP;d.y+=d.vy*STEP;
    if(!pull&&d.vy>=0){
      let landing=Infinity;
      for(const platform of terrain.platforms){
        const dy=d.y-oldY,at=dy>0?(platform.y-RADIUS-oldY)/dy:0;
        const x=oldX+(d.x-oldX)*at;
        if(oldY+RADIUS<=platform.y+.001&&d.y+RADIUS>=platform.y&&x+RADIUS>platform.l&&x-RADIUS<platform.r)landing=Math.min(landing,platform.y);
      }
      if(d.y+RADIUS>=terrain.floorY)landing=Math.min(landing,terrain.floorY);
      if(Number.isFinite(landing)){d.y=landing-RADIUS;d.vy=0;d.vx*=.95;if(Math.abs(d.vx)<6)d.vx=0;}
    }
    if(collect(game,d))game.pickups.splice(i,1);
  }
}
export function updatePickups(game,dt){
  if(game.mode!=='playing'||game.ritual)return;
  game.pickupStepRemainder=(game.pickupStepRemainder||0)+Math.max(0,dt);
  while(game.pickupStepRemainder+1e-10>=STEP){tick(game);game.pickupStepRemainder=Math.max(0,game.pickupStepRemainder-STEP);}
  // Also handles immediate overlap and zero-dt callers without advancing physics.
  for(let i=game.pickups.length-1;i>=0;i--)if(collect(game,game.pickups[i]))game.pickups.splice(i,1);
}
