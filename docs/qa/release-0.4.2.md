# Version 0.4.2

Stat rolls now work after the roll dialog closes. Character and NPC sheets adapt their controls to Ghouls, Investigators (humans) and Quinx.

- Fixes the `event.currentTarget is null` exception by capturing the selected stat before awaiting the dialog.
- Hides unrelated class controls: Ghouls use Hunger and Kagune/Kakuja progression; Investigators use Rage and Quinque forging/upgrades; Quinx use both with half-Kakuja only.
- Shows Reload and Gimmick controls when the relevant equipment is owned; removes inert Use buttons from non-usable inventory entries.
- Adds optional Dice So Nice! support for stat, attack, defense, control, mastery and Burning rolls. Critical rolls animate the actual extra d20, without rerolling or duplicate animation calls.
- Registers the Tokyo Ghoul red/black theme as a basic dice default on supported Dice So Nice! versions. Saved player customizations take precedence; older versions still offer the theme in their settings.
- Preserves existing Actor/Item data, owned equipment and compendium identities. No migration or adventure reimport is required.

Validation: 98 unit tests, three UI checks, 83 Item pack source records, 330 live checks in Foundry **14.368**, and 11 Dice So Nice! **6.4.3** checks including ordinary, critical and fumble animations. See [detailed QA](actor-rolls-and-dice.md).

Update the system from Foundry Setup, relaunch the world and reopen the sheets. Install and activate Dice So Nice! separately to enable 3D dice. The existing latest-release manifest URL remains unchanged.
