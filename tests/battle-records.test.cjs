const test=require('node:test'),assert=require('node:assert/strict');
const {loadGame}=require('./helpers/fixture.cjs');
const KEY='utbg_battle_records_v1';
function complete(t,el,{win=true,cls='melee',diff='revenge',time=306,hits=4}={}){
 el('class').value=cls;el('diff').value=diff;t.start();const g=t.getGame();
 g.totalTime=time;g.player.hits=hits;g.player.dashes=12;g.player.potions=5;g.player.regenPotions=2;g.boss.hp=win?1:g.boss.max*.42;
 t.finish(win);return g;
}
test('completed fights persist independent time and hit records per class and difficulty across reload',async()=>{
 const storage=new Map(),{t,el}=await loadGame({storage});
 const g=complete(t,el);assert.ok(g.battleResult,'finish must attach a result');
 assert.equal(g.battleResult.healingUsed,2);assert.equal(g.battleResult.regenerationUsed,1);
 assert.equal(g.battleResult.dashes,12);assert.equal(g.battleResult.bossHP,0);
 complete(t,el,{time:290,hits:7});complete(t,el,{time:320,hits:1});
 complete(t,el,{cls:'rogue',diff:'death',time:400,hits:9});
 const next=await loadGame({storage}),book=next.t.readBattleRecords();
 const record=book.records.find(r=>r.classId==='melee'&&r.difficulty==='revenge');
 assert.equal(record.wins,3);assert.equal(record.bestTime,290);assert.equal(record.fewestHits,1);
 assert.equal(book.records.length,2);assert.equal(book.history.length,4);
});
test('defeats retain ending boss HP but never improve victory records and finish is idempotent',async()=>{
 const {t,el}=await loadGame();complete(t,el);
 const g=complete(t,el,{win:false,time:12,hits:0});t.finish(true);
 const book=t.readBattleRecords();assert.equal(book.history.length,2);
 assert.equal(book.history[0].won,false);assert.equal(book.history[0].bossHP,42);
 assert.equal(book.records[0].wins,1);assert.equal(book.records[0].bestTime,306);
 assert.equal(g.mode,'dead');assert.equal(g.battleResult.won,false);
});
test('practice and debug cannot pollute records; new runs hide stale result cells',async()=>{
 const storage=new Map(),{t,el}=await loadGame({storage});complete(t,el);
 assert.equal(el('battle-results').hidden,false);
 t.start({practice:{id:'bh1',invincible:true}});assert.equal(el('battle-results').hidden,true);t.finish(true);
 t.start();t.getGame().debug=true;t.finish(true);
 assert.equal(t.readBattleRecords().history.length,1);assert.equal(t.readBattleRecords().records[0].wins,1);
});
test('record storage is bounded, ignores malformed data and survives unavailable storage',async()=>{
 const storage=new Map([[KEY,'{broken']]),{t,el,sandbox}=await loadGame({storage});
 assert.equal(t.readBattleRecords().history.length,0);
 for(let i=0;i<24;i++)complete(t,el,{time:300+i});
 assert.equal(t.readBattleRecords().history.length,20);assert.equal(t.readBattleRecords().records[0].wins,24);
 storage.set(KEY,JSON.stringify({history:[{classId:'<script>',won:true}],records:[{classId:'melee',difficulty:'death',wins:-1,bestTime:-2,fewestHits:0}]}));
 assert.equal(t.readBattleRecords().history.length,0);assert.equal(t.readBattleRecords().records.length,0);
 sandbox.localStorage.setItem=()=>{throw Error('quota');};
 const g=complete(t,el);assert.equal(g.battleResult.saved,false);assert.equal(g.mode,'won');
 assert.match(el('battle-results').innerHTML,/Не вдалося зберегти/);
 sandbox.localStorage.getItem=()=>{throw Error('denied');};
 assert.equal(t.readBattleRecords().history.length,0);
 const blocked=complete(t,el,{win:false});assert.equal(blocked.battleResult.saved,false);assert.equal(blocked.mode,'dead');
});
test('records page and finished summary refresh in both languages',async()=>{
 const {t,el}=await loadGame();complete(t,el);t.showMenu('records');
 assert.equal(t.model.panel,'records');assert.match(el('records-summary').innerHTML,/Перемог/);
 t.setLocale('en');assert.match(el('records-summary').innerHTML,/Wins/);
 assert.match(el('battle-results').innerHTML,/Healing potions/);
 t.setLocale('uk');assert.match(el('battle-results').innerHTML,/Лікувальні зілля/);
});
