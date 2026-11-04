import {getLocale} from '../core/localization.js?v=29.1.0';
const lerp=(a,b,x)=>Math.max(0,Math.min(1,(x-a)/(b-a)));
export function infernumIntroText(){return getLocale()==='uk'?'Відьма багряного полум’я\nКаламітас':'The Brimstone Witch\nCalamitas';}
export function infernumIntroState(seconds,title=infernumIntroText()){
 const completion=Math.max(0,Math.min(1,seconds/5)),reveal=lerp(.4,.92,completion),index=Math.floor(reveal*title.length),split=title.indexOf('\n');
 const letters=reveal<=0?0:index>=split?title.length:index;
 const afterimage=lerp(1,.45,completion);
 return{completion,letters,opacity:lerp(.4,.45,completion)*lerp(1,.77,completion),cover:lerp(0,.5,completion)*lerp(1,.84,completion),afterimage:afterimage*afterimage*.3,spread:(1-afterimage)*30};
}
