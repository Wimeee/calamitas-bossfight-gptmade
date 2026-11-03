const clamp01=x=>Math.max(0,Math.min(1,x));
const lerp=(a,b,t)=>a+(b-a)*t;
const polyIO=(x,p)=>x<.5?Math.pow(2*x,p)/2:1-Math.pow(2*(1-x),p)/2;
export function arkSwingRatio(progress){
 const t=clamp01(progress);
 if(t<.1)return .15*(t===0?0:1-Math.pow(2,-10*t/.1));
 if(t<.5)return .15+.85*polyIO((t-.1)/.4,3);
 return 1+.2*(t-.5)/.5;
}
export function arkSwirlRatio(progress){
 const t=clamp01(progress);
 return t<.1?.25*(1-Math.cos(t/.1*Math.PI/2)):.25+.75*Math.sin((t-.1)/.9*Math.PI/2);
}
export function arkAngle(s,progress){
 const facing=s.direction??(Math.cos(s.angle)<0?-1:1),direction=s.wide?-facing:facing;
 if(s.wide)return s.angle+lerp(Math.PI*.75,-(Math.PI*2+Math.PI*.375),arkSwirlRatio(progress))*direction;
 return s.angle+lerp(Math.PI*.375,-Math.PI*.375,arkSwingRatio(progress))*direction;
}
export function arkSwingGeometry(s,progress,p){
 const angle=arkAngle(s,progress),scale=1.2+Math.sin(arkSwingRatio(progress)*Math.PI)*.6+(s.charge||0)*.02;
 const dx=Math.cos(angle),dy=Math.sin(angle);
 return {angle,scale,flip:(s.direction??(Math.cos(s.angle)<0?-1:1))<0,
  draw:{x:p.x+dx*10,y:p.y+dy*10},
  start:{x:p.x+dx*30,y:p.y+dy*30},
  end:{x:p.x+dx*(30+172*scale),y:p.y+dy*(30+172*scale)}};
}
export function arkParryGeometry(s,p){
 const t=clamp01(1-s.time/s.max);
 let thrust=t<.2?.2-.05*Math.sin(t/.2*Math.PI):t<.7?.2+.8*polyIO((t-.2)/.5,2):1-.1*(1-Math.sqrt(1-Math.pow((t-.7)/.3,2)));
 const closing=t<.3?-.15*Math.sin(t/.3*Math.PI):t<.5?Math.pow((t-.3)/.2,4):1;
 const dx=Math.cos(s.angle),dy=Math.sin(s.angle),scale=1.4+thrust*.2,start=10+10*thrust;
 return {scale,opening:Math.PI/4*(1-closing),x:p.x+dx*(15+50*thrust),y:p.y+dy*(15+50*thrust),
 start:{x:p.x+dx*start,y:p.y+dy*start},end:{x:p.x+dx*(start+142*scale),y:p.y+dy*(start+142*scale)}};
}

