import { calamitasMusic } from '../../config/calamitas-music.js?v=25.0.1';

export function battleMusicPhase(game){
  if(!game||game.mode!=='playing'||game.ritual)return null;
  // Source waits until giveUpCounter < 1160 out of 1200, not merely 1% HP.
  if(game.stage==='accept'&&(game.acceptT||0)>40/60)return 'acceptance';
  const ratio=game.boss.hp/game.boss.max;
  return ratio<=.3?'epiphany':ratio<=.5?'lament':'grief';
}

// Stream only active sections. Long OST files never become four decoded PCM buffers.
export function createBattleMusic({Audio=window.Audio,now=()=>performance.now()/1000,fadeSeconds=.35}={}){
  let game=null,active=null,voices=[],allowed=false,failedPhase=null;
  const pauseVoice=voice=>{voice.element.pause();voice.requested=false;};
  function dispose(voice){pauseVoice(voice);voice.disposed=true;voice.element.removeAttribute?.('src');voice.element.load?.();}
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
    failedPhase=null;
    for(const voice of voices){voice.blocked=false;if(allowed)play(voice);}
  }
  function sync(nextGame,{enabled=false,volume=.35,screen='game'}={}){
    if(nextGame!==game){stop();game=nextGame;}
    const phase=battleMusicPhase(nextGame);
    if(!phase||!enabled||screen!=='game'||typeof Audio!=='function'){pause();return;}
    allowed=true;const time=now();
    if(active?.phase!==phase&&failedPhase!==phase){
      try{
        const track=calamitasMusic.tracks[phase],element=new Audio(track.url);
        element.preload='auto';element.loop=track.loop;element.volume=0;
        // At most two streams even when several HP thresholds are crossed quickly.
        for(const voice of voices)if(voice!==active)dispose(voice);
        voices=active?[active]:[];
        if(active){active.outAt=time;active.outVolume=active.element.volume;}
        active={element,phase,inAt:time,requested:false,blocked:false,disposed:false};voices.push(active);
      }catch{failedPhase=phase;}
    }
    const gain=Number.isFinite(volume)?Math.max(0,Math.min(1,volume)):0;
    const duration=Math.max(.001,fadeSeconds);
    for(const voice of [...voices]){
      if(voice!==active){
        const fade=1-Math.min(1,Math.max(0,(time-voice.outAt)/duration));
        if(fade<=0){dispose(voice);voices=voices.filter(v=>v!==voice);continue;}
        voice.element.volume=Math.min(gain,voice.outVolume)*fade;
      }else voice.element.volume=gain*Math.min(1,Math.max(0,(time-voice.inAt)/duration));
      play(voice);
    }
  }
  return {sync,pause,stop,unlock,status:()=>({phase:active?.phase||null,blocked:!!active?.blocked,streams:voices.length,supported:typeof Audio==='function'})};
}

export const battleMusic=createBattleMusic();
