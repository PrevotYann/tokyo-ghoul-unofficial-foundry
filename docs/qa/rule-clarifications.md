# Rule Clarifications

This file records rule conflicts or implementation choices discovered while comparing repository notes to the rulebook PDF.

## Meal Score Rounding

Repository notes specify Meal Score maximum as `CRL * 1.5` but do not identify a rounding mode. Phase 1 implements `Math.floor(CRL * 1.5)` with a minimum of 4, matching `RULES_ENGINE.md`.

## Hardy Incompatibility

Verified against the PDF: the detailed Edge entry conflicts with a later checklist. Use Hardy vs Preemptive, following the repository source-map precedence rule.

## Consumption RCL Gain

Repository notes state that Ghouls/Quinx gain RCL from consuming a person, but also mention a current RCL limit without restating that limit in the implementation checklist. Phase 9 implements the helper as `+1 RCL` with an explicit `rclLimit` parameter so GM-facing workflows can apply the table's chosen cap and correction.

## Kakuja armor chapter variants

The detailed equipment section (PDF pp. 21–22) uses armor RCL for damage reduction and doubles the chosen STR or ACC. The repeated section (p. 30) uses twice END and triples the chosen stat. Default to the detailed section, consistent with `RULEBOOK_SOURCE_MAP.md`; the world setting offers the repeated variant explicitly. Speed armor doubles SPD and adds one maneuver. Quinx Kagune costs remain doubled under armor.

## Grenades, Burning and medkits

Use the detailed grenade section's thrower ACC defense penalty and Burning check's stack penalty; later summaries omit these. Medkits use the user's PER plus the healed target's END.

## All-Out and rounding

All-Out's per-attack surcharge (5, or 3 with Quick Strikes) is charged in addition to ordinary weapon costs. Damage armor waives attack costs except for doubled Quinx Kagune costs. Raid halves ordinary attack costs with ceiling rounding and minimum 1 when nonzero; damage multiplies after bonuses. Counter damage above ×1 rounds up and below ×1 rounds down.

## GM boundaries

Direct sheet resource edits are administrative overrides; system actions run threshold checks. World-time automation needs Foundry time advancement. Ready trigger execution, Dynamic abilities, Chimera slot partition, carry limits, cloud area/exit and token positioning remain GM-adjudicated; see the rule audit.
