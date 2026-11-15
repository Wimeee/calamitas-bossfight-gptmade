# Death source audit —2026-11-15

Audited the existing implementation after practice31.0.0 against pinned CalamityModPublic1a8cebd27ec5615316b78f71973446b5528d2b78. Source reports2.2.2, installed artwork2.2.4. This is a scoped encounter audit, not a claim of complete tModLoader equivalence.

Confirmed implemented differences

- Native arena half-extents1250→1000 and Death heart diagonals.
- Brothers empower below60% rather than40%, opening delay uses1.5ticks/frame rather than1.
- Death-only heavy attacks in the native brother sequence.
- Opposite brother resurrects once, with the native subsequent65%HP cap.
- Fireblast16rather than14darts; Gigablast36rather than32.
- Catastrophe non-dash trail fuse35rather than45ticks.
- Correct Time++ ordering: heavy trails begin with variant4, fuse endpoints align, accelerating slash speeds up from native update31.
- Death inherits Revengeance bullet-hell cadence; the pinned source does not justify arbitrary additional Calamitas attacks for Death.

The initial suspected off-by-one in Catastrophe was disproved by production tests. Its clock already increments before the branch. No runtime behavior was changed during this audit. Four additional source contracts cover trail synchronization, acceleration, naturally emitted heavy attacks, and resurrection without manually injecting the solo flag.

Existing deliberate browser adaptations remain explicit: incoming damage scales1/1.09/1.22, local helper health/outgoing class tuning, circular collision approximations, approved Sepulcher0.75movement tempo and the browser movement system. No arbitrary new difficulty multipliers were introduced.

Primary files reviewed

- SupremeCalamitas.cs, SupremeCataclysm.cs, SupremeCatastrophe.cs.
- SupremeCatastropheSlash.cs, SupremeCataclysmFist.cs.
- SCalBrimstoneFireblast.cs, SCalBrimstoneGigablast.cs.
- SepulcherHead.cs, SoulSeekerSupreme.cs.
