# Implementation Plan

## Phase 0 - Repository setup
- [ ] Create package skeleton.
- [ ] Add `system.json`.
- [ ] Add ESM entrypoint.
- [ ] Add CSS and localization.
- [ ] Add README install instructions.
- [ ] Verify the system appears in Foundry v14 and a world loads without errors.

## Phase 1 - Data models and document classes
- [ ] Define Actor DataModels for character and npc.
- [ ] Define Item DataModels for all item types.
- [ ] Register Actor/Item document classes.
- [ ] Implement `prepareBaseData` and `prepareDerivedData`.
- [ ] Implement derived stats and validation pure functions.
- [ ] Unit test formulas.

## Phase 2 - Basic sheets
- [ ] ActorSheetV2 with header, overview, stats, resources.
- [ ] ItemSheetV2 for Kagune, Quinque, Edge, Maneuver, Consumable.
- [ ] Drag/drop owned items.
- [ ] Validation panel.
- [ ] Modern responsive CSS.

## Phase 3 - Compendiums and source data
- [ ] Create compendium source JSON.
- [ ] Add all Edges.
- [ ] Add all Maneuvers.
- [ ] Add all Conditions.
- [ ] Add consumables and templates.
- [ ] Build/import packs.
- [ ] Verify pack entries can be dragged to sheets.

## Phase 4 - Roll engine
- [ ] Implement d20 crit/fumble rules.
- [ ] Implement stat checks.
- [ ] Implement contested checks.
- [ ] Implement chat cards.
- [ ] Add roll buttons to sheets.
- [ ] Unit test natural 1/20 and contests.

## Phase 5 - Combat workflow
- [ ] Implement Strike workflow.
- [ ] Implement target/range validation.
- [ ] Implement stamina costs and damage formulas.
- [ ] Implement Dodge, Block, Take Hit.
- [ ] Implement failed defense consequences.
- [ ] Implement counterattack tiers.
- [ ] Implement maneuver budget and reaction reservation.
- [ ] Implement Squad initiative helper.
- [ ] Implement Raid mode.
- [ ] Add manual GM controls.

## Phase 6 - Hunger, Rage, and conditions
- [ ] Implement Hunger thresholds and checks.
- [ ] Implement Rage thresholds and temp stat assignment.
- [ ] Implement Bleeding, Burning, Grappled.
- [ ] Implement regeneration and suppression.
- [ ] Implement Take a Breather interactions.
- [ ] Add condition start/end turn hooks.

## Phase 7 - Kagune, Quinque, Edges, Gimmicks
- [ ] Implement all Edge effects.
- [ ] Implement type advantage.
- [ ] Implement RC Bonds and Quinque blocking.
- [ ] Implement sidearms/Q bullets.
- [ ] Implement grenades and medkits.
- [ ] Implement gimmick activation and effects.
- [ ] Implement Dynamic Edge/Gimmick manual/custom workflow.

## Phase 8 - Character builder
- [ ] Implement class selection.
- [ ] Implement Kagune builder.
- [ ] Implement Quinque builder.
- [ ] Implement stats allocation.
- [ ] Implement validation review.
- [ ] Create actor with owned items from selections.

## Phase 9 - Kakuja, Kakuja Quinque, progression
- [ ] Implement Kakuja eligibility and activation.
- [ ] Implement mastery tracker and loss of control workflow.
- [ ] Implement Kakuja armor/weapon.
- [ ] Implement Kagune Evolution spending.
- [ ] Implement consumption rewards.
- [ ] Implement Kakuhou storage.
- [ ] Implement Quinque forge/upgrade workflow.

## Phase 10 - QA, docs, and release
- [ ] Complete all tests in `TEST_PLAN.md`.
- [ ] Add user documentation.
- [ ] Add GM automation guide.
- [ ] Add release zip script.
- [ ] Test clean install on a separate v14 data folder.
- [ ] Tag release.

## Recommended commit sequence
1. `chore: create foundry v14 system skeleton`
2. `feat: add actor and item data models`
3. `feat: add modern actor and item sheets`
4. `feat: add compendium source data`
5. `feat: implement d20 roll engine`
6. `feat: implement combat workflow`
7. `feat: implement hunger rage and conditions`
8. `feat: implement kagune quinque and edges`
9. `feat: add character builder`
10. `feat: add kakuja progression and forging`
11. `test: add rule coverage and foundry smoke tests`
12. `docs: add user and gm guides`
