# Version 0.6.0

All 13 characters in The Last Delivery now have individually generated dark urban anime illustrations in place of the silhouette placeholders: Aya, Ren, Mio, Daichi, Nao, Sora, Emi, Yui, Haru, Riku, Chika, Masato and Kaito.

- The same transparent circular portrait appears on character/NPC sheets, prototype tokens and the adventure's placed tokens. Investigator cyan, ghoul rose, Quinx gold, human sage and boss crimson distinguish factions.
- Each original illustration was generated separately with the built-in image tool using the previous token and the adventure's character role as references. The full prompt set is included at `assets/adventures/last-delivery/tokens/image-prompts.json`.
- Sazanami Alley, Aobane Clinic and Shigure Station map images are byte-for-byte unchanged. Their scene geometry, lighting, doors, token positions and journals are preserved.
- No official anime/manga artwork, canonical character designs or logos are included.

## Upgrading

Install the update, then load the world as the active GM. Schema migration 4 replaces only exact bundled legacy SVG image paths on world actors, prototype tokens, scene tokens and unlinked token artwork overrides. Custom image paths are preserved independently for portraits and tokens. Resources, character data, permissions and adventure progress are unaffected; no adventure reimport is needed for the artwork. Legacy SVGs remain bundled for older references and compendiums.

## Validation

- `npm test`: all 117 unit tests pass, including artwork paths, migration/custom-art preservation and fixed SHA-256 checks for the three existing map files.
- `npm run test:ui`: all 3 checks pass, including the browser font check using the local Foundry v14 public directory.
- `npm run test:packs`: all 83 source records validate. All native packs rebuilt successfully; the Adventure contains 13 actors, 15 items, 15 journals, 3 scenes and 1 macro.
- `npm run test:adventure-art` on Foundry 14.368: all 47 checks pass. Each 1254 × 1254 PNG loads with transparency; a real sheet displays its portrait; schema 4 upgrades a wounded actor and an unlinked token while preserving a custom prototype image and the scene's background, walls and lighting. A repeated migration is safe. No browser page errors.
- `npm run test:adventure` on Foundry 14.368: all 223 checks pass, covering native import, all 13 actor sheets, resources, links, three scenes, walls/doors, lighting, GM/player permissions and visibility. No browser page errors. Both live suites ran against an isolated copy of the disposable `tg-qa` world.
- Visual review of all 13 illustrations together; full generated scene data matches v0.5.0 except token texture paths.
- Installable ZIP and both manifests verified: v0.6.0 URLs, all 13 PNGs and native pack source included, unchanged map hashes, valid ZIP checksums, no rulebook PDF or dependencies.
