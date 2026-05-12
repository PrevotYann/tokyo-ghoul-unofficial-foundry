# Foundry v14 Smoke Test

1. Install this folder as `Data/systems/tokyo-ghoul-unofficial`.
2. Start Foundry VTT v14 and create a clean world with this system.
3. Create a `character` Actor and open its sheet.
4. Confirm Vitality, Stamina, and Meal Score maxima derive from the default stats.
5. Change the class selector to Ghoul, Investigator, and Quinx; click Apply Class Setup and confirm missing starting Kagune/Quinque items are created.
6. Create Items of type `kagune`, `quinque`, `edge`, `gimmick`, `maneuver`, `consumable`, `kakuhou`, `kakuja-armor`, `condition`, and `loot`.
7. Open each Item sheet.
8. Use Strike from an actor sheet with a target selected; confirm the attack card lists target, range, roll, damage, and stamina cost.
9. Click Dodge, Block, and Take Hit from attack cards using a target actor or controlled token; confirm defense cards are created and resources change on failed defenses/take-hit.
10. Use Take a Breather and confirm Stamina recovers; if Rage is active, confirm it ends.
11. Check the browser console for load or sheet-rendering errors.
