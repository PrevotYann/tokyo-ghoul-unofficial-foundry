# Changelog

All notable changes to this project will be documented in this file.

## [Unreleased]

### Added

- Expanded the Actor sheet into a tabbed layout with Overview, Combat, Kagune/Quinque, Edges, Progression, Inventory, Biography, and Settings sections.
- Added categorized owned-item lists with basic drag data support and item drop handling.
- Added validation warnings for starting stat totals and class-required Kagune/Quinque items.
- Expanded the Item sheet with type-aware fields for Kagune, Quinque, Edges, Maneuvers, Consumables, and Gimmicks.
- Added Phase 3 pack source JSON for Edges, Maneuvers, Conditions, generic Kagune/Quinque templates, Consumables, and Gimmicks.
- Added a pack source validator script.
- Added the Phase 4 d20 roll engine with natural 1 and natural 20 handling.
- Added basic stat roll buttons and roll chat cards.
- Added Phase 5 combat math helpers for attack damage/cost, defense outcomes, and counter tiers.
- Added basic actor combat helpers for attack cards, stamina spending, damage application, Take a Breather, reaction reservation, Squad initiative sorting, and Raid mode modifiers.
- Added target range validation and selected-target display to attack declaration cards.
- Added Phase 6 Hunger/Rage threshold, TN, restoration, and failure-resolution helpers with actor CRL control checks.
- Added Phase 6 condition helpers for Bleeding, Burning, Grappled, and regeneration/suppression rules.
- Added Phase 7 type advantage, anti-Ghoul Quinque bonus, RC Bonds, and Quinque interpose block helpers.
- Added Phase 7 medkit, grenade, and Q bullet helpers.
- Added Phase 8 character-builder draft helpers for class profiles, stat presets, starting RCL, and starter Kagune/Quinque item data.

## [0.1.0] - 2026-05-10

### Added

- Created the Foundry VTT v14 system manifest for `tokyo-ghoul-unofficial`.
- Added the ESM entrypoint, config module, localization files, and dark `.tg-system` CSS namespace.
- Registered Actor and Item document classes with Foundry v14 DataModel stubs for all planned system document types.
- Added basic Actor and Item sheets using ApplicationV2-era sheet classes.
- Implemented pure derived-stat functions for Vitality, Stamina, Meal Score maximum, RC Bonds, starting RCL, and unused edge-slot RCL bonuses.
- Added Node unit tests for the Phase 1 derived-stat rules.
- Added README install instructions, Foundry smoke-test notes, and initial rule clarification notes.

### Notes

- Full combat, rolls, compendiums, character builder, Hunger/Rage workflows, Kakuja, and progression are intentionally deferred to later phases.
