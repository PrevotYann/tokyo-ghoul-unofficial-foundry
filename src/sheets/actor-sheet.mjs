export class TokyoGhoulActorSheet extends foundry.applications.api.HandlebarsApplicationMixin(foundry.applications.sheets.ActorSheetV2) {
  static DEFAULT_OPTIONS = {
    classes: ["tg-system", "tg-sheet", "tg-actor-sheet"],
    position: { width: 820, height: 720 },
    window: { resizable: true },
    form: {
      handler: TokyoGhoulActorSheet.#onSubmit,
      submitOnChange: true,
      closeOnSubmit: false
    }
  };

  static PARTS = {
    form: {
      template: "systems/tokyo-ghoul-unofficial/templates/actor/character-sheet.hbs"
    }
  };

  async _prepareContext(options) {
    const context = await super._prepareContext(options);
    const actor = this.actor ?? this.document;
    return {
      ...context,
      actor,
      system: actor.system,
      stats: Object.entries(actor.system.stats ?? {}).map(([key, data]) => ({ key, data })),
      items: Array.from(actor.items ?? []),
      isEditable: this.isEditable
    };
  }

  static async #onSubmit(event, form, formData) {
    return this.document.update(formData.object);
  }
}
