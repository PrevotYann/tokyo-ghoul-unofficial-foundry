import { assignEdgeToWeapon } from "./edge-assignment.mjs";
import { parseDropData } from "../ui/drag-drop.mjs";

export class TokyoGhoulItemSheet extends foundry.applications.api.HandlebarsApplicationMixin(foundry.applications.sheets.ItemSheetV2) {
  static DEFAULT_OPTIONS = {
    classes: ["tg-system", "tg-sheet", "tg-item-sheet"],
    position: { width: 520, height: "auto" },
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
      weaponTypes: ["ukaku","koukaku","rinkaku","bikaku"],
      edgesText: Array.from(item.system.edges ?? []).join(", "),
      sourceEdgesText: Array.from(item.system.sourceEdges ?? []).join(", "),
      grantedEdgesText: Array.from(item.system.grantedEdges ?? []).join(", "),
      isEditable: this.isEditable
    };
  }

  _onRender(context, options) {
    super._onRender(context, options);
    if (this.isEditable && ["kagune", "quinque"].includes(this.document.type)) {
      this.element.ondragover = event => event.preventDefault();
      this.element.ondrop = event => this._onDrop(event);
    }
  }

  async _onDrop(event) {
    event.preventDefault();
    const data = parseDropData(event);
    if (data?.type !== "Item" || !data.uuid || !this.isEditable) return false;
    return assignEdgeToWeapon(this.document, await fromUuid(data.uuid));
  }

  static async #onSubmit(event, form, formData) {
    if (!this.isEditable) return;
    const data = formData.object;
    for (const field of ["edges", "sourceEdges", "grantedEdges"]) {
      const key = `system.${field}`;
      if (typeof data[key] === "string") data[key] = data[key].split(",").map(s => s.trim()).filter(Boolean);
    }
    if (data["system.secondaryType"] === "") data["system.secondaryType"] = null;
    return this.document.update(data);
  }
}
