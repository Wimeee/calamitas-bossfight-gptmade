import { calamitasAudio as clips } from '../../config/calamitas-audio.js?v=28.1.0';
import { meleeAudio as meleeClips } from '../../config/calamitas-audio.js?v=28.1.0';
import {rangerAudio} from '../../config/ranger-audio.js?v=28.1.0';
import {mageAudio} from '../../config/mage-audio.js?v=28.1.0';
import { settings,subscribeSettings } from './settings.js?v=28.1.0';
import { state } from './state.js?v=28.1.0';

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

// Melee audio (Ark of the Cosmos)
export function createMeleeAudio({fetcher=(...args)=>fetch(...args),clips=meleeClips,directory='melee-original'}={}){
  let context=null,bus=null,loading=null;
  const buffers=new Map(),voices=new Set(),last=new Map(),variants=new Map(),pitches=new Map();
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
        const group=await Promise.all((clip.files||[clip.file]).map(async file=>{
          const response=await fetcher(new URL('../../assets/'+directory+'/'+file,import.meta.url).href);
          if(!response.ok)throw Error('Missing audio');
          return ctx.decodeAudioData(await response.arrayBuffer());
        }));
        group.layers=await Promise.all((clip.layers||[]).map(async file=>{
          const response=await fetcher(new URL('../../assets/'+directory+'/'+file,import.meta.url).href);
          if(!response.ok)throw Error('Missingaudio');return ctx.decodeAudioData(await response.arrayBuffer());
        }));
        buffers.set(name,group);status.loaded++;
      }catch{status.failed++;}
    })).then(()=>{status.state=status.failed?'fallback':'ready';});
    return loading;
  }
  function play(tag,game=state.game){
    if(!context||!bus||!settings.sfxEnabled||settings.sfxVolume<=0||game?.mode!=='playing'||state.screen!=='game')return false;
    const clip=clips[tag],group=buffers.get(tag);if(!clip||!group?.length)return false;
    const now=context.currentTime;if(now-(last.get(tag)??-Infinity)<clip.interval)return true;
    if(voices.size>=10){const oldest=voices.values().next().value;stop(oldest.tag);}
    last.set(tag,now);
    const selected=group[(variants.get(tag)||0)%group.length];variants.set(tag,(variants.get(tag)||0)+1);
    for(const buffer of [selected,...(group.layers||[])]){
      const source=context.createBufferSource(),gain=context.createGain();source.buffer=buffer;gain.gain.value=clip.gain;
      if(source.playbackRate)source.playbackRate.value=Math.pow(2,pitches.get(tag)??clip.pitch??0);
      source.connect(gain);gain.connect(bus);
      const voice={tag,source,gain};voices.add(voice);
      source.onended=()=>{voices.delete(voice);source.disconnect?.();gain.disconnect?.();};
      source.start();
    }
    return true;
  }
  subscribeSettings(sync);
  function setPitch(tag,pitch){
    pitches.set(tag,pitch);for(const v of voices)if(v.tag===tag&&v.source.playbackRate){const rate=Math.pow(2,pitch);if(v.source.playbackRate.setTargetAtTime)v.source.playbackRate.setTargetAtTime(rate,context.currentTime,.015);else v.source.playbackRate.value=rate;}
  }
  return {initialize,play,stop,setPitch,sync,status,get activeVoices(){return voices.size;}};
}
export const meleeSamples=createMeleeAudio();

export const mageSamples=createMeleeAudio({clips:mageAudio,directory:'mage-original'});

export const rangerSamples=createMeleeAudio({clips:rangerAudio,directory:'ranger-original'});
