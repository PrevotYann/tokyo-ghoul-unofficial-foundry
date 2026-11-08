# Changelog

All notable changes to this project will be documented in this file.

## [0.7.1] - 2026-11-08

- French translation module 1.3.0 updates every changed Last Delivery journal, role, item description and panel reminder for 0.7.x, and is verified live in Foundry 14.368 (2,090 checks).
- Repository cleanup: removed orphan LevelDB manifests and logs left by QA sessions, and a junction in an ignored QA folder that looped back to the repository root.

## [0.7.0] - 2026-11-08

### The Last Delivery: balance pass

- Added a Monte-Carlo encounter simulator (`npm run sim:adventure`) built on the system's own attack, defense, counter, regeneration, Hunger/Rage, medkit and breather formulas. It covers every scene at 4/5/6 players and the full night with wounds carried between scenes, plus seeded balance regression tests.
- Kurose: 126 VIT / 102 STM (PER 12, END 18, CRL 30). Riku: 123 VIT, SPD 11, Hardy, yields at 30. Every fight used to end in round one; the station now lasts 2–3.5 rounds with real risk, and the whole night is won in about 95–100% of simulated runs under the guide's tactics.
- Chika fights beside Kurose at the station until Kaito is freed. In the 6-player alley Riku only watches and withdraws.
- GM Control Panel party size now scales Kurose (+10/+30 CRL) and Riku (+8/+16 CRL) through temporary stats, preserving existing wounds.
- Aya is now the battle medic (Healer Edge, three kits). The unusable medkits on Daichi and Nao were removed, and the clinic cabinet restocks two kits.
- GM guide: opposition tactics (one Strike plus one reaction, no attacks on PCs who have not acted, spread pressure), simulated results and updated stat tables.
- Fixed token and pin placement on all three maps (pins covering Chika, Emi, Yui, Kurose, patients and Aya; Kurose away from the desk; South service route pin at the wrong gap). Tests now reject wall-straddling tokens and token-covering pins.
- Live QA: new `test:adventure-balance` suite; `test:adventure` now cleans up the imported macro.

## [0.6.0] - 2026-10-28

- Replaced all 13 Last Delivery character and NPC silhouettes with individually generated dark urban anime portraits, with transparent circular tokens and the existing faction colors.
- Actor sheets, prototype tokens and every placed adventure token use the new illustrations. The three map images and all scene geometry remain unchanged.
- Existing worlds automatically replace bundled legacy artwork when the active GM loads the world. Custom portraits and token textures, resources, ownership and story progress are preserved.
- Bundled generation prompts and retained legacy SVGs for compatibility. No official anime/manga images, characters or logos are included.

## [0.5.0] - 2026-10-28

### Rules

- Raid damage tripling, cost halving and defeat follow-ups now apply only to the players' side; enemies keep three maneuvers but attack with Squad numbers.
- Prehensile no longer grants Grab/Throw (only Grappler does); it still extends Grab range and adds RCL to the opposed roll.
- 0 Vitality applies the unconscious status and marks the combatant defeated; healing reverses it.
- The two-Quinque carry limit is enforced when equipping and reported by validation.
- Mastering a Kakuja stage prompts the Dynamic Edge design step.
- The character builder asks for the Bikaku −2 drawback (CRL, PER or RCL).
- Optional per-actor yield threshold whispers the GM a morale prompt.

### Interface

- New HUD-style actor sheet: angled portrait, class and rank badges with cross-faction rank equivalence, segmented resource bars, maneuver and reaction pips, live status chips, quick-action bar and icon tabs.
- d20 stat hexes, action tiles, RC-type colored weapon cards with RC Bonds, ammo and Edge chips, Kakuja mastery tracker.
- Redesigned item sheets with a hero header and dropdowns for gimmick, stamina, consumable, maneuver and Edge categories.
- Step-by-step character builder with class cards, live 60-point counter, Edge chips with slot/RCL counters, weapon names and type hints.
- New chat cards for checks, attacks, defenses, grenades and every log message, with critical/fumble styling.
- Combat tracker Squad/Raid toggle and `game.tokyoGhoul.startEncounter()`.
- Fixed corrupted characters in English range and settings labels; the bundled French UI now mirrors the French translation module.

### The Last Delivery

- GM control panel macro: party size, story pressure track, door locks, NPC recruit/capture, wound carry-over between scenes, one-click Squad encounters, hidden-token reveals.
- New NPC Kaito Fuse (Chika's brother, held in the van cab) resolving Chika's collateral thread, with token, map pin and station objective.
- New journals: GM Control Panel and Quick Reference, Interludes and Continuation, and the handout Chika's Photo.
- Yield thresholds for Riku (46), Chika (41) and Kurose (24); noncombatant flags for Emi, Yui, Haru and Kaito.
- Stable keys on actors, scenes and locked doors so automation works in translated worlds.

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
- Added an explicit Actor sheet class setup action that creates missing starting Kagune/Quinque items for the selected class.
- Replaced placeholder attack-card Dodge, Block, and Take Hit buttons with automated defense resolution and damage application.
- Hid Meal Score for Investigators and zeroed their derived Meal Score maximum.
- Added a simple character builder app exposed as `game.tokyoGhoul.openCharacterBuilder()` which creates Actors with starter owned Kagune/Quinque items.
- Added Phase 9 Kakuja eligibility, activation bonus, upkeep, and mastery helper logic.

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
