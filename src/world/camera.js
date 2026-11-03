import { W,H, ZOOM_DEFAULT, ZOOM_MIN, ZOOM_MAX } from '../core/config.js?v=26.3.0';
import { arena } from '../core/arena.js?v=26.3.0';
import { state } from '../core/state.js?v=26.3.0';
import { clamp } from '../core/math.js?v=26.3.0';
import {settings,subscribeSettings} from '../core/settings.js?v=26.3.0';

export function defaultCameraZoom(){return ZOOM_DEFAULT*(state.deviceMode==='mobile'?settings.cameraZoomMobile:settings.cameraZoomDesktop);}
let previousDesktopZoom=settings.cameraZoomDesktop,previousMobileZoom=settings.cameraZoomMobile;
subscribeSettings(next=>{
  const changed=state.deviceMode==='mobile'?next.cameraZoomMobile!==previousMobileZoom:next.cameraZoomDesktop!==previousDesktopZoom;
  previousDesktopZoom=next.cameraZoomDesktop;previousMobileZoom=next.cameraZoomMobile;
  if(changed&&state.game?.camera){state.game.camera.zoom=defaultCameraZoom();updateCamera(state.game,0);}
});
function getZoom(g) {
  const z = g?.camera?.zoom;
  return Number.isFinite(z) ? clamp(z, ZOOM_MIN, ZOOM_MAX) : defaultCameraZoom();
}

export function cameraView(g=state.game){
  const c = g?.camera || {x:500,y:300, zoom: defaultCameraZoom()};
  const zoom = getZoom(g);
  const halfW = W / 2 / zoom;
  const halfH = H / 2 / zoom;
  return {x: c.x - halfW, y: c.y - halfH, w: W / zoom, h: H / zoom, zoom};
}

export function updateCamera(g,dt=0,snap=false){
  const p=g.player,c=g.camera||(g.camera={x:p.x,y:p.y, zoom: defaultCameraZoom()});
  // Follow the player at the chosen zoom; arena extents never rescale the scene.
  c.zoom=getZoom(g);
  const targetX=p.x,targetY=p.y;
  const f=snap?1:1-Math.exp(-12*Math.max(0,dt));
  c.x+=(targetX-c.x)*f;c.y+=(targetY-c.y)*f;
  if(state.deviceMode==='desktop'&&Number.isFinite(state.pointer.viewX)){
    const view = cameraView(g);
    if(Number.isFinite(state.pointer.u)){state.pointer.viewX=state.pointer.u*view.w;state.pointer.viewY=state.pointer.v*view.h;}
    // viewX/viewY are world offsets from view origin (set in desktop.js eventPos)
    // Current world position = current view origin + stored offset
    state.pointer.x = clamp(view.x + state.pointer.viewX, arena.l, arena.r);
    state.pointer.y = clamp(view.y + state.pointer.viewY, arena.t, arena.b);
  }
}

export function setZoom(g, zoom) {
  if (g.camera) {
    g.camera.zoom = clamp(zoom, ZOOM_MIN, ZOOM_MAX);
  }
}
