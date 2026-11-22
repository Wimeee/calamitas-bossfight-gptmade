# Sepulcher transient allocation —31.1.4

User physical trace: Mage/Death/hearts;2048callbacks; median5.56ms,p955.6ms; one83.42ms gap with preceding measured0mslogic/2msdraw. Exact cause remains unresolved: garbage collection is a hypothesis, not established by this trace.

Removed confirmed sustained allocation in that phase:103segment spreads and12arm-filter arrays per draw,24temporary arm poses and96limb objects, plus rebuilding two full pose snapshot graphs every60Hz tick. Snapshots now retain independent head/node/arm records. Renderer WeakMap scratch holds only transforms/limbs and reads metadata directly. Rendering stays read-only; arithmetic, ordering, scale, opacity, animation, .75tempo, damage and hitboxes are preserved. No removal of effects or sprite downscaling.

Validation: new allocation tests failed before implementation. Focused11tests passed (including native arms/source/tempo/visibility). Exact786Canvas-command streams matched before/after at interpolation0/.5/1 and missing snapshots. Actual Firefox PNG frames differed in0channels for all3interpolated cases. CPU submission samples were noisy and do not prove a total speedup. Independent review found no actionable regressions. Final full440tests passed0failed; structural173modules185assets passed.

Benchmark/trace aggregate: benchmarks/v31.1.4-sepulcher-pooling.json. Original user attachment was not copied into the public repository. Recovery branch backup/v31.1.3-before-worm-pooling. Need user retest to establish whether the83ms pauses improve; frame trace remains available.
