import { settings } from '../core/settings.js?v=26.0.0';
import { state } from '../core/state.js?v=26.0.0';
import { dash } from '../combat/player.js?v=26.0.0';
import { movementConfig } from '../../config/movement.js?v=26.0.0';

export function directionTap(key,now=performance.now()){
  const g=state.game;if(!g||g.mode!=='playing'||g.ritual?.phase==='summoning'||!settings.doubleTapDash)return;
  const direction=key==='a'||key==='ArrowLeft'?-1:key==='d'||key==='ArrowRight'?1:0;
  if(!direction)return;
  const p=g.player;
  if(p.dashTapDirection===direction&&now-p.dashTapAt<=movementConfig.doubleTapMs){dash(direction);p.dashTapAt=-Infinity;}
  else{p.dashTapDirection=direction;p.dashTapAt=now;}
}
