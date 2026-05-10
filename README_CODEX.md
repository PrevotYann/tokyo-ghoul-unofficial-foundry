# README_CODEX.md

This folder contains instruction files for a Codex instance to build a Foundry VTT v14 system for the user's free/unofficial Tokyo Ghoul tabletop RPG.

## How to use this pack
1. Create a new repository named `tokyo-ghoul-unofficial` inside your Foundry data folder:
   `Data/systems/tokyo-ghoul-unofficial/`
2. Copy these `.md` files into the repository root.
3. Put the rulebook PDF at:
   `docs/rulebook/Tokyo Ghoul Tabletop RPG - Unofficial.pdf`
4. Start Codex in the repository and paste the contents of `CODEX_PROMPT.md`.
5. Let Codex implement in phases, committing after each working milestone.

## Recommended first Codex task
Ask Codex to create the Foundry v14 skeleton only:

> Read `AGENTS.md`, `PROJECT_SPEC.md`, `FOUNDRY_V14_ARCHITECTURE.md`, and `DATA_MODEL.md`. Create the minimal Foundry v14 system skeleton for `tokyo-ghoul-unofficial` that loads without errors. Implement `system.json`, `src/tokyo-ghoul.mjs`, localization, base CSS, DataModel stubs, Actor/Item classes, and basic sheets. Do not implement combat yet. Add a smoke-test checklist to README.

After that works in Foundry, proceed to rules and automation.

## Source files in this instruction pack
- `AGENTS.md` - top-level Codex rules and definition of done.
- `PROJECT_SPEC.md` - package scope, features, compendiums, release standards.
- `FOUNDRY_V14_ARCHITECTURE.md` - technical architecture for a v14 system.
- `DATA_MODEL.md` - Actor and Item schema design.
- `RULES_ENGINE.md` - formulas and automation logic.
- `RULEBOOK_IMPLEMENTATION_CHECKLIST.md` - complete rule checklist.
- `CHARACTER_BUILDER_AND_COMPENDIA.md` - guided creation and compendium requirements.
- `SHEETS_AND_UX.md` - modern sheet and UI instructions.
- `IMPLEMENTATION_PLAN.md` - build phases.
- `TEST_PLAN.md` - unit, integration, and manual QA.
- `LEGAL_AND_CONTENT_GUIDELINES.md` - asset and attribution guardrails.
- `RULEBOOK_SOURCE_MAP.md` - page/section map for rulebook implementation.
- `CODEX_PROMPT.md` - paste-ready prompt.
