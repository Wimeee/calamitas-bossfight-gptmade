# Ranger completion — v28.1.0

Source remains pinned CalamityModPublic1a8cebd27ec5615316b78f71973446b5528d2b78 (2.2.2), original installed art2.2.4. Added original CalamityPlayerDrawEffects source audit for backpack; no generated art/audio or whole-mod extraction.

## Corrections

- Mobile autoaim now owns continuous native primary fire; formerly the generic frame shoot call repeatedly opened/closed the holdout, losing the100tick paired lights. Empty target list stops the holdout; secondary retains priority.
- Shared photo-geometry controls gun, native arm aim, both muzzle points and body facing. Primary55/-10, auxiliary108/+6 (formerly incorrectly used the primary-10offset), holdout28 and native85x33origin. Cached by game/player/pointer identity/coordinates, frozen during pause. No new recoil or damage multiplier.
- Original38x46Photoviscerator backpack centered20px behind player and6px above center, mirrored at native scale. Source wing condition hides it for nonzero vertical velocity. It draws behind body and before front weapon, after wings. Native PNG/provenance retained.
- ExoLight's target is selected by predicted native center, from its own correct muzzle. Native120update timeout explodes at its last center before another movement step; no-destination lights retain210update life and a small expiry burst, rather than invented120update expiry. Initial collision scale includes the source.001baseline.
- Cluster physical bounces remain; only the first tile contact emits native ricochet cue/particles. NPC hits still disable tile collisions. Existing platform/floor approximation and circular NPC hitboxes remain browser adaptations; no invented arena forcefield collision.
- Pause freezes holdout geometry; death/victory hide active gun/flame presentation. Native flame stamps outside the transformed viewport are culled; particle caches and simulation RNG isolation preserved.

Raw495damage,1.5Auric modifier,44%crit, ammo, penetration, source cooldowns and encounter balance unchanged. Corrected mobile delivery and exact native projectile timing may change effective damage in scenarios that were previously broken. No natural full-fight duration claim.

## Verification

20focused tests pass, including9new source/equipment regressions and30second primary/secondary runs at30/60/120Hz with identical outcomes and bounded projectile/effect lists. Initial targeted regressions were observed failing before fixes. Original native images inspected in an actual nine-pose browser gallery (cardinals, diagonals, flight); no JS errors. Browser command-submission sampling measured low mode lower cost; these are headless submission times, not physical-phoneFPS guarantees or a listening test. Full regression372/372PASS with test concurrency4 (86.7seconds). Initial unbounded full run hit its180second timeout; bounded retry passed. Structural release check153modules165assets.
