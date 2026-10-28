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

## Four-actor combat audit (2026-10-10)

- Medkits (PDF p. 19) heal actual missing Vitality and must also remove the healed amount from tracked wounds. Where ordinary and RC wounds coexist, healing removes RC wounds first; the PDF does not prescribe a mixed-wound allocation. This choice avoids leaving medically treated RC wounds permanently unhealable by normal regeneration. Full recovery clears both pools, including legacy wound flags.
- Regenerating Quinque (p. 17): partially damaged weapons recover END at each turn end. Treat the explicit two-turn recovery for complete destruction as a delay: zero RC Bonds remain unusable after the first turn and restore fully after the second. Ordinary seven-day repair remains GM-managed through the repair tracker.
- Defense Gimmicks (p. 20) recover after two of their wielder's turns, with separate combat identity. Their automatic margin of one uses the applicable Dodge/Block target, including a grenade's distinct Block target. Blocking restrictions still apply.
- Throw (p. 35) includes RCL when a Kagune/Quinque was used for the Grab, even without Prehensile. Prehensile extends Grab range and changes the opposed roll; it is not a prerequisite for the weapon-based Throw distance. Store the weapon used so switching equipment does not change the existing grapple.
- Automatically successful attacks against grappled targets and automatic counters cannot be evaded through Counter stance (pp. 35, 37). This resolves competing automatic-success/failure language in favor of the explicit automatic-hit outcome.
- Raid (p. 37) grants a follow-up on a new defeat, not further hits on an already defeated actor.
- Rage costs defensive reactions and separate free follow-up attacks as actions (p. 7). All-Out pays Rage once for its declared maneuver; the attacks inside that same action do not pay Rage again.
- Ending an uncontrolled Kakuja episode clears lost-control and consecutive-check state. Players cannot voluntarily end a living uncontrolled Kakuja; the GM retains control until unconsciousness (pp. 15–16). Permanent stage choices and mastered stages are preserved.

Foundry 14.368 dispatches its protected `_manageTurnEvents` lifecycle asynchronously from document updates. The system exposes its completion promise and awaits it for GM turn navigation and action/reaction resolution, avoiding condition/resource races without a fixed sleep. Turn flags now carry combat identity; optional missing flags have safe defaults and existing Actor/Item schemas remain unchanged.

## Rule completion audit (2026-10-28)

- **Raid is a player-side benefit (p. 37).** "The damage that players deal is tripled against enemies, and stamina spent for each attack is halved"; defeat follow-ups are also granted to players. Every combatant takes three maneuvers, but `npc` actors and hostile-disposition tokens attack with Squad damage and costs and earn no follow-up. Player-owned or non-hostile `character` actors keep the Raid multipliers.
- **Prehensile does not grant Grab (pp. 12, 17).** It extends Grab's range to the weapon's range and adds RCL to the opposed roll when a weapon is used. Only Grappler grants Grab and Throw; the derived `grantsManeuvers` list no longer includes Grab/Throw for Prehensile.
- **Incapacitation at 0 Vitality (p. 5).** The system applies Foundry's `unconscious` status and marks the combatant defeated; regaining Vitality removes both. Whether the character is pacified, unconscious or killed remains a GM decision, announced in chat.
- **Two Quinque on one's person (p. 16).** `equipped` Quinque count as carried. Equipping a third from the sheet is refused, and imported data exceeding the limit shows a validation warning. Stowed Quinque are storage; swapping them "in a safe area" is GM-adjudicated.
- **Dynamic Edge on Kakuja mastery (p. 15).** Mastering a stage posts a chat reminder to design the stage's Dynamic Edge with the GM. Its effect remains manual.
- **Bikaku drawback choice at creation (p. 11).** The builder now asks for the −2 stat (CRL, PER or RCL) instead of silently defaulting to CRL.
- **Yield thresholds (optional, not a rulebook rule).** `system.combat.yieldAt` only whispers the GM when Vitality falls to the value. It changes no mechanics; it supports the adventure's surrender guidance.
