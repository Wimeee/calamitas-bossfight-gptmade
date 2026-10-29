const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

async function loadGame(options = {}) {
  const noop = () => {};
  const context = new Proxy({createRadialGradient: () => ({addColorStop: noop}), measureText: () => ({width: 100})}, {get: (object, key) => object[key] || noop});
  const elements = new Map();
  function el(id) {
    if (elements.has(id)) return elements.get(id);
    const classes = new Set();
    const element = {
      id, style: {}, value: id === 'class' ? 'melee' : id === 'diff' ? 'normal' : 'desktop', dataset: {}, hidden: false, disabled: false, isConnected: true, textContent: '', innerHTML: '', listeners: {},
      classList: {add: value => classes.add(value), remove: value => classes.delete(value), contains: value => classes.has(value), toggle: (value, on) => on ? classes.add(value) : classes.delete(value)},
      addEventListener(type, listener) { (this.listeners[type] ??= []).push(listener); },
      setAttribute: noop, getContext: () => context, getBoundingClientRect: () => ({left: 0, top: 0, width: 1000, height: 600}), setPointerCapture: noop, scrollIntoView: noop,
      querySelector: selector => el(id + selector), querySelectorAll: () => []
    };
    elements.set(id, element);
    return element;
  }
  const document = {getElementById: el, querySelector: selector => el(selector.replace('#', '')), createElement: () => el('canvas' + elements.size), addEventListener: noop, body: el('body')};
  el('scal-game').querySelector = selector => el(selector.replace('#', ''));
  const window = {listeners: {}, addEventListener(type, listener) { (this.listeners[type] ??= []).push(listener); }, matchMedia: () => ({matches: false}), scrollTo: noop};
  let seed = 12345;
  const math = Object.create(Math);
  math.random = () => ((seed = (seed * 1664525 + 1013904223) >>> 0) / 4294967296);
  const sandbox = {document, window, navigator: {maxTouchPoints: 0}, localStorage: {getItem: () => null, setItem: noop}, console, requestAnimationFrame: () => 1, performance: {now: () => 1000}, setInterval: noop, URL, location: {href: 'http://localhost:8877/'}, fetch: async () => ({ok: false}), Math: math};
  vm.createContext(sandbox);
  const root = path.resolve(__dirname, '../..');
  const modules = new Map();
  function getModule(file) {
    if (modules.has(file)) return modules.get(file);
    let source = fs.readFileSync(file, 'utf8');
    if (options.isolatedCombat) {
      for (const name of ['bossAttack', 'updateMinions', 'updateExtraPatterns', 'updateMaelstrom', 'transitionHealth']) {
        if (source.includes('function ' + name + '(')) source += '\n' + name + '=()=>{};\n';
      }
    }
    const mod = new vm.SourceTextModule(source, {context: sandbox, identifier: file});
    modules.set(file, mod);
    return mod;
  }
  function linker(specifier, parent) {
    if (!specifier.startsWith('.')) throw new Error('Only relative browser imports are allowed: ' + specifier);
    const file = path.resolve(path.dirname(parent.identifier), specifier.split('?')[0]);
    if (!file.startsWith(root + path.sep)) throw new Error('Import escapes the project: ' + specifier);
    return getModule(file);
  }
  let t;
  if (options.baseline) {
    const html = fs.readFileSync(options.baseline, 'utf8');
    let code = [...html.matchAll(/<script>([\s\S]*?)<\/script>/g)][0][1];
    const at = code.lastIndexOf('})();');
    code = code.slice(0, at) + `globalThis.api={start,enter,update,draw,shoot,classAbility,releaseArk,arkAbility,fireArk,updateSword,updateBullets,updateCosmic,updateClassKit,togglePause,takeAction,setDeviceMode,configureArena,eventPos,aimCanvas,traceWeaponBeam,beamWallDistance,fireChannelWeapon,muzzlePoint,weapons,pixelArt,arena,screenToWorld,hitTarget,bulletHell,releaseExtraPattern,updateExtraPatterns,dash,heal,makeGame,getGame:()=>game,getPointer:()=>pointer,setPointer:p=>pointer={...pointer,...p},setKeys:k=>keys=k,setGame:g=>game=g,setAxis:a=>moveAxis=a};` + code.slice(at);
    vm.runInContext(code, sandbox);
    t = sandbox.api;
  } else {
    const main = getModule(path.join(root, 'src/main.js'));
    await main.link(linker);
    await main.evaluate();
    t = {};
    for (const mod of modules.values()) Object.assign(t, mod.namespace);
    const state = t.state;
    Object.assign(t, {getGame: () => state.game, getPointer: () => state.pointer, setPointer: pointer => state.pointer = {...state.pointer, ...pointer}, setKeys: keys => state.keys = keys, setGame: game => state.game = game, setAxis: axis => state.moveAxis = axis});
  }
  return {t, el, window, sandbox, modules};
}

module.exports = {loadGame};
