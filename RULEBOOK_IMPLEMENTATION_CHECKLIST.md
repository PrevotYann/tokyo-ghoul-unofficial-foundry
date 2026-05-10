# Rulebook Implementation Checklist

Use this checklist to track completeness. Do not mark an item complete unless it has a data entry, UI support, and either automation or clear GM/manual workflow.

Legend:
- `[AUTO]` fully automated.
- `[ASSIST]` chat/UI assists but GM confirms.
- `[MANUAL]` stored and displayed; GM adjudicates.
- `[TODO]` not implemented.

## Source and system basics
- [ ] Rulebook metadata recorded: Unofficial Tokyo Ghoul Tabletop RPG, Version 1.0.1, Open Beta, written by Juliette Romano.
- [ ] Legal/non-profit/unofficial notice in README and system description.
- [ ] d20 roll system with natural 1 and natural 20 handling. `[AUTO]`
- [ ] Passive target number checks. `[AUTO]`
- [ ] Contested checks. `[AUTO]`
- [ ] Two maneuvers per Squad turn. `[AUTO]`
- [ ] Three maneuvers per Raid turn. `[AUTO]`
- [ ] Reaction maneuver reservation. `[AUTO/ASSIST]`
- [ ] Range bands and movement. `[ASSIST]`
- [ ] No Charisma/social stat; biography/social roleplay fields only. `[AUTO]`

## Classes
- [ ] Ghoul class.
- [ ] Investigator class.
- [ ] Quinx class.
- [ ] Quinx counts as Investigator where rules distinguish Ghoul vs Investigator.
- [ ] Quinx has Kagune and Quinque.
- [ ] Quinx tracks Hunger and Rage.
- [ ] Quinx has separate Kagune RCL and Quinque RCL.
- [ ] Quinx cannot become Full Kakuja.

## Stats and derived stats
- [ ] STR.
- [ ] ACC.
- [ ] PER.
- [ ] END.
- [ ] SPD.
- [ ] CRL.
- [ ] RCL as source-specific value.
- [ ] Starting 60 stat points validation.
- [ ] Vitality `(END + CRL) * 3`.
- [ ] Stamina `(END + SPD) * 3`.
- [ ] Meal Score max `max(CRL * 1.5, 4)`.
- [ ] Current resources clamp to max after changes.
- [ ] Temporary stat points from Rage/Hunger/Kakuja.
- [ ] Type effects on derived stats.

## Ranks
- [ ] Ghoul ranks: C, B, A, S, SS, SSS.
- [ ] Investigator ranks: Rank 3, Rank 2, Rank 1, First Class, Associate Special Class, Special Class.
- [ ] Rank equivalence display.
- [ ] Rank-based Quinque forge RCL.

## Kagune types
- [ ] Ukaku data, bonuses, drawbacks, range.
- [ ] Koukaku data, bonuses, drawbacks, range.
- [ ] Rinkaku data, bonuses, drawbacks, range.
- [ ] Bikaku data, bonuses, drawbacks, range.
- [ ] Type advantage cycle and bonuses.
- [ ] Kagune manifest/withdraw at will with no cost.
- [ ] Chimera dual Kagune support.

## Kagune Edges
- [ ] High-Speed Regeneration - Rinkaku only, replaces Ghoul Regeneration, creation/evolution restrictions.
- [ ] Ghoul Regeneration - free for Ghouls/Quinx, does not occupy slot.
- [ ] Prehensile - not Ukaku, range for Grab.
- [ ] Massive - range extension, infinite Ukaku projectiles.
- [ ] Sharpened - applies Bleeding, incompatible with Blunt.
- [ ] Blunt - extra half END damage, incompatible with Sharpened.
- [ ] Inner Peace - auto-pass CRL, no Kakuja, incompatible with Rampant/Chimera.
- [ ] Rampant - auto-fail CRL, Hunger changes, Kakuja mastery restriction, incompatible with Inner Peace.
- [ ] Grappler - grants Grab and Throw.
- [ ] Preemptive - not Koukaku, +3 Dodge, incompatible with Hardy.
- [ ] Hardy - not Ukaku, +3 Block, incompatible with Preemptive.
- [ ] Quick Strikes - All-Out multiplier 3 and SPD damage bonus, incompatible with Heavy Strikes.
- [ ] Breathing Exercises - not Rinkaku, Take Breather restores END * 2.
- [ ] Heavy Strikes - grants Heavy Strike, incompatible with Quick Strikes.
- [ ] Cannibalistic - Ghoul only, Ghoul meal restores 100%, can gain Kakuja.
- [ ] Chimera - Ghoul only, creation or evolution, dual Kagune, CRL cap, Kakuja split bonuses, incompatible with Inner Peace.
- [ ] Dynamic Edge - custom, repeatable, GM adjudicated.

## Kakuja
- [ ] Half-Kakuja eligibility.
- [ ] Full Kakuja eligibility.
- [ ] Kakuja activation via Enhance.
- [ ] Half-Kakuja unmastered stamina drain.
- [ ] Full Kakuja unmastered and mastered drains.
- [ ] Stat bonus selection locked per Kakuja.
- [ ] Kakuja-only Edges per stage.
- [ ] Dynamic Edge on mastery.
- [ ] Mastery roll sequence in combat and out of combat.
- [ ] Hunger CRL rolls count toward mastery.
- [ ] Loss of control GM workflow.
- [ ] Chimera Kakuja split bonuses.

