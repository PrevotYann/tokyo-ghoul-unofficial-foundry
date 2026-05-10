# Rulebook Source Map

Use this map to verify implementation against the PDF. Page numbers are the PDF's printed page numbers.

## Pages 1-3 - Introduction and classes
- Title/version/author.
- Non-profit/unofficial context.
- World premise.
- Ghoul overview: Kakugan, Kagune, enhanced senses/physicality, skin resistance.
- Investigator overview: human anti-Ghoul force using Quinque.
- Quinx overview: human with Kakuhou transplant, one Kakugan, Kagune and Quinque.

Implementation notes:
- Actor class choices: Ghoul, Investigator, Quinx.
- Biography and faction fields.
- Do not add a dedicated Charisma stat.

## Pages 3-8 - Stats, resources, Hunger/Rage, rolls, action economy, range
- Stats: STR, ACC, RCL, PER, END, SPD, CRL.
- Derived: VIT `(END + CRL) * 3`, STM `(END + SPD) * 3`.
- Meal Score/Hunger rules.
- Rage rules.
- d20 critical failure/success rules.
- Passive and active checks.
- Two maneuvers per turn.
- Range bands: Melee, Close, Mid, Long, Far.

Implementation notes:
- RCL is source-specific.
- CRL is a base stat and is not the same as RCL.
- Hunger and Rage threshold automation is central.

## Page 9 - Ranks
- Ghoul ranks: C to SSS.
- Investigator ranks: Rank 3 to Special Class.
- Rank equivalence.

Implementation notes:
- Use ranks for display and Quinque forge values.
- Promotion logic is GM/story adjudicated.

## Pages 10-15 - Kagune, Edges, Kakuja
- Kagune types: Ukaku, Koukaku, Rinkaku, Bikaku.
- Kagune type advantage cycle.
- Kagune ranges.
- Starting edge slots and type bonuses/drawbacks.
- Kagune Evolution.
- Kagune Edges.
- Kakuja eligibility, activation, bonuses, costs, mastery, lost control.

Implementation notes:
- Edge validation and type restrictions are essential.
- Kakuja has several state fields: eligible, stage, active, mastered, mastery streak, lost control.

## Pages 15-23 - Quinque, Gimmicks, Kakuja Quinque, crafting/upgrading, Quinx
- Quinque types and ranges.
- Quinque type advantage and general anti-Ghoul bonus.
- RC Bonds and blocking with a Quinque.
- Quinque Edges.
- Gimmicks: Attack, Defense, Form, Utility, Dynamic.
- Kakuja Quinque weapons and armor.
- RCL, creating, and upgrading Quinque.
- Quinx special rules.

Implementation notes:
- Quinque are Items with RC Bonds and repair state.
- Gimmicks need active state and stamina upkeep.
- Kakuja armor has parasitic damage after five turns.
- Quinx is the most complex class: both Hunger and Rage, both weapon types, special Kakuja restrictions.

## Pages 24-30 - Edge summary list
- Repeated/condensed Edges for Ghoul and Investigator.

Implementation notes:
- Use earlier detailed sections where the summary conflicts.
- Known inconsistency to document: one summary line appears to make Hardy incompatible with Inner Peace, but detailed rules say Hardy is incompatible with Preemptive. Implement Hardy vs Preemptive and note the discrepancy in `docs/qa/rule-clarifications.md`.

## Pages 31-32 - Character building
- Four steps: class, weapons, stats, character information.
- Starting RCL values.
- Edge slot counts.
- Unused Edges add RCL.
- 60 stat points.

Implementation notes:
- Character builder should mirror this flow.
- Validation should be transparent and GM-overridable.

## Pages 33-38 - Combat and progression
- Combat styles: Squad and Raid.
- Squad initiative by SPD and tie rules.
- Maneuvers list.
- Attack formulas.
- Defense formulas and counterattack tiers.
- Raid mode bonuses.
- Progression and RC Levels.

Implementation notes:
- Combat workflow is the biggest automation area.
- Implement attack/defense as a chat-card workflow rather than one giant sheet button.
- Progression should provide assisted workflows because campaign rewards are GM-sensitive.
