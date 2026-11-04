# Mage combat polish —2026-11-04

User: mage already exists; finish any genuine gaps. Bounded source audit found three combat defects, not a reason to redesign the class or add unidentified accessories. Existing10%local nerf,210item base, mana, potion inventory, visual art, sounds and other classes preserved.

1. VoidVortexProj.SetDefaults keeps38x38hitbox; child Projectile.scale only changes rendering. Removed erroneous scaling of19px circular collision radius against NPCs and existing worm blockers. Browser still uses its shared circular approximation, not native rectangle collisions.
2. ClimaxBeam.OnHitNPC applies vanilla Electrified90ticks, not AuricRebuke180ticks. Orb/core retains AuricRebuke. Separate timers coexist/refresh independently.
3. Electrical timers now tick through boss immunity instead of freezing until a vulnerable phase returns. No stored invulnerable damage, no DoTcrit/Rage/Adrenaline/projectile-balance multiplier. Added bounded shared NPCstatus update with source regen-loss conversion: Electrified15HP/s stationary,60HP/s when horizontalvx!=0; AuricRebuke100/400. Fractional damage accumulated, actual loss shown at most4times/sec per affectedNPC, boss floor1preserved. Paused/ritual/dead simulation does not advance timers.

Sources: official pinned1a8cebd27ec5615316b78f71973446b5528d2b78 `Projectiles/Magic/{VoidVortexProj,ClimaxBeam}.cs`, `DataStructures/DebuffData.cs` Electrified definition and ElectricUpdateNPCLifeRegen, `Buffs/DamageOverTime/AuricRebuke.cs`. Code2.2.2/art2.2.4gap remains explicit. Reads retained externally in mage-source; no full-mod extraction or new dependencies.

Verification:4new production tests failed first for shrinking hitbox, wrong beam status, frozen immune timers and wrong DoT; then22focused tests passed, including30/60/120Hz, active Rage/Adrenaline and shared-worm splash. No visual changes; no new claimed full-fight/physicalphone/audio verification. FinalCI/deployment status in external handoff.

Inherited armor-set proc/revival/defense framework and unverified accessory identities remain explicitly outside this bounded correction, as documented for the initial mage/warrior ports. This patch does not represent them as implemented.
