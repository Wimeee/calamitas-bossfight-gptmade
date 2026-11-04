import { finish } from '../game/session.js?v=27.0.0';
export function projectileHexDuration(q){if(q.nativeSeeker||q.kind==='sepulcherDart'&&q.ai0===0)return 3;if(!q.sourceCalamitas)return 0;return q.kind==='giga'?5:q.kind==='fire'||q.kind==='scalfireblast'?4:q.kind==='wave'||q.kind==='skull'?2:['dart','hellblast','hellblast2'].includes(q.kind)?3:0;}
export function applyPlayerHex(g,duration){if(!duration||g.mode!=='playing')return;const p=g.player;p.debuffs??={};const old=p.debuffs.hex;if(!old||duration>old.remaining)p.debuffs.hex={remaining:duration,max:duration,carry:old?.carry||0};}
export function updatePlayerDebuffs(g,dt){if(g.mode!=='playing'||g.ritual)return 0;const hex=g.player.debuffs?.hex;if(!hex)return 0;
 const active=Math.min(Math.max(0,dt),hex.remaining);if(active>0)g.player.lastHit=g.t;hex.remaining=Math.max(0,hex.remaining-active);hex.carry=(hex.carry||0)+active*(g.difficulty==='death'?18.75:15);
 const loss=Math.floor(hex.carry+1e-8);hex.carry-=loss;if(loss>0){g.player.hp=Math.max(0,g.player.hp-loss);g.lastCause='Vulnerability Hex';if(g.floaters.length<160)g.floaters.push({x:g.player.x,y:g.player.y-12,life:.6,text:'-'+loss,col:'#e56d83',dot:true});if(g.player.hp<=0)finish(false);}
 if(hex.remaining<=1e-9)delete g.player.debuffs.hex;return active;
}
