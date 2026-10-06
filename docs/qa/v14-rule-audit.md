# v14 rule and automation audit

Reviewed against the complete local 38-page rulebook on 2026-10-06. The detailed rule sections take precedence over inconsistent repeated summaries; decisions are recorded in [rule-clarifications.md](rule-clarifications.md). Pack records expose `full`, `assisted`, or `manual` status. Assisted means the software calculates the result, but a person supplies a choice, target, location, or adjudication.

| Rule group | Implementation and remaining judgment |
| --- | --- |
| Ghoul, Investigator, Quinx creation | Builder creates starting equipment, validates 60 nonnegative integer stat points, type restrictions, Edge incompatibilities and slots; unused slots grant RCL. Presets or custom stats, starting resource fill. Chimera slot partition is GM-managed. |
| Stats and resources | Derived type bonuses, VIT, STM, Meal Score, RCL, RC Bonds, edge slots, Rage allocations, Kakuja bonuses and speed armor. Native numeric Active Effects apply before derived stats, including transferred item effects. |
| Checks | d20 + stat, modifiers, natural 1 subtraction/minimum, natural 20's single extra die; no repeated explosions. Chat records formulas/results. |
| Initiative and actions | SPD order with class tie-break, Squad two/Raid three maneuvers, speed armor extra maneuver. Start/end processing is awaited on the active GM. First-turn defense restriction, reserved reactions, Counter stance, Breather restrictions and grappling restrictions. |
| Attacks | One selected target per card; weapon/source, melee/ranged/Sidearm selection; range validation from scene distance or declared range; costs, overflow to VIT, Raid modifiers, type advantage and anti-Ghoul bonus. Walls, cover and line of sight require GM judgment. |
| Defense | Dodge, Block, Take Hit and Quinque interpose. Active GM resolves player requests, checks ownership/target identity, serializes updates and prevents duplicate application. Harsh failures, counter tiers, counter follow-up buttons, no chained counters and Raid defeat follow-up. |
| Maneuvers | Strike, Heavy Strike, Overextend, All-Out, Counter, Breather, reaction reserve, Reload, Enhance and inventory use calculate costs/results. Move logs its allowance; move tokens manually. Ready saves the trigger; GM decides when/how to execute it. Grab/Break/Throw require the GM, who resolves opposed rolls and collision distance; token positioning is manual. |
| Hunger and Rage | Threshold checks during system-driven damage/spending, daily Meal Score reduction and ten-minute Hunger damage through Foundry world time; initial/ongoing consequences, temporary stat allocation, feeding and Breather clearing. Direct resource editing is an administrative override and does not run threshold dialogs. |
| Regeneration and conditions | Distinct RC/ordinary injury pools, normal/high-speed healing, Hunger/RC suppression, Bleeding removal/damage, Burning roll/stacks, grapple restriction, timed condition expiry. Investigator High-Speed Quinque repairs the weapon, never its wielder. Generic condition markers have no invented mechanics. |
| Kagune and Quinque | Four type bonuses/ranges, manifestation/equipment, RC Bonds breakage, seven-day repair tracker, high-speed Quinque repair, Sidearm ammunition/reload and combat-end refill. Carry limits remain GM-managed. |
| Edges | Every listed Edge has a pack record. Weapon Edge drops validate category/type, incompatibilities, duplicates and capacity. Combat modifiers, regeneration, control exceptions, Sidearm and purchase costs are connected to workflows. Prehensile object use, Chimera Edge partition and custom Dynamic Edge behavior require GM judgment. |
| Gimmicks | Attack signature damage, defense automatic success cooldown, Form damage/roll benefit, Utility's two granted Edges, activation/upkeep and Kakuja free-gimmick flag. Dynamic Gimmicks require a native effect or GM adjudication. Assign the relevant active Gimmick to the equipped weapon; per-weapon associations are not enforced. |
| Medkits and grenades | Healer/Grenadier access checks, quantities, PER + target END healing and condition removal; player ally healing is GM-mediated. Frag/Incendiary/RC limiter defense cards and consequences. Select affected tokens manually. RC cloud geometry, leaving a cloud and its one-turn lingering effect require GM adjustment of the condition. |
| Kakuja | Eligibility/unlock, permanent stage bonus choices, split Chimera choices, upkeep, consecutive mastery checks, lost-control state and GM control, deactivation. Rampant bypasses mastery checks and uses its eligibility exceptions; the GM directs uncontrolled behavior. |
| Kakuja Quinque/armor | Weapon RCL/slot minima, free Gimmick flag, damage/speed armor, chosen STR or ACC, configurable chapter variant, parasitic damage after five turns, doubled Quinx Kagune costs. Dynamic Edges remain manual. |
| Progression | Consumption rewards/feeding, stat points, Kagune stat purchase/Edge swap/Chimera evolution, stored Kakuhou, rank-based forging, half-source-RCL upgrades, Gimmick purchase and source Edge swaps. Consumption cap is a GM decision; see clarifications. Rank promotion and downtime/calendar advancement are GM-managed. |
| Data compatibility | Schema migration clears obsolete persisted Kakuja bonuses and repairs older armor/Edge source data. Imports retain declared Actor/Item subtypes. Existing campaign migrations should be tried on a copy first. |

This release automates deterministic rules and provides tools for adjudicated rules. It does not claim automated token movement, area membership, narrative triggers, Dynamic abilities, or arbitrary custom rules.

## Verified build

Local Foundry **14.368**, separate disposable `tg-qa` world; the installation directory happens to be named `14.360`, so verification uses the executable's reported version. Live checks cover all sheet/document types and populated native packs, Active Effects, builder submission, action budgets, combat outcomes, conditions, healing, Raid mode, permissions, duplicate requests and separate GM/player browser clients. Screenshots were inspected at 1366 × 900 and with a 520px-wide sheet. Palette contrast tests cover normal/muted/accent text, controls and keyboard focus; this is not a full accessibility certification.

## Additional table QA

1. Create each class with a custom allocation and restricted Edge choices; invalid choices must keep the builder open.
2. Test Heavy/All-Out/Overextend, Sidearm Reload and zero-Stamina overflow in Squad and Raid.
3. Cross each Hunger/Rage threshold, assign points, feed, then Breather; advance world time one day and ten minutes.
4. Exercise Half/Full Kakuja, Chimera split choices, mastery failure and controlled/uncontrolled behavior; Quinx must never Full-Kakuja.
5. Exercise both armor chapter settings, selected damage stat, speed maneuver bonus and six turns of parasitic drain.
6. Use every grenade on mixed targets; manually adjudicate area membership, RC-cloud exit and lingering duration.
7. Forge/upgrade from stored Kakuhou at each rank; check Edge restrictions, consumed sources and stat rewards.
8. Run GM Grab/Break/Throw, then move tokens manually; declare and execute a Ready trigger at the table.
9. Import a copy of an older world; verify equipment and active effects before using it in a campaign.
