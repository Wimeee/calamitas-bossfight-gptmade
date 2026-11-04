import {createFrameMeter} from '../core/frame-meter.js?v=27.1.0';
import {settings,subscribeSettings} from '../core/settings.js?v=27.1.0';
import {translate,subscribeLocale} from '../core/localization.js?v=27.1.0';
import {state} from '../core/state.js?v=27.1.0';
import {$} from '../core/dom.js?v=27.1.0';
const meter=createFrameMeter();let owner=null,lastPaint=-Infinity;
export function updateFPSCounter(now){
 const game=state.game;if(game!==owner){owner=game;meter.reset();lastPaint=-Infinity;}
 const active=!!game&&game.mode==='playing'&&state.screen==='game'&&!document.hidden;
 const stats=meter.sample(now,active),element=$('fps-counter');
 if(element.hidden===settings.showFPS)element.hidden=!settings.showFPS;
 if(element.hidden||now-lastPaint<500)return;
 const number=n=>n===null?'—':String(Math.round(n));
 element.textContent=state.deviceMode==='mobile'?number(stats.fps)+' FPS':'FPS: '+number(stats.fps)+' · '+translate('Найнижчий FPS')+': '+number(stats.minFPS);lastPaint=now;
}
subscribeSettings(()=>{$('fps-counter').hidden=!settings.showFPS;lastPaint=-Infinity;});
subscribeLocale(()=>{lastPaint=-Infinity;});
// RAF can stop completely in a hidden tab, so invalidate its baseline on the
// visibility event rather than waiting for a hidden animation-frame callback.
document.addEventListener('visibilitychange',()=>{meter.sample(performance.now(),false);lastPaint=-Infinity;});
