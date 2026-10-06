import { SYSTEM_ID, TG_CONFIG } from "../config.mjs";

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
    for (const actor of game.actors) {
      if (!["character", "npc"].includes(actor.type)) continue;
      const update = {};
      // v1 persisted Kakuja bonuses. v2 derives them from activation instead.
      for (const key of TG_CONFIG.stats) update[`system.stats.${key}.kakuja`] = 0;
      await actor.update(update);
      for (const item of actor.items) {
        if (item.type === "kakuja-armor" && item._source.system.rcl < 45) await item.update({"system.rcl":45});
        if (typeof item._source.system.edges === "string") await item.update({"system.edges":item._source.system.edges.split(",").map(s=>s.trim()).filter(Boolean)});
      }
    }
    await game.settings.set(SYSTEM_ID, "schemaVersion", TG_CONFIG.schemaVersion);
  }
}
