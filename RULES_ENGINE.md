# Rules Engine Specification

This file paraphrases the mechanical rules that must be encoded. The rulebook PDF remains the final source of truth.

## Core stats
Six base stats are distributed at character creation:
- STR - basic melee damage, grabs, throws, heavy melee costs.
- ACC - basic ranged damage, thrown/grenade accuracy, ranged attacks.
- PER - attack roll modifier.
- END - vitality/stamina maximums, blocking, burning checks, tanking.
- SPD - stamina maximum, turn order, dodging, movement feel.
- CRL - Hunger/Rage control checks and vitality maximum.

RCL is a special RC Level value attached to Kagune/Quinque sources, not part of the 60 starting stat pool.

## Derived stats
- Vitality max: `(END + CRL) * 3`.
- Stamina max: `(END + SPD) * 3`.
- Meal Score max for Ghouls/Quinx: `max(floor_or_round(CRL * 1.5), 4)`. The rulebook does not explicitly specify rounding; implement `Math.floor` by default and expose a GM setting if needed.
- RC Bonds for Quinque: normally equal to Quinque RCL; Rinkaku High-Speed Regeneration Quinque uses half RCL, rounded down.
- Apply Kagune type max penalties after base max is calculated:
  - Ukaku reduces max stamina by total SPD.
  - Rinkaku reduces max vitality by total END.

## Roll rules
Implement a central `rollD20Check({ actor, stat, bonus, penalty, targetNumber, opponent })`.

Rules:
- Roll `1d20 + modifiers`.
- Natural 1: subtract 10 from the overall total, minimum 0.
- Natural 20: roll one additional unmodified d20 and add it. The extra d20 never explodes and does not fumble.
- Passive checks compare to a target number.
- Contests compare two totals; higher wins.
- Attack rolls always add PER last after other bonuses/penalties.

## Character creation
### Class
Choose `ghoul`, `investigator`, or `quinx`.

### Weapons and RCL
- Ghoul Kagune starts at RCL 10.
- Quinx Kagune starts at RCL 5.
- Investigator/Quinx Quinque starts at RCL 10.
- Ghoul Kagune gets up to 3 starting Edges.
- Quinx Kagune gets up to 1 starting Edge.
- Investigator Quinque gets up to 3 starting Edges.
- Quinx Quinque gets up to 2 starting Edges.
- Each unchosen starting Edge increases the appropriate RCL by +2, up to +6 where applicable.

### Stats
- 60 points are distributed across STR, ACC, PER, END, SPD, CRL.
- Provide a default 10/10/10/10/10/10 preset.

## Type advantage
Kagune/Quinque types form a cycle:
- Ukaku beats Bikaku.
- Bikaku beats Rinkaku.
- Rinkaku beats Koukaku.
- Koukaku beats Ukaku.

Automation:
- Ghoul Kagune advantage: +3 to relevant rolls against the weak target type.
- Quinque type advantage against a Ghoul's Kagune: +2 to relevant rolls.
- Investigator attacking a Ghoul with a Quinque has a general +3 bonus. The rulebook notes type interactions can effectively cancel; implement this visibly in the formula breakdown.
- Natural Predator changes Quinque type advantage to +4 instead of +2.

## Range bands
- Melee: within 5 ft.
- Close: 5-15 ft.
- Mid: 15-30 ft.
- Long: 30-45 ft.
- Far: 45+ ft.

Movement maneuver moves one range increment. On a square grid, 5 ft is one tile; the standard one-increment move is effectively 15 ft. Use Foundry grid distance 5 ft and show range bands in chat.

Kagune/Quinque ranges:
- Ukaku: Close melee; Long projectiles.
- Koukaku: Close.
- Rinkaku: Mid.
- Bikaku: Mid.
- Massive extends effective range by one increment; Ukaku projectiles become infinite.
- Overextend can push melee one increment further with SPD penalty/cost.

## Squad combat
- Initiative order is by SPD, highest first.
- Tie: Ghouls before Investigators. Same side tie can act simultaneously or use GM tiebreaker.
- Each character gets two maneuvers per turn.
- Dodge and Block are reaction maneuvers that require an unspent/reserved maneuver from the previous turn. Attacks against a target that has not acted yet automatically succeed.

## Raid combat
Raid combat changes:
- Combatants take three maneuvers per turn.
- Player damage against enemies is tripled.
- Stamina spent for each attack is halved.
- Dropping an enemy grants a free out-of-sequence attack against another enemy in range.
- Use sparingly; support via combat mode flag and chat banner.

## Maneuvers
### Strike
Basic attack. If the target does not Dodge/Block, it hits automatically if in range. If defended, attacker rolls d20 + PER + modifiers against defender's Dodge/Block total.

### Move
Move one range increment.

### Ready
Save one action for a clear trigger. It resolves as an interrupt before the triggering condition if desired. Cannot be used as Counter.

### Take a Breather
Recover Stamina equal to END. On a turn where this is used, the second maneuver can only be Move, Ready, Enhance, Dodge, Block, or Take a Breather again. Breathing Exercises changes recovery to `END * 2`.

