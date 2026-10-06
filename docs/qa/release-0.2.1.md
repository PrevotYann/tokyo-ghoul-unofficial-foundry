Foundry v14 window controls and compact item sheet update.

- Restored Foundry's icon font on window header buttons so controls display recognizable icons instead of broken glyphs.
- Reduced default item window width from 620px to 520px and let height fit the content.
- Moved automation into the item header and tightened portraits, panels and description fields.
- Preserved editable fields, resizing and responsive layouts.

Validation: unit tests, UI contrast checks, compendium source validation and release packaging. A browser preview using the installed Foundry v14 styles confirmed header icon fonts, a fully visible consumable description and no horizontal overflow at 520px and 360px widths. Full live-world regression tests were not rerun for this patch; the existing Foundry 14.368 verification is from 0.2.0. Manual checks are documented in test/foundry/SMOKE_TEST.md.

Install or update using the release's system.json asset URL in Foundry's Install System dialog. The manifest.json asset is an identical alias. The ZIP contains the installable system and excludes the developer rulebook and development dependencies. This patch does not change document schemas or game mechanics.
