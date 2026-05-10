# Sheets and UX Specification

## Visual direction
Create a modern dark interface inspired by urban horror without copying official Tokyo Ghoul logos or assets.

Style keywords:
- Dark charcoal backgrounds.
- Deep red accent.
- White/gray typography.
- Subtle glass panels and red glow only where useful.
- Clean stat cards, chips, progress bars, and compact controls.
- Responsive CSS grid.
- Strong focus states and keyboard accessibility.

## Actor sheet layout
### Header
- Character portrait.
- Name and alias.
- Class badge: Ghoul / Investigator / Quinx.
- Rank badge.
- Active Kagune/Quinque summary.
- Quick resources: Vitality, Stamina, Meal Score, Rage, RC Bonds.
- Quick actions: Strike, Dodge, Block, Take a Breather, Enhance, Hunger/Rage Check.

### Overview tab
- Six stat cards with base/temp/total.
- Derived resources with editable current values.
- Threshold markers for Hunger/Rage.
- Type advantage summary.
- Active conditions.
- Validation warnings.

### Combat tab
- Maneuver budget and reserved reaction state.
- Available maneuvers as action cards.
- Equipped weapons/Kagune attacks.
- Range selector or target range display.
- Recent combat log.
- Buttons for Squad/Raid mode if GM.

### Kagune/Quinque tab
For Ghouls:
- Kagune type, RCL, manifest state, range, edge slots, evolution controls.

For Investigators:
- Equipped Quinque cards, RC Bonds, sidearm ammo, storage, Kakuhou storage.

For Quinx:
- Both sections side-by-side or stacked.

### Edges tab
- Edge slots with drag/drop.
- Incompatibility warnings.
- Edge automation badges.
- Dynamic Edge notes and custom effect editor.

### Progression tab
- Stat points.
- Consumption/Kakuhou log.
- RCL gains and spending.
- Kagune Evolution.
- Quinque forge/upgrade.
- Kakuja eligibility and mastery tracker.

### Inventory tab
- Consumables: medkits, grenades, Q bullets, flesh/meal sources.
- Loot and custom items.

### Biography tab
- Appearance, personality, backstory, likes, dislikes, goals.
- No social stat; this is roleplay support.

### Settings tab
- Automation level per actor.
- Optional rule toggles.
- GM notes.

## Item sheets
### Kagune sheet
- Type selector and visual range summary.
- RCL and evolution spending.
- Edge slots.
- Type bonuses/drawbacks preview.
- Attack buttons for melee/projectile if relevant.

### Quinque sheet
- Type, RCL, RC Bonds.
- Equipped/stored status.
- Edge slots.
- Gimmick configuration.
- Sidearm configuration.
- Kakuja weapon/armor options.
- Repair tracker.

### Edge sheet
- Category and prerequisites.
- Slot cost and incompatibilities.
- Effects and formulas.
- Automation status.
- Custom/Dynamic controls.

### Maneuver sheet
- Cost formula.
- Action/reaction type.
- Granted by which Edge if restricted.
- Chat action id.

### Consumable sheet
- Quantity/max carry.
- Use button.
- Effect preview.

## Automation UX requirements
- Every automated button should show the formula before rolling/applying.
- Every resource change should create a chat message, unless batch/quiet mode is enabled.
- Dangerous automatic changes should have GM confirmation in early versions.
- Always show which rule caused a modifier.
- Show warnings instead of silently blocking where a GM override could be valid.

## Chat card design
A good attack chat card includes:
- Attacker and target.
- Attack type and source item.
- Range and type advantage.
- Attack roll formula and result.
- Defense buttons: Dodge, Block, Take Hit.
- Damage formula.
- Stamina cost.
- Condition applications.
- Follow-up counterattack buttons if defense succeeds enough.

## Accessibility
- Use semantic buttons.
- Ensure keyboard focus is visible.
- Do not rely on color alone.
- Keep icons decorative unless they convey information, then provide text labels.
- Allow reduced motion.
- Ensure all numeric inputs have labels and sane min/max.

## Localization
All user-facing text must use localization keys:
- `TG.stats.str.label`
- `TG.resources.vitality.label`
- `TG.classes.ghoul`
- `TG.kagune.ukaku`
- `TG.edges.quickStrikes.name`
- etc.

## Mobile/narrow support
Minimum acceptable behavior:
- Header stacks.
- Tabs remain usable.
- Stat cards wrap.
- Combat buttons remain large enough to tap.
- Long item lists scroll inside sections rather than overflowing the window.
