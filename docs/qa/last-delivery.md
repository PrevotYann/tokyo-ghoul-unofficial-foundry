# The Last Delivery

An original, unofficial Tokyo Ghoul one-shot for **4–6 players**, designed for a **4–5 hour session**. All characters, locations and prose are original. The story uses the setting's ghoul hunger, CCG investigations, Kagune, Quinque and Quinx without canon characters or official artwork. The local investigator–ghoul truce is an exceptional agreement between individuals.

## Run it in Foundry v14

1. Install this repository's updated system package and restart Foundry to discover its new compendium.
2. Open **Tokyo Ghoul - Adventures → The Last Delivery • One-Shot**.
3. Open **The Last Delivery** and import all content through the native Adventure importer.
4. Open **Last Delivery • GM Guide → 00 • GM Start Here**.
5. Assign Aya, Ren, Mio and Daichi to four players. Add Nao for five and Sora for six. Give each player Owner permission on their actor and share their dossier privately.
6. Activate **01 • Rain at Sazanami**, use the four visible preplaced PCs and reveal Nao/Sora on each scene for five/six players, and share **A Meeting in the Rain**. All journals start private; reveal evidence only as discovered.

Native import preserves deterministic IDs and document references. Reimporting offers to overwrite existing imported documents; cancel if you want to keep ongoing session changes. Duplicate into another world for a separate run. Player assignment and selecting 4–6 PCs remain GM choices.

## Contents

| Content | Count | Details |
| --- | ---: | --- |
| Playable characters | 6 | Two investigators, three ghouls, one Quinx; 60 base stat points each, class-appropriate weapons, full derived resources, motives and private secrets |
| NPCs | 6 | Two coerced combatants, a developed ghoul boss, a coffee shop owner, courier and captive; the second captive uses another unlinked token |
| Standalone Items | 15 | Original Kagune and Quinque, field medkit, keys, camera, phone and original ledger; weapons also embedded on relevant actors |
| Journals | 12 | GM setup, truth, scaling, three keyed acts, endings, briefing, three evidence handouts and private dossiers |
| Scenes | 3 | Three original generated 1536 × 1024 top-down PNG maps, preplaced PC/NPC tokens, working walls/doors, ambient lights, vision, hidden reinforcements and 10 linked journal pins |
| Scene geometry | 75 wall segments | Includes 11 interactive doors/gates; aligned to building outlines, room partitions, vehicles, fences and platform edges |
| Dynamic lights | 20 | Wall-constrained ambient lights plus dim global night illumination |
| Token illustrations | 12 | Original vector silhouette tokens with individual initials and class colors |
| Adventure | 1 | One native LevelDB Adventure record with folders and all documents |

Premise: a stolen mortuary van exposes a broker replacing dead-body transfers with murdered living victims. The party investigates Sazanami's rainy alley, rescues the courier from Aobane Clinic, and reaches Shigure Freight Station before the last delivery. Rescue, exposure, surrender, bargaining and escape are supported. Three independent clues lead to each next location. The endings ask who receives the evidence and how dependent ghouls survive the route's closure.

## Automation and limits

Existing system workflows handle attacks, reactions, damage, regeneration, resource costs, medical kits and Kagune manifestation. Combat uses Squad mode. The adventure adds no house-rule engine or schema changes. Optional weapon Edges are left empty to simplify first-session play; the builder converts unused starting slots into RCL. The boss is a developed rinkaku ghoul with 96 Vitality, 84 Stamina and a 22-RCL Kagune, without Kakuja eligibility.

Scenes use a gridless 64 px / 5 ft measurement scale, artwork-aligned movement/sight walls, interactive doors and gates, wall-constrained ambient lights, token vision and fog exploration. Dim global illumination keeps outdoor paths navigable without revealing rooms through walls. All six PCs are preplaced and actor-linked on every scene: four core PCs visible, Nao/Sora hidden for the GM to reveal for larger parties. Linked PC resources persist across scenes. Closed solid doors block movement and sight; fences and fence gates block movement while allowing sight/light. The clinic service door and captive gate begin locked. Unlock them through native wall controls when keys, the code or story objectives succeed. Platform-lip movement walls leave stairs open; the GM adjudicates climbs. Cover, narrative interactions, surrender and story clocks remain GM adjudicated. Unlinked NPC tokens need wounds/resources carried across scenes manually. Human noncombatants use the system's investigator data subtype with no weapon, not Quinx or biological regeneration.

The guide provides 4/5/6-player reinforcement tables, retreat conditions and assistance for struggling groups. **Combat balance and session duration require table playtesting**; technical validation is not a playtest.

## Build and verify

```sh
npm run build:adventure
npm test
npm run test:adventure
```

`build:packs` also builds the Adventure. Stop Foundry before rebuilding its active databases. For an isolated output, use `npm run build:packs -- --output artifacts/packs`. The generated source bundle is `packs/last-delivery/_source.json`; edit the source modules under `src/packs-source/adventures/` and rebuild rather than editing the bundle. Stable IDs are based on content keys and version 1; keep keys stable for future updates. Scene configuration is content version 2, with the original Actor/Scene/Journal IDs preserved. Reimport the Adventure to update previously imported scenes; this also resets its NPCs and PC resource snapshots, so preserve ongoing play first. No migration is needed for this additive content pack.

`test:adventure` only operates in the disposable `tg-qa` world on v14, at `TG_QA_URL` or `http://localhost:30014`. It imports through Foundry's native importer, checks DataModels/resources, renders actor sheets and all scene canvases, resolves all journal links and pins, verifies private journal permissions and served map images, then removes its fixtures. It refuses to overwrite existing adventure documents.

Validated locally on **Foundry 14.368**: 204 adventure checks passed, including separate GM and player clients. Checks cover native import, all three canvases, linked PC placements, active vision sources, door controls, closed/open door collisions, invisible hidden tokens, and player permission to open/close unlocked doors. The full unit suite passed 96 tests, including scene configuration, bounds, non-overlapping party placement and connected door endpoints. Player-view screenshots and the latest report are under `artifacts/qa/`. The import test also exposed and fixed the English Babele pack-folder template format: names must be strings rather than `{name: ...}` objects for Foundry folder sorting. Older external translation modules may require the same correction in their `_packs-folders` file.

Manual QA: assign players, reveal one handout at a time, verify GM journals stay private, reveal optional PC tokens on each scene, check player vision through an opened door, unlock the clinic service door and captive gate, manifest a Kagune, run a targeted attack and reaction, spend a medkit, apply the correct reinforcement row, and complete each negotiation/rescue ending. Test on a narrow tablet and in both Foundry themes. Narrative balance is not yet playtested.

## Artwork and generation prompts

The three PNG battlemaps were made with the **built-in imagegen tool**, inspected, and copied into `assets/adventures/last-delivery/`. No API CLI was used. Prompts are recorded in [image-prompts.json](../../assets/adventures/last-delivery/image-prompts.json). Tokens are repository-native original SVG artwork; regenerate with `node scripts/generate-adventure-tokens.mjs`. No official images, logos, soundtrack or rulebook passages are included. Local rulebook PDFs remain excluded from release archives.

The package uses Foundry's [native Adventure document](https://foundryvtt.com/article/adventure/) to import the content and preserve its folders and links.
