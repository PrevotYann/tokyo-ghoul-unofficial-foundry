# Tokyo Ghoul: Unofficial TTRPG for Foundry VTT

A free, fan/unofficial Foundry VTT v14 system implementation for a Tokyo Ghoul tabletop RPG.

Tokyo Ghoul is owned by its respective rights holders. This package does not include official artwork, manga panels, anime screenshots, music, logos, fonts, or paid content. Use only with materials you have permission to use.

## Status

Phase 0-1 skeleton is in progress:

- Foundry v14 `system.json`
- ESM entrypoint
- Actor and Item document types
- DataModel stubs
- Basic Actor and Item sheets
- Pure derived-stat functions and unit tests

Full combat, compendiums, character builder, Hunger/Rage workflows, Kakuja, and progression are planned in later phases from `IMPLEMENTATION_PLAN.md`.

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

Open the simple in-world character builder from the Foundry console:

```js
game.tokyoGhoul.openCharacterBuilder()
```

## Smoke Test

In a clean Foundry v14 world:

1. Enable the system by creating a world with it.
2. Create a `character` Actor.
3. Open the Actor sheet and edit class, stats, and current resources.
4. Create one Item of each declared type.
5. Open the Item sheets and confirm the generic fields render.
6. Confirm the browser console has no system load errors.

## Rulebook Source

The rulebook PDF is expected locally at:

`docs/rulebook/Tokyo Ghoul Tabletop RPG - Unofficial.pdf`

Do not paste long verbatim rulebook text into source files or compendiums. Encode mechanics as formulas, data, and concise paraphrased help.
