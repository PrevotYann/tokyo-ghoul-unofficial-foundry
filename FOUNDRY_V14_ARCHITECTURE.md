# Foundry VTT v14 Architecture

## Foundry version assumptions
Target Foundry VTT v14. Use the current public v14 API docs during implementation. Foundry systems require a `system.json` manifest at the system root, and custom document sub-types are declared through `documentTypes` and paired with DataModel definitions in code.

## Boot sequence
`src/tokyo-ghoul.mjs` should:
1. Import config, data models, documents, sheets, helpers, and rule modules.
2. Register DataModels for Actor and Item document types during `init`.
3. Register custom Actor and Item document classes.
4. Register ActorSheetV2/ItemSheetV2 classes and make them defaults for this system.
5. Register Handlebars helpers and partials.
6. Register system settings.
7. Register combat hooks and chat card listeners.
8. On `ready`, run migrations and optional compendium sanity checks.

## DataModels over loose data
Prefer explicit DataModels for all Actor and Item subtypes. If `template.json` is used for compatibility, keep it generated from the DataModel schema and do not manually diverge it.

## Document classes
### `TokyoGhoulActor`
Responsibilities:
- Prepare base data and derived data.
- Aggregate owned items into active Kagune, active/equipped Quinque, edges, maneuvers, consumables, conditions.
- Expose helpers such as:
  - `getStat(key, options)`
  - `getRcl(source)`
  - `getVitalityMax()`
  - `getStaminaMax()`
  - `getMealScoreMax()`
  - `getAvailableManeuvers()`
  - `canUseManeuver(id)`
  - `rollCheck(statKey, options)`
  - `rollAttack(item, options)`
  - `applyDamage(amount, options)`
  - `spendStamina(amount, options)`
  - `takeBreather()`
  - `checkHungerOrRage(trigger)`

### `TokyoGhoulItem`
Responsibilities:
- Normalize item data.
- Validate edge compatibility and slot usage.
- Provide item-specific roll data.
- Provide active effect data for edges and conditions.

### Combat helper or custom Combat subclass
If v14 supports safe substitution or extension, add a combat helper that:
- Supports Squad and Raid mode.
- Sorts initiative by SPD, with ghoul/investigator tie logic where possible.
- Tracks per-turn maneuver budgets and reserved reaction maneuvers.
- Applies start/end turn effects: Bleeding, Burning, regeneration, Kakuja drains, Hunger/Rage drains, grapple drain, gimmick costs, RC limiter durations.

If a Combat subclass is too invasive, use hooks and flags on Combat/Combatant.

## Sheets
Use v14 sheet classes (`ActorSheetV2`, `ItemSheetV2`, or `DocumentSheetV2` descendants as appropriate). Keep template context creation pure and tested.

Actor sheet must include:
- Summary header with class, rank, Kagune/Quinque, VIT/STM/Meal/Rage chips.
- Editable base stats and read-only derived totals.
- Button row for common actions.
- Drag/drop inventory and edge slots.
- Validation panel that flags invalid edge combinations, missing weapons, over-cap stats, incorrect RCL, and invalid Kakuja prerequisites.

Item sheet must include:
- Data fields.
- Applicable constraints.
- Automation status.
- Formula preview.
- For Dynamic Edge/Gimmick, a GM notes area and a structured custom effect builder.

## Roll and chat workflow
Create chat cards for:
- Basic stat checks.
- Passive TN checks.
- Contested checks.
- Attack declaration.
- Defense reaction selection.
- Damage and condition application.
- Hunger/Rage checks.
- Kakuja mastery rolls.
- Quinque forging/upgrading.

Chat cards should store enough flags to resolve buttons later:
- Attacker Actor UUID.
- Target Token/Actor UUID.
- Item UUID.
- Attack roll total.
- Damage expression and result.
- Range and type advantage metadata.
- Pending reaction state.

## Targeting and permissions
- Use Foundry's token targeting for attack workflows.
- Only the owning player or GM can spend a character's resources.
- GM override buttons should exist for applying damage, correcting resources, or accepting optional interpretations.

## Settings
Implement at least these settings:
- `automationLevel`: `full`, `assisted`, `manual`.
- `defenseConsequences`: enable/disable harsh failed dodge/block penalties.
- `autoApplyDamage`: GM-only default false for early versions.
- `autoThresholdChecks`: prompt or automatic Hunger/Rage threshold checks.
- `raidMode`: combat-level setting, not global only.
- `useDetailedBurningRule`: default true; see rule conflict notes.
- `showRuleHelp`: show concise paraphrased help in sheets.
- `theme`: red-black default.

## Migrations
Implement `src/rules/migrations.mjs` with:
- System schema version stored in world settings.
- Actor migration registry.
- Item migration registry.
- Pack migration helper.
- Dry-run logging.

## Packs
Pack build can use Foundry's normal compendium workflow or JSON source files converted by a build script. Store source data under `src/packs-source/` if useful and generate db/pack content for releases.

## No private API rule
Foundry's public API has stability promises. Avoid private/internal APIs unless absolutely necessary, and when used:
- Wrap the call in a small compatibility function.
- Add a comment with the v14 build tested.
- Add a migration/compatibility note.
