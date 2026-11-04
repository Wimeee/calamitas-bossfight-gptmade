import {localeEntries,localeFragments} from '../../config/localization.js?v=29.0.1';
const KEY='utbg_locale_v1',catalog=new Map(),listeners=new Set();
const ukOverrides={"LMB: 5 swings and a throw; release to snap • RMB: parry / Big Rip":"ЛКМ: 5 змахів і кидок; відпусти для змикання • ПКМ: парирування / Великий розрив","LMB: heat-building beam • RMB: piercing Exo Shot, vents heat":"ЛКМ: промінь із нагрівом • ПКМ: пробивний екзопостріл зі скиданням нагріву","LMB: 6 Dragonfire beams • RMB: full-resonance Nova, +75 mana":"ЛКМ: 6 променів драконячого полум’я • ПКМ: Нова за повний резонанс, +75 мани","LMB: returning Celestus, double hit • RMB: recall • catches build stealth":"ЛКМ: зворотні клинки Celestus, подвійне влучання • ПКМ: відкликання • ловіння накопичує прихованість"};
const ukTerms={'SNAP':'ЗМИКАННЯ','Big Rip':'Великий розрив','Exo Shot':'Екзопостріл','Nova':'Нова','Ranger':'Стрілець','Mage':'Маг','Rogue':'Розбійник','Summoner':'Закликач','stealth':'прихованість','ON':'УВІМК','OFF':'ВИМК','DEBUG':'ДЕБАГ'};
function canonicalUk(value){return value.replace(/\b(?:SNAP|Big Rip|Exo Shot|Nova|Ranger|Mage|Rogue|Summoner|stealth|ON|OFF|DEBUG)\b/g,key=>ukTerms[key]);}
ukOverrides['and Touhou-style bullet hell.']='та пекло куль у дусі Touhou.';
for(const [uk,en]of localeEntries){const pair=catalog.get(en)||[canonicalUk(ukOverrides[en]||uk),en];catalog.set(uk,pair);catalog.set(pair[0],pair);catalog.set(en,pair);}
let language='uk';try{if(localStorage.getItem(KEY)==='en')language='en';}catch{}
const caches={uk:new Map(),en:new Map()};
const escape=s=>[...s].map(c=>'^$.*+?()[]{}|'.includes(c)||c.charCodeAt(0)===92?String.fromCharCode(92)+c:c).join('');
function compiler(locale){const pairs=new Map();for(const [uk,en]of [...localeEntries,...localeFragments]){const from=locale==='en'?uk:en,to=locale==='en'?en:(catalog.get(en)?.[0]||uk);if(!pairs.has(from))pairs.set(from,to);}if(locale==='uk')for(const [source,pair]of catalog)if(source!==pair[0]&&/[А-Яа-яІіЇїЄєҐґ]/.test(source))pairs.set(source,pair[0]);const keys=[...pairs.keys()].sort((a,b)=>b.length-a.length);const letter=/[\p{L}\p{N}_]/u;const pattern=keys.map(k=>(letter.test(k[0])?'(?<![\\p{L}\\p{N}_])':'')+escape(k)+(letter.test(k.at(-1))?'(?![\\p{L}\\p{N}_])':'')).join('|');return {pairs,regex:new RegExp(pattern,'gu')};}
const compiled={uk:compiler('uk'),en:compiler('en')};

