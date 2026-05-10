# Rule Clarifications

Use this file in the target repository at `docs/qa/rule-clarifications.md`.

Record any ambiguous, conflicting, or GM-configurable rule interpretations here.

## Known clarifications to start
### Meal Score rounding
The rulebook says Meal Score max is CRL * 1.5 with minimum 4 but does not specify rounding. Default implementation: floor the result. Add a GM setting if tables prefer round or ceil.

### Hardy incompatibility wording
The detailed Edge text says Hardy is incompatible with Preemptive. A later summary line appears to say a different incompatibility. Default implementation: Hardy is incompatible with Preemptive.

### Burning END penalty
One detailed grenade section says Burning subtracts 1 END from the roll per Burning stack; a later summary omits that. Default implementation: use the detailed version and expose `useDetailedBurningRule` setting.

### Counter cost minimum
Counter cost formula can become negative: `(SPD * 3) - PER`. Default implementation clamps resource costs to minimum 0 unless GM setting changes it.
