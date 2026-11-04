import { settings, subscribeSettings } from '../core/settings.js?v=29.0.0';
import { state } from '../core/state.js?v=29.0.0';

// Minion/encounter SFX config - only real sounds from assets/calamitas/encounter/Sounds/
// Reuses the same AudioContext/gain/voice lifecycle as calamitas-audio
export const minionAudioClips=Object.freeze({
 brotherDeath:{files:['Sounds/Custom/SCalSounds/BrothersDeath1.ogg','Sounds/Custom/SCalSounds/BrothersDeath2.ogg'],gain:.55,interval:0},
 brotherHurt:{files:['Sounds/Custom/SCalSounds/BrothersHurt1.ogg','Sounds/Custom/SCalSounds/BrothersHurt2.ogg'],gain:.5,interval:.12},
 brotherSpawn:{file:'../../helper-original/RavagerDeath1.ogg',layers:['../../helper-original/RavagerDeath2.ogg'],gain:.55,pitch:-.2,interval:1},
 brotherFist:{file:'Sounds/Custom/SCalSounds/BrimstoneHellblastSound.ogg',gain:.5,interval:.03},
 brotherSlash:{file:'Sounds/Custom/SCalSounds/CatastropheResonanceSlash.ogg',gain:.5,interval:.03},
 brotherBigShot:{file:'Sounds/Custom/SCalSounds/BrimstoneShoot.ogg',gain:.65,interval:.03},
 brotherEnrage:{file:'../../helper-original/RavagerLimbLoss2.ogg',gain:.8,pitch:.3,interval:.15},
 brotherCharge:{file:'../../helper-original/RavagerPillarSummon.ogg',gain:.65,pitch:.6,interval:.1},
 brotherHeavyFist:{file:'../../helper-original/ThanatosHitOpen1.ogg',gain:.4,pitch:-.8,interval:.03},
 brotherHeavySlash:{file:'../../helper-original/MurasamaBigSwing.ogg',gain:.55,interval:.03},
 brotherRespawn:{file:'../../helper-original/RavagerLimbLoss3.ogg',gain:.75,pitch:.3,interval:.1},
 brotherDash:{file:'../../helper-original/ExobladeBeamSlash.ogg',gain:.65,interval:.03},
 brotherOrb:{files:['../../helper-original/ScorchedEarthShot1.ogg','../../helper-original/ScorchedEarthShot2.ogg','../../helper-original/ScorchedEarthShot3.ogg'],gain:.65,pitch:-.75,interval:.05},
 maelstromSpawn:{file:'../../helper-original/BrimstoneMonsterSpawn.ogg',gain:.65,interval:1},
 maelstromDrone:{file:'../../helper-original/BrimstoneMonsterDrone.ogg',gain:.65,interval:0,loop:true},
 maelstromBurn:{file:'../../helper-original/WeldingBurn.ogg',gain:1,interval:.08},
 sepulcherSpawn:{file:'Sounds/Custom/SCalSounds/SepulcherSpawn.ogg',gain:.50,interval:1},
 sepulcherDeath:{file:'Sounds/NPCKilled/SepulcherDeath.ogg',gain:.55,interval:1},
 fireblastImpact:{file:'Sounds/Custom/SCalSounds/BrimstoneFireblastImpact.ogg',gain:.4,interval:.1},
 gigablastImpact:{file:'Sounds/Custom/SCalSounds/BrimstoneGigablastImpact.ogg',gain:.5,interval:.15}
});

export function createMinionAudio({ fetcher = (...args) => fetch(...args) } = {}) {
  let context = null, bus = null, loading = null;
  const buffers = new Map(), voices = new Set(), last = new Map(), variants=new Map();
  const status = { state: 'idle', loaded: 0, failed: 0 };

  function stop(tag) {
    for (const voice of [...voices]) if (!tag || voice.tag === tag) {
      voices.delete(voice);
      try { voice.gain.gain.setTargetAtTime(0, context.currentTime, .012); voice.source.stop(context.currentTime + .05); } catch {}
    }
  }

  function sync() {
    if (bus && context) bus.gain.setTargetAtTime(settings.sfxEnabled ? settings.sfxVolume : 0, context.currentTime, .02);
    if (!settings.sfxEnabled || settings.sfxVolume <= 0) stop();
  }

  async function initialize(ctx, master) {
    if (loading) return loading;
    context = ctx; if (!ctx || !master) return;
    bus = ctx.createGain(); bus.gain.value = settings.sfxEnabled ? settings.sfxVolume : 0; bus.connect(master);
    status.state = 'loading';
    loading = Promise.all(Object.entries(minionAudioClips).map(async ([name, clip]) => {
      try {
        const decode=async file=>{const response=await fetcher(new URL('../../assets/calamitas/encounter/'+file,import.meta.url).href);if(!response.ok)throw Error('Missing audio');return ctx.decodeAudioData(await response.arrayBuffer());};
        const choices=await Promise.all((clip.files||[clip.file]).map(decode)),layers=await Promise.all((clip.layers||[]).map(decode));buffers.set(name,{choices,layers});status.loaded++;
      } catch { status.failed++; }
    })).then(() => { status.state = status.failed ? 'fallback' : 'ready'; });
    return loading;
  }

  function play(tag,game=state.game,options={}){
    const clip=minionAudioClips[tag];if(!clip)return false;
    if(!context||!bus||!settings.sfxEnabled||settings.sfxVolume<=0||game?.mode!=='playing'||state.screen!=='game'){if(clip.loop)stop(tag);return false;}
    const group=buffers.get(tag);if(!group)return false;
    const volume=clip.gain*(options.volume??1),rate=Math.pow(2,options.pitch??clip.pitch??0);
    const active=clip.loop&&[...voices].find(v=>v.tag===tag);if(active){active.gain.gain.setTargetAtTime(volume,context.currentTime,.05);if(active.source.playbackRate)active.source.playbackRate.value=rate;return true;}
    const now=context.currentTime;if(now-(last.get(tag)??-Infinity)<clip.interval)return true;last.set(tag,now);
    const selected=group.choices[(variants.get(tag)||0)%group.choices.length];variants.set(tag,(variants.get(tag)||0)+1);
    for(const buffer of [selected,...group.layers]){
      if(voices.size>=10){const oldest=[...voices].find(v=>!v.loop)||voices.values().next().value;stop(oldest.tag);}
      const source=context.createBufferSource(),gain=context.createGain();source.buffer=buffer;source.loop=!!clip.loop;gain.gain.value=volume;if(source.playbackRate)source.playbackRate.value=rate;source.connect(gain);gain.connect(bus);
      const voice={tag,source,gain,loop:!!clip.loop};voices.add(voice);source.onended=()=>{voices.delete(voice);source.disconnect?.();gain.disconnect?.();};source.start();
    }return true;
  }

  subscribeSettings(sync);
  return { initialize, play, stop, sync, status, get activeVoices() { return voices.size; } };
}

export const minionAudio = createMinionAudio();