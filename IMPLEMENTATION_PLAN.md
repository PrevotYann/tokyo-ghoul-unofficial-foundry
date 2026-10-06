# Implementation status ? 0.2.0

The v14 repair replaces the earlier checklist with a verified status record. Coverage and remaining GM work are documented in [the rule audit](docs/qa/v14-rule-audit.md).

- Foundry 14.368 loads all Actor/Item subtypes in an isolated QA world.
- Native sheets/dialogs use v14 APIs and valid forms.
- Six native LevelDB packs contain 83 records with folders.
- Native numeric Active Effects update dependent totals/maxima.
- Combat budgets, reactions, damage, conditions, counters and separate GM/player clients are verified.
- Character creation, progression, equipment, Hunger/Rage and Kakuja workflows are connected.
- Responsive dark sheets, keyboard tabs, readable dialogs and contrast tests are in place.
- Unit, palette, pack and live browser checks are reproducible through npm scripts.

Assisted/manual boundaries remain explicit: spatial/narrative adjudication, Dynamic abilities, Chimera slot partition, carry limits and arbitrary custom effects. All progression/Kakuja combinations and existing-world migrations still require the additional table QA checklist; passing smoke tests does not replace it.
