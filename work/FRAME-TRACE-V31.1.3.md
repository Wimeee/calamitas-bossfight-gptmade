# Diagnostic build —31.1.3

User reports microfreezes still present after prior fixes. Remaining cause is unresolved; do not claim this release fixes it. Added a local2048-slot preallocated RAF timing ring, current/previous callback CPU attribution and scene context. Pauses, menu and visibility gaps are excluded; new attempts isolate samples and clear stale selectable exports when empty. No per-frame objects, DOM, serialization, storage or upload from the recorder. No combat/renderer quality changes.

User flow: immediately after a stutter, Menu→Settings→Copy stutter report, paste into chat. Clipboard denial/unavailability shows selected text for manual copying. Report preserves25worst intervals in the retained window. It cannot prove GPU/GC causation; metadata reflects export settings. Physical-device report is necessary next evidence.

Validation: initial4test contracts observed failing while functionality absent; final full438tests passed0failed, plus focused4after final stale-export clearing. Structural173modules185assets passed. Independent read-only review found no important issues. Actual isolated Firefox capture and clipboard fallback succeeded, button visible,0JS errors, game state unchanged. Recorder-only100000calls12ms; not whole-instrumentation or user-display FPS. Browser result captured before version bump and retained honestly as31.1.2 in benchmarks/v31.1.3-frame-trace.json.

Recovery branch backup/v31.1.2-before-frame-trace. Still need user's actual trace before another performance fix.
