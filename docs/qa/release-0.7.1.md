# Version 0.7.1

Maintenance release after the 0.7.0 balance pass. No rules, content or data changes in the system itself.

## French translation

The companion [French translation module](https://github.com/PrevotYann/tokyo-ghoul-unofficial-fr) **1.3.0** now matches 0.7.x:

- Every changed Last Delivery journal was updated in French, with the same HTML structure, links and section order as the English text. That covers the start page, cast, the rewritten encounters and scaling guide (party-size scaling, opposition tactics, simulated results), the alley, clinic and station scenes, the GM quick reference with the new Kurose and Riku stats, Aya's dossier and the interludes.
- Aya's French role and weapon text and Riku's surrender threshold are updated, and the medkit description is new. The French panel reminders show the scaled Vitality.
- The module's stale character-builder check (written for the pre-0.5.0 dropdown) now targets the Edge chips.

Use French module 1.3.0 or later with system 0.7.x.

## Repository cleanup

- Removed orphan LevelDB manifests and empty logs that Foundry QA sessions had left in the packs.
- Removed a Windows junction inside the ignored `artifacts/art-v0.6.0` QA folder that pointed back at the repository root and made git report endlessly nested paths.

## Validation

- `npm test`: 125 unit tests pass. `npm run test:packs`: 83 source records validate.
- French module: 7 Node tests pass, the source validator covers 458 interface keys, 83 rule records, 8 Babele files and the full adventure, and `npm run test:foundry` passes 2,090 live checks on Foundry 14.368 in French, 223 of them on the adventure, with no page errors. Run against the disposable `tg-qa` world, restored from a backup afterwards.
- The system's live adventure suites ran for 0.7.0 (225 + 20 checks); adventure content is unchanged since.
