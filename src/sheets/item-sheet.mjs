import { enrichSheetFields, labelRichTextEditors } from "./rich-text.mjs";
import { assignEdgeToWeapon } from "./edge-assignment.mjs";
import { parseDropData } from "../ui/drag-drop.mjs";
import { TG_CONFIG } from "../config.mjs";

export class TokyoGhoulItemSheet extends foundry.applications.api.HandlebarsApplicationMixin(foundry.applications.sheets.ItemSheetV2) {
  static DEFAULT_OPTIONS = {
    classes: ["tg-system", "tg-sheet", "tg-item-sheet"],
    position: { width: 560, height: "auto" },
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
      enriched: await enrichSheetFields(item, ["description", "notes", "dynamicEffect", "dynamicNotes"]),
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
      rc: ["kagune", "quinque"].includes(item.type) ? item.system.primaryType : item.type === "kakuja-armor" ? item.system.armorType : item.type === "kakuhou" ? item.system.sourceKaguneType : null,
      heroStat: TokyoGhoulItemSheet.#heroStat(item),
      options: {
        gimmickTypes: ["attack", "defense", "form", "utility", "dynamic"].map(value => ({ value, label: `TG.gimmicks.${value}` })),
        staminaModes: ["maxEndSpd", "tripleMaxEndSpd", "custom", "none"].map(value => ({ value, label: `TG.staminaModes.${value}` })),
        consumableTypes: ["medkit", "fragGrenade", "incendiaryGrenade", "rcLimiterGrenade", "qBullet", "other"].map(value => ({ value, label: `TG.consumables.${value}` })),
        maneuverTypes: ["action", "reaction"].map(value => ({ value, label: `TG.maneuverTypes.${value}` })),
        chatActions: ["strike", "heavyStrike", "overextend", "allOut", "move", "ready", "breather", "counter", "enhance", "grab", "throw", "breakGrapple", "reload", "dodge", "block", "takeHit"].map(value => ({ value, label: `TG.actions.${value}` })),
        edgeCategories: ["ghoul", "investigator", "universal"].map(value => ({ value, label: `TG.edgeCategories.${value}` })),
        selectedStats: ["str", "acc", "per", "end", "spd", "crl", "rcl"].map(value => ({ value, label: `TG.stats.${value}.label` })),
        ranks: TG_CONFIG.ranks.ghoul.map(value => ({ value, label: `TG.ranks.${value}` }))
      },
      edgesText: Array.from(item.system.edges ?? []).join(", "),
      sourceEdgesText: Array.from(item.system.sourceEdges ?? []).join(", "),
      grantedEdgesText: Array.from(item.system.grantedEdges ?? []).join(", "),
      isEditable: this.isEditable
    };
  }

  static #heroStat(item) {
    const system = item.system;
    if (["kagune", "quinque", "kakuja-armor"].includes(item.type)) return { label: "TG.resources.rcl.label", value: system.rcl };
    if (item.type === "kakuhou") return { label: "TG.resources.rcl.label", value: system.sourceRcl };
    if (item.type === "consumable" || item.type === "loot") return { label: "TG.sheet.quantity", value: system.quantity ?? 1 };
    if (item.type === "condition") return { label: "TG.sheet.stacks", value: system.stacks };
    if (item.type === "edge") return { label: "TG.sheet.slots", value: system.slots };
    return null;
  }

  _onRender(context, options) {
    super._onRender(context, options);
    labelRichTextEditors(this.element);
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
    for (const key of ["system.secondaryType", "system.selectedStat"]) if (data[key] === "") data[key] = null;
    return this.document.update(data);
  }
}
