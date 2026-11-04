import { calamitasMusic } from '../../config/calamitas-music.js?v=29.1.0';
import {state} from './state.js?v=29.1.0';
const unlockSilence='data:audio/wav;base64,UklGRmQBAABXQVZFZm10IBAAAAABAAEAQB8AAIA+AAACABAAZGF0YUABAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA==';

export function battleMusicPhase(game){
  if(game?.mode==='won')return 'acceptance';
  if(!game||game.mode!=='playing'||game.ritual)return null;
  // Source waits until giveUpCounter < 1160 out of 1200, not merely 1% HP.
  if(game.stage==='accept'&&(game.acceptT||0)>40/60)return 'acceptance';
  const ratio=game.boss.hp/game.boss.max;
  return ratio<=.3?'epiphany':ratio<=.5?'lament':'grief';
}

// Stream only active sections. Long OST files never become four decoded PCM buffers.
export function createBattleMusic({Audio=window.Audio,now=()=>performance.now()/1000,fadeSeconds=1.6,mobile=()=>false}={}){
  let game=null,active=null,voices=[],allowed=false,failedPhase=null;
  const mobileChannels=[];
  function primeChannels(){
    if(!mobile()||typeof Audio!=='function')return;
    while(mobileChannels.length<2){const element=new Audio(unlockSilence);element.preload='auto';mobileChannels.push({element,voice:null,primed:false,priming:false});}
    for(const entry of mobileChannels){if(entry.voice||entry.primed||entry.priming)continue;entry.priming=true;entry.element.src=unlockSilence;entry.element.volume=1;entry.element.loop=false;
      try{Promise.resolve(entry.element.play()).then(()=>{entry.primed=true;if(!entry.voice){entry.element.pause();entry.element.currentTime=0;}},()=>{}).finally(()=>{entry.priming=false;});}catch{entry.priming=false;}
    }
  }
  function acquire(track){const entry=mobile()?mobileChannels.find(c=>!c.voice):null;if(!entry)return{element:new Audio(track.url),entry:null};entry.element.src=track.url;entry.element.currentTime=0;entry.element.load?.();return{element:entry.element,entry};}
  const pauseVoice=voice=>{voice.element.pause();voice.requested=false;};
  function dispose(voice){pauseVoice(voice);voice.disposed=true;for(const [name,handler]of Object.entries(voice.handlers||{}))voice.element.removeEventListener?.(name,handler);voice.element.removeAttribute?.('src');voice.element.load?.();if(voice.entry?.voice===voice)voice.entry.voice=null;}
  function pause(){allowed=false;for(const voice of voices)pauseVoice(voice);}
  function stop(){pause();for(const voice of voices)dispose(voice);voices=[];active=null;game=null;failedPhase=null;}
  function play(voice){
    if(voice.requested||voice.blocked||voice.disposed)return;
    voice.requested=true;
    try{
      Promise.resolve(voice.element.play()).catch(()=>{if(!voice.disposed){voice.blocked=true;voice.requested=false;}});
    }catch{voice.blocked=true;voice.requested=false;}
  }
  function unlock(){
    primeChannels();
    failedPhase=null;
    for(const voice of voices){voice.blocked=false;if(allowed)play(voice);}
  }
  function ready(voice){
    if(voice.disposed||voice.ready)return;
    voice.ready=true;voice.inAt=now();
    for(const old of voices)if(old!==voice){old.outAt=voice.inAt;old.outVolume=old.element.volume;}
  }
  function failed(voice){
    if(voice.disposed||voice!==active)return;
    failedPhase=voice.phase;dispose(voice);voices=voices.filter(v=>v!==voice);active=voices[0]||null;
    if(active){delete active.outAt;active.inAt=-Infinity;}
  }
  function sync(nextGame,{enabled=false,volume=.35,screen='game'}={}){
    if(nextGame!==game){stop();game=nextGame;}
    const phase=battleMusicPhase(nextGame);
    if(!phase||!enabled||(screen!=='game'&&nextGame?.mode!=='won')||typeof Audio!=='function'){pause();return;}
    allowed=true;const time=now();
    if(active?.phase!==phase&&failedPhase!==phase){
      try{
        // At most two streams even when several HP thresholds are crossed quickly.
        for(const voice of voices)if(voice!==active)dispose(voice);
        voices=active?[active]:[];
        const track=calamitasMusic.tracks[phase],{element,entry}=acquire(track);
        element.preload='auto';element.loop=phase!=='acceptance'&&track.loop;element.volume=0;
        active={element,entry,phase,inAt:time,ready:typeof element.addEventListener!=='function',requested:false,blocked:false,disposed:false};if(entry)entry.voice=active;voices.push(active);
        const incoming=active;
        incoming.handlers={playing:()=>ready(incoming),error:()=>failed(incoming),ended:()=>{if(!incoming.disposed)incoming.ended=true;}};
        for(const [name,handler]of Object.entries(incoming.handlers))element.addEventListener?.(name,handler);
        if(active.ready)for(const voice of voices)if(voice!==active){voice.outAt=time;voice.outVolume=voice.element.volume;}
      }catch{failedPhase=phase;}
    }
    const gain=Number.isFinite(volume)?Math.max(0,Math.min(1,volume)):0;
    const duration=Math.max(.001,fadeSeconds);
    for(const voice of [...voices]){
      if(voice!==active){
        if(!active.ready){voice.element.volume=gain;play(voice);continue;}
        const fade=1-Math.min(1,Math.max(0,(time-voice.outAt)/duration));
        if(fade<=0){dispose(voice);voices=voices.filter(v=>v!==voice);continue;}
        voice.element.volume=Math.min(gain,voice.outVolume)*Math.sin(fade*Math.PI/2);
      }else voice.element.volume=voice.ready?gain*Math.sin(Math.min(1,Math.max(0,(time-voice.inAt)/duration))*Math.PI/2):0;
      if(!voice.ended)play(voice);
    }
  }
  return {sync,pause,stop,unlock,status:()=>({phase:active?.phase||null,blocked:!!active?.blocked,streams:voices.length,supported:typeof Audio==='function'})};
}

export const battleMusic=createBattleMusic({mobile:()=>state.deviceMode==='mobile'||!!window.matchMedia?.('(pointer:coarse)').matches});
