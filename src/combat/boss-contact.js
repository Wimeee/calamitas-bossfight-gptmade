import {hurt} from './damage.js?v=29.0.0';
import {relativeActorDistance} from './motion-collision.js?v=29.0.0';

// All actors use the same frame-local timeline. The ordinary body remains harmless.
export function resolveCalamitasContact(g,motion){
 if(g.mode!=='playing'||g.phase2Intro>0||g.castDelayState)return;
 for(const segment of motion?.bossSegments||[]){
  if(segment.damage>0&&relativeActorDistance(motion.points,segment)<g.boss.r+11){
   hurt(segment.damage,'contact','Ривок Calamitas');
   if(g.player.iframes>0||g.mode!=='playing')break;
  }
 }
}
