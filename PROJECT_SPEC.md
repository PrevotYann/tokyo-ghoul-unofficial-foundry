# Project Specification - Tokyo Ghoul: Unofficial TTRPG for Foundry VTT v14

## Goal
Create a polished, automation-heavy Foundry VTT v14 system that lets a table play the Tokyo Ghoul tabletop RPG from the provided rulebook with minimal manual math.

## Target users
- Players creating Ghouls, Investigators, or Quinx.
- GMs running squad fights, raids, investigations, and progression.
- Homebrew-friendly groups that need support for custom Dynamic Edges and Quinque gimmicks.

## Core play entities
### Actor types
- `character`: player characters and important named NPCs.
- `npc`: simplified enemies and mobs for raids.
- Optional later: `organization` or `territory` if the GM needs campaign tracking.

### Character classes/factions
- `ghoul`: has Kagune, Hunger/Meal Score, regeneration, possible Kakuja.
- `investigator`: human CCG-style character with Quinque, Rage, Kakuhou storage, RC Bonds, possible Kakuja Quinque.
- `quinx`: hybrid with Kagune and Quinque; tracks Hunger and Rage; has two RCL concepts, with special Kakuja restrictions.

### Item types
- `kagune`
- `quinque`
- `edge`
- `gimmick`
- `maneuver`
- `consumable` (medkits, grenades, Q bullets, food/flesh abstractions)
- `kakuhou` (harvested resource for crafting/upgrading Quinque)
- `kakuja-armor`
- `condition` or Active Effect based condition items
- `loot` or `note` for campaign-specific items

## Required compendiums
- Edges - all Ghoul/Kagune and Investigator/Quinque edges.
- Maneuvers - Strike, Move, Ready, Take a Breather, All-Out Offensive, Counter, Enhance, Overextend, Grab, Throw, Heavy Strike, Dodge, Block, Take Hit.
- Conditions - Bleeding, Burning, Grappled, Hungry, Rage, Kakuja Active, RC-Limiter Gas, Regeneration Suppressed, Quinque Broken.
- Kagune Templates - Ukaku, Koukaku, Rinkaku, Bikaku plus optional Chimera template.
- Quinque Templates - Ukaku, Koukaku, Rinkaku, Bikaku, Sidearm, Kakuja Weapon, Kakuja Armor.
- Equipment - Medkit, Frag Grenade, Incendiary Grenade, RC Limiter Grenade, Q Bullet variants.
- Macros - common rolls and GM utility macros.

## Package features
### Must-have
- Modern Actor sheet with tabs: Overview, Combat, Kagune/Quinque, Edges, Progression, Inventory, Biography, Settings.
- Modern Item sheets for Kagune, Quinque, Edges, Gimmicks, Maneuvers, and consumables.
- Guided character builder with validation.
- Automatic formulas for derived stats and resources.
- Roll engine with d20 critical failure/success rules.
- Automated Strike workflow with target, range, resource cost, defense reaction, damage, conditions, and chat cards.
- Hunger/Rage threshold automation.
- Kakuja and Kakuja Quinque automation.
- Quinque forging/upgrading workflow.
- Squad combat and Raid combat modes.
- Rule status dashboard so the GM can see what is fully automated vs GM-adjudicated.

### Nice-to-have after MVP
- Drag/drop edge incompatibility warnings.
- Visual range chips and movement reminders.
- Token HUD buttons for Strike, Dodge, Block, Take Breather, Rage, Hunger, Kakuja.
- Journal importer that creates rule reference pages from concise paraphrased notes, not copyrighted full text.
- Settings to simplify optional harsh dodge/block consequences.
- Theme options: red-black, monochrome CCG, ghoul neon.

## Foundry v14 manifest requirements
The system root must include `system.json`. Keep the folder name identical to the manifest `id`. Use `documentTypes` to declare Actor and Item subtypes. Use `esmodules`, `styles`, `languages`, `packs`, `grid`, `initiative`, `primaryTokenAttribute`, and `secondaryTokenAttribute`.

Recommended manifest values:

```json
{
  "id": "tokyo-ghoul-unofficial",
  "title": "Tokyo Ghoul: Unofficial TTRPG",
  "description": "A free, unofficial Tokyo Ghoul tabletop RPG system for Foundry VTT v14.",
  "version": "0.1.0",
  "compatibility": { "minimum": "14", "verified": "14" },
  "esmodules": ["src/tokyo-ghoul.mjs"],
  "styles": ["styles/tokyo-ghoul.css", "styles/sheets.css"],
  "languages": [{ "lang": "en", "name": "English", "path": "lang/en.json" }],
  "documentTypes": {
    "Actor": { "character": {}, "npc": {} },
    "Item": {
      "kagune": {},
      "quinque": {},
      "edge": {},
      "gimmick": {},
      "maneuver": {},
      "consumable": {},
      "kakuhou": {},
      "kakuja-armor": {},
      "condition": {},
      "loot": {}
    }
  },
  "initiative": "@stats.spd.total",
  "grid": { "distance": 5, "units": "ft" },
  "primaryTokenAttribute": "resources.vitality",
  "secondaryTokenAttribute": "resources.stamina"
}
```

Note: If the v14 build requires a different initiative formula syntax for system data, adjust accordingly and document the change.

## Release standards
- CI or local scripts must lint, test, build packs, and zip releases.
- Release zip must unpack to a folder named `tokyo-ghoul-unofficial` containing `system.json` at the top level.
- Version every schema change and write a migration.
- README must describe how to install manually and through manifest URL.
