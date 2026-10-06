# Pack Source Data

These JSON files are source records for future Foundry compendium generation. They intentionally use concise paraphrased descriptions and structured rule metadata instead of long rulebook excerpts.

Current status:

- Edges: source entries for Ghoul and Investigator/Quinque edge lists.
- Maneuvers: source entries for the core combat maneuver list.
- Conditions: source entries for baseline condition concepts.
- Templates: generic Kagune and Quinque samples only.
- Consumables and Gimmicks: generic starter records.

All source names and text are English. Edge records include a stable `system.ruleId` that translation modules must preserve.

Run `npm run build:packs` to create native LevelDB databases and `_source.json` bundles under `packs/*`. Stop Foundry first, or use `npm run build:packs -- --output artifacts/translation-packs` to build separately. Run `npm run build:translations` after changing English text to refresh the ID-keyed Babele files. See [translation instructions](../../docs/qa/translations.md).
