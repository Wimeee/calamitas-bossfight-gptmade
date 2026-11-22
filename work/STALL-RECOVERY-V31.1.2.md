# Short-stall recovery and prewarmed native effects —31.1.2

Two verified issues addressed:

- Helper rendering extracted source alpha via synchronous getImageData for every new tint. Nine shared native masks and39existing native colors are now prepared before launch. Source textures and all color/alpha formulas remain unchanged. At64tints the cache now correctly evicts the LRU and retains the new entry. Native first-use Firefox test:6readbacks/64ms before,0/9ms with shared masks,0/time below timer precision with full prewarming. Output differs in0channels against the original algorithm.
- RAF dropped all elapsed time above34ms, making the game slow down after a missed frame; zero intervals also advanced16ms. It now recovers up to100ms in <=1/60s simulation steps, preserves desktop/mobile presentation policy, and stops stepping after finish. Start and visibility changes reset timing baselines. Production tests compare80ms stalls to equivalent shorter frames and cover long-gap bounds, zero/backwards intervals, pause, hidden-tab return and practice completion.

Validation: regression tests observed failing before implementation. Focused20checks passed; final full suite434passed0failed and structural check171modules183assets passed. Independent read-only review found no material issues. Real loaded Firefox smoke exercised primary+secondary and movement across all5classes with an80ms gap: finite positions, playing state,0pixel readbacks,0browser errors. This was a short scripted scene per class, not full bossfights, physical-phone QA or a guarantee of stable120/180FPS.

Raw browser measurements: benchmarks/v31.1.2-stall-recovery.json. Recovery branch: backup/v31.1.1-before-prewarm. ROADMAP now distinguishes currentv31implementation from historical plan and explicitly lists remaining manual validation.
