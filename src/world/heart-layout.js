// SupremeCalamitas.DoHeartsSpawningCastAnimation, pinned1a8cebd.
// Use the original safe-box frame, not its currently animated expansion/contraction.
export function heartSpawnPositions(g){
 const death=g.difficulty==='death',half=death?1000:1250,top=300-half+250-(death?50:0),dy=death?100:125,points=[];
 for(let i=0;i<5;i++){
  points.push({x:500-half+50+i*200,y:top+i*dy});
  points.push({x:500+half-50-i*200,y:top+i*dy});
 }
 return points;
}
