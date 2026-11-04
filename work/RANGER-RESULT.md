# Native Ranger / Photoviscerator

Original C# audited at CalamityModPublic commit1a8cebd27ec5615316b78f71973446b5528d2b78 (2.2.2). Installed original artwork/audio is2.2.4; this revision gap is intentional and recorded in assets/ranger-original/provenance.json.

- Native ranged Auric Tesla helmet and common Auric body, Wings of Rebirth and Asgardian Aegis.
- Base495damage, armor+50%damage and44%crit. Gel9999 encounter loadout. No invented heat, overheat or railgun.
- Held primary: finite1440px penetrating fire, native6tick shared NPC immunity. Native180updates collapsed into120Hz swept segments without tunnelling; source endpoint and travel duration retained. Two ExoLight projectiles every100firing ticks, source approach/orbit paths and burst.
- Secondary:70%damage homing cluster,25tick cadence,5penetration and22update perNPC immunity.120Hz native movement. Native platform/floor bounce before first hit.
- Miracle Blight:1500typeless HP/s; timers age through immunity without banked damage or moving-electrified multiplier.
- Source90tick PhotoTimer on release; no permanent weapon lock. Source secondary holdout duration25ticks. Secondary input takes priority when both held so mobile aiming plus secondary button works.
- Native170x66 holdout/glow, SmallBloom/BloomCircle particle art, original16x14Gel and5original OGG samples. Palette textures cached; bounded particles and lower mobile stamp budget. No generated images or audio.

Browser adaptations: existing circular NPC hitboxes, existing platforms in place of Terraria solid tiles; sampled additive native particles rather than full Terraria particle engine; existing shared armor defense/set-proc framework. Do not describe this as pixel-identical or a complete tModLoader port.

Verification:7new production-controller tests cover repeated damage, clocks30/60/120Hz, ammo, source cadence, held-secondary priority, worm front/rear absorption, phase/release/pause and Miracle Blight. Existing ranged fixtures changed from the removed railgun to native projectiles; generic beam geometry tests remain. Actual local browser gallery loaded5/5native sounds without errors, and representative frames decoded from the supplied341frame GIF. No physical-phone FPS, audio listening or natural full-fight claim.
