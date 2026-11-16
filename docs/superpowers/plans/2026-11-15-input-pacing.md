# Microfreeze investigation and movement response

User reports recurring microfreezes and wooden controls in Firefox across classes. Prior feedback specifically identified platform walking. Delegated execution; preserve top movement speeds, wings reserve/ascent, dash, damage, enemy patterns and desktop quality.

Evidence: actual movement at240Hz takes166.7ms before full-speed platform motion even changes direction. Current ground acceleration3400 and braking4200 treat reversal like ordinary acceleration. Improve platform reaction with separate reversing force, shorter start and release, while preserving max speed and substepped collision. Proposed bounds:90% ground speed by100ms, opposite motion by70ms, release stop by80ms across30/60/120/180Hz. Keep airborne source stats unchanged unless a separate verified bug requires changes.

Investigate frame-time spikes with real isolated Firefox update/render samples, compare HUD-enabled versus skipped periodic DOM writes; instrument actual writes and CPU submission before selecting a fix. Do not promise hardware FPS or claim an unmeasured cause. Fix only confirmed unnecessary work; preserve simulation/collision inputs and visible effects.

Steps: backup branch already made; write failing movement response and hot-path regression tests; implement measured root fixes; focused movement/loop/localization checks; bounded independent review; full release checks once; compare measured before/after, publish patch and verify Pages/live version. If headless profile is inconclusive, report its limits and retain only independently proven improvements. Stop new work at<=2% remaining either quota window.
