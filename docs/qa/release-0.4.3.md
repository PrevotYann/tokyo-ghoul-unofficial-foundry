# Version 0.4.3

Combat and recovery now handle turn timing, wound tracking, reaction costs and equipment delays consistently across Ghoul, Investigator and Quinx builds.

- Wait for GM turn processing to finish before turn navigation and action/reaction resolution; prevent reaction state from carrying into a new combat.
- Remove medically healed wounds from injury tracking and report actual healing rather than the uncapped amount.
- Respect the two-turn recovery delay of completely broken regenerating Quinque.
- Fix the consumption reward crash caused by an undefined variable.
- Clear Kakuja episode state when it ends while retaining GM control of living uncontrolled characters.
- Apply Rage costs to defensive reactions and separate free follow-up attacks.
- Track defense Gimmick cooldowns by wielder turns and use the correct grenade defense target.
- Prevent Counter stance from avoiding automatic hits and prevent repeated Raid rewards from an already defeated target.
- Validate Grab range and use the original grapple weapon's RCL for Throw distance, including armor cost exceptions.
- Add a reproducible four-actor combat suite, resource transcripts and rule clarifications.

Validation: **103 unit tests**, **173 live combat assertions across 17 scenarios**, **76 Foundry integration checks**, **3 UI checks** and **83 pack source records**, using Foundry **14.368**. See the [combat audit](https://github.com/PrevotYann/tokyo-ghoul-unofficial-foundry/blob/v0.4.3/docs/qa/four-actor-combat.md) and [rule interpretations](https://github.com/PrevotYann/tokyo-ghoul-unofficial-foundry/blob/v0.4.3/docs/qa/rule-clarifications.md).

Update the system from Foundry Setup and relaunch the world. Actor/Item schemas and compendium identities remain compatible; no adventure reimport is required. Finish the current combat before updating, since reaction and Gimmick timing state now use combat identity. Spatial and narrative GM decisions remain documented in the rule audit. The latest-release manifest URL is unchanged.
