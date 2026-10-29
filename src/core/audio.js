import { settings,updateSettings } from './settings.js?v=19.0.0';
import { $ } from './dom.js?v=19.0.0';

const audio={
  ctx:null,
  master:null,
  sfx:settings.sfxEnabled,
  music:settings.musicEnabled,
  volume:1,
  musicVoice:false,
  last:{},
  step:-1,
  notes:[50,50,53,48,50,55,53,48,46,46,50,43,46,53,50,48],
  supported:!!(window.AudioContext||window.webkitAudioContext),
  noise:null,
  init(){
    if(!this.supported)return false;
    if(!this.ctx){
      try{
        this.ctx=new (window.AudioContext||window.webkitAudioContext)();
        this.master=this.ctx.createGain();
        this.master.gain.value=.25*this.volume;
        this.master.connect(this.ctx.destination);
        const len=Math.floor(this.ctx.sampleRate*.55);
        const b=this.ctx.createBuffer(1,len,this.ctx.sampleRate),ch=b.getChannelData(0);
        for(let i=0;i<len;i++)ch[i]=(Math.random()*2-1)*(1-i/len);
        this.noise=b;
      }catch(e){
        this.supported=false;
        return false
      }
    }
    if(this.ctx.state==='suspended')this.ctx.resume().catch(()=>{
    });
    return true
  },
  vol(v){
    updateSettings({sfxVolume:v});
    if(this.master&&this.ctx)this.master.gain.setTargetAtTime(.25*this.volume,this.ctx.currentTime,.025)
  },
  gate(tag,interval=.04){
    if(!this.ctx||!this.sfx||this.volume<=0)return false;
    const now=this.ctx.currentTime;
    if(now-(this.last[tag]||-50)<interval)return false;
    this.last[tag]=now;
    return true
  },
  tone(f,d=.13,shape='triangle',gain=.1,slide=1,delay=0){
    if(!this.ctx||!this.master||this.volume<=0)return;
    try{
      gain*=this.musicVoice?settings.musicVolume:settings.sfxVolume;
      if(gain<=0)return;
      const t=this.ctx.currentTime+delay,osc=this.ctx.createOscillator(),env=this.ctx.createGain();
      osc.type=shape;
      osc.frequency.setValueAtTime(Math.max(40,f),t);
      if(slide!==1)osc.frequency.exponentialRampToValueAtTime(Math.max(30,f*slide),t+d);
      env.gain.setValueAtTime(.0001,t);
      env.gain.exponentialRampToValueAtTime(Math.max(.0002,gain),t+.009);
      env.gain.exponentialRampToValueAtTime(.0001,t+d);
      osc.connect(env);
      env.connect(this.master);
      osc.start(t);
      osc.stop(t+d+.012)
    }catch(e){
    }
  },
  hiss(d=.13,gain=.10,delay=0){
    if(!this.ctx||!this.noise||this.volume<=0)return;
    try{
      gain*=this.musicVoice?settings.musicVolume:settings.sfxVolume;
      if(gain<=0)return;
      let t=this.ctx.currentTime+delay,src=this.ctx.createBufferSource(),fil=this.ctx.createBiquadFilter(),env=this.ctx.createGain();
      src.buffer=this.noise;
      fil.type='highpass';
      fil.frequency.value=850;
      env.gain.setValueAtTime(.0001,t);
      env.gain.exponentialRampToValueAtTime(gain,t+.012);
      env.gain.exponentialRampToValueAtTime(.0001,t+d);
      src.connect(fil);
      fil.connect(env);
      env.connect(this.master);
      src.start(t);
      src.stop(t+d+.01)
    }catch(e){
    }
  },
  fx(name){
    if(!this.sfx||!this.ctx)return;
    switch(name){
      case 'sword':
      if(!this.gate('sword',.13))return;
      this.hiss(.115,.16);
      this.tone(390,.15,'sawtooth',.085,.42);
      break;
      case 'swordhit':
      if(!this.gate('swordhit',.10))return;
      this.tone(165,.10,'square',.14,.45);
      this.hiss(.07,.11);
      break;
      case 'shoot':
      if(!this.gate('shoot',.095))return;
      this.tone(445,.062,'square',.055,.46);
      break;
      case 'magic':
      if(!this.gate('magic',.14))return;
      this.tone(710,.14,'sine',.10,1.35);
      this.tone(470,.12,'triangle',.07,1.15);
      break;
      case 'summon':
      if(!this.gate('summon',.25))return;
      this.tone(345,.20,'triangle',.12,1.7);
      break;
      case 'rogue':
      if(!this.gate('rogue',.16))return;
      this.hiss(.11,.085);
      this.tone(625,.10,'triangle',.07,.7);
      break;
      case 'enemy':
      if(!this.gate('enemy',.31))return;
      this.tone(195,.17,'sawtooth',.065,.65);
      break;
      case 'big':
      if(!this.gate('big',.6))return;
      this.tone(96,.35,'sawtooth',.19,.35);
      this.hiss(.25,.16);
      break;
      case 'dash':
      if(!this.gate('dash',.18))return;
      this.hiss(.19,.16);
      this.tone(250,.21,'triangle',.12,2.0);
      break;
      case 'damage':
      if(!this.gate('damage',.25))return;
      this.tone(140,.33,'sawtooth',.22,.52);
      this.hiss(.13,.14);
      break;
      case 'heal':
      this.tone(440,.16,'sine',.13,1.22);
      this.tone(660,.23,'sine',.11,1.28,.11);
      break;
      case 'regen':
      this.tone(330,.20,'triangle',.10,1.3);
      this.tone(494,.26,'sine',.10,1.15,.12);
      break;
      case 'pickup':
      if(!this.gate('pickup',.12))return;
      this.tone(740,.08,'sine',.09,1.25);
      this.tone(990,.13,'sine',.08,1.15,.07);
      break;
      case 'phase':
      if(!this.gate('phase',.8))return;
      this.tone(110,.75,'sawtooth',.15,.65);
      this.tone(164.81,.65,'triangle',.11,.85,.10);
      this.hiss(.34,.09);
      break;
      case 'maelstrom':
      this.tone(73.4,.95,'sawtooth',.20,.52);
      this.tone(92.5,1.05,'triangle',.13,.71,.1);
      break;
      case 'victory':
      for(let i=0;i<4;i++)this.tone([392,494,587,784][i],.35,'triangle',.15,1,i*.18);
      break;
      case 'death':
      this.tone(160,.8,'sawtooth',.18,.32);
      break;
      case 'menu':
      this.tone(510,.075,'sine',.07,1.1);
      break;
    }
  },
  // Original, optional 16-step eerie pulse; intentionally not Calamity OST.
  tick(g){
    if(!this.music||!this.ctx||!g||g.mode!=='playing'||this.volume<=0)return;
    let step=Math.floor(g.totalTime/.24);
    if(step===this.step)return;
    this.step=step;
    let idx=step%16;
    this.musicVoice=true;
    try{
    const hz=m=>440*Math.pow(2,(m-69)/12),base=this.notes[idx];
    if(idx%2===0)this.tone(hz(base-12),.28,'triangle',.065,.87);
    if(idx%4===0)this.tone(hz(base+12),.34,'sine',.040,1.01);
    if(idx%2===1)this.hiss(.025,.028);
    if((g.stage==='hell'||g.thresholds.has('40'))&&idx%4===2)this.tone(hz(base+19),.12,'sawtooth',.026,.8);
    }finally{this.musicVoice=false;}
  },
  setSound(flag){
    this.sfx=flag;updateSettings({sfxEnabled:flag});
    $('soundtoggle').textContent=flag?'🔊 Звуки: УВІМК':'🔇 Звуки: ВИМК';
    $('soundtoggle').setAttribute('aria-pressed',String(flag));
    $('soundtoggle').classList.toggle('sound-muted',!flag)
  },
  setMusic(flag){
    this.music=flag;updateSettings({musicEnabled:flag});
    this.step=-1;
    $('musictoggle').textContent=flag?'♫ Музика: УВІМК':'♫ Музика: ВИМК';
    $('musictoggle').setAttribute('aria-pressed',String(flag));
    $('musictoggle').classList.toggle('sound-muted',!flag)
  }
};


export { audio };
