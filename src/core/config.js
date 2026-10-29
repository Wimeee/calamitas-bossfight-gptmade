const W=1200;

const H=720;

const TAU=Math.PI*2;

const VIEW_X=100;

const VIEW_Y=60;

const ARENA_SCALE=Math.sqrt(1.5);

const milestones=[
  {id:'opening',label:'100%'},
  {id:'h75',label:'75%'},
  {id:'h50',label:'50%'},
  {id:'bros',label:'Брати'},
  {id:'h40',label:'40%'},
  {id:'h30',label:'🕳 30%'},
  {id:'seek',label:'20%'},
  {id:'h10',label:'10%'},
  {id:'sep2',label:'Sep. II'},
  {id:'finish',label:'Фініш'}
];

const seq=['darts','hellblast','giga2','dash4','giga2','hellblast','darts','dash2','darts','hellblast','giga4','hellblast','dash2','darts','giga4','dash4','darts','dash2','darts','dash2'];

const VERSION='17.0.0';


export { W, H, TAU, VIEW_X, VIEW_Y, ARENA_SCALE, milestones, seq, VERSION };
