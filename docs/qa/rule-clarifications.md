# Rule Clarifications

This file records rule conflicts or implementation choices discovered while comparing repository notes to the rulebook PDF.

## Meal Score Rounding

Repository notes specify Meal Score maximum as `CRL * 1.5` but do not identify a rounding mode. Phase 1 implements `Math.floor(CRL * 1.5)` with a minimum of 4, matching `RULES_ENGINE.md`.

## Hardy Incompatibility

`RULEBOOK_SOURCE_MAP.md` flags a checklist inconsistency: one summary line appears to make Hardy incompatible with Inner Peace, while the detailed rule says Hardy is incompatible with Preemptive. Implementation should use Hardy vs Preemptive unless PDF verification later changes this.
