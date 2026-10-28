# Version 0.5.0

Completes the remaining rulebook gaps found in a fresh audit, replaces every sheet, window and chat card with a modern tabletop-game interface, and turns The Last Delivery into a GM-assisted adventure.

- Rules: Raid multipliers for the players' side only, Prehensile no longer granting Grab, incapacitation status at 0 Vitality, the two-Quinque carry limit, Kakuja-mastery Dynamic Edge prompt and the Bikaku drawback choice in the builder. See [rule clarifications](rule-clarifications.md).
- Interface: HUD actor sheet, item hero sheets, step-by-step builder, chat cards for checks/attacks/defenses/grenades/logs, styled dialogs, combat tracker Squad/Raid toggle.
- Adventure: GM control panel macro, Kaito Fuse subplot, three new journals, yield thresholds, door keys and wound carry-over.
- Localization: 120 new keys in English and French; corrupted English characters fixed; bundled `lang/fr.json` mirrors the French module. The [French module](https://github.com/PrevotYann/tokyo-ghoul-unofficial-fr) 1.3.0 translates all new UI keys and adventure content.

## Validation performed

- `npm test`: 113 unit tests pass (new: Raid side, vitality transitions, carry limit, Prehensile, sheet view helpers, adventure automation keys/thresholds/quick-reference figures, locked-door keys).
- `npm run test:ui`: palette contrast checks pass (the Font Awesome browser check is skipped without `TG_FOUNDRY_PUBLIC`).
- `npm run test:packs`: 83 pack source records; `npm run build:adventure` rebuilds the adventure (13 actors, 15 items, 15 journals, 3 scenes, 1 macro).
- French module 1.3.0: `validate:source` and its 7 Node tests pass against these sources.
- Static render of the real templates with Foundry 14's bundled Handlebars, CSS and fonts at 940 px and 520 px, in English and French: actor tabs, item sheet, builder, GM panel, chat cards and journal, with no page errors.

## Still to run before publishing

The live Foundry suites (`test:foundry`, `test:combat`, `test:actor-rolls`, `test:sheet-content`, `test:adventure`, `test:dice-so-nice`) need the disposable `tg-qa` world on `localhost:30014` and were **not** run for this version. In particular, check in a live world: sheet listeners and drag/drop on the new markup, the builder's live counters, the combat tracker button position in v14, `unconscious` status toggling, and the GM panel after a French Babele import.

## Upgrading

Actor/Item schemas are compatible; `system.combat.yieldAt` is a new optional field with a null default. Reimport The Last Delivery (in a new world, or after saving progress) to get the new journals, Kaito, the macro and the automation keys; an older import lacks the keys the GM panel looks for and the panel reports that the adventure is not imported.
