import { enrichSheetFields, labelRichTextEditors } from "./rich-text.mjs";
import { promptAttackOptions, promptRollOptions, promptFields } from "./roll-dialogs.mjs";
import { assignEdgeToWeapon } from "./edge-assignment.mjs";
import { parseDropData } from "../ui/drag-drop.mjs";
import { createKaguneDraft, createQuinqueDraft, getClassStartingProfile } from "../rules/character-builder.mjs";
import { validateCharacterSystemData, countCarriedQuinque, QUINQUE_CARRY_LIMIT } from "../rules/validation.mjs";
import { TG_CONFIG } from "../config.mjs";
import { edgeLabel } from "../localization/labels.mjs";
import { equivalentRank, pips, resourceBar, statDelta } from "../ui/sheet-view.mjs";

export class TokyoGhoulActorSheet extends foundry.applications.api.HandlebarsApplicationMixin(foundry.applications.sheets.ActorSheetV2) {
  static DEFAULT_OPTIONS = {
    classes: ["tg-system", "tg-sheet", "tg-actor-sheet"],
    position: { width: 940, height: 800 },
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
    const system = actor.system;
    const actorClass = system.identity?.class;
    const usesMealScore = ["ghoul", "quinx"].includes(actorClass);
    const usesRage = ["investigator", "quinx"].includes(actorClass);
    return {
      ...context,
      actor,
      system,
      enriched: await enrichSheetFields(actor, ["biography.appearance", "biography.personality", "biography.backstory", "biography.goals", "progression.notes", "automation.ruleNotes"]),
      usesMealScore,
      usesRage,
      usesKakuja: ["ghoul", "quinx"].includes(actorClass),
      usesQuinque: ["investigator", "quinx"].includes(actorClass),
      hasGimmicks: items.some(item => item.type === "gimmick"),
      effects: actor.effects.contents,
      rangeBands: ["melee","close","mid","long","far"],
      quickActions: ["strike", "dodge", "block", "breather", "controlCheck"],
      kakujaStages: actorClass === "quinx" ? ["none", "half"] : ["none", "half", "full"],
      maneuverActions: ["move","ready","allOut","counter","overextend","heavyStrike","grab","throw","breakGrapple", ...(items.some(item => item.type === "quinque" && item.system.sidearm?.enabled) ? ["reload"] : [])],
      stats: Object.entries(system.stats ?? {}).map(([key, data]) => ({ key, data, delta: statDelta(data) })),
      itemGroups: this.#groupItems(items),
      validation: validateCharacterSystemData(system, items),
      view: this.#buildView(actor, items, { usesMealScore, usesRage }),
      isEditable: this.isEditable
    };
  }

  #buildView(actor, items, { usesMealScore, usesRage }) {
    const system = actor.system;
    const actorClass = system.identity?.class ?? "ghoul";
    const rankField = actorClass === "ghoul" ? "rankGhoul" : "rankInvestigator";
    const rank = system.identity?.[rankField];
    const rankList = actorClass === "ghoul" ? TG_CONFIG.ranks.ghoul : TG_CONFIG.ranks.investigator;
    const equivalent = equivalentRank(rank);
    const bars = [
      { key: "vitality", ...resourceBar(system.resources.vitality) },
      { key: "stamina", ...resourceBar(system.resources.stamina) },
      ...(usesMealScore ? [{ key: "mealScore", ...resourceBar(system.resources.mealScore) }] : [])
    ];
    const budget = system.resources.maneuverBudget;
    const conditions = items.filter(item => item.type === "condition");
    const states = [
      ...(system.resources.vitality.value <= 0 ? [{ key: "down", label: "TG.states.down", icon: "fa-skull-crossbones", tone: "danger" }] : []),
      ...(usesRage && system.resources.rage?.active ? [{ key: "rage", label: "TG.states.rage", icon: "fa-fire", tone: "danger" }] : []),
      ...(usesMealScore && system.hunger?.active ? [{ key: "hunger", label: "TG.states.hunger", icon: "fa-tooth", tone: "danger" }] : []),
      ...(system.kakuja?.active ? [{ key: "kakuja", label: `TG.kakuja.${system.kakuja.stage}`, icon: "fa-skull", tone: "accent" }] : []),
      ...(system.kakuja?.lostControl ? [{ key: "lostControl", label: "TG.states.lostControl", icon: "fa-explosion", tone: "danger" }] : []),
      ...(system.combat?.counterDeclared ? [{ key: "counter", label: "TG.actions.counter", icon: "fa-rotate-left", tone: "info" }] : []),
      ...(system.combat?.readiedAction?.trigger ? [{ key: "ready", label: "TG.actions.ready", icon: "fa-hourglass-half", tone: "info", title: system.combat.readiedAction.trigger }] : []),
      ...(system.hunger?.regenerationSuppressed ? [{ key: "suppressed", label: "TG.states.regenSuppressed", icon: "fa-ban", tone: "warning" }] : []),
      ...conditions.map(item => ({ key: item.system.conditionId, text: item.name, stacks: Number(item.system.stacks) > 1 ? item.system.stacks : null, icon: "fa-triangle-exclamation", tone: "warning", itemId: item.id }))
    ];
    const weapons = items.filter(item => ["kagune", "quinque", "kakuja-armor"].includes(item.type)).map(item => this.#weaponView(item));
    const carried = countCarriedQuinque(items);
    return {
      actorClass,
      rankField,
      rank,
      rankOptions: rankList.map(value => ({ value, label: `TG.ranks.${value}` })),
      equivalentRank: equivalent ? `TG.ranks.${equivalent}` : null,
      bars,
      maneuverPips: pips(budget.value, budget.max),
      reactionPips: pips(budget.reactionsReserved, budget.reactionsReserved),
      states,
      weapons,
      weaponEdges: weapons.filter(weapon => weapon.edges.length),
      quinqueCarry: actorClass === "ghoul" ? null : { value: carried, max: QUINQUE_CARRY_LIMIT, over: carried > QUINQUE_CARRY_LIMIT },
      kakujaMasteryPips: pips(system.kakuja?.masterySuccesses ?? 0, system.kakuja?.active || system.kakuja?.masterySuccesses ? 10 : 0)
    };
  }

