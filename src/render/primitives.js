import { TAU } from '../core/config.js?v=19.1.1';
import { ctx } from '../core/dom.js?v=19.1.1';
import { clamp } from '../core/math.js?v=19.1.1';
import { pixelArt } from './sprites.js?v=19.1.1';


function round(x,y,r,col,stroke,thick=1){
  ctx.beginPath();
  ctx.arc(x,y,r,0,TAU);
  ctx.fillStyle=col;
  ctx.fill();
  if(stroke){
    ctx.lineWidth=thick;
    ctx.strokeStyle=stroke;
    ctx.stroke()
  }
}


function line(x1,y1,x2,y2,col,width=2){
  ctx.strokeStyle=col;
  ctx.lineWidth=width;
  ctx.beginPath();
  ctx.moveTo(x1,y1);
  ctx.lineTo(x2,y2);
  ctx.stroke()
}


function text(s,x,y,size=14,col='#fff',align='center'){
  ctx.font=`800 ${size}px system-ui`;
  ctx.fillStyle=col;
  ctx.textAlign=align;
  ctx.fillText(s,x,y)
}


function pixel(name,x,y,scale=2,angle=0,flip=false){
  const c=pixelArt[name];
  ctx.save();
  ctx.imageSmoothingEnabled=false;
  ctx.translate(Math.round(x),Math.round(y));
  ctx.rotate(angle);
  ctx.scale(flip?-scale:scale,scale);
  ctx.drawImage(c,-c.width/2,-c.height/2);
  ctx.restore();
}


function hpMini(x,y,actual,max,width=38,color='#f26c86'){
  const ratio=clamp(actual/max,0,1);
  ctx.fillStyle='#170b13';
  ctx.fillRect(x-width/2,y,width,6);
  ctx.fillStyle=color;
  ctx.fillRect(x-width/2,y,width*ratio,6);
  ctx.strokeStyle='#ffd4cb90';
  ctx.lineWidth=1;
  ctx.strokeRect(x-width/2,y,width,6);
}


export { round, line, text, pixel, hpMini };
