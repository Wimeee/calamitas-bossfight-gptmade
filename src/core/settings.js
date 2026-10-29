const STORAGE_KEY = 'utbg_settings_v1';
const defaultBindings = Object.freeze({dash:'ShiftLeft',heal:'KeyH',regen:'KeyB',pause:'KeyP',restart:'KeyR',attack:'KeyJ'});
const defaults = Object.freeze({sfxVolume:.55,musicVolume:.35,sfxEnabled:true,musicEnabled:false,quality:'high',screenShake:false,device:'auto',autoAim:true,touchScale:1,doubleTapDash:true});
const listeners = new Set();
function cleanSettings(value = {}) {
  const number = (name, fallback) => typeof value[name] === 'number' && Number.isFinite(value[name]) ? Math.max(0,Math.min(1,value[name])) : fallback;
  const bindings = {...defaultBindings};
  for (const name of Object.keys(bindings)){
    const code=value.bindings?.[name];
    if(typeof code==='string'&&/^(Key[A-Z]|ShiftLeft|ShiftRight)$/.test(code)&&!['KeyW','KeyA','KeyS','KeyD'].includes(code))bindings[name]=code;
    if(name==='dash'&&/^Mouse(Middle|Back|Forward)$/.test(code||''))bindings[name]=code;
  }
  // Space is reserved for jump/flight; old saved Space-dash bindings migrate safely.
  if(value.bindings?.dash==='Space'){
    const used=Object.entries(bindings).filter(([name])=>name!=='dash').map(([,code])=>code);
    bindings.dash=['ShiftLeft','ShiftRight','KeyG','KeyV','KeyC','KeyX','KeyZ'].find(code=>!used.includes(code));
  }
  return {
    sfxVolume:number('sfxVolume',defaults.sfxVolume),musicVolume:number('musicVolume',defaults.musicVolume),
    sfxEnabled:typeof value.sfxEnabled==='boolean'?value.sfxEnabled:defaults.sfxEnabled,
    musicEnabled:typeof value.musicEnabled==='boolean'?value.musicEnabled:defaults.musicEnabled,
    quality:['low','high','ultra'].includes(value.quality)?value.quality:defaults.quality,
    screenShake:typeof value.screenShake==='boolean'?value.screenShake:defaults.screenShake,
    device:['auto','desktop','mobile'].includes(value.device)?value.device:defaults.device,
    autoAim:typeof value.autoAim==='boolean'?value.autoAim:defaults.autoAim,
    doubleTapDash:typeof value.doubleTapDash==='boolean'?value.doubleTapDash:defaults.doubleTapDash,
    touchScale:[.9,1,1.12].includes(value.touchScale)?value.touchScale:defaults.touchScale,
    bindings
  };
}
function readSettings() {
  try { return cleanSettings(JSON.parse(localStorage.getItem(STORAGE_KEY)||'{}')); }
  catch { return cleanSettings(); }
}
const settings = readSettings();
function updateSettings(patch) {
  Object.assign(settings,cleanSettings({...settings,...patch,bindings:{...settings.bindings,...patch.bindings}}));
  try { localStorage.setItem(STORAGE_KEY,JSON.stringify(settings)); } catch {}
  for (const listener of listeners) listener(settings);
  return settings;
}
function resetSettings() { return updateSettings({...defaults,bindings:{...defaultBindings}}); }
function subscribeSettings(listener) { listeners.add(listener); return ()=>listeners.delete(listener); }
const actions = {dash:' ',heal:'h',regen:'b',pause:'p',restart:'r',attack:'j'};
function resolveGameKey(code, legacy) {
  for(const [name,binding] of Object.entries(settings.bindings)) if(binding===code)return actions[name];
  const key=legacy[code]||null;
  return Object.values(actions).includes(key)?null:key;
}
function keyLabel(code) { return ({Space:'Space',MouseMiddle:'Коліщатко',MouseBack:'Бічна 4',MouseForward:'Бічна 5'})[code]||code.replace(/^Key/,'').replace('ShiftLeft','Left Shift').replace('ShiftRight','Right Shift'); }
function controlHint(){const b=settings.bindings;return `A/D — біг · Space — стрибок / крила · S — зниження · S+Space — крізь платформу · ЛКМ — атака · ПКМ — уміння · ${settings.doubleTapDash?'A/A, D/D або ':''}${keyLabel(b.dash)} — ривок · ${keyLabel(b.heal)} — лікування · ${keyLabel(b.regen)} — реген · ${keyLabel(b.pause)} — пауза · ${keyLabel(b.restart)} — новий бій`;}
function bindKey(action,code) {
  if(!Object.hasOwn(defaultBindings,action))return false;
  if(!/^(Key[A-Z]|ShiftLeft|ShiftRight)$/.test(code)&&!(action==='dash'&&/^Mouse(Middle|Back|Forward)$/.test(code)))return false;
  if(['KeyW','KeyA','KeyS','KeyD','Space'].includes(code))return false;
  if(Object.entries(settings.bindings).some(([name,value])=>name!==action&&value===code))return false;
  updateSettings({bindings:{[action]:code}});return true;
}
function shakeOffset(game) {
  if(!settings.screenShake||!game||!game.player.hits)return {x:0,y:0};
  const age=game.t-game.player.lastHit,strength=Math.max(0,1-age/.18)*3;
  return {x:Math.sin(game.t*125)*strength,y:Math.cos(game.t*143)*strength};
}
export {settings,defaults,defaultBindings,cleanSettings,updateSettings,resetSettings,subscribeSettings,resolveGameKey,keyLabel,controlHint,bindKey,shakeOffset};
