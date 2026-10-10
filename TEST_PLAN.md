# Test Plan

## Unit tests
Use a test runner that can execute pure rule functions outside Foundry. Keep Foundry-specific integration tests separate.

### Roll tests
- Natural 1 subtracts 10, minimum 0.
- Natural 20 adds exactly one extra d20.
- Extra d20 does not explode or fumble.
- Passive TN success/failure.
- Contest higher total wins.

### Derived stat tests
- VIT = `(END + CRL) * 3`.
- STM = `(END + SPD) * 3`.
- Meal Score max uses CRL * 1.5 with minimum 4.
- Ukaku reduces max Stamina by total SPD.
- Rinkaku reduces max Vitality by total END.
- Koukaku applies +3 END and -3 SPD.
- Bikaku applies edge bonus and selected -2 penalty.

### Character creation tests
- 60-point stat validation passes/fails correctly.
- Ghoul starts with Kagune RCL 10.
- Quinx starts with Kagune RCL 5 and Quinque RCL 10.
- Investigator starts with Quinque RCL 10.
- Unused edge slot adds +2 RCL.
- Edge restrictions and incompatibilities are enforced.

### Attack formula tests
- Melee Basic damage/cost.
- Melee Kagune damage/cost.
- Melee Quinque damage/cost.
- Ranged Basic damage/cost.
- Ranged Kagune damage/cost.
- Ranged Quinque damage/cost.
- Minimum stamina cost 1 for Kagune/Quinque attacks.
- Sidearm uses ACC damage only.
- Quick Strikes changes All-Out cost multiplier.
- Heavy Strike doubles STR for damage when it hits.

### Defense tests
- Take Hit applies damage.
- Failed Dodge applies full damage and half stamina penalty.
- Failed Block applies floor(1.5x damage).
- Defense success prevents damage.
- Counter tiers trigger at +5, +10, +15, +20.
- Optional setting disables harsh consequences.

### Hunger/Rage tests
- Meal Score daily reduction.
- Hunger threshold detection at 50/25/10.
- Hunger TN equals missing Meal Score or Stamina.
- Hunger failure applies initial and ongoing damage.
- Hunger suppresses regeneration.
- Inner Peace auto-passes.
- Rampant auto-fails and swaps consequences.
- Rage threshold detection at 50/25/10 Vitality.
- Rage failure grants 10 temp stat budget and stamina costs.
- Voluntary Rage initial cost 0.
- Take a Breather ends Rage.

### Conditions tests
- Bleeding stacks and damage.
- Normal regeneration removes one Bleeding stack before damage.
- High-speed regeneration removes two Bleeding stacks before damage.
- Burning success clears stacks.
- Burning failure deals 3 per stack and adds a stack.
- Grappled prevents movement/attacks and allows break attempt.

### Quinque tests
- RC Bonds initialize from RCL.
- High-Speed Regeneration Quinque RC Bonds max is half RCL rounded down.
- Quinque interpose block consumes RC Bonds and halves damage.
- RC Bonds 0 marks broken.
- Repair tracker works.
- Forge RCL by source Ghoul rank.
- Upgrade RCL by half source RCL.
- Gimmick add costs 20 RCL.

### Kakuja tests
- Eligibility requires RCL and Cannibalistic.
- Half-Kakuja costs RCL per turn when unmastered.
- Full Kakuja costs RCL * 2 when unmastered and half RCL when mastered.
- Bonuses by type are applied and removed.
- Mastery requires consecutive successes.
- Failure causes lost control.
- Quinx cannot Full-Kakuja.

## Foundry integration tests / smoke tests
Manual or automated in a clean world:
1. Install system and create world.
2. Create a Ghoul character through the builder.
3. Create an Investigator through the builder.
4. Create a Quinx through the builder.
5. Drag Edge from compendium to a Kagune and see validation update.
6. Roll STR, ACC, PER, END, SPD, CRL checks.
7. Start combat, verify SPD ordering.
8. Make a Strike and resolve Take Hit.
9. Make a Strike and resolve Dodge.
10. Make a Strike and resolve Block.
11. Trigger Bleeding and start next turn.
12. Trigger Burning and start next turn.
13. Trigger Hunger threshold and resolve failure.
14. Trigger Rage and assign temp stats.
15. Activate Kakuja and run mastery roll.
16. Damage a Quinque's RC Bonds and repair it.
17. Use a medkit.
18. Throw each grenade type.
19. Switch combat to Raid mode and verify maneuver/damage/cost changes.
20. Export and import actors/items.

## Acceptance scenarios
### Scenario A - Starting Ghoul
- Class: Ghoul.
- Kagune: Ukaku.
- Edges: Sharpened, Quick Strikes, Preemptive.
- Stats: STR 8, ACC 14, PER 12, END 8, SPD 12, CRL 6.
Expected:
- RCL 10.
- SPD includes +3 type bonus.
- Max stamina reduced by total SPD.
- Projectile range Long.
- Dodge includes Preemptive +3.
- Kagune hit can apply Bleeding.

### Scenario B - Investigator with Healer/Grenadier
- Class: Investigator.
- Quinque: Bikaku.
- Edges: Healer and Grenadier.
Expected:
- Edge slots total 3, Healer uses 2.
- Carries up to 5 medkits and 10 grenades.
- Medkit removes Bleeding/Burning and heals PER + target END.
- Frag grenade damage = ACC * 3.

### Scenario C - Quinx hybrid
- Class: Quinx.
- Kagune: Rinkaku.
- Quinque: Koukaku.
Expected:
- Kagune RCL 5; Quinque RCL 10.
- High-Speed Regeneration on Rinkaku.
- Tracks both Hunger and Rage.
- Can use Kagune and Quinque attacks with correct RCL source.

## Regression notes

`npm run test:combat` runs four distinct builds in the disposable `tg-qa` v14 world. It covers turn completion, combat-scoped first-turn reactions, bonuses and penalties, successful/failed defenses, native critical dice, the chat Counter button, ranges/Overextend/Massive, All-Out, Rage costs and allocations, Hunger thresholds, Breather, healing wound reconciliation, regeneration, all grenades, timed effects, Gimmick upkeep/cooldowns, Grab/Throw, RC Bonds, Sidearm refill, Kakuja mastery/control cleanup and Raid defeat rewards. Fixtures are removed even after failures; the transcript is saved in `artifacts/qa/four-actor-combat.json`.

Every bug fix must add a test or a QA checklist item. If a rule cannot be automated, add a manual acceptance scenario.

`test/ui/window-icons.test.mjs` reproduces Foundry v14's layered Font Awesome loading and checks UUID, Close, menu, expand, regular and duotone icons, normal text labels, and the native resize grip. Set `TG_FOUNDRY_PUBLIC` to a local v14 `public/` directory to run outside the developer's default installation. It uses installed Foundry assets without copying them into the repository.

## Translation regression checks

`test/unit/localization.test.mjs` covers translated Edge identity, defense bonuses, duplicate validation, Kakuja prerequisites, character creation, Healer slot costs, Sidearm, forging, translated drops, schema v3 migrations, optional Babele bootstrap, complete English templates and UI key coverage. [Foundry translation QA](docs/qa/translations.md) covers runtime pack overlays, folders, language switching and imported documents.