### All-Out Offensive
Spend `numberOfAttacks * 5` Stamina, make up to five attacks, requires both maneuvers. Quick Strikes changes multiplier to 3 and allows damage bonus equal to SPD.

### Counter
Declare Counter and take no other actions until next turn. If targeted by an attack, it automatically fails and you counterattack. Cost is `(SPD * 3) - PER`, minimum should be clamped to 0 unless rulebook/GM says otherwise.

### Enhance
Activate Quinque gimmick or Kakuja. Ongoing costs happen before maneuvers each turn.

### Overextend
Melee attack one range increment farther. Attack roll penalty = SPD. Stamina cost = SPD.

### Grab
Requires Grappler edge or equivalent. Opposed STR roll. If Prehensile Kagune/Quinque is used, roll STR + RCL. Success applies Grappled. Grappled target cannot move or attack; can Take a Breather or oppose STR/STR+RCL to break. Attacks against grappled target auto-hit. Grappler suffers end-turn Stamina drain equal to END. Throw can be part of the same Grab action, then no more actions until next turn.

### Throw
Requires Grappler and a grappled target. Throw distance = floor(STR / 2), or floor((STR + RCL) / 2) if using Prehensile Kagune/Quinque. Collision before full distance deals remaining feet as Vitality damage. Cost = STR * 2 Stamina.

### Heavy Strike
Requires Heavy Strikes edge. Cost = STR * 2 Stamina (halved for Investigator Heavy Strikes edge). Attack roll penalty = STR. If the Kagune/Quinque melee attack hits, double STR for damage.

### Dodge
Reaction. Roll d20 + SPD + modifiers against attacker total.

### Block
Reaction. Roll d20 + END + modifiers against attacker total.

### Take Hit
No roll. Apply full damage.

## Attack formulas
Attack roll = d20 + PER + modifiers.

Damage and stamina costs:
- Melee Basic: damage `STR`, cost 0.
- Melee Kagune: damage `STR + RCL`, cost `max(STR - RCL, 1)`.
- Melee Quinque: damage `STR + RCL`, cost `max(RCL - STR, 1)`.
- Ranged Basic: damage `ACC`, cost 0.
- Ranged Kagune: damage `ACC + RCL`, cost `max(ACC - RCL, 1)`.
- Ranged Quinque: damage `ACC + RCL`, cost `max(RCL - ACC, 1)`.
- Sidearm Q bullets: count as ranged Quinque for attack/bonuses but damage uses ACC only and has no weapon RCL damage.

When Stamina reaches 0, maneuvers that would spend Stamina instead drain Vitality.

## Defense outcomes
If taking the hit: subtract damage from Vitality.

If Dodge fails:
- Take full damage.
- Also take half damage as Stamina penalty.

If Block fails:
- Take `floor(damage * 1.5)` Vitality damage.

If Dodge or Block succeeds, compare defender total to attacker total:
- 5-9 higher: may attempt counterattack for half normal damage, rounded down.
- 10-14 higher: may attempt counterattack for full damage.
- 15-19 higher: automatic counterattack for full damage.
- 20+ higher: automatic counterattack for `ceil(1.5 * normalDamage)`.

Make failed defense consequences and counter tiers visible and optionally configurable.

## Hunger
For Ghouls and Quinx:
- Out of combat, Meal Score decreases by 1 at the start of each day.
- Full human meal sets Meal Score to maximum.
- Partial flesh is GM-adjudicated.
- Full Ghoul meal restores 50% max Meal Score; Cannibalistic restores 100%.
- At 50%, 25%, and 10% thresholds, make CRL roll.
- Out-of-combat TN = missing Meal Score.
- In-combat TN = missing Stamina when Stamina crosses thresholds.
- On success, no effect.
- On failure: lose 5 Vitality, then lose 1 additional Vitality for each combat turn not Taking a Breather or for every ten in-game minutes out of combat. Regeneration is disabled until at least 1 Meal Score is gained or flesh is eaten.
- Inner Peace auto-passes CRL rolls.
- Rampant auto-fails CRL rolls but changes consequences to +10 temporary stat points while hungry and no Hunger damage.

## Rage
For Investigators and Quinx:
- Trigger checks when Vitality crosses 50%, 25%, and 10% thresholds.
- Roll CRL against missing Vitality.
- On failure: enter Rage.
- Rage causes 5 Stamina initial loss and 2 Stamina for every action that is not Take a Breather.
- Taking a Breather ends Rage.
- Rage grants 10 temporary stat points to assign during that Rage; remove them when Rage ends.
- Investigators can voluntarily enter Rage; voluntary initial Stamina drain is 0.
- Inner Peace prevents Rage.
- Rampant makes Rage checks auto-fail, removes initial Stamina cost, and reduces Rage per-action Stamina cost by 1.

