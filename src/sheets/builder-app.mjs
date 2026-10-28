import { createCharacterDraft, STAT_PRESETS } from "../rules/character-builder.mjs";
import { normalizeEdgeName, validateEdgeLoadout } from "../rules/edges.mjs";

function getCenteredPosition({ width = 760, height = Math.min(820, (globalThis.window?.innerHeight ?? 900) - 80) } = {}) {
  const viewportWidth = globalThis.window?.innerWidth ?? width + 160;
  const viewportHeight = globalThis.window?.innerHeight ?? height + 160;
  return {
    width,
    height,
    left: Math.max(24, Math.round((viewportWidth - width) / 2)),
    top: Math.max(64, Math.round((viewportHeight - height) / 2))
  };
}

let activeBuilderApp = null;

// Starting Edge slots (PDF pp. 11, 17, 32); Bikaku adds one Kagune slot.
const BUILDER_EDGE_LIMITS = {
  kagune: (actorClass, type) => (actorClass === "quinx" ? 1 : 3) + (type === "bikaku" ? 1 : 0),
  quinque: actorClass => actorClass === "quinx" ? 2 : 3
};

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
  for (const weapon of actor.items.filter(i=>i.type==="quinque")) await weapon.update({"system.rcBonds.value":weapon.system.rcBonds.max,"system.sidearm.ammo.value":weapon.system.sidearm.enabled?weapon.system.rcl:0});
  await actor.update({"system.resources.vitality.value":actor.getVitalityMax(),"system.resources.stamina.value":actor.getStaminaMax(),"system.resources.mealScore.value":actor.getMealScoreMax()});
  actor.sheet?.render?.({force:true});
  return actor;
}

export async function openCharacterBuilder() {
  if (activeBuilderApp?.rendered) {
    await activeBuilderApp.close();
  }

  const app = new CharacterBuilderApp({ position: getCenteredPosition() });
  activeBuilderApp = app;
  await app.render({force:true});
  app.setPosition(getCenteredPosition());
  return app;
}

export class CharacterBuilderApp extends foundry.applications.api.HandlebarsApplicationMixin(foundry.applications.api.ApplicationV2) {
  static DEFAULT_OPTIONS = {
    tag: "form",
    id: "tg-character-builder",
    classes: ["tg-system", "tg-builder-window"],
    window: { frame: true, positioned: true, title: "TG.builder.title", resizable: true, minimizable: true },
    position: { width: 760, height: 820 },
    form: {
      handler: CharacterBuilderApp.#onSubmit,
      submitOnChange: false,
      closeOnSubmit: false
    }
  };

  static PARTS = {
    form: {
      template: "systems/tokyo-ghoul-unofficial/templates/apps/character-builder.hbs"
    }
  };

  async _prepareContext(options) {
    const context = await super._prepareContext(options);
    const edges = await game.packs.get("tokyo-ghoul-unofficial.edges")?.getDocuments() ?? [];
    return {
      ...context,
      presets: Object.entries(STAT_PRESETS).map(([key, values]) => ({ key, values: ["str","acc","per","end","spd","crl"].map(stat => values[stat]).join(",") })),
      classes: [{ key: "ghoul", icon: "fa-eye" }, { key: "investigator", icon: "fa-briefcase" }, { key: "quinx", icon: "fa-eye-low-vision" }],
      rcTypes: ["ukaku", "koukaku", "rinkaku", "bikaku"],
      kaguneEdges: edges.filter(i => i.system.category === "ghoul" && normalizeEdgeName(i) !== "ghoul-regeneration").map(i => ({ name: i.name, system: { slots: i.system.slots, ruleId: normalizeEdgeName(i) } })),
      quinqueEdges: edges.filter(i => i.system.category === "investigator").map(i => ({ name: i.name, system: { slots: i.system.slots, ruleId: normalizeEdgeName(i) } })),
      stats: ["str","acc","per","end","spd","crl"]
    };
  }

