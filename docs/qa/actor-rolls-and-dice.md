# Actor rolls and Dice So Nice!

The reported `event.currentTarget is null` exception occurred after awaiting the stat-roll dialog. DOM event dispatch clears `currentTarget` when the listener returns; the stat key is now captured before opening the dialog. Other sheet handlers read their action/Item identifiers before their first await.

Both registered Actor document types (`character` and `npc`) share the sheet and support the three identity classes (`ghoul`, `investigator`, `quinx`). Human characters use `investigator`; no new Actor type or migration is introduced.

Class controls:

| Control | Ghoul | Investigator/human | Quinx |
| --- | --- | --- | --- |
| Meal Score, feed, consume, Kagune evolution | Yes | Hidden | Yes |
| Rage | Hidden | Yes | Yes |
| Kakuja | Half/full | Hidden | Half only |
| Forge/upgrade Quinque | Hidden | Yes | Yes |
| Reload | Owned sidearm | Owned sidearm | Owned sidearm |
| Gimmick activation | Owned Gimmick | Owned Gimmick | Owned Gimmick |

Existing owned equipment is retained for editing, export and GM exceptions. Inert Use buttons on Loot, Kakuhou, Conditions and Kakuja armor are removed; armor retains its activation button. Administrative resource edits keep their existing behavior.

Evaluated Foundry Roll instances are attached to chat messages for stat checks, attacks, rolled defenses, Hunger/Rage, Kakuja mastery and Burning. Natural 20 retains exactly one extra die. Rule summaries stored in flags remain serializable; live Roll references are non-enumerable and no Actor/Item data schema changes are required. Automatic Edge successes/failures and take-hit/interpose do not invent dice.

Dice So Nice! theme registration uses `diceSoNiceReady`, `addColorset` and, where supported, `addRole` for the basic default. Saved player appearance is not overwritten. The module is optional and its files are not bundled with this system.

Validation in the disposable local world, Foundry **14.368**:

- 98 unit tests; three UI/contrast checks; 83 compendium source records.
- 219 Actor sheet checks: Character/NPC × three classes, six delayed stat-button clicks per combination, modifiers/targets, identical native dice, cancel, tabs, derived updates and equipment-dependent controls. Includes an actual native dialog submitted through browser controls.
- 35 existing sheet-content checks: all Item types, rich text, persisted edits, read-only permissions, boolean controls and narrow layouts.
- 76 runtime checks with Dice So Nice! active: builders, every document type, combat modes, attacks, defense, permissions, resources, conditions and narrow layouts; attack, Dodge and Block cards retain native dice.
- Dice So Nice! **6.4.3**: 11 checks including the registered default theme and real start/completion hooks for ordinary, natural-20 and natural-1 animations.

The Actor regression waits for Foundry's chat notification animation before deleting temporary messages; deleting a card during that core animation otherwise causes a Foundry `#postNotification` error unrelated to sheet actions.

For manual follow-up, change a Character and an NPC between all three classes, reopen every tab, roll each stat with bonus/penalty/target, cancel a dialog, equip/withdraw a weapon, and verify the owner's and observer's controls. With Dice So Nice! enabled, compare the 3D face to the chat card, exercise Dodge/Block, Hunger/Rage and mastery, and check a player's custom appearance remains selected after reload.
