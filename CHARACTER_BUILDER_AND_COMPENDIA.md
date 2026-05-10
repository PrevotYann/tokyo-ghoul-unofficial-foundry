# Character Builder and Compendia

## Character builder goals
Create a guided builder that produces valid characters and teaches the system without requiring the user to read every rule during setup.

## Builder steps
### Step 1 - Concept and class
Fields:
- Name, alias, pronouns, faction.
- Class: Ghoul, Investigator, Quinx.
- Rank: default C-Rank for Ghoul, Rank 2 or Rank 3 for Investigator depending GM preference.
- Biography prompts: appearance, personality, backstory, likes, dislikes, goals.

Validation:
- Ghoul requires Kagune.
- Investigator requires Quinque.
- Quinx requires both Kagune and Quinque.

### Step 2 - Kagune builder
For Ghoul or Quinx:
1. Choose type: Ukaku, Koukaku, Rinkaku, Bikaku.
2. Apply type modifiers and range.
3. Set starting RCL: Ghoul 10, Quinx 5.
4. Select Edges: Ghoul up to 3, Quinx up to 1.
5. For each unused Edge slot, add +2 RCL.
6. Apply free Ghoul Regeneration or High-Speed Regeneration if Rinkaku.
7. Validate restrictions/incompatibilities.
8. If Chimera is selected, choose secondary Kagune type and allocate the extra Edges.

### Step 3 - Quinque builder
For Investigator or Quinx:
1. Choose type: Ukaku, Koukaku, Rinkaku, Bikaku.
2. Set starting RCL 10.
3. Select Edges: Investigator up to 3, Quinx up to 2.
4. For each unused Edge slot, add +2 RCL.
5. Configure Sidearm, Gimmick, Chimera, Healer, or Grenadier if selected.
6. Initialize RC Bonds.
7. Validate carried Quinque count.

### Step 4 - Stats
- Start with 60 points across STR, ACC, PER, END, SPD, CRL.
- Provide presets:
  - Balanced: 10 each.
  - Ukaku ranged: ACC/SPD/PER focus.
  - Koukaku tank: END/STR/CRL focus.
  - Rinkaku bruiser: STR/END/PER focus.
  - Investigator brawler: STR/PER/END focus.
  - Investigator marksman: ACC/PER/SPD focus.
- Display derived changes live.

### Step 5 - Review
Show warnings:
- Incompatible Edges.
- Missing required choices.
- Unspent/overspent stats.
- Invalid Kakuja/Chimera states.
- RCL inconsistencies.
- Empty biography prompts.

Create Actor and owned Items only when validation passes or GM overrides.

## Compendium source strategy
Store source JSON under `src/packs-source/`. Create a build script to import into Foundry packs, or provide documented manual pack generation.

Recommended structure:
```text
src/packs-source/
  edges-ghoul.json
  edges-investigator.json
  maneuvers.json
  conditions.json
  consumables.json
  templates-kagune.json
  templates-quinque.json
  macros.json
```

## Edge compendium data fields
Each Edge entry needs:
- Name.
- Category: Ghoul, Investigator, Universal.
- Applies to: Actor/Kagune/Quinque/Kakuja.
- Slot cost.
- Prerequisites.
- Type restrictions.
- Incompatibilities.
- Granted maneuvers.
- Passive bonuses.
- Automation status.
- Concise paraphrased rule summary.
- Implementation hook id, e.g. `edge.quickStrikes`.

## Maneuver compendium entries
Create entries for:
- Strike
- Move
- Ready
- Take a Breather
- All-Out Offensive
- Counter
- Enhance
- Overextend
- Grab
- Throw
- Heavy Strike
- Dodge
- Block
- Take Hit

Each maneuver needs:
- Action type and reaction type.
- Cost formula.
- Targeting requirements.
- Range requirements.
- Chat card action id.
- Automation status.

## Condition compendium entries
Create entries for:
- Bleeding
- Burning
- Grappled
- Hunger Active
- Rage Active
- Regeneration Suppressed
- Kakuja Active
- Lost Control
- RC Limiter Cloud
- Quinque Broken

Each condition needs:
- Stackable or not.
- Start-turn/end-turn behavior.
- Removal rules.
- ActiveEffect transfer behavior.
- Icon. Use original simple SVG icons, not copyrighted assets.

## GM custom content tools
Because Dynamic Edges and Gimmicks are core to the game, the system must include structured custom content support:
- Custom Edge builder with fields for stat bonus, roll bonus, granted maneuver, ongoing cost, damage formula, condition application, and GM notes.
- Custom Gimmick builder with active toggle and resource cost.
- Warning when custom formulas cannot be safely automated.
- Chat card support for manual custom effects.

## Sample content
Include original, generic sample items only:
- `Sample Ukaku Kagune`
- `Sample Koukaku Shield Quinque`
- `Sample Rinkaku Tendril Kagune`
- `Sample Bikaku Tail Kagune`
- `Sample Investigator Sidearm`
- `Sample Medkit`
- `Sample Frag Grenade`

Do not include named canon characters, official weapon names, official art, or copyrighted images unless the repository owner supplies licensed content.
