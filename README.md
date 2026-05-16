# Tokyo Ghoul: Unofficial TTRPG for Foundry VTT

A free, fan/unofficial Foundry VTT v14 system implementation for a Tokyo Ghoul tabletop RPG.

Tokyo Ghoul is owned by its respective rights holders. This package does not include official artwork, manga panels, anime screenshots, music, logos, fonts, or paid content. Use only with materials you have permission to use.

## Status

Current implementation status is tracked in `IMPLEMENTATION_PLAN.md`. The system currently includes:

- Foundry v14 `system.json`
- ESM entrypoint
- Actor and Item document types
- DataModels for actor and item types
- Actor and Item sheets with class setup, resource automation, attacks, and basic defenses
- Pack source validation for Edges, Maneuvers, Conditions, equipment, Kagune, Quinque, Gimmicks, and Kakuja armor
- Pure rules helpers and unit tests for derived stats, rolls, combat math, Hunger/Rage, conditions, gear, builder drafts, Gimmicks, progression/crafting, and Kakuja helpers
- A simple in-world character builder

## Manual Install

1. Copy or symlink this repository folder into your Foundry user data systems folder as `tokyo-ghoul-unofficial`.
2. Confirm `system.json` is at the top level of that folder.
3. Start Foundry VTT v14.
4. Create a new world using `Tokyo Ghoul: Unofficial TTRPG`.

Example PowerShell symlink:

```powershell
New-Item -ItemType SymbolicLink `
  -Path "$env:LOCALAPPDATA\FoundryVTT\Data\systems\tokyo-ghoul-unofficial" `
  -Target "C:\git\tokyo-ghoul-unofficial-foundry"
```

## Development

Run pure unit tests outside Foundry:

```powershell
npm test
```

Validate pack source records:

```powershell
npm run test:packs
```

Build source bundles for the declared packs:

```powershell
npm run build:packs
```

Open the simple in-world character builder from the Foundry console:

```js
game.tokyoGhoul.openCharacterBuilder()
```

If a test window ever renders in a bad position while developing, reload the browser tab. The builder is designed to reopen centered and closes any prior builder instance first.

## Smoke Test

In a clean Foundry v14 world:

1. Enable the system by creating a world with it.
2. Create a `character` Actor.
3. Open the Actor sheet and edit class, stats, and current resources.
4. Change class setup between Ghoul, Investigator, and Quinx and confirm starting items/resources update.
5. Run `game.tokyoGhoul.openCharacterBuilder()` and confirm it opens as a centered framed window.
6. Create one Item of each declared type.
7. Open the Item sheets and confirm the fields render.
8. Confirm the browser console has no system load errors.

## Rulebook Source

The rulebook PDF is expected locally at:

`docs/rulebook/Tokyo Ghoul Tabletop RPG - Unofficial.pdf`

Do not paste long verbatim rulebook text into source files or compendiums. Encode mechanics as formulas, data, and concise paraphrased help.
