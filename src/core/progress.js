const KEY='utbg_calamitas_victory_v1';
export function hasDefeatedCalamitas(){try{return localStorage.getItem(KEY)==='1';}catch{return false;}}
export function rememberCalamitasVictory(g){if(g.debug)return;try{localStorage.setItem(KEY,'1');}catch{/* Private storage may be unavailable; the fight still finishes. */}}