export function getLocale(){return language;}
export function translate(value,locale=language){
 const input=String(value??''),source=input.trim(),pair=catalog.get(source);if(pair)return input.replace(source,pair[locale==='en'?1:0]);
 const cache=caches[locale]||caches.uk;if(cache.has(input))return cache.get(input);
 const c=compiled[locale]||compiled.uk;let result=input.replace(c.regex,match=>c.pairs.get(match));
 if(locale==='en')result=result.replace(/(\d[\d.,]*)\s?с(?=$|[\s)·])/g,'$1s');
 if(locale==='uk')result=result.replace(/(\d[\d.,]*)s(?=$|[\s)·])/g,'$1с');
 if(cache.size>=1000)cache.delete(cache.keys().next().value);cache.set(input,result);
 return result;
}
export function setLocale(next){if(!['uk','en'].includes(next))return false;language=next;try{localStorage.setItem(KEY,next);}catch{}for(const callback of listeners)callback(next);return true;}
export function subscribeLocale(callback){listeners.add(callback);return()=>listeners.delete(callback);}
const textValues=new WeakMap(),attributeValues=new WeakMap();let observer;
function skip(node){return !!node.parentElement?.closest?.('[data-i18n-skip],script,style,svg');}
function localizeText(node){if(skip(node))return;const value=node.data;if(!value?.trim())return;let saved=textValues.get(node);if(!saved||value!==saved.rendered)saved={source:value};const output=translate(saved.source);saved.rendered=output;textValues.set(node,saved);if(value!==output)node.data=output;}
function localizeAttributes(node){if(node.closest?.('[data-i18n-skip],script,style,svg'))return;let saved=attributeValues.get(node);if(!saved){saved={};attributeValues.set(node,saved);}for(const key of ['title','aria-label','alt','placeholder']){const value=node.getAttribute?.(key);if(!value)continue;let item=saved[key];if(!item||value!==item.rendered)item={source:value};item.rendered=translate(item.source);saved[key]=item;if(value!==item.rendered)node.setAttribute(key,item.rendered);}}
function tree(root){if(root.nodeType===3){localizeText(root);return;}if(root.nodeType!==1)return;localizeAttributes(root);const walker=document.createTreeWalker(root,1|4);let n;while((n=walker.nextNode())){if(n.nodeType===3)localizeText(n);else localizeAttributes(n);}}
const ukFlag='<svg aria-hidden="true" width="28" height="18" viewBox="0 0 28 18"><path fill="#0057b7" d="M0 0h28v9H0z"/><path fill="#ffd700" d="M0 9h28v9H0z"/></svg>';
const enFlag='<svg aria-hidden="true" width="28" height="18" viewBox="0 0 28 18"><path fill="#012169" d="M0 0h28v18H0z"/><path stroke="#fff" stroke-width="4" d="m0 0 28 18M28 0 0 18"/><path stroke="#c8102e" stroke-width="1.5" d="m0 0 28 18M28 0 0 18"/><path stroke="#fff" stroke-width="6" d="M14 0v18M0 9h28"/><path stroke="#c8102e" stroke-width="3.5" d="M14 0v18M0 9h28"/></svg>';
export function initializeLocalization(){
 if(!document.createTreeWalker||typeof MutationObserver==='undefined')return;
 const button=document.getElementById('menu-language');
 const options={subtree:true,childList:true,characterData:true,attributes:true,attributeFilter:['title','aria-label','alt','placeholder']};
 function refresh(){observer?.disconnect();document.documentElement.lang=language;if(button){button.innerHTML=(language==='uk'?ukFlag:enFlag)+'<span>'+(language==='uk'?'Українська':'English')+'</span>';button.setAttribute('aria-label',language==='uk'?'Перемкнути на англійську':'Switch to Ukrainian');button.title=language==='uk'?'Перемкнути на англійську':'Switch to Ukrainian';}tree(document.body);observer?.observe(document.body,options);}
 observer=new MutationObserver(records=>{observer.disconnect();for(const record of records){if(record.type==='characterData')localizeText(record.target);else if(record.type==='attributes')localizeAttributes(record.target);else for(const n of record.addedNodes)tree(n);}observer.observe(document.body,options);});
 button?.addEventListener('click',()=>{setLocale(language==='uk'?'en':'uk');button.blur();});subscribeLocale(refresh);refresh();
}

export function registerTranslation(uk,en){const pair=[uk,en];catalog.set(uk,pair);catalog.set(en,pair);for(const c of Object.values(caches)){c.delete(uk);c.delete(en);}}
