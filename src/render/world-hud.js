import { W,H,TAU } from '../core/config.js?v=28.0.1';
import { ctx } from '../core/dom.js?v=28.0.1';
import { arena } from '../core/arena.js?v=28.0.1';
import { cameraView } from '../world/camera.js?v=28.0.1';
import { settings,keyLabel } from '../core/settings.js?v=28.0.1';
import { clamp } from '../core/math.js?v=28.0.1';
import { text,line,round } from './primitives.js?v=28.0.1';

export function edgePoint(x,y,g,padding=28){
  const v=cameraView(g);
  // Convert world point to canvas coordinates: screen = (world - cam) * zoom + (W/2, H/2)
  // cam = (v.x + v.w/2, v.y + v.h/2), zoom = v.zoom
  const zoom = v.zoom || 1;
  const camX = v.x + v.w/2;
  const camY = v.y + v.h/2;
  const sx = (x - camX) * zoom + W/2;
  const sy = (y - camY) * zoom + H/2;
  if(sx>=padding&&sx<=W-padding&&sy>=padding&&sy<=H-padding)return null;
  const dx=sx-W/2,dy=sy-H/2,scale=Math.min((W/2-padding)/Math.max(.001,Math.abs(dx)),(H/2-padding)/Math.max(.001,Math.abs(dy)));
  return {x:W/2+dx*scale,y:H/2+dy*scale,angle:Math.atan2(dy,dx)};
}
function arrow(point,color,label=''){
  ctx.save();ctx.translate(point.x,point.y);ctx.rotate(point.angle);ctx.fillStyle=color;
  ctx.beginPath();ctx.moveTo(8,0);ctx.lineTo(-5,-5);ctx.lineTo(-5,5);ctx.closePath();ctx.fill();ctx.restore();
  if(label)text(label,clamp(point.x,75,W-75),clamp(point.y+18,38,H-12),10,color);
}
function meter(x,y,label,value,time,color,key){
  ctx.fillStyle='#09060dd9';ctx.fillRect(x,y,205,38);
  text(label+' · '+key+(time>0?' · '+time.toFixed(1)+'s':value>=1?' · ГОТОВО':''),x+102,y+14,11,value>=1||time>0?'#fff0ca':color);
  ctx.fillStyle='#301e2c';ctx.fillRect(x+7,y+24,191,6);ctx.fillStyle=color;ctx.fillRect(x+7,y+24,191*value,6);
}
export function drawWorldHUD(g){
  const r=g.rippers,v=cameraView(g);
  const targets=g.stage==='hearts'?g.hearts:g.stage==='brothers'?g.brothers:g.stage==='seekers'?g.seekers:[g.boss];
  for(const t of targets){const point=edgePoint(t.x,t.y,g,40);if(point)arrow(point,g.stage==='hearts'?'#ffb4bb':'#ffa486',targets.length===1?'CALAMITAS':'');}
  if(g.maelstrom){const point=edgePoint(g.maelstrom.x,g.maelstrom.y,g,52);if(point)arrow(point,'#d995ee','MAELSTROM');}
  // Only approaching, nearby off-screen bullets receive a small edge marker.
  let warnings=0;
  const zoom = v.zoom || 1;
  const camX = v.x + v.w/2;
  const camY = v.y + v.h/2;
  for(const q of g.projectiles){
    if(warnings>=10)break;
    // Convert projectile world position to canvas coordinates
    const sx = (q.x - camX) * zoom + W/2;
    const sy = (q.y - camY) * zoom + H/2;
    const outside = sx < 0 || sx > W || sy < 0 || sy > H;
    // Check distance in canvas pixels (with some margin)
    const marginX = 320 / zoom; // 320 world units at zoom=1, scaled
    const marginY = 260 / zoom;
    if(!outside || sx < -marginX * zoom || sx > W + marginX * zoom || sy < -marginY * zoom || sy > H + marginY * zoom) continue;
    // Only warn for bullets approaching player
    if(q.vx*(g.player.x-q.x)+q.vy*(g.player.y-q.y)<=0)continue;
    const point=edgePoint(q.x,q.y,g,17);if(point){arrow(point,'#ffcc86');warnings++;}
  }
  if(g.stage==='hell')text('BULLET HELL '+g.phaseN+' · '+Math.ceil(Math.max(0,15-g.stageT))+'s',W/2,51,15,'#ffd0bf');
  // Minimap temporarily hidden; retain threat arrows.
}
