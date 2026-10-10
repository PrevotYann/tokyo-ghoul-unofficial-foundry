# Four-actor combat audit

Executed on 2026-10-10 in the disposable `tg-qa` world using local Foundry **14.368**. The local 38-page PDF was consulted for the relevant detailed rules. No campaign world was modified.

## Characters

| Build | Class | Equipment and abilities |
| --- | --- | --- |
| Shooter | Ghoul | Ukaku; Sharpened, Quick Strikes, Preemptive; ranged allocation |
| Bruiser | Ghoul | Koukaku; Heavy Strikes, Blunt, Breathing Exercises; tank allocation |
| Medic | Investigator | Bikaku Quinque; Healer and Grenadier; marksman allocation |
| Hybrid | Quinx | Rinkaku Kagune and Koukaku Quinque; Hardy and Sidearm; bruiser allocation |

Temporary equipment variants exercise regenerating Rinkaku Quinque, standard Gimmicks with deterministic mechanical effects, Grappler, Massive, Cannibalistic/Kakuja and speed armor. Every starting allocation contains 60 points.

## Verification

The four-actor suite passed **173 live assertions**, with no browser exceptions. It uses actual Actor/Item updates, native dice, ChatMessage cards, the Counter button, and Combat start/next-turn/end lifecycles. Die values are controlled, including fumbles and criticals; production rolling code is unchanged. Resource snapshots after every scenario are saved alongside checks in `artifacts/qa/four-actor-combat.json`. All created actors, embedded items, combats and related chat cards are cleaned up.

The existing integration suite also passed **76 runtime checks**, including separate GM/player clients and duplicate requests. **103 unit tests**, **3 UI checks** and validation of **83 pack source records** passed. The simulation server used port 30015 because 30014 belonged to another project.

Coverage includes derived type bonuses/penalties and Active Effects; Squad initiative and turn budgets; first-turn and reserved reactions; successful and failed Dodge/Block; Take Hit and interpose; duplicate resolution; attack costs and overflow; ranges, Overextend and Massive; Heavy Strike and All-Out; Rage/Hunger checks, allocation and action costs; Breather; medical healing and wound pools; ordinary/high-speed/suppressed regeneration; Bleeding/Burning; all three grenade types and source-turn expiry; Gimmick activation/upkeep, utility Edges and defensive cooldown; Grab/Throw and collision damage; Sidearm ammunition/refill; broken-weapon recovery; Kakuja eligibility, bonuses, mastery, loss of control and cleanup; Raid damage/costs and new-defeat rewards; speed armor maneuvers and six-turn parasitic drain.

## Corrections

1. Await turn processing before GM navigation/actions/reactions finish; fixed sleeps are unnecessary.
2. Scope acted/reaction eligibility to each combat so previous fights cannot bypass first-turn restrictions.
3. Remove healed wounds from injury tracking and log actual medkit healing.
4. Keep completely broken regenerating Quinque unavailable for their full recovery delay.
5. Clear Kakuja episode state on deactivation/reactivation while preserving GM control of living uncontrolled characters.
6. Remove an undefined variable that crashed consumption rewards.
7. Charge Rage for defensive reactions and separate free follow-up actions.
8. Track defense Gimmick cooldown by wielder turns and use the correct grenade defense target.
9. Prevent Counter stance from defeating automatic hits.
10. Grant Raid follow-ups only when a living target becomes defeated.
11. Validate Grab range and calculate Throw distance from the weapon used for that grapple, including armor cost exceptions.

Interpretations and PDF references are recorded in [rule-clarifications.md](rule-clarifications.md).

## Reproduction and limits

Run `npm test`, `npm run test:packs`, `npm run test:ui`, then `npm run test:combat` and `npm run test:foundry` against a separate v14 `tg-qa` server. Set `TG_QA_URL` to change the default `http://localhost:30014`. Run live suites sequentially because they share world documents.

This is scripted functional verification, not statistical game-balance testing. Scene cover, cloud boundaries/exits, token movement, narrative Ready triggers, custom Dynamic abilities, carry limits and downtime/ordinary repairs retain the GM decisions documented in the existing rule audit. Rest here means the rulebook's Take a Breather; no unsupported long-rest healing rule was added. World-calendar advancement and cloud exit/lingering still need the manual QA steps in [v14-rule-audit.md](v14-rule-audit.md).
