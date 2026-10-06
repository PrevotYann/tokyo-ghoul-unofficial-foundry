import assert from "node:assert/strict";
import test from "node:test";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { normalizeEdgeName, collectEdgeNames, calculateEdgeCombatModifiers, validateEdgeLoadout } from "../../src/rules/edges.mjs";
import { getKakujaEligibility } from "../../src/rules/kakuja.mjs";
import { calculateBuilderRcl, createQuinqueDraft } from "../../src/rules/character-builder.mjs";
import { validateForgeEdges, createKakuhouStorageEntry } from "../../src/rules/progression.mjs";
import { migrateItemRuleIdentity, runMigrations } from "../../src/rules/migrations.mjs";
import { assignEdgeToWeapon } from "../../src/sheets/edge-assignment.mjs";
import { registerBabeleHooks } from "../../src/localization/babele.mjs";
import { generateBabele, translationFiles } from "../../scripts/generate-babele.mjs";

const root = fileURLToPath(new URL("../../", import.meta.url));
const translated = (ruleId, name, extra = {}) => ({ type: "edge", name, system: { ruleId, category: "ghoul", slots: 1, ...extra } });

test("translated Edge names preserve bonuses, prerequisites, duplicate checks and Kakuja eligibility", () => {
  const edges = [translated("hardy", "Robuste"), translated("cannibalistic", "Cannibale")];
  const ids = collectEdgeNames({ actorItems: edges });
  assert.deepEqual(ids, ["hardy", "cannibalistic"]);
  assert.equal(calculateEdgeCombatModifiers(ids).blockBonus, 3);
  assert.equal(getKakujaEligibility({ rcl: 50, edges }).canHalf, true);
  assert.equal(validateEdgeLoadout({ edgeItems: [edges[0], translated("hardy", "Hardy")] }).valid, false);
  assert.equal(normalizeEdgeName({ name: "Robuste", flags: { babele: { originalPayload: { name: "Hardy" } } } }), "hardy");
  assert.equal(normalizeEdgeName({ name: "Robuste", flags: { babele: { originalName: "Hardy" } } }), "hardy");
});

test("canonical and legacy Edge IDs work together in creation, slot costs and forging", () => {
  assert.equal(calculateBuilderRcl({ baseRcl: 10, maxEdges: 3, chosenEdges: [translated("healer", "Soigneur")] }), 12);
  assert.equal(createQuinqueDraft({ edges: ["sidearm"] }).system.sidearm.enabled, true);
  assert.equal(createQuinqueDraft({ edges: ["Sidearm"] }).system.sidearm.enabled, true);
  assert.deepEqual(createQuinqueDraft({ edges: [translated("sidearm", "Arme secondaire")] }).system.edges, ["sidearm"]);
  assert.equal(validateForgeEdges({ chosenEdges: [translated("hardy", "Robuste")], sourceEdges: ["Hardy"] }).valid, true);
  assert.deepEqual(createKakuhouStorageEntry({ sourceEdges: [translated("hardy", "Robuste")] }).sourceEdges, ["hardy"]);
});

test("dropping a translated Edge stores a canonical ID and rejects duplicates", async () => {
  const edge = translated("hardy", "Robuste");
  const saved = [];
  const weapon = { type: "kagune", isOwner: true, system: { edges: [], primaryType: "koukaku", edgeSlots: { max: 3 } }, update: async update => { saved.push(update); weapon.system.edges = update["system.edges"]; } };
  const previousGame = globalThis.game, previousUi = globalThis.ui;
  globalThis.game = { packs: new Map([["tokyo-ghoul-unofficial.edges", { getDocuments: async () => [edge] }]]), i18n: { localize: key => key } };
  globalThis.ui = { notifications: { warn() {} } };
  try {
    assert.equal(await assignEdgeToWeapon(weapon, edge), true);
    assert.deepEqual(saved, [{ "system.edges": ["hardy"] }]);
    assert.equal(await assignEdgeToWeapon(weapon, edge), false);
  } finally { globalThis.game = previousGame; globalThis.ui = previousUi; }
});

test("identity migration recovers renamed imports and preserves custom content and explicit IDs", () => {
  const catalog = [{ ...translated("hardy", "Robuste"), id: "abc123" }];
  assert.deepEqual(migrateItemRuleIdentity({ type: "edge", name: "Custom display name", system: {}, _stats: { compendiumSource: "Compendium.tokyo-ghoul-unofficial.edges.Item.abc123" } }, catalog), { "system.ruleId": "hardy" });
  assert.deepEqual(migrateItemRuleIdentity(translated("hardy", "Robuste"), catalog), {});
  assert.deepEqual(migrateItemRuleIdentity({ type: "quinque", system: { edges: "Hardy, My Custom Edge" } }, [{ ...catalog[0], system: { ...catalog[0].system, category: "investigator" } }]), { "system.edges": ["hardy", "My Custom Edge"] });
});

