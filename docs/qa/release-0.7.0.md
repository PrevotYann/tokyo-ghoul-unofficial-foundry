# Version 0.7.0

The Last Delivery has been balance-tested encounter by encounter with a Monte-Carlo simulator built on the system's own combat formulas. Before this release every fight ended in round one: Chika yielded on her first wound, Riku (SPD 3) was shot to his yield threshold before he could act, and Kurose (96 Vitality) fell to one round of focused attacks. Now each scene is a real fight, and the night stays winnable.

## Balance changes

| | Before | After |
| --- | --- | --- |
| Kurose (4 players) | 96 VIT / 84 STM, PER 10, regen 12 | 126 VIT / 102 STM, PER 12, END 18, CRL 30, regen 18; same 36 damage, yields at 24 |
| Riku | 93 VIT / 60 STM, SPD 3, yields at 46 | 123 VIT / 96 STM, SPD 11, Hardy Iron Wake, yields at 30 |
| Station opposition | Kurose alone (4p) | Kurose + Chika at every size until Kaito is freed; Riku joins at 6 players only if he escaped the clinic |
| 6-player alley | Chika + Riku from round 2 | Chika; Riku only watches and withdraws to warn the clinic |
| Party-size scaling | Reinforcement table only | GM panel also adds temporary CRL: Kurose +10 / +30 (156 / 216 VIT), Riku +8 / +16 (147 / 171 VIT) at 5 / 6 players |
| Healing | Daichi, Aya and Nao each carried a kit nobody could use (medkits require the Healer Edge) | Aya has the Healer Edge (Signal Nine RCL 16 → 12) and three kits; the clinic restocks two |

The GM guide now names the intended opposition tactics: one Strike plus one reserved reaction per NPC turn, no attacks against PCs who have not yet acted (they cannot defend), and attacks spread across active PCs.

## Simulated results

`npm run sim:adventure` (2,000 runs per row). The full night carries PC wounds, Stamina, spent kits and escaped NPCs across all three scenes, with one breather and Aya's field medicine between scenes.

| Players | Night win, recommended tactics | Night win, ruthless GM (double strike + focus fire) | Station: rounds / any PC down |
| ---: | ---: | ---: | ---: |
| 4 | 95–98% | 85% | 2.4–2.7 / 36–60% |
| 5 | 97.5–99.9% | 94% | 2.3–2.4 / 36–56% |
| 6 | 100% | 100% | 3.1–3.4 / 53–66% (worst case with Riku) |

A "loss" means every PC is unconscious. The endings already cover Kurose escaping, and the simulator never frees Kaito, so real tables have an extra easy-mode lever.

## Token and pin placement

All three maps were rendered with walls, tokens and pins overlaid and reviewed:

- Alley: Chika now hides among the loading-yard crates instead of sitting under the yard pin; the coffee shop and delivery van pins no longer cover Emi or straddle the van's wall.
- Clinic: Yui is tied to the treatment-room chair as the text describes; the hidden Chika reinforcement waits outside the side service door instead of inside the office under its pin.
- Station: Kurose stands at the loading desk with the ledger; the desk pin sits on the desk; the South service route pin marks the real service gap by the captive gate instead of covering Aya at the main entrance; the captives and van cab pins are clear of tokens and walls.

New unit tests reject any token that straddles a wall or any pin that covers a token.

## Upgrading

Adventure content version 4. Reimport The Last Delivery to get the new NPC profiles, positions and journals (this resets imported adventure state; finish or back up ongoing play first). Then click the party size in the GM Control Panel before the first scene so Kurose and Riku are scaled. No schema migration is needed. The external French translation module may still show the older journal text until it is updated.

## Validation

- `npm test`: 125 unit tests pass, including 6 new seeded balance tests and new placement and medkit tests.
- `npm run test:packs`: all 83 source records validate; the Adventure was rebuilt (13 actors, 15 items, 15 journals, 3 scenes).
- `npm run test:adventure` on Foundry 14.368: 225 checks pass (native import, all sheets, canvases, links, pins, doors, GM and player clients). The suite now also removes the imported macro during cleanup.
- `npm run test:adventure-balance` on Foundry 14.368: 20 live checks pass, covering imported NPC profiles, party-size scaling to 156 / 216 and back while preserving wounds, unlinked station tokens inheriting the scaling, Chika visible at the station, and Aya's kit healing PER + END and consuming a kit.
- Both live suites ran against the disposable `tg-qa` world, which was restored from a backup afterwards.
