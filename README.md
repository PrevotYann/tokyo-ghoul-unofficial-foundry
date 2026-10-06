# Tokyo Ghoul: Unofficial TTRPG for Foundry VTT

An unofficial system for Foundry **v14**, verified locally on **14.368**. Version 0.2.0 repairs native v14 integration, connects combat/effect workflows, ships populated compendiums and provides responsive charcoal/crimson sheets with readable dialogs.

## Install

In Foundry Setup ? Game Systems ? Install System, paste:

https://github.com/PrevotYann/tokyo-ghoul-unofficial-foundry/releases/latest/download/system.json

Foundry uses system.json as its system manifest. Releases also provide an identical manifest.json alias. For manual installation, extract tokyo-ghoul-unofficial.zip into Data/systems/ so the manifest is Data/systems/tokyo-ghoul-unofficial/system.json. Reload Foundry and create a world using this system. Back up existing worlds before updating.

## Use

Open the builder from the Actors directory or game.tokyoGhoul.openCharacterBuilder(). Choose a class, preset or 60-point custom allocation and starting Edges. Manifest a Kagune or equip a Quinque before attacking. Drop Edges onto a weapon or Actor sheet to assign them with validation.

Target one token per attack. Dialogs choose the weapon, mode and modifiers; chat buttons resolve Dodge, Block, Take Hit or Quinque interpose. The active GM applies player requests once. Reserve reactions during your turn; start combat to enforce budgets. Choose Squad or Raid on the Actor combat tab.

Progression tools cover stat spending, consumption, evolution, Kakuhou forging and upgrading. Native Active Effects support numeric stat bonuses. Advance Foundry world time for daily Meal Score and out-of-combat Hunger. Compendium entries show automation status. [The audit](docs/qa/v14-rule-audit.md) describes GM-managed rules and additional QA; [clarifications](docs/qa/rule-clarifications.md) document conflicting PDF passages.

## Development

Node 24/npm; runtime JavaScript has no external dependencies. Run npm ci, npm test, npm run test:ui, npm run test:packs and npm run build:packs. Stop Foundry before building native LevelDB packs because the databases have exclusive locks. Sources are in src/packs-source/.

For live tests, create a separate disposable world with id tg-qa, an unpassworded Gamemaster and this system installed. Run a valid local Foundry v14 server on port 30014, install Chromium with npx playwright install chromium, then run npm run test:foundry. Override the URL with TG_QA_URL. The suite refuses other world IDs, creates/deletes [TG QA] fixtures, and creates a test player. Screenshots/results go to ignored artifacts/.

Live checks cover document/sheet creation, pack loading, builder submission, effects, combat, conditions, healing, Edge drops, two clients, duplicate resolution and narrow-sheet overflow. Palette checks verify AA normal-text and control/focus contrast; they are not a complete accessibility certification.

## Release

Run npm run release:package to create the installable archive and manifests in artifacts/release/. Pushing a v* tag runs validation, builds packs and publishes assets through GitHub Actions. Packages exclude the developer PDF, tests, dependencies and database lock/log files.

## Attribution and limitations

The developer rulebook is expected locally at docs/rulebook/Tokyo Ghoul Tabletop RPG - Unofficial.pdf and is excluded from releases. Mechanics use formulas and concise paraphrases. The placeholder SVG is original; no official Tokyo Ghoul artwork, panels, music, logos or fonts are shipped. Tokyo Ghoul belongs to its respective rights holders.

French localization includes English stubs for newer controls. Spatial movement, cover, area membership, Dynamic abilities and narrative triggers require GM judgment; consult the audit rather than assuming complete automation.
