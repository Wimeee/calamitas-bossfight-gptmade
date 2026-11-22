# Reduce Sepulcher transient allocation from the actual user trace

User v31.1.3 trace: Mage/Death/hearts,2048samples, median5.56ms,p955.6ms, one83.42ms gap. Prior callback measured0ms logic/2ms draw; cannot attribute83ms to that measured CPU. GC/GPU/browser scheduling remain hypotheses. Do not state GC is proven.

Inspection and instrumented baseline identify sustained avoidable allocation precisely in this phase:103node spreads and12arm-filter arrays per draw; additional24arm poses,96limb objects and two full snapshots per60Hz tick. At180Hz this is tens of thousands of short-lived objects/sec. Reduce that pressure without changing numerical work or rendering.

Use two reusable simulation snapshot buffers, filled in place. Renderer owns WeakMap scratch transforms/limbs, never mutates game state; reads immutable node metadata directly and scans arms by index without filter/indexOf. Recompute every interpolated transform each draw, preserving ordering, alpha, angle wrapping and arm pivots. No motion/tempo/size/collision changes.

Baseline captured exact draw-command hashes at interpolation0/.5/1 and missing snapshots; compare after refactor. Test snapshot reuse/value correctness, absence of node spreads/arm filtering and existing native source/arms/visibility/blocking contracts. Real Firefox frozen frame parity and allocation-pressure benchmark if practical. One final review; focused checks and structural check; full suite if simulation snapshot risk warrants one run. Publish31.1.4 and ask user to retest; causation still requires physical-device confirmation. Preserve2%quota floor.
