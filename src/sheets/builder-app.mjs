import { createCharacterDraft, STAT_PRESETS } from "../rules/character-builder.mjs";
import { normalizeEdgeName, validateEdgeLoadout } from "../rules/edges.mjs";

function getCenteredPosition({ width = 560, height = 520 } = {}) {
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
    position: { width: 560, height: 520 },
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
      presets: Object.keys(STAT_PRESETS),
      kaguneEdges: edges.filter(i => i.system.category === "ghoul" && normalizeEdgeName(i) !== "ghoul-regeneration").map(i => ({ name: i.name, system: { slots: i.system.slots, ruleId: normalizeEdgeName(i) } })),
      quinqueEdges: edges.filter(i => i.system.category === "investigator").map(i => ({ name: i.name, system: { slots: i.system.slots, ruleId: normalizeEdgeName(i) } })),
      stats: ["str","acc","per","end","spd","crl"]
    };
  }

  static async #onSubmit(event, form, formData) {
    const data = formData.object;
    const selected = key => Array.isArray(data[key]) ? data[key] : data[key] ? [data[key]] : [];
    const kaguneEdges = selected("kaguneEdges"), quinqueEdges = selected("quinqueEdges");
    const records = await game.packs.get("tokyo-ghoul-unofficial.edges")?.getDocuments() ?? [];
    for (const [names, type, category, max] of [[kaguneEdges,data.kaguneType,"ghoul",data.actorClass==="quinx"?1:3],[quinqueEdges,data.quinqueType,"investigator",data.actorClass==="quinx"?2:3]]) {
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
      quinqueType: data.quinqueType || "ukaku", kaguneEdges, quinqueEdges, customStats:hasCustom?customValues:null
    });
    if (actor) await this.close();
  }
}
