// Live check of The Last Delivery balance hooks in the disposable tg-qa world:
// GM panel party-size scaling, Aya's Healer medkits, and the tuned NPC profiles.
import { chromium } from "playwright";
import fs from "node:fs/promises";
const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1366, height: 900 } });
const errors = [];
page.on("pageerror", error => errors.push(error.message));
try {
  await page.goto(process.env.TG_QA_URL ?? "http://localhost:30014");
  await page.waitForTimeout(1200);
  if (await page.locator("[name=username]").count()) {
    await page.locator("[name=username]").fill("Gamemaster");
    await page.locator("button[name=join]").click();
  }
  await page.waitForFunction(() => globalThis.game?.ready);
  const report = await page.evaluate(async () => {
    if (game.world.id !== "tg-qa" || game.release.generation !== 14) throw new Error("Requires disposable tg-qa world on Foundry v14");
    const checks = [];
    const assert = (value, message) => { if (!value) throw new Error(message); checks.push(message); };
    const [adventure] = await game.packs.get("tokyo-ghoul-unofficial.last-delivery").getDocuments();
    const source = adventure.toObject();
    const mappings = { actors: "Actor", items: "Item", journal: "JournalEntry", scenes: "Scene", folders: "Folder", macros: "Macro" };
    for (const [field, type] of Object.entries(mappings)) assert(source[field].every(d => !game.collections.get(type).has(d._id)), `${type} fixtures absent before import`);
    const previousSize = game.settings.get("tokyo-ghoul-unofficial", "lastDeliveryPartySize");
    try {
      await adventure.import({ dialog: false, importFields: ["all"] });
      const ld = game.tokyoGhoul.adventures.lastDelivery;
      const boss = ld.actor("boss"), guard = ld.actor("guard"), aya = ld.actor("aya"), daichi = ld.actor("daichi");
      const vit = actor => [actor.system.resources.vitality.value, actor.system.resources.vitality.max];
      assert(JSON.stringify(vit(boss)) === "[126,126]" && boss.system.resources.stamina.max === 102, "Kurose imports at 126 Vitality / 102 Stamina");
      assert(JSON.stringify(vit(guard)) === "[123,123]" && guard.system.stats.spd.total === 11, "Riku imports at 123 Vitality, SPD 11");
      assert(guard.items.find(i => i.type === "kagune").system.edges.includes("hardy"), "Riku's Iron Wake has Hardy");
      await ld.setPartySize(6);
      assert(JSON.stringify(vit(boss)) === "[216,216]", "Party size 6 scales Kurose to full 216 Vitality");
      assert(JSON.stringify(vit(guard)) === "[171,171]", "Party size 6 scales Riku to full 171 Vitality");
      assert(boss.system.stats.crl.temp === 30 && boss.system.stats.crl.base === 30, "Scaling uses the temp field only");
      const station = ld.scene("station");
      const bossToken = station.tokens.find(t => t.actorId === boss.id);
      assert(bossToken.actor.system.resources.vitality.max === 216, "Unlinked station token inherits scaling");
      await ld.setPartySize(5);
      assert(JSON.stringify(vit(boss)) === "[156,156]", "Party size 5 scales Kurose to 156");
      await boss.update({ "system.resources.vitality.value": 100 });
      await ld.setPartySize(4);
      assert(JSON.stringify(vit(boss)) === "[100,126]", "A wounded Kurose keeps his wounds when scaling down");
      assert(station.tokens.find(t => t.actorId === ld.actor("lookout").id && !t.hidden), "Chika is visible at the station");
      // Medkits: only Aya carries them and the Healer workflow works out of combat.
      assert(!daichi.items.some(i => i.system.consumableType === "medkit"), "Daichi carries no unusable medkit");
      const kit = aya.items.find(i => i.system.consumableType === "medkit");
      assert(kit?.system.quantity === 3, "Aya carries three field kits");
      await daichi.applyDamage(30, { quiet: true, rc: true });
      await aya.useConsumable(kit, { target: daichi });
      assert(daichi.system.resources.vitality.value === 30 + aya.getStat("per") + daichi.getStat("end"), "Aya's kit heals PER + target END");
      assert(kit.system.quantity === 2, "Using a kit consumes it");
      return { version: game.release.version, checks: checks.length, list: checks };
    } finally {
      await game.settings.set("tokyo-ghoul-unofficial", "lastDeliveryPartySize", previousSize);
      for (const field of ["scenes", "journal", "items", "actors", "macros", "folders"]) {
        const type = mappings[field];
        const ids = source[field].map(d => d._id).filter(id => game.collections.get(type).has(id));
        if (ids.length) await getDocumentClass(type).deleteDocuments(ids).catch(error => console.error(`Cleanup ${type}: ${error.message}`));
      }
    }
  });
  if (errors.length) throw new Error(errors.join("\n"));
  await fs.mkdir("artifacts/qa", { recursive: true });
  await fs.writeFile("artifacts/qa/last-delivery-balance.json", JSON.stringify(report, null, 2));
  console.log(report);
} finally { await browser.close(); }
