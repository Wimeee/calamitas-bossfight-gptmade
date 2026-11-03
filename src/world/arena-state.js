import { arena } from '../core/arena.js?v=26.0.5';
// SupremeCalamitas.GetArenaSize: Vector4 is up/right/down/left, in native pixels.
export function arenaTarget(g){
 let up=g.difficulty==='death'?1000:1250,right=up,down=up,left=up;
 if(g.stage==='accept'){up=400;right=left=500;down=73;}
 else if(!g.castDelayState&&g.hearts?.some(h=>h.hp>0)){right*=1.15;left*=1.15;down*=g.phaseN>=5 ? .75 : .25;}
 else if(g.seekers?.some(h=>h.hp>0)){up*=1.5;down*=1.5;right*=.85;left*=.85;}
 else if(g.brothers?.some(h=>h.hp>0)){up*=.85;down*=.85;right*=1.33;left*=1.33;}
 return {l:500-left,r:500+right,t:300-up,b:300+down};
}
export const arenaColors=['#dc143c','#4169e1','#db4b02','#808080'];
export function arenaPhase(g){return g.stage==='accept'&&g.acceptT>=40/60?3:g.boss?.hp/g.boss?.max<=.3?2:g.boss?.hp/g.boss?.max<=.5?1:0;}
export function resetArenaState(g,opening=false){Object.assign(arena,arenaTarget(g));g.arenaState={phase:0,previous:0,colorMix:1,opening};}
export function updateArenaState(g,dt){
 if(g.mode!=='playing')return;
 if(!g.arenaState)resetArenaState(g);
 if(g.arenaState.opening){g.arenaState.opening=false;const initial=arenaTarget(g);for(const k of ['l','r'])arena[k]=500+(initial[k]-500)*2;for(const k of ['t','b'])arena[k]=300+(initial[k]-300)*2;}
 const particles=g.arenaDebris||[];g.arenaDebris=particles.filter(p=>(p.life-=dt)>0);
 for(const p of g.arenaDebris){p.vy+=300*dt;p.x+=p.vx*dt;p.y+=p.vy*dt;p.rotation+=p.spin*dt;}
 const a=g.arenaState,target=arenaTarget(g),rate=g.stage==='accept'?.02:g.phaseN>=4?.05:.1,f=1-Math.pow(1-rate,Math.max(0,dt)*60);
 for(const k of ['l','r','t','b'])arena[k]+=(target[k]-arena[k])*f;
 const phase=arenaPhase(g);if(phase!==a.phase){a.previous=a.phase;a.phase=phase;a.colorMix=0;}
 a.colorMix=Math.min(1,a.colorMix+dt*.18);
}
export function heartTendrilAnchors(h,index=0){
 // Stable visual seed, separate from combat RNG. Anchors follow the actual ceiling.
 const span=arena.r-arena.l,offset=75+(index*83%176),xs=[h.x-offset,h.x+offset];
 if(index%2===0)xs.push(h.x+((index*157%631)-315));
 return xs.map(x=>({x:Math.max(arena.l+span*.02,Math.min(arena.r-span*.02,x)),y:arena.t}));
}

export function breakHeartTendrils(g,heart){
 if(heart.tendrilsBroken)return;heart.tendrilsBroken=true;const index=heart.tendrilIndex||0;
 g.arenaDebris??=[];
 for(let i=0;i<2;i++)g.arenaDebris.push({x:heart.x,y:heart.y,vx:(i?1:-1)*(35+index*3),vy:-90-i*35,rotation:0,spin:i?1:-1,life:3,kind:'heartGore'+(i+1)});
 for(const a of heartTendrilAnchors(heart,index))for(let i=1;i<=9;i++){const f=i/10;g.arenaDebris.push({x:a.x+(heart.x-a.x)*f,y:a.y+(heart.y-a.y)*f,vx:Math.sin(i+index)*30,vy:15,rotation:0,spin:0,life:.5+i*.05});}
 g.arenaDebris=g.arenaDebris.slice(-320);
}
