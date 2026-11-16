# Input response and Firefox rendering —31.1.1

Platform movement: acceleration3400→5600, release braking4200→9000, opposing-direction force10000. Production physics240Hz measurement: opposite velocity begins166.7→58.3ms. Top speed555.552px/s and all airborne, wing, dash and damage values unchanged. Response regressions cover both directions at30/60/120/180Hz. This is a deliberate responsiveness adjustment, not a claim of literal Terraria ground acceleration.

HUD: compare translated output before replacing text nodes, skip identical width/hidden/disabled/title values and translated milestone markup. The focused watched-field test drops160writes over10identical refreshes to0; changed health and both languages still update. Refresh frequency and gameplay data unchanged.

Backdrop: cached final-resolution canvas no longer gets fractionally rescaled every frame when its backing dimensions already match within1pixel. Round only backdrop destination to backing pixels, restore the world transform and retain the general fallback. Source resolution unchanged. Actual controlled Firefox ABA source-draw CPU9.46/4.06/10.71ms. Live before/after source-draw cost approximately9–15→3–4ms/frame. Overall scene medians/tails remain noisy and long frames remain: no promise of eliminated microfreezes or physical120/180FPS. Immutable bitmap experiment was inconclusive and rejected. Raw data in benchmarks/v31.1.1-input-pacing.json.

Validation: each new behavioral test observed failing before implementation; focused movement7 and render/HUD10 passed. Final release check171modules183assets; full427tests passed0failed. Independent read-only review found no material regressions. Actual Firefox scene screenshot visually inspected with native textures and aligned camera. Edge visual automation timed out and was not used as evidence. Physical Firefox playthrough remains user verification.

Recovery branch: backup/v31.1-before-input-pacing. Existing mobile controls/classes/encounter phases preserved.
