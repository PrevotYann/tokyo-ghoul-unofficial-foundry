# Version 0.4.1

Fixes the raw HTML and checkbox layout reported on character and weapon sheets.

- Biography, progression notes, rule notes, all Item descriptions, Edge notes and Gimmick effects now display enriched HTML with formatting and Foundry document links.
- Text is read-only by default. Owners explicitly open the native Foundry rich text editor using a visible, accessible pencil button and save their changes. Read-only sheets hide the editing controls.
- Kagune manifestation, Quinque equipment and Kakuja options, and other boolean controls now use compact native checkboxes with clear horizontal labels. Corrected the generic input styling and removed duplicate Foundry checkbox glyphs.
- Existing text and document data are preserved; no data migration or adventure reimport is required.

Validation: 96 unit tests, three local UI checks, 83 Item pack source records, 35 sheet regression checks in Foundry 14.368, and release packaging. The sheet checks cover formatted content on every affected Actor tab and Item category, explicit owner editing, persisted saves, read-only controls, checkbox sizing and boolean updates, and narrow layouts.

Update the system from Foundry Setup, then relaunch your world and reopen the sheets. The existing latest-release manifest URL remains unchanged.
