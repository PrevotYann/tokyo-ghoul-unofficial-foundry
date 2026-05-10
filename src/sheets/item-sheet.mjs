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
      typeFlags: {
        isKagune: item.type === "kagune",
        isQuinque: item.type === "quinque",
        isEdge: item.type === "edge",
        isGimmick: item.type === "gimmick",
        isManeuver: item.type === "maneuver",
        isConsumable: item.type === "consumable",
        isKakuhou: item.type === "kakuhou",
        isKakujaArmor: item.type === "kakuja-armor",
        isCondition: item.type === "condition",
        isLoot: item.type === "loot"
      },
      isEditable: this.isEditable
    };
  }

  static async #onSubmit(event, form, formData) {
    return this.document.update(formData.object);
  }
}