  #weaponView(item) {
    const system = item.system;
    const isQuinque = item.type === "quinque", isKagune = item.type === "kagune", isArmor = item.type === "kakuja-armor";
    const active = isQuinque ? !!system.equipped : !!system.manifested;
    const range = system.range ?? {};
    return {
      id: item.id,
      name: item.name,
      img: item.img,
      type: item.type,
      rc: isArmor ? system.armorType : system.primaryType,
      rcLabel: isArmor ? `TG.armor.${system.armorType}` : `TG.kagune.${system.primaryType}`,
      secondary: system.secondaryType ? `TG.kagune.${system.secondaryType}` : null,
      rcl: system.rcl,
      active,
      toggleAction: isQuinque ? (active ? "unequip" : "equip") : isKagune ? (active ? "withdraw" : "manifest") : "toggleArmor",
      melee: !isArmor && range.melee ? `TG.ranges.${range.melee}` : null,
      projectile: !isArmor && range.projectile ? `TG.ranges.${range.projectile}` : null,
      edges: Array.from(system.edges ?? []).map(edge => ({ id: edge, label: edgeLabel(edge) })),
      slots: system.edgeSlots ? { used: system.edgeSlots.used, max: system.edgeSlots.max } : null,
      bonds: isQuinque ? { ...resourceBar(system.rcBonds), broken: !!system.rcBonds?.broken, repair: system.rcBonds?.repairDaysRemaining } : null,
      ammo: isQuinque && system.sidearm?.enabled ? { value: system.sidearm.ammo.value, max: system.sidearm.ammo.max, type: `TG.kagune.${system.sidearm.ammoType}` } : null,
      armor: isArmor ? { turns: system.turnsActive ?? 0, parasitic: (system.turnsActive ?? 0) >= 5 } : null,
      kakujaWeapon: isQuinque && !!system.kakuja?.isKakujaWeapon,
      canAttack: !isArmor
    };
  }

  async _onRender(context, options) {
    await super._onRender(context, options);
    labelRichTextEditors(this.element);
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
    const stat = event.currentTarget.dataset.rollStat;
    const options = await promptRollOptions();
    if (!options) return;
    await actor.rollCheck(stat, {bonus:Number(options.bonus),penalty:Number(options.penalty), ...(options.targetNumber !== "" ? {targetNumber:Number(options.targetNumber)} : {})});
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
      if (item.type === "quinque" && !item.system.equipped && countCarriedQuinque(Array.from(this.actor.items)) >= QUINQUE_CARRY_LIMIT) return ui.notifications.warn(game.i18n.localize("TG.notifications.quinqueCarryLimit"));
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
      weapons: { label: "TG.sheet.weapons", icon: "fa-dragon", items: [] },
      edges: { label: "TG.sheet.edges", icon: "fa-gem", items: [] },
      maneuvers: { label: "TG.sheet.maneuvers", icon: "fa-person-running", items: [] },
      inventory: { label: "TG.sheet.inventory", icon: "fa-box-open", items: [] },
      conditions: { label: "TG.sheet.conditions", icon: "fa-triangle-exclamation", items: [] }
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
