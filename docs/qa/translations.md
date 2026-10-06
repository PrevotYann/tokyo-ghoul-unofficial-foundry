# Translation modules and Babele

English is the base language: UI strings live in `lang/en.json`, compendium sources in `src/packs-source/`, and Babele starter files in `babele/en/`. The bundled French UI remains optional. Missing module translations use Foundry's English fallback; no world language setting is forced.

UI and compendium translations are separate. Foundry loads UI translations through a module's `languages` manifest entry. Babele loads pack translations through `babele.init`. Babele is optional for the system and required by a compendium translation module. Use a Babele release compatible with Foundry v14 (minimum 2.8.0).

## Create a module

From the system repository, run:

```sh
npm run build:translations -- --module --lang fr --output artifacts/translation-module/fr
```

Replace `fr` with your language code. This creates an installable starter:

```text
module.json
register.mjs
lang/fr.json
compendium/fr/tokyo-ghoul-unofficial.edges.json
compendium/fr/tokyo-ghoul-unofficial.maneuvers.json
compendium/fr/tokyo-ghoul-unofficial.conditions.json
compendium/fr/tokyo-ghoul-unofficial.equipment.json
compendium/fr/tokyo-ghoul-unofficial.sample-kagune.json
compendium/fr/tokyo-ghoul-unofficial.sample-quinque.json
compendium/fr/tokyo-ghoul-unofficial._packs-folders.json
```

All starter values are English. Edit the module title, language display name, author and distribution details in `module.json` before publishing. Translate values in `lang/fr.json`, retaining localization keys and placeholders such as `{actor}` and `{amount}`. Translate pack `label`, folder values, and entry `name`, `description`, `notes`, `dynamicNotes` and `dynamicEffect` values wherever present. Preserve HTML markup and Foundry UUID links.

The registration file uses the public bootstrap API:

```js
Hooks.once("babele.init", babele => {
  babele.register({
    module: "tokyo-ghoul-unofficial-fr",
    lang: "fr",
    dir: "compendium/fr"
  });
});
```

Install the generated folder as `Data/modules/tokyo-ghoul-unofficial-fr/`. Install and enable Babele and the translation module, choose the language in Foundry's core settings, and reload. You can also copy only the pack JSON files into a Babele local translation directory organized by language.

## Identity and mappings

Entry keys are the original 16-character compendium document IDs. Keep these keys unchanged. Ghoul and Investigator Edges can share an English name but have different IDs. The source builder and translation generator share the same ID calculation, preserving existing pack UUIDs. Folder keys stay in English; translate only their values. `_packs-folders` handles the two system sidebar groups.

Every pack includes its own mapping. Descriptions use `system.description`, which is an HTML string in this system. Edge notes use `system.notes`; Kagune notes use `system.dynamicNotes`; Dynamic Gimmicks use `system.dynamicEffect`. Do not change the mapped paths or add mappings for mechanical fields.

Edge automation uses `system.ruleId` (for example `high-speed-regeneration`), independent of its translated name. Keep it unchanged. Weapon `edges`, Kakuhou `sourceEdges`, Gimmick `grantedEdges`, and Kakuja Edge references are mechanical identifiers. Their editors accept comma-separated rule IDs. Builder options and progression menus show translated labels and store IDs. Translate `TG.edges.*` UI values to localize stored Edge references in progression menus.

Do not translate stat keys, document types, categories, action IDs, Kagune types, condition IDs, automation levels, formulas, effect hooks, constraints, or Edge references. Translating those values changes the rules. A translated weapon's damage, range, costs, slots and prerequisites must match its English source.

Schema v3 assigns stable IDs to existing world and embedded Edges, recovering renamed imports from compendium provenance or Babele's original-name metadata. It also converts known Edge references to IDs without changing custom references. An old translated custom Edge with no provenance or original-name metadata needs its canonical `system.ruleId` supplied explicitly; a translation cannot be inferred from its display name alone. Existing campaign names and narrative content are preserved.

## Maintain and verify

Run `npm run build:translations` after changing English compendium content. Tests check that all six templates and the sidebar-folder template match the sources and that literal UI keys have English values. Generate updates into a new directory and merge them into your translation module; regenerating directly into a translated directory overwrites its values with English.

Run `npm test`, `npm run test:packs`, and `npm run test:ui`. Native compendiums can be built separately with `npm run build:packs -- --output artifacts/translation-packs`; stop Foundry before building into the system's `packs/` directory.

In a disposable Foundry v14 world:

1. Disable Babele and select English. Verify sheets, builder, chat, pack labels, folders and descriptions use English and no missing-key strings appear.
2. Enable Babele and a translation module. Verify all six packs and both sidebar groups translate, including both same-named Cannibalistic Edges.
3. Build Ghoul, Investigator and Quinx characters using translated Edges. Verify starting RCL, Healer's two slots, Sidearm ammo, and regeneration bonuses.
4. Drop a translated Hardy or Preemptive Edge onto a weapon. Verify the canonical ID is stored, defense bonuses apply, and duplicate/incompatible drops are rejected.
5. Forge and swap Edges using a Kakuhou, evolve Chimera, and activate Kakuja with translated Cannibalistic. Verify costs, prerequisites and grants match English.
6. Import an Edge, rename it, and migrate a copy of an older world. Verify its ID survives without renaming the item or resetting Actor bonuses.
7. Disable the translation module, switch back to English and reload. Verify original compendium content remains English. Already imported campaign documents keep their names; Babele's Actor translation workflow can update them when desired.

References: [Babele documentation](https://gitlab.com/riccisi/foundryvtt-babele/-/wikis/Docs) and [Babele source](https://gitlab.com/riccisi/foundryvtt-babele).
