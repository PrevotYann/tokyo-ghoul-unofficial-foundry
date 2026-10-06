import { SYSTEM_ID, TG_CONFIG } from "../config.mjs";
import { normalizeEdgeName } from "./edges.mjs";

/** Recover identity from source provenance before falling back to the English/original name. */
export function migrateItemRuleIdentity(item, catalog = []) {
  const update = {};
  const system = item._source?.system ?? item.system ?? {};
  const sourceId = item._stats?.compendiumSource ?? item.flags?.core?.sourceId;
  const source = sourceId && catalog.find(edge => sourceId === `Compendium.${SYSTEM_ID}.edges.Item.${edge.id ?? edge._id}`
    || sourceId === `Compendium.${SYSTEM_ID}.edges.${edge.id ?? edge._id}`);
  if (item.type === "edge" && !system.ruleId) update["system.ruleId"] = normalizeEdgeName(source ?? item);
  const category = item.type === "kagune" ? "ghoul" : item.type === "quinque" ? "investigator" : null;
  for (const field of ["edges", "sourceEdges", "grantedEdges"]) {
    if (system[field] == null) continue;
    const old = typeof system[field] === "string" ? system[field].split(",").map(s => s.trim()).filter(Boolean) : Array.from(system[field]);
    const next = old.map(value => {
      const edge = catalog.find(edge => (!category || edge.system.category === category)
        && (edge.name === value || normalizeEdgeName(edge) === normalizeEdgeName(value)));
      return edge ? normalizeEdgeName(edge) : value;
    });
    if (typeof system[field] === "string" || next.some((value, index) => value !== old[index])) update[`system.${field}`] = next;
  }
  return update;
}

export async function registerMigrationSettings() {
  game.settings.register(SYSTEM_ID, "schemaVersion", {
    name: "TG.settings.schemaVersion.name",
    scope: "world",
    config: false,
    type: Number,
    default: 0
  });
}

export async function runMigrations({ dryRun = false } = {}) {
  if (!game.user.isActiveGM) return;
  const current = game.settings.get(SYSTEM_ID, "schemaVersion");
  if (current >= TG_CONFIG.schemaVersion) return;

  console.log(`${SYSTEM_ID} | Migrating world schema from ${current} to ${TG_CONFIG.schemaVersion}.`);
  if (!dryRun) {
    const catalog = current < 3 ? await game.packs.get(`${SYSTEM_ID}.edges`)?.getDocuments() ?? [] : [];
    const migrateItem = async item => {
      const update = current < 3 ? migrateItemRuleIdentity(item, catalog) : {};
      if (current < 2 && item.type === "kakuja-armor" && item._source.system.rcl < 45) update["system.rcl"] = 45;
      if (Object.keys(update).length) await item.update(update);
    };
    for (const item of game.items) await migrateItem(item);
    for (const actor of game.actors) {
      if (!["character", "npc"].includes(actor.type)) continue;
      const update = {};
      // v1 persisted Kakuja bonuses. v2 derives them from activation instead.
      if (current < 2) for (const key of TG_CONFIG.stats) update[`system.stats.${key}.kakuja`] = 0;
      if (Object.keys(update).length) await actor.update(update);
      for (const item of actor.items) await migrateItem(item);
    }
    await game.settings.set(SYSTEM_ID, "schemaVersion", TG_CONFIG.schemaVersion);
  }
}
