# AGENTS.md - Codex Instructions for the Tokyo Ghoul Unofficial Foundry VTT v14 System

## Mission
Build a complete, modern, highly automated Foundry Virtual Tabletop **Version 14** game system for the user's free/unofficial Tokyo Ghoul tabletop RPG implementation.

The system must implement every mechanical rule in `docs/rulebook/Tokyo Ghoul Tabletop RPG - Unofficial.pdf` and the summarized implementation notes in this repository. The rulebook is the source of truth where this instruction pack is incomplete or ambiguous.

## Package identity
Use these defaults unless the repository owner changes them:

- Package id: `tokyo-ghoul-unofficial`
- Display title: `Tokyo Ghoul: Unofficial TTRPG`
- Minimum Foundry version: `14`
- Verified Foundry version: current local v14 build used by the developer
- JavaScript: modern ESM only
- CSS: modern responsive CSS, no external runtime CSS framework unless bundled locally and justified
- Localization: all user-facing labels through `lang/en.json`; add `lang/fr.json` stubs if practical because the requester may be francophone

## Non-negotiable requirements
1. Implement **all rules**, not only character sheets:
   - Character creation for Ghoul, Investigator, and Quinx.
   - Stats, derived stats, resources, ranks, action economy, combat, reactions, maneuvers, ranges, Hunger, Rage, Kakuja, Kagune, Quinque, Edges, Gimmicks, Kakuja Quinque, Quinx special cases, progression, and upgrading.
2. Sheets must look modern:
   - Polished dark urban theme, responsive layout, accessible contrast, CSS variables, no official anime/manga art unless the user supplies licensed assets.
   - Character sheet must be usable on 1366px desktop and narrow tablet widths.
3. Sheets must be automated as far as Foundry permits:
   - Auto-calculate Vitality, Stamina, Meal Score maximum, RC Bonds, range text, edge slot usage, bonuses, penalties, and resource costs.
   - Provide buttons for rolls, attacks, maneuvers, defense reactions, Hunger/Rage checks, Kakuja activation/mastery, Take a Breather, grenades, medkits, forge/upgrade workflows, and edge/gimmick management.
4. Respect Foundry v14 practices:
   - Use `system.json` at the system root.
   - Use custom Actor and Item document sub-types declared through `documentTypes`.
   - Pair document types with DataModel definitions in code.
   - Use ES modules, ApplicationV2/DocumentSheetV2-era APIs, ActorSheetV2 and ItemSheetV2 where applicable.
   - Do not use private API unless there is no public alternative, and document any exception.
5. Never ship copyrighted Tokyo Ghoul anime/manga images, logos, manga panels, soundtracks, or long verbatim text from the rulebook. The user states they have rights/permission for this free TTRPG system, but the repository must still keep assets and attribution clean. Use original placeholder SVG/CSS assets unless licensed assets are explicitly added by the repository owner.
6. Use test-driven implementation. Every major mechanic must have automated tests or reproducible manual Foundry QA steps.
7. Preserve data compatibility. Include migration helpers for future schema changes.

## Expected repository structure
Create or maintain this structure:

```text
tokyo-ghoul-unofficial/
  AGENTS.md
  README.md
  system.json
  template.json                         # optional in v14; prefer DataModels, but may be included for compatibility if useful
  src/
    tokyo-ghoul.mjs
    config.mjs
    data-models/
      actor-character.mjs
      actor-npc.mjs
      item-kagune.mjs
      item-quinque.mjs
      item-edge.mjs
      item-maneuver.mjs
      item-consumable.mjs
      item-kakuhou.mjs
      item-gimmick.mjs
    documents/
      actor.mjs
      item.mjs
      combat.mjs
      active-effect.mjs
    sheets/
      actor-sheet.mjs
      item-sheet.mjs
      builder-app.mjs
      roll-dialogs.mjs
    rules/
      rolls.mjs
      derived-stats.mjs
      combat-workflow.mjs
      damage.mjs
      hunger-rage.mjs
      kagune-quinque.mjs
      edges.mjs
      kakuja.mjs
      progression.mjs
      validation.mjs
      migrations.mjs
    ui/
      chat-cards.mjs
      handlebars-helpers.mjs
      drag-drop.mjs
  templates/
    actor/
      character-sheet.hbs
      npc-sheet.hbs
      parts/
    item/
      kagune-sheet.hbs
      quinque-sheet.hbs
      edge-sheet.hbs
      maneuver-sheet.hbs
      consumable-sheet.hbs
      gimmick-sheet.hbs
    chat/
      roll-card.hbs
      attack-card.hbs
      defense-card.hbs
      condition-card.hbs
  styles/
    tokyo-ghoul.css
    sheets.css
  lang/
    en.json
    fr.json
  packs/
    edges/
    maneuvers/
    sample-kagune/
    sample-quinque/
    equipment/
    conditions/
  docs/
    rulebook/
      Tokyo Ghoul Tabletop RPG - Unofficial.pdf
    architecture/
    qa/
  test/
    unit/
    foundry/
```

## Rulebook source handling
- Keep the rulebook PDF in `docs/rulebook/` for developer reference only if the repository owner confirms it may be included. Otherwise store it outside the repo and document where to place it locally.
- Do not paste long passages from the PDF into source files. Encode mechanics as data, formulas, and concise paraphrased help text.
- Any rule conflict in this instruction pack must be resolved by checking the PDF, then adding a note to `docs/qa/rule-clarifications.md`.

## Implementation priorities
1. Create the Foundry package skeleton and load it in a clean v14 world.
2. Implement DataModels and derived stat preparation.
3. Build Actor/Item sheets with drag/drop and modern UI.
4. Implement compendium content for Edges, Maneuvers, conditions, and baseline equipment.
5. Implement roll engine, chat cards, attack/defense workflow, Hunger/Rage/Kakuja automation.
6. Implement character builder and weapon builders.
7. Implement progression and upgrade flows.
8. Add migrations, tests, README, release packaging.

## Coding standards
- Prefer pure functions in `src/rules/*` and keep Foundry document code thin.
- Every formula must exist in one place only, with named exports and tests.
- Store numeric constants in `src/config.mjs` with localized labels in `lang/*.json`.
- Use `foundry.utils.mergeObject`, `foundry.utils.getProperty`, and v14-safe helpers where appropriate.
- Chat cards must include clear formulas, dice results, crit/fumble handling, damage, resource changes, and buttons for GM/player follow-up.
- Write data migrations whenever field names, data shapes, or item type definitions change.
- Use semantic CSS class names under a `.tg-system` namespace.
- Avoid hardcoded English in templates; use localization keys.

## Definition of done
A release is not complete until:
- The package installs and creates a world in Foundry v14 without console errors.
- All Actor and Item document types can be created, edited, dragged, dropped, imported, exported, and used in rolls.
- Character builder can create valid Ghoul, Investigator, and Quinx characters from scratch.
- Derived stats and resource maxima update automatically when stats, types, edges, Rage, Hunger, Kakuja, armor, or equipment change.
- Attack workflow supports target selection, reaction prompts, Dodge/Block/take-hit, counterattack tiers, stamina/vitality application, conditions, RC Bonds, and chat logging.
- Raid and Squad combat modes are both supported.
- Every Edge, Gimmick, maneuver, Kagune type, Quinque type, and Kakuja rule has a data entry and an implementation status of automated, semi-automated, or manual/GM-adjudicated.
- Unit tests cover the formulas and edge cases listed in `TEST_PLAN.md`.
- README documents install/build/test/release steps.
