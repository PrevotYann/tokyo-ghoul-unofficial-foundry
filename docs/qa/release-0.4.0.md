# Version 0.4.0

**The Last Delivery** is an original Tokyo Ghoul one-shot for 4–6 players, now included as a native Foundry Adventure compendium. A stolen mortuary delivery leads investigators and ghouls through an uneasy truce, a clandestine clinic, and a freight-station rescue. All characters and artwork are original.

- One import creates six playable characters, six NPCs, fifteen standalone weapon/equipment/evidence Items, twelve journals, three scenes and their folders.
- Three generated top-down battlemaps include 75 wall segments, 11 interactive doors/gates, 20 ambient lights, token vision, fog exploration and linked journal pins.
- All six PC tokens are preplaced and linked on every scene. The core four start visible; reveal Nao for five players and Sora for six. NPC reinforcements start hidden.
- Full GM instructions include encounter scaling, separate character motives, evidence handouts, multiple clue routes, negotiations, surrender, rescue objectives and branching endings.
- Corrected Babele compendium-folder templates to use string names, preventing a Foundry folder-sorting error during imports.
- Added deterministic Adventure source generation, scene/asset validation and native import tests. Native compendium files retain their exact bytes across Git checkouts.

Validation: **96 unit tests**, three local UI checks, the 83 existing Item compendium records, native pack/release builds, and **204 Adventure runtime checks on Foundry 14.368**. Runtime checks use separate GM/player clients and cover native import, actor sheets/resources, every scene canvas, document links, PC vision, door collision, hidden token visibility and player permission to open/close unlocked doors.

After updating the system in Foundry Setup, launch your world and open **Tokyo Ghoul - Adventures → The Last Delivery • One-Shot**. Import **The Last Delivery**, then read **00 • GM Start Here**. Assign each player ownership of their selected pregen. The adventure is not automatically imported into existing worlds by the system update.

If you previously imported the development version, reimport to apply the completed scene setup. Reimport overwrites imported adventure documents and resource snapshots; preserve ongoing session changes first. Narrative clocks, surrender, keys/codes and some terrain interactions remain GM adjudicated. Encounter balance and the estimated 4–5 hour session length still require table playtesting. See [the adventure guide](https://github.com/PrevotYann/tokyo-ghoul-unofficial-foundry/blob/v0.4.0/docs/qa/last-delivery.md).

The existing latest-release manifest URL remains unchanged, so installed systems using it can update normally. Foundry v14 is required. The developer rulebook PDF remains excluded from releases.
