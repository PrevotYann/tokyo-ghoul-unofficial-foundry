import { promptAttackOptions, promptRollOptions, promptFields } from "./roll-dialogs.mjs";
import { assignEdgeToWeapon } from "./edge-assignment.mjs";
import { parseDropData } from "../ui/drag-drop.mjs";
import { createKaguneDraft, createQuinqueDraft, getClassStartingProfile } from "../rules/character-builder.mjs";
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

  #activeTab = "overview";

  async _prepareContext(options) {
    const context = await super._prepareContext(options);
    const actor = this.actor ?? this.document;
    const items = Array.from(actor.items ?? []);
    return {
      ...context,
      actor,
      system: actor.system,
      usesMealScore: actor.system.identity?.class === "ghoul" || actor.system.identity?.class === "quinx",
      effects: actor.effects.contents,
      rangeBands: ["melee","close","mid","long","far"],
      kakujaStages: ["none","half","full"],
      maneuverActions: ["move","ready","reload","allOut","counter","overextend","heavyStrike","grab","throw","breakGrapple"],
      stats: Object.entries(actor.system.stats ?? {}).map(([key, data]) => ({ key, data })),
      itemGroups: this.#groupItems(items),
      validation: validateCharacterSystemData(actor.system, items),
      isEditable: this.isEditable
    };
  }

  async _onRender(context, options) {
    await super._onRender(context, options);
    this.#activateTab(this.#activeTab);
    this.element.querySelectorAll("[data-effect-id]").forEach(button => button.addEventListener("click", () => this.actor.effects.get(button.dataset.effectId)?.sheet.render({force:true})));
    this.element.querySelectorAll("[data-item-action]").forEach(button => button.addEventListener("click", event => this.#onItemAction(event)));
    this.element.querySelectorAll("[data-tg-tab]").forEach((button) => {
      button.addEventListener("click", (event) => this.#activateTab(event.currentTarget.dataset.tgTab));
      button.addEventListener("keydown", event => {
        const tabs = Array.from(this.element.querySelectorAll("[data-tg-tab]"));
        const index = tabs.indexOf(button);
        const next = event.key === "ArrowRight" ? (index+1)%tabs.length : event.key === "ArrowLeft" ? (index+tabs.length-1)%tabs.length : event.key === "Home" ? 0 : event.key === "End" ? tabs.length-1 : null;
        if (next === null) return;
        event.preventDefault(); this.#activateTab(tabs[next].dataset.tgTab); tabs[next].focus();
      });
    });
    this.element.querySelectorAll("[data-roll-stat]").forEach((button) => {
      button.addEventListener("click", (event) => this.#onRollStat(event));
    });
    this.element.querySelectorAll("[data-actor-action]").forEach((button) => {
      button.addEventListener("click", (event) => this.#onActorAction(event));
    });

    if (!this.isEditable) this.element.querySelectorAll("[data-actor-action], [data-roll-stat], [data-item-action]:not([data-item-action=edit])").forEach(button => button.disabled = true);
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

    if (!this.isEditable) return false;
    if (item.type === "edge") {
      const weapons = actor.items.filter(i => ["kagune", "quinque"].includes(i.type));
      let weapon = actor.items.get(event.target?.closest?.("[data-item-id]")?.dataset.itemId);
      if (!["kagune", "quinque"].includes(weapon?.type)) {
        if (!weapons.length) return false;
        const choice = await promptFields("TG.sheet.edges", [{name:"weapon",label:"TG.chat.source",value:weapons[0].id,options:weapons.map(i => ({value:i.id,label:i.name}))}]);
        if (!choice) return false;
        weapon = actor.items.get(choice.weapon);
      }
      return assignEdgeToWeapon(weapon, item);
    }
    const source = item.toObject();
    delete source._id;
    await actor.createEmbeddedDocuments("Item", [source]);
    return true;
  }

  #activateTab(tab) {
    this.#activeTab = tab;
    this.element.querySelectorAll("[data-tg-tab]").forEach((button) => {
      button.classList.toggle("active", button.dataset.tgTab === tab);
      button.setAttribute("aria-selected", String(button.dataset.tgTab === tab));
      button.tabIndex = button.dataset.tgTab === tab ? 0 : -1;
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

  async #onRollStat(event) {
    event.preventDefault();
    const actor = this.actor ?? this.document;
    if (!this.isEditable) return;
    const options = await promptRollOptions();
    if (!options) return;
    await actor.rollCheck(event.currentTarget.dataset.rollStat, {bonus:Number(options.bonus),penalty:Number(options.penalty), ...(options.targetNumber !== "" ? {targetNumber:Number(options.targetNumber)} : {})});
  }

  async #onActorAction(event) {
    event.preventDefault();
    const actor = this.actor ?? this.document;
    const action = event.currentTarget.dataset.actorAction;

    if (!this.isEditable) return;
    if (["strike", "heavyStrike", "overextend", "allOut"].includes(action)) {
      const data = await promptAttackOptions(actor);
      if (data) return actor.useManeuver(action, {...data.options,item:data.item});
      return;
    }
    if (["move", "ready", "counter", "reload", "grab", "throw", "breakGrapple"].includes(action)) return actor.useManeuver(action);
    if (action === "addEffect") { const [effect] = await actor.createEmbeddedDocuments("ActiveEffect", [{name:game.i18n.localize("TG.sheet.effects"),system:{changes:[]}}]); return effect.sheet.render({force:true}); }
    if (["consume","spendPoints","evolve","forge","upgrade"].includes(action)) return actor.progressionDialog(action);
    if (action === "rage") return actor.enterRage();
    if (action === "assignStats") return actor.allocateTemporaryStats(actor.system.resources.rage.active ? "rage" : "hunger");
    if (action === "feed") return actor.feed();
    if (action === "mastery") return actor.checkKakujaMastery();
    if (action === "dodge") return actor.rollCheck("spd", { reaction: "dodge" });
    if (action === "block") return actor.rollCheck("end", { reaction: "block" });
    if (action === "breather") return actor.useManeuver("breather");
    if (action === "reserveReaction") return actor.reserveReactionManeuver();
    if (action === "controlCheck") return actor.checkHungerOrRage("manual");
    if (action === "toggleGimmick") return actor.toggleGimmick();
    if (action === "activateKakuja") return actor.activateKakuja({ stage: actor.system.kakuja?.stage === "full" ? "full" : "half" });
    if (action === "deactivateKakuja") return actor.deactivateKakuja();
    if (action === "setupClass") return this.#setupClass(actor);
  }

  async #onClassChange(event) {
    const actor = this.actor ?? this.document;
    await actor.update({ "system.identity.class": event.currentTarget.value });
  }

  async #setupClass(actor) {
    const actorClass = actor.system.identity.class;
    const profile = getClassStartingProfile(actorClass);
    const embedded = [];

    if (profile.needsKagune && !actor.items.some((item) => item.type === "kagune")) {
      embedded.push(createKaguneDraft({ actorClass }));
    }

    if (profile.needsQuinque && !actor.items.some((item) => item.type === "quinque")) {
      embedded.push(createQuinqueDraft({ actorClass }));
    }

    const update = {
      "system.identity.faction": actorClass === "ghoul" ? "ghoul" : "ccg",
      "system.resources.maneuverBudget.max": actor.system.combat?.mode === "raid" ? 3 : 2,
      "system.resources.maneuverBudget.value": actor.system.combat?.mode === "raid" ? 3 : 2
    };

    await actor.update(update);
    if (embedded.length) await actor.createEmbeddedDocuments("Item", embedded);
    ui.notifications?.info(game.i18n.format("TG.notifications.classSetupApplied", { class: game.i18n.localize(`TG.classes.${actorClass}`) }));
  }

  async #onItemAction(event) {
    event.preventDefault();
    const item = this.actor.items.get(event.currentTarget.closest("[data-item-id]")?.dataset.itemId);
    if (!item) return;
    const action = event.currentTarget.dataset.itemAction;
    if (action === "edit") return item.sheet.render({force:true});
    if (!this.isEditable) return;
    if (action === "delete") return item.deleteDialog();
    if (action === "switchForm") return item.setFlag("tokyo-ghoul-unofficial","activeForm",item.getFlag("tokyo-ghoul-unofficial","activeForm") === "secondary" ? "primary" : "secondary");
    if (action === "toggle") {
      const field = item.type === "quinque" ? "equipped" : "manifested";
      return item.update({[`system.${field}`]:!item.system[field], ...(item.type === "kakuja-armor" ? {"system.turnsActive":0} : {})});
    }
    if (item.type === "gimmick") return this.actor.toggleGimmick(item);
    if (item.type === "consumable") return this.actor.useConsumable(item);
    if (item.type === "maneuver") return this.actor.useManeuver(item.system.chatAction);
    if (["kagune","quinque"].includes(item.type)) {
      const data = await promptAttackOptions(this.actor,item);
      if (data) return this.actor.rollAttack(data.item,data.options);
    }
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
    if (!this.isEditable) return;
    return this.document.update(formData.object);
  }
}
