import { beginAttack, kit } from './shared.js?v=27.1.1';
import { beamWallDistance, fireChannelWeapon } from '../combat/beams.js?v=27.1.1';
import { hitTarget } from '../combat/damage.js?v=27.1.1';
import { possibleTargets } from '../combat/targets.js?v=27.1.1';
import { audio } from '../core/audio.js?v=27.1.1';
import { segmentDistance } from '../core/math.js?v=27.1.1';
import { state } from '../core/state.js?v=27.1.1';
import { muzzlePoint, weaponAim } from '../render/weapons.js?v=27.1.1';
import { getSepulcherBlockers, traceSepulcherBeam } from '../combat/sepulcher-blocking.js?v=27.1.1';


function activateRanger(){
  const g=state.game,p=g.player,k=kit(),a=weaponAim(g);
  if(k.heat<.35)return;
  const dx=Math.cos(a),dy=Math.sin(a);
  const maxDist=beamWallDistance(p.x,p.y,dx,dy);
  const damage=1800+2700*k.heat;

  // Check Sepulcher blockers - find earliest blocker hit
  let blockDist = maxDist;
  let blockerHit = false;
  if (g.sepulcher && g.stage === 'hearts' && g.hearts?.some(h => h.hp > 0)) {
    const blockers = getSepulcherBlockers(g);
    if (blockers.length > 0) {
      const beamResult = traceSepulcherBeam(p.x, p.y, dx, dy, 13, blockers, maxDist);
      if (beamResult.hit) {
        blockDist = beamResult.distance;
        blockerHit = true;
      }
    }
  }

  const blockedEnd = { x: p.x + dx * blockDist, y: p.y + dy * blockDist };
  k.rail={x:p.x,y:p.y,ex:blockedEnd.x,ey:blockedEnd.y,time:.28,max:.28};

  // Hit targets using ray entry (hitbox entry) within stop distance
  // Use swept ray vs circle (target hitbox) - target is hit if ray entry <= blockDist
  for(const t of possibleTargets()){
    // Ray from player to blockedEnd, check if target circle intersects
    const tx = t.x - p.x, ty = t.y - p.y;
    const along = tx * dx + ty * dy;
    if (along < 0) continue; // Target center behind player

    // Perpendicular distance squared from ray to target center
    const perpDistSq = tx * tx + ty * ty - along * along;
    const targetRadius = t.r + 13; // beam half-width 13

    if (perpDistSq <= targetRadius * targetRadius) {
      // Ray intersects target circle - compute entry point along ray
      const offset = Math.sqrt(Math.max(0, targetRadius * targetRadius - perpDistSq));
      let entryDist = along - offset;

      // If origin inside target hitbox (entryDist < 0), clamp to 0 - overlapping target can be damaged
      // This handles the case where player is inside/overlapping the target
      if (entryDist < 0) entryDist = 0;

      // Hit if entry point is within the rail distance (before blocker or maxDist)
      if (entryDist <= blockDist) {
        hitTarget(t, damage, t.x, t.y, '#fff0ba', 'ranger');
      }
    }
  }
  k.heat=0;
  k.overheat=0;
  k.abilityCd=1.4;
  p.fireCd=Math.max(p.fireCd,.15);
  audio.fx('big');
}


function updateRanger(dt){
  const g=state.game,k=kit();
  if(g.t-k.lastFire>.15)k.heat=Math.max(0,k.heat-dt*.28);
}


function attackRanger(w){
  if(kit().overheat>0)return;
  if(!beginAttack(w))return;
  const p=state.game.player;
  p.fireCd=w.cool;
  p.mana-=w.mana;
  audio.fx('shoot');
  fireChannelWeapon(w,weaponAim(state.game));
}


export { activateRanger, updateRanger, attackRanger };
