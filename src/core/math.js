const clamp=(x,a,b)=>Math.max(a,Math.min(b,x));

const lerp=(a,b,t)=>a+(b-a)*t;

const dist=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);

const rnd=(a,b)=>a+Math.random()*(b-a);

const norm=(x,y)=>{
  let d=Math.hypot(x,y)||1;
  return{x:x/d,y:y/d}
};


function segmentDistance(x,y,ax,ay,bx,by){
  const dx=bx-ax,dy=by-ay,t=clamp(((x-ax)*dx+(y-ay)*dy)/(dx*dx+dy*dy||1),0,1);
  return Math.hypot(x-ax-t*dx,y-ay-t*dy)
}


export { clamp, lerp, dist, rnd, norm, segmentDistance };
