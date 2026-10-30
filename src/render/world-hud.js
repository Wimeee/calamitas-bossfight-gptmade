import { W,H,TAU } from '../core/config.js?v=22.1.0';
import { ctx } from '../core/dom.js?v=22.1.0';
import { arena } from '../core/arena.js?v=22.1.0';
import { cameraView } from '../world/camera.js?v=22.1.0';
import { settings,keyLabel } from '../core/settings.js?v=22.1.0';
import { clamp } from '../core/math.js?v=22.1.0';
import { text,line,round } from './primitives.js?v=22.1.0';

export function edgePoint(x,y,g,padding=28){
  const v=cameraView(g),sx=x-v.x,sy=y-v.y;
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
  if(r?.enabled){
    meter(16,H-93,'RAGE',r.rage,r.rageTime,'#e96b55',keyLabel(settings.bindings.rage));
    meter(16,H-50,'ADRENALINE',r.adrenaline,r.adrenalineTime,'#78cfe8',keyLabel(settings.bindings.adrenaline));
  }
  const targets=g.stage==='hearts'?g.hearts:g.stage==='brothers'?g.brothers:g.stage==='seekers'?g.seekers:[g.boss];
  for(const t of targets){const point=edgePoint(t.x,t.y,g,40);if(point)arrow(point,g.stage==='hearts'?'#ffb4bb':'#ffa486',targets.length===1?'CALAMITAS':'');}
  if(g.maelstrom){const point=edgePoint(g.maelstrom.x,g.maelstrom.y,g,52);if(point)arrow(point,'#d995ee','MAELSTROM');}
  // Only approaching, nearby off-screen bullets receive a small edge marker.
  let warnings=0;
  for(const q of g.projectiles){
    if(warnings>=10)break;
    const sx=q.x-v.x,sy=q.y-v.y;
    const outside=sx<0||sx>W||sy<0||sy>H;
    if(!outside||sx< -320||sx>W+320||sy< -260||sy>H+260)continue;
    if(q.vx*(g.player.x-q.x)+q.vy*(g.player.y-q.y)<=0)continue;
    const point=edgePoint(q.x,q.y,g,17);if(point){arrow(point,'#ffcc86');warnings++;}
  }
  if(g.stage==='hell')text('BULLET HELL '+g.phaseN+' · '+Math.ceil(Math.max(0,15-g.stageT))+'s',W/2,51,15,'#ffd0bf');
  // A small arena map retains landmarks and reveals targets beyond the camera.
  const size=125,x=W-size-16,y=H-size-16,scale=size/(arena.r-arena.l);
  ctx.fillStyle='#09060dd9';ctx.fillRect(x-5,y-5,size+10,size+10);
  ctx.strokeStyle='#a45965';ctx.lineWidth=1;ctx.strokeRect(x,y,size,size);
  const px=z=>x+(z-arena.l)*scale,py=z=>y+(z-arena.t)*scale;
  ctx.strokeStyle='#c9ac7d66';ctx.strokeRect(px(v.x),py(v.y),W*scale,H*scale);
  round(px(500),py(300),2,'#c9ac7d');
  for(const t of targets)round(px(t.x),py(t.y),2,g.stage==='hearts'?'#ffa4bb':'#f77370');
  round(px(g.player.x),py(g.player.y),3,'#a8e8eb');
}
