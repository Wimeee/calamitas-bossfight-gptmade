import { movementConfig } from '../../config/movement.js?v=21.1.1';
import { ctx } from '../core/dom.js?v=21.1.1';

export function drawFlightWings(g){
  const p=g.player;if(!p.physics||!p.flying)return;
  const t=g.ritual?.ambient??g.t,flap=Math.sin(t*24)*5;
  ctx.save();ctx.translate(p.x,p.y-5);ctx.shadowBlur=0;
  for(const side of [-1,1])for(let i=0;i<3;i++){
    ctx.fillStyle=i===0?'#d9b576b8':i===1?'#90c8edaa':'#8660b8a0';
    ctx.beginPath();ctx.moveTo(side*4,5);ctx.lineTo(side*(32-i*6),-15+i*8+flap);
    ctx.lineTo(side*(24-i*5),8+i*3+flap*.4);ctx.closePath();ctx.fill();
  }
  ctx.restore();
}

export function drawFlightGauge(g){
  const p=g.player;if(!p.physics||p.grounded)return;
  const ratio=p.flightRemaining/movementConfig.flightTime;
  ctx.fillStyle='#0d0818dd';ctx.fillRect(p.x+26,p.y-20,5,34);
  ctx.fillStyle=ratio>.2?'#a5d9f1':'#e7937a';ctx.fillRect(p.x+27,p.y+13-ratio*32,3,ratio*32);
}