## Regeneration
- Ghoul Regeneration: at start of turn, if last-round damage was not from Kagune/Quinque, heal END Vitality. Cannot heal Kagune/Quinque wounds.
- High-Speed Regeneration: Rinkaku only; replaces Ghoul Regeneration. If last-round damage was not Kagune/Quinque, heal END + CRL. If it was Kagune/Quinque, heal END.
- Hunger and RC Limiter can suppress regeneration.
- Bleeding stacks can be removed by regeneration before damage: normal removes 1 stack; high-speed removes 2.

## Conditions
### Bleeding
- Stacks indefinitely.
- Deals 1 Vitality damage per stack at start of afflicted turn.
- Regeneration removes stacks before damage.

### Burning
Detailed version to implement by default:
- At start of afflicted turn, make END roll.
- Subtract 1 END from the roll for every Burning stack if using detailed rule.
- If result < 15: take 3 damage per stack, then gain another stack.
- If result >= 15: remove all Burning stacks.
- Incendiary grenades apply one stack and cannot be blocked.

### Grappled
- Cannot move or attack.
- Can Take a Breather or attempt to break with opposed STR/STR+RCL.
- Attacks against grappled targets automatically hit.

## Kagune Evolution
A Ghoul can allocate/spend RCL to evolve:
- Spend 10 RCL to swap one Edge for a compatible Edge. Cannot swap into creation-only High-Speed Regeneration or Chimera unless the specific evolution rule allows Chimera.
- Spend 2 RCL per point to increase a non-RCL stat by 1.
- Spend 40 RCL and require Cannibalistic to gain Chimera if a slot is open or swap an Edge to Chimera.

## Kakuja
Eligibility:
- Half-Kakuja: Ghoul fails a CRL roll after reaching at least RCL 50 and has Cannibalistic Edge.
- Full Kakuja: Ghoul has mastered Half-Kakuja and reaches at least RCL 150.
- Quinx cannot become Full-Kakuja; they may choose Half-Kakuja or Kakuja Quinque options.

Half-Kakuja:
- If unmastered and active in combat, end-turn Stamina cost = RCL.
- Grants up to 20 temporary points to one of two stats based on Kagune type:
  - Ukaku: SPD or ACC.
  - Koukaku: END or STR.
  - Rinkaku: RCL +10 or SPD +20.
  - Bikaku: STR +20 or RCL +10.

Full Kakuja:
- Bonuses double: +40 normal stat or +20 RCL.
- Unmastered full cost = RCL * 2 per turn.
- Mastered full cost = floor(RCL / 2) per turn.

Mastery:
- Half/Full Kakuja mastery requires 10 consecutive CRL rolls in combat or 20 consecutive rolls out of combat.
- TN = user's RCL.
- One roll at end of each turn if in combat.
- Hunger CRL rolls count toward mastery.
- Failure causes loss of control.

Lost control:
- GM controls the character.
- Attacks closest target each turn.
- Ends when Stamina or Vitality is depleted; Kakuja withdraws and player regains control on waking.

Chimera Kakuja:
- Split bonuses between Kagune types instead of one big bonus.
- CRL stat cannot exceed 15 for Chimera Ghoul.
- See rulebook source map for exact split values.

## Quinque and RC Bonds
- Investigator can carry no more than two Quinque on person; storage is unlimited.
- RC Bonds are weapon health, normally equal to RCL.
- When blocking with Quinque, investigator can interpose weapon, auto-succeed Block, reduce RC Bonds by incoming damage, and take half Vitality damage.
- At RC Bonds 0, Quinque is destroyed and requires one week repair.
- Rinkaku regeneration Quinque self-repairs; see Edge details.

## Quinque creation and upgrading
Upgrade during downtime using harvested Kakuhou:
- Increase Quinque RCL by half the slain Ghoul's RCL.
- Swap an Edge with an Edge from the slain Ghoul if compatible.
- Add a gimmick by decreasing Quinque RCL by 20. Type mapping:
  - Ukaku Kakuhou -> Attack gimmick.
  - Koukaku -> Defense gimmick.
  - Rinkaku -> Form gimmick.
  - Bikaku -> Utility gimmick.
  - Dynamic Edge source can allow Dynamic gimmick instead.

Forge new Quinque:
- Takes about one week.
- Choose up to 3 Edges; two must come from source Ghoul's edges.
- Base RCL by source Ghoul rank:
  - C: 10
  - B: 15
  - A: 20
  - S: 25
  - SS: 30
  - SSS: 40
- Each unchosen Edge adds +2 RCL.

## Progression
- Ghouls gain stat points equal to the consumed being's highest RCL.
- Ghouls/Quinx also gain +1 RCL when consuming a person, up to their current RCL limit as described by the rulebook wording. Implement this carefully and expose GM correction.
- Investigators gain advancement through Kakuhou used to upgrade or forge Quinque.
- Quinx can use both methods.
- RCL cannot be upgraded directly using stat points.

## GM adjudicated mechanics
These should be supported with structured fields, notes, and optional custom formulas:
- Dynamic Edge.
- Dynamic Gimmick.
- Partial meals.
- Story-based rank changes.
- Ambiguous simultaneous turn resolution.
- Optional removal of harsh dodge/block consequences.
