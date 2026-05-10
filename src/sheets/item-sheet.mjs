export class TokyoGhoulItemSheet extends foundry.applications.api.HandlebarsApplicationMixin(foundry.applications.sheets.ItemSheetV2) {
  static DEFAULT_OPTIONS = {
    classes: ["tg-system", "tg-sheet", "tg-item-sheet"],
    position: { width: 620, height: 560 },
    window: { resizable: true },
    form: {
      handler: TokyoGhoulItemSheet.#onSubmit,
      submitOnChange: true,
      closeOnSubmit: false
    }
  };

  static PARTS = {
    form: {
      template: "systems/tokyo-ghoul-unofficial/templates/item/item-sheet.hbs"
    }
  };

  async _prepareContext(options) {
    const context = await super._prepareContext(options);
    const item = this.item ?? this.document;
    return {
      ...context,
      item,
      system: item.system,
      isEditable: this.isEditable
    };
  }

  static async #onSubmit(event, form, formData) {
    return this.document.update(formData.object);
  }
}
