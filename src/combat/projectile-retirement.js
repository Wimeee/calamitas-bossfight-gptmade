// SupremeCalamitas.DespawnProjectiles: preserve motion while shortening lifetime.
export function retireBulletHellProjectiles(g){
  for(const q of g.projectiles){
    if(!q.sourceCalamitas)continue;
    if(q.kind==='fire'||q.kind==='giga'){
      q.ai2=1; // Native OnKill suppression: no new radial barrage during cleanup.
      q.nativeLife=Math.min(15,q.nativeLife??(q.kind==='fire'?150:120),Math.ceil(q.life*60));
      q.life=q.nativeLife/60;
      // Render frames can precede the first60Hz physics tick; never retain full-opacity contact.
      q.opacity=Math.min(1,q.nativeLife/60);
    }else if(q.kind==='hellblast2'||q.kind==='skull'||q.kind==='sepulcherDart'||q.kind==='dart'){
      q.life=Math.min(q.life,1);
    }
  }
}
