import { createCharacterDraft, STAT_PRESETS } from "../rules/character-builder.mjs";

export async function createActorFromCharacterDraft(options = {}) {
  const draft = createCharacterDraft(options);
  const { items, validation, ...actorData } = draft;

  if (!validation.valid) {
    ui.notifications?.warn(game.i18n.format("TG.notifications.invalidBuilderStats", {
      total: validation.total,
      expected: validation.expected
    }));
    return null;
  }

  const actor = await Actor.create(actorData);
  if (items.length) await actor.createEmbeddedDocuments("Item", items);
  actor.sheet?.render?.({ force: true });
  return actor;
}

export class CharacterBuilderApp extends foundry.applications.api.HandlebarsApplicationMixin(foundry.applications.api.ApplicationV2) {
  static DEFAULT_OPTIONS = {
    id: "tg-character-builder",
    classes: ["tg-system", "tg-builder"],
    window: { title: "TG.builder.title", resizable: true },
    position: { width: 560, height: 520 },
    form: {
      handler: CharacterBuilderApp.#onSubmit,
      submitOnChange: false,
      closeOnSubmit: true
    }
  };

  static PARTS = {
    form: {
      template: "systems/tokyo-ghoul-unofficial/templates/apps/character-builder.hbs"
    }
  };

  async _prepareContext(options) {
    const context = await super._prepareContext(options);
    return {
      ...context,
      presets: Object.keys(STAT_PRESETS)
    };
  }

  static async #onSubmit(event, form, formData) {
    const data = formData.object;
    await createActorFromCharacterDraft({
      name: data.name || game.i18n.localize("TG.builder.defaultName"),
      actorClass: data.actorClass || "ghoul",
      statPreset: data.statPreset || "balanced",
      kaguneType: data.kaguneType || "ukaku",
      quinqueType: data.quinqueType || "ukaku"
    });
  }
}
