export class CharacterBuilderApp extends foundry.applications.api.ApplicationV2 {
  static DEFAULT_OPTIONS = {
    id: "tg-character-builder",
    classes: ["tg-system", "tg-builder"],
    window: { title: "TG.builder.title", resizable: true },
    position: { width: 720, height: 640 }
  };
}
