# Photoviscerator presentation polish — v28.0.1

Source: native pinned2.2.2 C# from the Ranger audit, installed2.2.4 original art/audio, and actual decoded representative frames from the user's341frame Photoviscerator demo GIF.

- Native palette interpolation (t*8, ramp/hold), cached32bloom tints. No per-frame tint canvases or combat RNG.
- Animated tapered flowing flame particles, crystal vent sparks, native-sized160px cluster bloom with oscillating offset particles, larger light trails, alternate pulse rings, impact sparks, cluster hit rings, warmup and bounce particles. Fixed original170x66holdout grip; no invented recoil.
- Seven original OGGs, including newly integrated DeadSunShot and DeadSunRicochet. Pitch follows source PhotoTimer*.002. Switching to secondary/releasing stops only primary voice; impacts and explosions retain their tails. Native shared hit sound cooldown:16ticks fire,10ticks cluster; light uses its explosion sound.
- Events expire within1simulation second and are capped48. Lower particle counts on mobile. Damage, ammo, cadence, collisions and projectile paths unchanged.

Verification:15focused tests passed (4new presentation/audio plus7Ranger mechanics plus4existing native armor/audio tests). Real native files decoded7/7 in browser, no JS errors; desktop gallery visually inspected against the GIF. No listening test, physical-phone FPS guarantee, natural full-fight verification or pixel-identical claim. Existing generic audio behavior retained when setPitch is unused.
