# Foundry v14 Smoke Test

1. Install this folder as `Data/systems/tokyo-ghoul-unofficial`.
2. Start Foundry VTT v14 and create a clean world with this system.
3. Create a `character` Actor and open its sheet.
4. Confirm Vitality, Stamina, and Meal Score maxima derive from the default stats.
5. Change the class selector to Ghoul, Investigator, and Quinx; click Apply Class Setup and confirm missing starting Kagune/Quinque items are created.
6. Confirm Meal Score is shown for Ghoul and Quinx but not shown for Investigator.
7. Run `game.tokyoGhoul.openCharacterBuilder()` in the console, create each class, and confirm starter owned items are created.
   - The builder should open as a centered, framed window and should not move or resize the Foundry sidebar.
8. Create Items of type `kagune`, `quinque`, `edge`, `gimmick`, `maneuver`, `consumable`, `kakuhou`, `kakuja-armor`, `condition`, and `loot`.
9. Open each Item sheet.
   - A new consumable window should fit its content at roughly 520px wide, with automation in the header and the description visible without scrolling on a 1366px desktop.
   - Header controls on actor, item and builder windows must show recognizable icons; check tooltips, the controls menu and Close, including keyboard focus.
   - Check Copy UUID and the resize grip too. Check native roll dialogs and Active Effect popups. Icons must use the appropriate Font Awesome family/weight rather than the sheet text font; normal button labels must remain readable text.
   - Resize an item window to 360px wide: fields must remain readable without horizontal overflow. Longer weapon/Edge descriptions must remain scrollable, and textareas must still resize.
   - Change automation, quantity and description; close and reopen the item to confirm changes are saved.
10. Use Strike from an actor sheet with a target selected; confirm the attack card lists target, range, roll, damage, and stamina cost.
11. Click Dodge, Block, and Take Hit from attack cards using a target actor or controlled token; confirm defense cards are created and resources change on failed defenses/take-hit.
12. Use Take a Breather and confirm Stamina recovers; if Rage is active, confirm it ends.
13. Check the browser console for load or sheet-rendering errors.
