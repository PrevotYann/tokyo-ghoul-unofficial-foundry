import { parseDropData } from "../ui/drag-drop.mjs";
import { validateCharacterSystemData } from "../rules/validation.mjs";

export class TokyoGhoulActorSheet extends foundry.applications.api.HandlebarsApplicationMixin(foundry.applications.sheets.ActorSheetV2) {
  static DEFAULT_OPTIONS = {
    classes: ["tg-system", "tg-sheet", "tg-actor-sheet"],
    position: { width: 920, height: 760 },
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
    const items = Array.from(actor.items ?? []);
    return {
      ...context,
      actor,
      system: actor.system,
      stats: Object.entries(actor.system.stats ?? {}).map(([key, data]) => ({ key, data })),
      itemGroups: this.#groupItems(items),
      validation: validateCharacterSystemData(actor.system, items),
      isEditable: this.isEditable
    };
  }

  async _onRender(context, options) {
    await super._onRender(context, options);
    this.element.querySelectorAll("[data-tg-tab]").forEach((button) => {
      button.addEventListener("click", (event) => this.#activateTab(event.currentTarget.dataset.tgTab));
    });
    this.element.querySelectorAll("[data-item-id]").forEach((row) => {
      row.setAttribute("draggable", "true");
      row.addEventListener("dragstart", (event) => this.#onDragItem(event));
    });
  }

  async _onDrop(event) {
    const data = parseDropData(event);
    if (data?.type !== "Item") return super._onDrop(event);

    const actor = this.actor ?? this.document;
    const item = await fromUuid(data.uuid);
    if (!item) return false;

    const source = item.toObject();
    delete source._id;
    await actor.createEmbeddedDocuments("Item", [source]);
    return true;
  }

  #activateTab(tab) {
    this.element.querySelectorAll("[data-tg-tab]").forEach((button) => {
      button.classList.toggle("active", button.dataset.tgTab === tab);
    });
    this.element.querySelectorAll("[data-tg-panel]").forEach((panel) => {
      panel.hidden = panel.dataset.tgPanel !== tab;
    });
  }

  #onDragItem(event) {
    const actor = this.actor ?? this.document;
    const item = actor.items.get(event.currentTarget.dataset.itemId);
    if (!item) return;
    event.dataTransfer.setData("text/plain", JSON.stringify(item.toDragData()));
  }

  #groupItems(items) {
    const groups = {
      weapons: { label: "TG.sheet.weapons", items: [] },
      edges: { label: "TG.sheet.edges", items: [] },
      maneuvers: { label: "TG.sheet.maneuvers", items: [] },
      inventory: { label: "TG.sheet.inventory", items: [] },
      conditions: { label: "TG.sheet.conditions", items: [] }
    };

    for (const item of items) {
      if (["kagune", "quinque", "kakuja-armor"].includes(item.type)) groups.weapons.items.push(item);
      else if (["edge", "gimmick"].includes(item.type)) groups.edges.items.push(item);
      else if (item.type === "maneuver") groups.maneuvers.items.push(item);
      else if (item.type === "condition") groups.conditions.items.push(item);
      else groups.inventory.items.push(item);
    }

    return Object.entries(groups).map(([key, group]) => ({ key, ...group }));
  }

  static async #onSubmit(event, form, formData) {
    return this.document.update(formData.object);
  }
}
