# Pack Source Data

These JSON files are source records for future Foundry compendium generation. They intentionally use concise paraphrased descriptions and structured rule metadata instead of long rulebook excerpts.

Current status:

- Edges: source entries for Ghoul and Investigator/Quinque edge lists.
- Maneuvers: source entries for the core combat maneuver list.
- Conditions: source entries for baseline condition concepts.
- Templates: generic Kagune and Quinque samples only.
- Consumables and Gimmicks: generic starter records.

Run `npm run build:packs` to create `_source.json` import bundles under `packs/*`. These are source bundles for Foundry import/build workflows; final LevelDB pack databases should still be generated from Foundry or a dedicated pack build tool before release.
