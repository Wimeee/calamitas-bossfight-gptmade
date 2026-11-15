# Results and records —31.1.0

Completed-fight overlay now shows the existing fight clock, accepted-hit count, dashes, healing/regeneration potions consumed, and ending boss health. An immutable snapshot and finish guard prevent duplicate completion or later state changes from rewriting a result.

Records menu keeps independent victory counts, fastest victory and fewest-hit victory for each of the five classes and three difficulties, plus the last20 completed attempts. Records remain in this browser; previous fights cannot be reconstructed retroactively. Practice and debug runs never enter the ledger. Existing victory/unlock storage stays independent. Reads validate and bound the data; denied/full browser storage does not interrupt the ending and produces an explicit warning.

No combat balance, movement, phase clock, music or frame-loop work changed. Existing totalTime semantics retained. Browser-save processing runs only on completion/menu navigation. UK/EN refresh works for an already visible result and records page.

Validation: new production-path tests failed before implementation, then focused16 passed. Final full suite423 passed,0 failed; structural check171 modules183 assets passed. Read-only review found no blockers; added its suggested denied-read case. Actual headless Edge screenshots inspected at1440x900 and900x520, English/Ukrainian, retry button accessible and no page overflow/JS errors. These are controlled result fixtures, not a full-fight, physical phone or Firefox performance claim.

Recovery branch backup/v31-before-results retains the previous release.