## Quinque
- [ ] Ukaku Quinque data and range.
- [ ] Koukaku Quinque data and range.
- [ ] Rinkaku Quinque data and range.
- [ ] Bikaku Quinque data and range.
- [ ] Investigator can carry max two Quinque on person.
- [ ] Storage list for inactive Quinque.
- [ ] Type advantage and general anti-Ghoul bonus.
- [ ] RC Bonds max/value/broken state.
- [ ] Quinque interpose block workflow.
- [ ] One-week repair tracking.

## Quinque Edges
- [ ] High-Speed Regeneration - Rinkaku, self-repair, half RC Bonds.
- [ ] Sidearm - Q bullet firearm, ammo type, ammo count, reload action, ACC damage only.
- [ ] Prehensile.
- [ ] Massive.
- [ ] Sharpened.
- [ ] Blunt.
- [ ] Inner Peace - no Rage.
- [ ] Rampant - Rage auto-fail and reduced costs.
- [ ] Grappler.
- [ ] Preemptive.
- [ ] Hardy.
- [ ] Quick Strikes.
- [ ] Lightweight - not Koukaku, SPD for melee damage/cost, incompatible with Heavy Strikes.
- [ ] Heavy Strikes - grants discounted Heavy Strike, incompatible with Quick Strikes/Lightweight.
- [ ] Cannibalistic - RCL x1.5.
- [ ] Chimera - two-in-one Quinque with secondary type and edge split.
- [ ] Natural Predator - type advantage +4 instead of +2.
- [ ] Healer - 2 slots, 5 medkits, remove Bleeding/Burning, heal PER + target END.
- [ ] Grenadier - 10 grenades, frag/incendiary/RC limiter.
- [ ] Gimmick - create gimmick according to gimmick rules.

## Gimmicks
- [ ] Enhance activates/deactivates gimmick.
- [ ] Ongoing cost = higher of END or SPD unless special case.
- [ ] Attack Type - signature attack using RCL + chosen stat.
- [ ] Defense Type - every other turn auto-pass Dodge or Block by 1.
- [ ] Form Type - alternate form, choose attack roll bonus equal PER or doubled damage stat.
- [ ] Utility Type - two extra Edges while active, stamina cost tripled.
- [ ] Dynamic Type - custom Dynamic Edge effect.

## Kakuja Quinque
- [ ] Kakuja weapon edge slots doubled.
- [ ] Free Dynamic Edge or free no-cost gimmick.
- [ ] Kakuja armor as manifestable Quinque-like armor.
- [ ] Armor reduces all damage by armor RCL.
- [ ] After five turns, parasitic damage = half armor RCL + half weapon RCL, not reduced by armor.
- [ ] Speed Type armor doubles SPD and grants extra maneuver.
- [ ] Attack Type armor doubles STR or ACC for damage and removes stamina costs for damage maneuvers.
- [ ] Quinx can use Kagune under Kakuja armor but Kagune maneuver stamina costs are doubled.

## Grenades and consumables
- [ ] Frag grenade: Mid throw, close-area, Dodge TN 15, Koukaku Block TN 16, others fail block, damage ACC * 3, Dodge/Block result reduced by thrower's ACC.
- [ ] Incendiary grenade: Mid throw, close-area, Dodge TN 14, cannot be blocked, applies Burning.
- [ ] RC Limiter grenade: Mid throw, close-area cloud for three thrower turns, suppresses Kagune/Kakuja/regeneration, lingers one turn after leaving, attacks into/out of cloud penalized by attacker's ACC.
- [ ] Medkit: up to 5 with Healer, removes Bleeding/Burning, heals PER + target END.
- [ ] Q bullets: type variants and reload.

## Combat maneuvers
- [ ] Strike.
- [ ] Move.
- [ ] Ready.
- [ ] Take a Breather.
- [ ] All-Out Offensive.
- [ ] Counter.
- [ ] Enhance.
- [ ] Overextend.
- [ ] Grab.
- [ ] Throw.
- [ ] Heavy Strike.
- [ ] Dodge.
- [ ] Block.
- [ ] Take Hit.

## Attacking and defending
- [ ] Attack roll formula adds PER.
- [ ] Basic melee/ranged damage.
- [ ] Kagune melee/ranged damage and cost.
- [ ] Quinque melee/ranged damage and cost.
- [ ] Sidearm/Q bullet handling.
- [ ] Failed Dodge full damage + half damage to Stamina.
- [ ] Failed Block 1.5x damage.
- [ ] Successful defense counterattack tiers.
- [ ] Optional setting to disable harsh consequences.

## Hunger/Rage
- [ ] Meal Score daily decrease.
- [ ] Meal restoration options.
- [ ] Threshold tracking at 50/25/10.
- [ ] Hunger CRL roll against missing Meal Score or missing Stamina.
- [ ] Hunger failure damage and ongoing damage.
- [ ] Regeneration suppressed by Hunger.
- [ ] Rage threshold tracking at 50/25/10 Vitality.
- [ ] Rage CRL roll against missing Vitality.
- [ ] Rage temp stat budget.
- [ ] Rage stamina costs and Take Breather ending.
- [ ] Voluntary Rage.

## Progression and crafting
- [ ] Ghoul consuming rewards stat points equal target highest RCL.
- [ ] Ghoul/Quinx consumption RCL gain.
- [ ] Investigator Kakuhou storage.
- [ ] Quinque upgrade RCL by half slain Ghoul RCL.
- [ ] Edge swap using source Ghoul edges.
- [ ] Gimmick add by reducing RCL by 20.
- [ ] New Quinque forge by Ghoul rank.
- [ ] Edge skipped -> RCL +2.
- [ ] RCL cannot be bought with stat points.