  _onRender(context, options) {
    super._onRender?.(context, options);
    const form = this.element;
    const root = form.querySelector(".tg-builder-form");
    const value = name => form.querySelector(`[name="${name}"]:checked`)?.value ?? form.querySelector(`[name="${name}"]`)?.value;
    const update = () => {
      const actorClass = value("actorClass");
      root.dataset.class = actorClass;
      form.querySelector('[data-builder-part="kagune"]').hidden = actorClass === "investigator";
      form.querySelector('[data-builder-part="quinque"]').hidden = actorClass === "ghoul";
      form.querySelector('[data-builder-part="bikaku"]').hidden = value("kaguneType") !== "bikaku";
      const typeHint = form.querySelector('[data-type-hint="kagune"]');
      typeHint.textContent = game.i18n.localize(`TG.builder.typeHint.${value("kaguneType")}`);
      for (const [part, max] of [["kagune", BUILDER_EDGE_LIMITS.kagune(actorClass, value("kaguneType"))], ["quinque", BUILDER_EDGE_LIMITS.quinque(actorClass)]]) {
        const used = Array.from(form.querySelectorAll(`[name^="${part}Edges."]:checked`)).reduce((n, input) => n + Number(input.dataset.slots || 1), 0);
        const label = form.querySelector(`[data-edge-count="${part}"]`);
        label.textContent = game.i18n.format("TG.builder.edgeSlots", { used, max, rcl: Math.max(0, Math.min(max, 3) - used) * 2 });
        label.classList.toggle("tg-warning", used > max);
      }
      const total = ["str","acc","per","end","spd","crl"].reduce((n, key) => n + (Number(form.querySelector(`[name="stats.${key}"]`).value) || 0), 0);
      const points = form.querySelector("[data-points]");
      points.textContent = `${total} / 60`;
      points.classList.toggle("is-valid", total === 60);
      points.classList.toggle("is-over", total !== 60);
    };
    form.querySelector('[name="statPreset"]').addEventListener("change", event => {
      const values = event.currentTarget.selectedOptions[0].dataset.values.split(",");
      ["str","acc","per","end","spd","crl"].forEach((key, index) => form.querySelector(`[name="stats.${key}"]`).value = values[index]);
      update();
    });
    root.addEventListener("input", update);
    root.addEventListener("change", update);
    update();
  }

  static async #onSubmit(event, form, formData) {
    const data = formData.object;
    const selected = key => Object.entries(data).filter(([name, checked]) => name.startsWith(`${key}.`) && checked === true).map(([name]) => name.slice(key.length + 1));
    const kaguneEdges = selected("kaguneEdges"), quinqueEdges = selected("quinqueEdges");
    const records = await game.packs.get("tokyo-ghoul-unofficial.edges")?.getDocuments() ?? [];
    for (const [names, type, category, max] of [[data.actorClass==="investigator"?[]:kaguneEdges,data.kaguneType,"ghoul",BUILDER_EDGE_LIMITS.kagune(data.actorClass)],[data.actorClass==="ghoul"?[]:quinqueEdges,data.quinqueType,"investigator",BUILDER_EDGE_LIMITS.quinque(data.actorClass)]]) {
      const edgeItems = names.map(name => records.find(i=>normalizeEdgeName(i)===normalizeEdgeName(name)&&i.system.category===category)).filter(Boolean);
      const validation=validateEdgeLoadout({edgeItems,sourceType:type,phase:"creation"});
      if (!validation.valid || edgeItems.length!==names.length || validation.usedSlots > max+(category==="ghoul"&&type==="bikaku"?1:0)) {
        ui.notifications.warn(game.i18n.localize("TG.notifications.invalidEdges")); return;
      }
    }
    const customValues = Object.fromEntries(["str","acc","per","end","spd","crl"].map(key=>[key,data[`stats.${key}`]]));
    const hasCustom = Object.values(customValues).some(v => v !== "" && v != null);
    if (hasCustom && Object.values(customValues).some(v => v == null || v === "" || !Number.isInteger(Number(v)) || Number(v)<0)) {
      ui.notifications.warn(game.i18n.localize("TG.notifications.invalidBuilderStats")); return;
    }
    const actor = await createActorFromCharacterDraft({
      name: data.name || game.i18n.localize("TG.builder.defaultName"),
      actorClass: data.actorClass || "ghoul",
      statPreset: data.statPreset || "balanced",
      kaguneType: data.kaguneType || "ukaku",
      quinqueType: data.quinqueType || "ukaku", kaguneEdges, quinqueEdges, customStats:hasCustom?customValues:null,
      kaguneName: data.kaguneName, quinqueName: data.quinqueName, bikakuPenalty: data.bikakuPenalty
    });
    if (actor) await this.close();
  }
}
