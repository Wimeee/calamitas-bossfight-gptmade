import { W,H } from '../core/config.js?v=22.1.0';
import { arena } from '../core/arena.js?v=22.1.0';
import { state } from '../core/state.js?v=22.1.0';
import { clamp } from '../core/math.js?v=22.1.0';

export function cameraView(g=state.game){
  const c=g?.camera||{x:500,y:300};return {x:c.x-W/2,y:c.y-H/2,w:W,h:H};
}
export function updateCamera(g,dt=0,snap=false){
  const p=g.player,c=g.camera||(g.camera={x:p.x,y:p.y});
  const targetX=clamp(p.x,arena.l+W/2-40,arena.r-W/2+40);
  const targetY=clamp(p.y-35,arena.t+H/2-40,arena.b-H/2+40);
  const f=snap?1:1-Math.exp(-12*Math.max(0,dt));
  c.x+=(targetX-c.x)*f;c.y+=(targetY-c.y)*f;
  if(state.deviceMode==='desktop'&&Number.isFinite(state.pointer.viewX)){
    state.pointer.x=clamp(state.pointer.viewX+c.x-W/2,arena.l,arena.r);
    state.pointer.y=clamp(state.pointer.viewY+c.y-H/2,arena.t,arena.b);
  }
}
