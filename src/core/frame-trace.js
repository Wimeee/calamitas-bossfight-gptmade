import {state} from './state.js?v=31.1.4';
import {renderQuality} from './settings.js?v=31.1.4';
import {VERSION} from './config.js?v=31.1.4';
import {canvas} from './dom.js?v=31.1.4';
const classes=['melee','ranger','mage','summon','rogue'];
const rounded=n=>Number.isFinite(n)?Math.round(n*100)/100:null;
export function createFrameTrace(capacity=2048){
 capacity=Math.max(2,Math.min(4096,Math.floor(capacity)||2048));
 const stride=15,data=new Float64Array(capacity*stride),stages=new Array(capacity),previousStages=new Array(capacity);
 let cursor=0,count=0,last=null,previousLogic=0,previousDraw=0,previousPaint=false,previousStage='';
 function breakSequence(){last=null;previousLogic=previousDraw=0;previousPaint=false;previousStage='';}
 function reset(){cursor=count=0;breakSequence();}
 function record(now,logic,draw,delay,steps,painted,g){
  if(!Number.isFinite(now))return;
  const i=cursor*stride;
  data[i]=now;data[i+1]=last!==null&&now>last?now-last:NaN;
  data[i+2]=logic;data[i+3]=draw;data[i+4]=delay;data[i+5]=steps;data[i+6]=painted?1:0;
  data[i+7]=g?.t||0;data[i+8]=g?.projectiles?.length||0;data[i+9]=g?.shots?.length||0;
  data[i+10]=(g?.arkEffects?.length||0)+(g?.calamitasEffects?.length||0)+(g?.sparks?.length||0)+(g?.floaters?.length||0);
  data[i+11]=g?.player?.weapon??-1;data[i+12]=last===null?NaN:previousLogic;data[i+13]=last===null?NaN:previousDraw;data[i+14]=previousPaint?1:0;
  stages[cursor]=g?.stage||'';previousStages[cursor]=previousStage;cursor=(cursor+1)%capacity;count=Math.min(capacity,count+1);
  last=now;previousLogic=logic;previousDraw=draw;previousPaint=painted;previousStage=g?.stage||'';
 }
 function snapshot(){
  const frames=[];for(let n=0;n<count;n++){
   const slot=(cursor-count+n+capacity)%capacity,i=slot*stride;
   frames.push({atMs:rounded(data[i]),intervalMs:rounded(data[i+1]),logicMs:rounded(data[i+2]),drawMs:rounded(data[i+3]),callbackDelayMs:rounded(data[i+4]),steps:data[i+5],painted:!!data[i+6],gameSeconds:rounded(data[i+7]),projectiles:data[i+8],shots:data[i+9],effects:data[i+10],classId:classes[data[i+11]]||'unknown',stage:stages[slot],previousStage:previousStages[slot],previousLogicMs:rounded(data[i+12]),previousDrawMs:rounded(data[i+13]),previousPainted:!!data[i+14]});
  }
  const intervals=frames.map(f=>f.intervalMs).filter(n=>n!==null).sort((a,b)=>a-b);
  const percentile=p=>intervals.length?intervals[Math.min(intervals.length-1,Math.floor(intervals.length*p))]:null;
  return {samples:count,capacity,summary:{medianIntervalMs:percentile(.5),p95IntervalMs:percentile(.95),worstIntervalMs:intervals.at(-1)??null,over25ms:intervals.filter(n=>n>25).length},worst:frames.filter(f=>f.intervalMs!==null).sort((a,b)=>b.intervalMs-a.intervalMs).slice(0,25)};
 }
 return {record,snapshot,reset,breakSequence};
}
const trace=createFrameTrace();let owner=null;
export function pausePerformanceTrace(){trace.breakSequence();}
export function recordPerformanceFrame(g,now,start,logicEnd,renderEnd,steps,painted){
 if(owner!==g){owner=g;trace.reset();}
 trace.record(now,logicEnd-start,renderEnd-logicEnd,Math.max(0,start-now),steps,painted,g);
}
export function getPerformanceReport(){
 const g=state.game,window=owner===g?trace.snapshot():createFrameTrace(2).snapshot();
 return {format:'utbg-frame-trace-v1',version:VERSION,browser:navigator.userAgent||'unknown',device:state.deviceMode,quality:renderQuality(),backingPixels:[canvas.width,canvas.height],zoom:g?.camera?.zoom??null,game:g?{classId:classes[g.player.weapon],difficulty:g.difficulty,stage:g.stage,seconds:rounded(g.totalTime),practice:!!g.practice}:null,
  notes:'Local bounded RAF callback window. intervalMs precedes this callback; previousLogicMs/previousDrawMs describe the previous callback, not the current one. CPU draw submission does not measure GPU completion or identify GC. Mobile skipped paints are marked. Pause/hidden/menu gaps are excluded. No automatic upload.',...window};
}
