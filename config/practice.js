// Native encounter entry points. phaseN is the completed/current Bullet Hell number.
export const practicePhases=Object.freeze([
 {id:'bh1',label:'Bullet Hell I',stage:'hell',marker:'opening',hp:1,phaseN:1},
 {id:'sep1',label:'Sepulcher I',stage:'hearts',marker:'opening',hp:1,phaseN:1},
 {id:'normal1',label:'Бойова фаза I',stage:'normal',marker:'opening',hp:.99,phaseN:1},
 {id:'bh2',label:'Bullet Hell II',stage:'hell',marker:'h75',hp:.75,phaseN:2},
 {id:'bh3',label:'Bullet Hell III',stage:'hell',marker:'h50',hp:.5,phaseN:3},
 {id:'brothers',label:'Cataclysm + Catastrophe',stage:'brothers',marker:'bros',hp:.5,phaseN:3},
 {id:'normal2',label:'Бойова фаза II',stage:'normal',marker:'h40',hp:.39,phaseN:3},
 {id:'bh4',label:'Bullet Hell IV',stage:'hell',marker:'h30',hp:.3,phaseN:4},
 {id:'maelstrom',label:'Whispering Maelstrom',stage:'normal',marker:'h30',hp:.29,phaseN:4},
 {id:'seekers',label:'Soul Seekers',stage:'seekers',marker:'seek',hp:.2,phaseN:4},
 {id:'bh5',label:'Bullet Hell V',stage:'hell',marker:'h10',hp:.1,phaseN:5},
 {id:'sep2',label:'Sepulcher II',stage:'hearts',marker:'sep2',hp:.09,phaseN:5},
 {id:'desperation',label:'Останні 9% HP',stage:'normal',marker:'sep2',hp:.09,phaseN:5},
 {id:'acceptance',label:'Фінальний діалог',stage:'accept',marker:'finish',hp:1/750000,phaseN:5}
].map(phase=>Object.freeze(phase)));

export const practiceAttacks=Object.freeze([
 {index:null,label:'Усі атаки фази'},
 {index:0,label:'Віяло снарядів'},
 {index:1,label:'Черепи навпроти гравця'},
 {index:2,label:'Великі вогняні кулі'},
 {index:3,label:'Серія ривків'}
].map(attack=>Object.freeze(attack)));
