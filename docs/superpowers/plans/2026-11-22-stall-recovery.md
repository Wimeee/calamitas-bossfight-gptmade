# Render preparation and short-stall recovery

User authorized release polish, starting with remaining Firefox microfreezes and control feel. Continue inline in current clean checkout; recovery branch backup/v31.1.1-before-prewarm.

Evidence: helperTint performs getImageData for each new color during rendering and ceases caching new colors entirely after64entries. Alpha extraction depends only on source texture, not tint. Prepare one alpha mask per tinted helper image before battle; recolor from it without readback. Keep original textures, alpha formula/downsample geometry and64entry cap, use LRU insertion at capacity. Reject failed masks gracefully. Measure real Firefox readbacks and compare output pixels.

Second reproducible issue: loop clamps all frame gaps to34ms. A short80ms stall discards46ms of movement and combat time, extending perceived hesitation. Recover up to100ms via <=1/60s simulation chunks, preserve one desktop render per RAF / existing mobile60Hz presentation, stop stepping on finish. Reset timing on start and visibility changes to avoid hidden-tab catch-up. Keep native phase clocks, physics speeds and enemy damage unchanged.

1. Write production-path failing tests for post-preparation readback budget, correct tinted mask alpha, bounded tint reuse after capacity, and loop80ms recovery/finish/pause/visibility.
2. Implement helper mask preparation and LRU; verify actual Firefox same-pixel output, no synchronous readback when colors first appear.
3. Implement bounded elapsed-time recovery and fresh baselines; verify movement/time against equivalent short frames, no extra rendering or hidden-tab advancement.
4. Focused checks plus one bounded independent review; full release suite once for loop gameplay risk. Publish31.1.2 with measured limits and inspect live version. No claim of guaranteed hardware FPS. Stop new work at<=2%remaining either window.
