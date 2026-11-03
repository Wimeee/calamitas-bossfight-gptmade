import {state} from '../core/state.js?v=25.0.1';
import {launchBattle} from '../ui/menu.js?v=25.0.1';
import {start,togglePause} from '../game/session.js?v=25.0.1';
import {configureDebugScenario} from './scenarios.js?v=25.0.1';

const panel=document.createElement('aside');
panel.style.cssText='position:fixed;z-index:100000;top:80px;left:12px;max-width:340px;padding:10px;background:#170f1fed;color:#fff;border:1px solid #ba789c;font:13px sans-serif;border-radius:6px';
panel.innerHTML=`<details open><summary>DEBUG · швидкий тест</summary><p>Клас і складність — у звичайному меню.</p><div id="debug-actions"></div><p><label><input id="debug-god" type="checkbox" checked> Безсмертя</label> <button id="debug-pause">Пауза</button></p><output id="debug-state">Обери тест нижче</output></details>`;
document.body.append(panel);
let busy=false;
const status=panel.querySelector('output'),god=panel.querySelector('#debug-god');
for(const [id,label] of [['maelstrom','Дірка · спавн'],['brothers','Брати'],['hearts','Глист'],['normal','Calamitas'],['seekers','Seekers'],['cast-hearts','Призов глиста'],['cast-brothers','Призов братів'],['accept-first','Фінал · вперше'],['accept-rematch','Фінал · повтор'],...[1,2,3,4,5].map(n=>['bh'+n,'BH '+n])]){
 const b=document.createElement('button');b.textContent=label;b.style.cssText='margin:3px;padding:6px;cursor:pointer';
 b.addEventListener('click',async()=>{if(busy)return;busy=true;try{await launchBattle();start();configureDebugScenario(state.game,id);protect();status.textContent=label;}catch(e){status.textContent='Помилка: '+e.message;console.error(e);}finally{busy=false;}});panel.querySelector('#debug-actions').append(b);
}
function protect(){const g=state.game;if(!g)return;g.debug=true;g.player.godMode=god.checked;if(god.checked){g.player.iframes=1e9;g.player.hp=g.player.maxHp;g.player.debuffs={};}else if(g.player.iframes>1e8)g.player.iframes=0;}
god.addEventListener('change',()=>{protect();god.blur();});
panel.querySelector('#debug-pause').addEventListener('click',()=>{if(state.screen==='game'&&state.game)togglePause();});
panel.addEventListener('pointerdown',e=>e.stopPropagation());
setInterval(()=>{protect();const g=state.game;if(g&&state.screen==='game')status.textContent=`${g.mode} · ${g.stage} · HP ${Math.ceil(g.player.hp)} · куль ${g.projectiles.length}`;},100);