test("schema v3 migrates world and owned Edges without resetting v2 Actor bonuses", async () => {
  const updates = [], previous = globalThis.game;
  const item = { type: "edge", name: "Hardy", system: {}, update: async data => updates.push(data) };
  globalThis.game = { user: { isActiveGM: true }, settings: { get: () => 2, set: async (_, key, value) => updates.push({ [key]: value }) }, packs: new Map(), items: [item], actors: [{ type: "character", items: [item], update: async () => assert.fail("v3 must not reset Actor bonuses") }] };
  try { await runMigrations(); assert.deepEqual(updates, [{ "system.ruleId": "hardy" }, { "system.ruleId": "hardy" }, { schemaVersion: 3 }]); }
  finally { globalThis.game = previous; }
});

test("Babele is optional and integration registers at its bootstrap hook", () => {
  let callback, dir;
  registerBabeleHooks({ once: (hook, handler) => { assert.equal(hook, "babele.init"); callback = handler; } });
  callback({ setSystemTranslationsDir: value => dir = value });
  assert.equal(dir, "babele");
});

test("English Babele templates cover every Item pack and remain in sync with English source content", async () => {
  const files = await translationFiles(root);
  const manifest = JSON.parse(await fs.readFile(path.join(root, "system.json"), "utf8"));
  for (const pack of manifest.packs.filter(p => p.type === "Item")) {
    const name = `${manifest.id}.${pack.name}.json`;
    const checkedIn = JSON.parse(await fs.readFile(path.join(root, "babele/en", name), "utf8"));
    assert.deepEqual(checkedIn, files[name], `Regenerate ${name} with npm run build:translations`);
    assert.equal(checkedIn.mapping.description, "system.description");
    for (const mappedPath of Object.values(checkedIn.mapping)) assert.ok(["name", "system.description", "system.notes", "system.dynamicNotes", "system.dynamicEffect"].includes(mappedPath));
    assert.ok(Object.keys(checkedIn.entries).length > 0);
  }
  const edgeEntries = files[`${manifest.id}.edges.json`].entries;
  assert.equal(Object.values(edgeEntries).filter(e => e.name === "Cannibalistic").length, 2, "same-name Ghoul and Investigator Edges must have separate IDs");
  assert.deepEqual(JSON.parse(await fs.readFile(path.join(root, "babele/en", `${manifest.id}._packs-folders.json`), "utf8")), files[`${manifest.id}._packs-folders.json`]);
  assert.ok(Object.values(files[`${manifest.id}._packs-folders.json`].entries).every(name => typeof name === "string"), "Babele pack folder translations must be strings for Foundry sorting");
});

test("translation module generator includes UI language, mappings and bootstrap registration", async () => {
  const output = await fs.mkdtemp(path.join(os.tmpdir(), "tg-translations-"));
  try {
    await generateBabele({ root, lang: "fr", output, module: true });
    const manifest = JSON.parse(await fs.readFile(path.join(output, "module.json"), "utf8"));
    assert.equal(manifest.relationships.requires[0].id, "babele");
    assert.equal(manifest.languages[0].path, "lang/fr.json");
    assert.deepEqual(JSON.parse(await fs.readFile(path.join(output, "lang/fr.json"), "utf8")), JSON.parse(await fs.readFile(path.join(root, "lang/en.json"), "utf8")));
    assert.ok((await fs.readFile(path.join(output, "register.mjs"), "utf8")).includes('dir: "compendium/fr"'));
    assert.ok(JSON.parse(await fs.readFile(path.join(output, "compendium/fr/tokyo-ghoul-unofficial.equipment.json"), "utf8")).entries);
  } finally { await fs.rm(output, { recursive: true }); }
});

test("literal UI localization keys have English base strings", async () => {
  const english = JSON.parse(await fs.readFile(path.join(root, "lang/en.json"), "utf8"));
  const walk = async directory => {
    for (const entry of await fs.readdir(directory, { withFileTypes: true })) {
      const file = path.join(directory, entry.name);
      if (entry.isDirectory()) await walk(file);
      else if (/\.(mjs|hbs)$/.test(entry.name)) {
        const text = await fs.readFile(file, "utf8");
        for (const match of text.matchAll(/["'](TG\.[A-Za-z0-9_.-]+)["']/g)) {
          if (match[1].endsWith(".")) continue; // Dynamic localization prefix.
          assert.equal(typeof english[match[1]], "string", `${path.relative(root, file)}: missing ${match[1]}`);
        }
      }
    }
  };
  await walk(path.join(root, "src"));
  await walk(path.join(root, "templates"));
});
