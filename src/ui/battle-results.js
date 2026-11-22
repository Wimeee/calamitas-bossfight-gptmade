import {readBattleRecords} from '../core/battle-records.js?v=31.1.2';
import {translate,subscribeLocale} from '../core/localization.js?v=31.1.2';
import {state} from '../core/state.js?v=31.1.2';
const names={melee:'Melee',ranger:'Ranger',mage:'Mage',summon:'Summoner',rogue:'Rogue'};
const difficulties={normal:'Expert',revenge:'Revengeance',death:'Death'};
const byId=id=>document.getElementById(id);
export function formatBattleTime(seconds){const tenths=Math.round(seconds*10);return `${Math.floor(tenths/600)}:${String(Math.floor(tenths/10)%60).padStart(2,'0')}.${tenths%10}`;}
const cell=(label,value)=>`<div class="result-stat"><span>${translate(label)}</span><strong>${value}</strong></div>`;
export function renderBattleResult(){
 const element=byId('battle-results'),r=state.game?.battleResult;
 element.hidden=!r;if(!r){element.innerHTML='';return;}
 const badge=r.eligible?(r.saved?(r.newTime||r.newHits?'Новий особистий рекорд':'Результат збережено'):'Не вдалося зберегти результат у браузері'):'Дебаг — без рекордів';
 element.innerHTML=`<p class="result-loadout">${translate(names[r.classId])} · ${difficulties[r.difficulty]}</p><div class="result-grid">`+
  cell('Час бою',formatBattleTime(r.time))+cell('Отримано влучань',r.hits)+cell('Ривків',r.dashes)+
  cell('Лікувальні зілля',r.healingUsed)+cell('Зілля регенерації',r.regenerationUsed)+cell('Залишилось HP боса',r.bossHP.toFixed(1)+'%')+
  `</div><p class="result-save">${translate(badge)}</p>`;
}
export function renderBattleRecords(){
 const {records,history}=readBattleRecords();
 byId('records-summary').innerHTML=records.length?records.map(r=>`<article class="record-card"><h3>${translate(names[r.classId])}<small>${difficulties[r.difficulty]}</small></h3><dl><div><dt>${translate('Найкращий час')}</dt><dd>${formatBattleTime(r.bestTime)}</dd></div><div><dt>${translate('Найменше влучань')}</dt><dd>${r.fewestHits}</dd></div><div><dt>${translate('Перемог')}</dt><dd>${r.wins}</dd></div></dl></article>`).join(''):`<p class="records-empty">${translate('Рекордів ще немає. Здолай Каламітас у повному бою.')}</p>`;
 byId('records-history').innerHTML=history.length?history.map(r=>`<li class="record-run"><span class="run-outcome ${r.won?'won':'dead'}">${translate(r.won?'Перемога':'Поразка')}</span><span>${translate(names[r.classId])} · ${difficulties[r.difficulty]}</span><strong>${formatBattleTime(r.time)}</strong><span>${translate('Отримано влучань')}: ${r.hits} · ${translate('Залишилось HP боса')}: ${r.bossHP.toFixed(1)}%</span></li>`).join(''):`<li class="records-empty">${translate('Завершені спроби з’являться тут.')}</li>`;
}
subscribeLocale(()=>{renderBattleResult();if(state.screen==='menu')renderBattleRecords();});
