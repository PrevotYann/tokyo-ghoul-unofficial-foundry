# Version 0.3.0

- Added original Tokyo Ghoul TTRPG artwork as the system setup thumbnail and default background for newly created worlds. Existing world backgrounds are preserved.
- Added optional Babele support with English translation templates for all six compendiums, their folders and sidebar groups. A generator creates separate translation-module starters with UI strings and pack mappings.
- Edge automation now uses stable rule IDs independent of translated names. Character creation, weapon assignment, duplicate checks, forging, progression and Kakuja retain their mechanics across languages.
- Schema v3 migrates existing world and embedded Edges using source provenance or original-name metadata, while preserving custom names and v2 Actor bonuses.
- Corrected popup icon font families and face weights for Foundry v14's CSS layers, including UUID, Close, menu and alternate icon controls. Native resize grips are preserved.
- Release packaging includes artwork and Babele files and supports freshly built packs from a separate directory, excluding recovered database files.

Validation: 93 unit tests, three local UI tests including a browser reproduction of Foundry's layered fonts, 83 compendium records, stable compendium IDs, native pack builds, and release archive validation. Foundry v14.368 passed 72 runtime checks covering document and sheet creation, the builder, combat, conditions, effects, healing, Edge drops, two clients and narrow layouts. Additional live checks covered Actor, Item, builder and dialog window icons. Detailed translation runtime QA is documented in docs/qa/translations.md; Babele itself was not installed for the live checks.

After updating, reload the client to refresh CSS. English remains the base language and the bundled French UI remains optional. Back up existing worlds before schema migration. Older translated custom Edges without source provenance or original-name metadata need a canonical system.ruleId supplied explicitly. Narrative and spatial rules retain the GM adjudication described in the rule audit.
