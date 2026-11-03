// Browser frame intervals, before the simulation's dt clamp. No game-state mutation.
export function createFrameMeter(){
 let last=null,elapsed=0,frames=0,worst=0;const stats={fps:null,minFPS:null};
 function reset(){last=null;elapsed=frames=worst=0;stats.fps=stats.minFPS=null;}
 function sample(now,active=true){
  if(!active||!Number.isFinite(now)){last=null;elapsed=frames=0;return stats;}
  if(last===null){last=now;return stats;}const dt=now-last;last=now;if(dt<=0)return stats;
  worst=Math.max(worst,dt);stats.minFPS=1000/worst;elapsed+=dt;frames++;
  if(elapsed>=500){stats.fps=frames*1000/elapsed;elapsed=frames=0;}return stats;
 }
 return {sample,reset,status:()=>({...stats})};
}
