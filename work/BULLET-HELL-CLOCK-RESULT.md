# Bullet Hell source-clock correction / mage feedback —2026-11-04

User reported that tiny side steps trivialize Bullet Hells, and spawning feels wrong. Audited existing spawn schedules against pinned official SupremeCalamitas.cs939–1644 and BrimstoneHellblast2.cs, rather than increasing density arbitrarily.

## Actual defects fixed
- BrimstoneHellblast2 has `extraUpdates=1`: two projectile updates per60Hz world tick. The browser wrongly updated it only60times/sec. Initial native4px/update now becomes480px/sec, followed by420/360px/sec source variants. Public vx/vy represent actual world px/sec so HUD prediction, moving collisions and parry use consistent speeds.
- Native1500-update lifetime is12.5sec, not25. Fade/animation now use120Hz, including source pre-decrement opacity and60-update ending fade=.5sec. Regular Calamitas attack Hellblast keeps its separate existing60Hz acceleration/fade.
- Native40x40 projectile bounds were represented by an unrelated6.3px radius. The browser's circular collision approximation now uses20px; artwork already used the full native54x44frame. General player collision remains the existing9px center approximation, so this is not a claim of exact vanilla rectangular collisions.
- Source spawns reference player.position rather than player.Center. Both actual emissions and preview now offset by the local player's10x18half-size; native integer random ranges±1000inclusive and mirrored±500BH5 waves retained.
- Removed invented two-position afterimages from BrimstoneHellblast2; original regular attack Hellblast retains its native trail. No additional volleys, snipers or random density boosts.

Preserved five direction sequences, original emission gates, shared counters, fire/giga schedules, Maelstrom and phase duration. Corrected old tests that had explicitly asserted the half-speed210px/s or incorrect1sec retirement.

## Mage steering / asset correction
User first requested a buff, then withdrew it, then requested a nerf and reported318sec (5:18) natural fight. Final change is a modest10%local outgoing multiplier=.9 on cast snapshots, preserving native210base, criticals,4xcore/child ratios, mana and effects. This is an intentional encounter adaptation, not a canonical item stat. The earlier unshipped25%draft was replaced; it was never published.

Incorrect potion art in v27.0.0 was Terraria Item3540(a bow). Corrected to verified `ItemID.SuperManaPotion=2209` from official tModLoader ItemID documentation and converted the actual installed Item_2209.xnb. HUD now draws native dimensions without stretching. Provenance and checksum replaced, not appended with duplicate identities; regression checks exact2209source.

Initial ring sphere contact checked against BOTH official VoidVortexProj.cs and the installed2.2.4CalamityMod.dll, read-only via PEReader metadata/IL without loading/executing mod code. `doDamage` field0x04001D3E defaults false; AI sets it only under ai[2]==3/homing and time>=20; OnKill sets it for ai[2]==1/core explosion. CanDamage returns false otherwise. Thus initial ring and visible central orb do not contact-hit; only beams, core explosion and armed homing children damage. Existing behavior preserved and now directly tested. Raw installed IL kept externally in mage-source/installed-vortex-il.json.

## Verification
Three new native BH tests first failed on240vs480,30vs60updates and missing visible-edge collision; then passed. Clock/motion/animation/fade agree at30/60/120Hz.28focused mage/BH/schedule/retirement/hit/fairness checks pass. Full/visual/deployment final status recorded in external release handoff. Controlled checks are not a natural full fight or physical-phone/audio-listening verification.
