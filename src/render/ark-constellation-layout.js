const layouts=new WeakMap();
function hash(n){const v=Math.sin(n*127.1+311.7)*43758.5453;return v-Math.floor(v);}
// Native constellation swaps every15ticks, with 0.2..0.5 spacing and ±50px offsets.
export function arkConstellationLayout(g,s){
 const ready=s.age-s.max*.25;if(ready<0&&!s.snapped)return null;
 const tick=Math.max(0,ready*60),bucket=Math.floor(tick/15),p=g.player;let layout=layouts.get(s);
 if(!layout||layout.bucket!==bucket){
  const dx=s.x-p.x,dy=s.y-p.y,d=Math.hypot(dx,dy)||1,nx=-dy/d,ny=dx/d,seed=(s.charge||0)*17+bucket*89+(s.initialAngle||0)*59+17;
  const nodes=[{x:0,y:0,scale:1+hash(seed)*.5,hue:300,rotation:hash(seed+1)*Math.PI*2}],links=[];let previous=0,i=.2+hash(seed+2)*.3,index=3;
  while(i<1){const h=hash(seed+index++)*360,offset=hash(seed+index++)*100-50;
   nodes.push({x:dx*i+nx*offset,y:dy*i+ny*offset,scale:1+hash(seed+index++)*.5,hue:h,rotation:hash(seed+index++)*Math.PI*2});links.push([previous,nodes.length-1]);
   if(hash(seed+index++)<1/3){const extra=hash(seed+index++)*100-50;nodes.push({x:dx*i+nx*extra,y:dy*i+ny*extra,scale:1+hash(seed+index++)*.5,hue:(h+57.6)%360,rotation:hash(seed+index++)*Math.PI*2});links.push([previous,nodes.length-1]);}
   previous=nodes.length-1;i+=.2+hash(seed+index++)*.3;
  }
  nodes.push({x:dx,y:dy,scale:1+hash(seed+index++)*.5,hue:hash(seed+index++)*360,rotation:hash(seed+index)*Math.PI*2});links.push([previous,nodes.length-1]);
  layout={bucket,nodes,links};layouts.set(s,layout);
 }
 return{...layout,origin:{x:p.x,y:p.y},age:tick-bucket*15};
}
