# Implementation Plan

## Phase 0 - Repository setup
- [x] Create package skeleton.
- [x] Add `system.json`.
- [x] Add ESM entrypoint.
- [x] Add CSS and localization.
- [x] Add README install instructions.
- [x] Verify the system appears in Foundry v14 and a world loads without errors.

## Phase 1 - Data models and document classes
- [x] Define Actor DataModels for character and npc.
- [x] Define Item DataModels for all item types.
- [x] Register Actor/Item document classes.
- [ ] Implement `prepareBaseData` and `prepareDerivedData`.
- [x] Implement derived stats and validation pure functions.
- [x] Unit test formulas.

## Phase 2 - Basic sheets
- [x] ActorSheetV2 with header, overview, stats, resources.
- [x] ItemSheetV2 for Kagune, Quinque, Edge, Maneuver, Consumable.
- [x] Drag/drop owned items.
- [x] Validation panel.
- [x] Modern responsive CSS.

## Phase 3 - Compendiums and source data
- [x] Create compendium source JSON.
- [x] Add all Edges.
- [x] Add all Maneuvers.
- [x] Add all Conditions.
- [x] Add consumables and templates.
- [ ] Build/import packs.
- [ ] Verify pack entries can be dragged to sheets.

## Phase 4 - Roll engine
- [x] Implement d20 crit/fumble rules.
- [x] Implement stat checks.
- [x] Implement contested checks.
- [x] Implement chat cards.
- [x] Add roll buttons to sheets.
- [x] Unit test natural 1/20 and contests.

## Phase 5 - Combat workflow
- [ ] Implement Strike workflow.
- [x] Implement target/range validation.
- [x] Implement stamina costs and damage formulas.
- [x] Implement Dodge, Block, Take Hit.
- [x] Implement failed defense consequences.
- [x] Implement counterattack tiers.
- [x] Implement maneuver budget and reaction reservation.
- [x] Implement Squad initiative helper.
- [x] Implement Raid mode.
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
