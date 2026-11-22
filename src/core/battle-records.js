import {playerConfig} from '../../config/player.js?v=31.1.3';
const KEY='utbg_battle_records_v1';
const classes=['melee','ranger','mage','summon','rogue'],difficulties=['normal','revenge','death'];
const finite=(n,max=1e9)=>Number.isFinite(n)&&n>=0&&n<=max;
const count=n=>Number.isInteger(n)&&finite(n);
const identity=r=>r&&classes.includes(r.classId)&&difficulties.includes(r.difficulty);
const validRecord=r=>identity(r)&&count(r.wins)&&r.wins>0&&finite(r.bestTime,86400)&&count(r.fewestHits);
const validRun=r=>identity(r)&&typeof r.won==='boolean'&&finite(r.time,86400)&&count(r.hits)&&count(r.dashes)&&count(r.healingUsed)&&count(r.regenerationUsed)&&finite(r.bossHP,100)&&finite(r.finishedAt,1e15);
const recordFields=r=>({classId:r.classId,difficulty:r.difficulty,wins:r.wins,bestTime:r.bestTime,fewestHits:r.fewestHits});
const runFields=r=>({classId:r.classId,difficulty:r.difficulty,won:r.won,time:r.time,hits:r.hits,dashes:r.dashes,healingUsed:r.healingUsed,regenerationUsed:r.regenerationUsed,bossHP:r.bossHP,finishedAt:r.finishedAt});

export function readBattleRecords(){
 try{
  const raw=localStorage.getItem(KEY);if(!raw||raw.length>100000)return {records:[],history:[]};
  const data=JSON.parse(raw),seen=new Set();
  const records=(Array.isArray(data?.records)?data.records:[]).filter(r=>{
   if(!validRecord(r))return false;const key=r.classId+':'+r.difficulty;
   if(seen.has(key))return false;seen.add(key);return true;
  }).slice(0,15).map(recordFields);
  return {records,history:(Array.isArray(data?.history)?data.history:[]).filter(validRun).slice(0,20).map(runFields)};
 }catch{return {records:[],history:[]};}
}

export function recordBattleResult(g,won){
 if(g.battleResult)return g.battleResult;
 const p=g.player,run={classId:classes[p.weapon],difficulty:g.difficulty,won:!!won,
  time:Math.max(0,g.totalTime),hits:p.hits,dashes:p.dashes,
  healingUsed:Math.max(0,playerConfig.potions-p.potions),regenerationUsed:Math.max(0,playerConfig.regenerationPotions-p.regenPotions),
  bossHP:won?0:Math.max(0,Math.min(100,g.boss.hp/g.boss.max*100)),finishedAt:Date.now()};
 const result={...run,eligible:!g.debug&&!g.practice,saved:false,newTime:false,newHits:false};
 if(result.eligible&&validRun(run)){
  const book=readBattleRecords();
  if(won){
   let record=book.records.find(r=>r.classId===run.classId&&r.difficulty===run.difficulty);
   result.newTime=!record||run.time<record.bestTime;result.newHits=!record||run.hits<record.fewestHits;
   if(record){record.wins++;record.bestTime=Math.min(record.bestTime,run.time);record.fewestHits=Math.min(record.fewestHits,run.hits);}
   else book.records.push({classId:run.classId,difficulty:run.difficulty,wins:1,bestTime:run.time,fewestHits:run.hits});
  }
  book.history.unshift(run);book.history.length=Math.min(book.history.length,20);
  try{localStorage.setItem(KEY,JSON.stringify(book));result.saved=true;}catch{/* Results remain usable when browser storage is full or blocked. */}
 }
 g.battleResult=Object.freeze(result);return g.battleResult;
}
