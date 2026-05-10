import { SYSTEM_ID, TG_CONFIG } from "../config.mjs";

export async function registerMigrationSettings() {
  game.settings.register(SYSTEM_ID, "schemaVersion", {
    name: "TG.settings.schemaVersion.name",
    scope: "world",
    config: false,
    type: Number,
    default: TG_CONFIG.schemaVersion
  });
}

export async function runMigrations({ dryRun = false } = {}) {
  const current = game.settings.get(SYSTEM_ID, "schemaVersion");
  if (current >= TG_CONFIG.schemaVersion) return;

  console.log(`${SYSTEM_ID} | Migrating world schema from ${current} to ${TG_CONFIG.schemaVersion}.`);
  if (!dryRun) await game.settings.set(SYSTEM_ID, "schemaVersion", TG_CONFIG.schemaVersion);
}
