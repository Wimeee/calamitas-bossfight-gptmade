// Pinned Calamity DebuffData.Electrified:30lostregen (15HP/s), and
// AuricRebuke:200lostregen (100HP/s). ElectricUpdateNPCLifeRegen multiplies
// by4 when npc.velocity.X !=0. DoT is not a projectile hit or a critical hit.
export function updateMageDebuffs(dt,g,hosts,vulnerable){
 for(const t of hosts){
  const auric=Math.min(dt,Math.max(0,t.auricRebuke||0)),electric=Math.min(dt,Math.max(0,t.electrified||0));
  if(!auric&&!electric)continue;
  const d=t.mageDot??={carry:0,shown:0,textTime:0};
  if(auric)t.auricRebuke=Math.max(0,t.auricRebuke-dt);
  if(electric)t.electrified=Math.max(0,t.electrified-dt);
  // Timers keep running through immunity; never save up invulnerable damage.
  if(t.hp>0&&vulnerable.has(t)){
   d.carry+=(auric*100+electric*15)*(t.vx?4:1)*(t.electricDamageScale??1);
   const loss=Math.floor(d.carry+1e-8);d.carry=Math.max(0,d.carry-loss);
   if(loss>0){const hp=t.hp;t.hp=Math.max(t===g.boss?1:0,t.hp-loss);d.shown+=hp-t.hp;}
  }
  const expired=(t.auricRebuke||0)<=1e-9&&(t.electrified||0)<=1e-9;
  d.textTime+=dt;
  if(d.shown>0&&(d.textTime>=.25-1e-9||expired)){
   if(g.floaters.length<140)g.floaters.push({x:t.x,y:t.y-12,life:.6,text:String(Math.ceil(d.shown)),col:'#9affff',dot:true});
   d.shown=0;d.textTime=0;
  }
  if((t.auricRebuke||0)<=1e-9)delete t.auricRebuke;
  if((t.electrified||0)<=1e-9)delete t.electrified;
  if(expired||t.hp<=0)delete t.mageDot;
 }
}
