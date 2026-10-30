import { calamitasAudio as clips } from '../../config/calamitas-audio.js?v=22.1.0';
import { settings,subscribeSettings } from './settings.js?v=22.1.0';
import { state } from './state.js?v=22.1.0';

export function createCalamitasAudio({fetcher=(...args)=>fetch(...args)}={}){
  let context=null,bus=null,loading=null;
  const buffers=new Map(),voices=new Set(),last=new Map();
  const status={state:'idle',loaded:0,failed:0};
  function stop(tag){
    for(const voice of [...voices])if(!tag||voice.tag===tag){
      voices.delete(voice);
      try{voice.gain.gain.setTargetAtTime(0,context.currentTime,.012);voice.source.stop(context.currentTime+.05);}catch{}
    }
  }
  function sync(){
    if(bus&&context)bus.gain.setTargetAtTime(settings.sfxEnabled?settings.sfxVolume:0,context.currentTime,.02);
    if(!settings.sfxEnabled||settings.sfxVolume<=0)stop();
  }
  async function initialize(ctx,master){
    if(loading)return loading;
    context=ctx;if(!ctx||!master)return;
    bus=ctx.createGain();bus.gain.value=settings.sfxEnabled?settings.sfxVolume:0;bus.connect(master);
    status.state='loading';
    loading=Promise.all(Object.entries(clips).map(async([name,clip])=>{
      try{
        const response=await fetcher(new URL('../../assets/calamitas/'+clip.file,import.meta.url).href);
        if(!response.ok)throw Error('Missing audio');
        const bytes=await response.arrayBuffer(),buffer=await ctx.decodeAudioData(bytes);
        buffers.set(name,buffer);status.loaded++;
      }catch{status.failed++;}
    })).then(()=>{status.state=status.failed?'fallback':'ready';});
    return loading;
  }
  function play(tag,game=state.game){
    if(!context||!bus||!settings.sfxEnabled||settings.sfxVolume<=0||game?.mode!=='playing'||state.screen!=='game')return false;
    const clip=clips[tag],buffer=buffers.get(tag);if(!clip||!buffer)return false;
    const now=context.currentTime;if(now-(last.get(tag)??-Infinity)<clip.interval)return true;
    if(voices.size>=10){const oldest=voices.values().next().value;stop(oldest.tag);}
    last.set(tag,now);
    const source=context.createBufferSource(),gain=context.createGain();source.buffer=buffer;gain.gain.value=clip.gain;
    source.connect(gain);gain.connect(bus);
    const voice={tag,source,gain};voices.add(voice);
    source.onended=()=>{voices.delete(voice);source.disconnect?.();gain.disconnect?.();};
    source.start();return true;
  }
  subscribeSettings(sync);
  return {initialize,play,stop,sync,status,get activeVoices(){return voices.size;}};
}
export const calamitasSamples=createCalamitasAudio();
