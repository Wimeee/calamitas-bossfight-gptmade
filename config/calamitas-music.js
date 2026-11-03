// Native sections from the installed CalamityModMusic 2.1 archive, unmodified.
// Phase selection: SupremeCalamitas.HandleMusicVariables, pinned 1a8cebd.
export const calamitasMusic = Object.freeze({
  title: 'Stained, Brutal Calamity',
  artist: 'DM DOKURO',
  authorUrl: 'https://dmdokuro.bandcamp.com/track/stained-brutal-calamity',
  tracks: Object.freeze(Object.fromEntries(['grief','lament','epiphany','acceptance'].map(phase=>[phase,Object.freeze({
    url:new URL('../assets/calamitas/music/'+phase+'.ogg?v=26.1.2',import.meta.url).href,
    loop:true
  })])))
});
