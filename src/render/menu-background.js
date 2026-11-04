import {renderQuality} from '../core/settings.js?v=29.1.0';
import { settings, subscribeSettings } from '../core/settings.js?v=29.1.0';

function createMenuBackground(canvas) {
  const ctx=canvas.getContext('2d');
  let seed=Date.now()>>>0;const random=()=>((seed=(seed*1664525+1013904223)>>>0)/4294967296);
  let frame=0,last=0,width=0,height=0,particles=[],running=false;
  const reduced=window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const count=()=>Math.round(({low:35,high:85,ultra:145}[renderQuality()])*(reduced?.35:1));
  function spawn(initial=false){return {x:random()*width,y:initial?random()*height:height+12,vx:10+random()*35,vy:24+random()*95,r:.6+random()*1.7,phase:random()*6.28,life:random()};}
  function resize(){
    width=window.innerWidth||1200;height=window.innerHeight||720;
    const ratio=Math.min(window.devicePixelRatio||1,renderQuality()==='ultra'?2:1.5);
    canvas.width=Math.round(width*ratio);canvas.height=Math.round(height*ratio);
    ctx.setTransform(ratio,0,0,ratio,0,0);
    particles=Array.from({length:count()},()=>spawn(true));
  }
  function draw(now){
    if(!running)return;
    if(document.hidden){last=now;frame=requestAnimationFrame(draw);return;}
    const dt=Math.min(.05,(now-last)/1000||.016);last=now;
    ctx.clearRect(0,0,width,height);ctx.globalCompositeOperation='lighter';
    for(let i=0;i<particles.length;i++){
      let p=particles[i];p.y-=p.vy*dt;p.x+=(p.vx+Math.sin(now*.0007+p.phase)*15)*dt;
      if(p.y< -12||p.x>width+12)particles[i]=p=spawn();
      const fade=Math.min(1,(height-p.y)/70,Math.max(0,p.y/120));
      ctx.globalAlpha=(.35+.45*Math.sin(p.phase+now*.002)**2)*fade;
      ctx.fillStyle=i%5===0?'#ffe3a1':'#f88749';
      ctx.shadowColor='#ff502c';ctx.shadowBlur=renderQuality()==='low'?0:9;
      ctx.beginPath();ctx.ellipse(p.x,p.y,p.r,p.r*1.8,.45,0,Math.PI*2);ctx.fill();
    }
    ctx.globalAlpha=1;ctx.shadowBlur=0;ctx.globalCompositeOperation='source-over';
    frame=requestAnimationFrame(draw);
  }
  window.addEventListener('resize',resize);
  let quality=renderQuality();
  subscribeSettings(()=>{if(quality!==renderQuality()){quality=renderQuality();resize();}});
  return {
    start(){if(running)return;running=true;resize();last=0;frame=requestAnimationFrame(draw);},
    stop(){running=false;if(frame)cancelAnimationFrame(frame);frame=0;ctx.clearRect(0,0,width,height);},
    get active(){return running;},
    get particleCount(){return particles.length;}
  };
}
export { createMenuBackground };
