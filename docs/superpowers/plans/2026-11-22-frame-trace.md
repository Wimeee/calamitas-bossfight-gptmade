# Capture actual user microfreezes

Previous measured fixes did not resolve the user's physical Firefox microfreezes. Stop guessing at another renderer fix. Add bounded in-memory per-callback timings around real update/draw and callback start delay. Capture raw RAF interval, previous callback CPU work, current work, paint/skip, phase, class and scene counts. These do not identify GPU stalls or GC by themselves; make limits explicit in report.

Use a preallocated2048-slot numeric ring with stage string references; no per-frame objects, DOM, storage, JSON or network. Pause/menu/hidden gaps break timing continuity but retain samples. A new fight cannot export the previous attempt. Export only on a user click from settings, copying a compact report with browser/version/quality/backing dimensions and25worst intervals. Show selectable text if Clipboard API is unavailable/denied. Local only, no automatic sending or saving.

Tests first: previous-frame attribution, bounded storage, pause boundaries, reset/restart, real loop collection without game mutation, clipboard fallback and both languages. Instrument and test focused lifecycle/performance checks; inspect actual Firefox report. One bounded final review. Publish31.1.3 only as diagnostic build; request the user's trace before claiming remaining microfreezes fixed. Keep2%quota floor.
