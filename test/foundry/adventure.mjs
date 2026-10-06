import { chromium } from "playwright";
import fs from "node:fs/promises";
const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1366, height: 900 } });
const errors = [];
page.on("pageerror", error => errors.push(error.message));
page.on("console", message => { if (message.type() === "error") console.error(message.text()); });
await fs.mkdir("artifacts/qa", { recursive: true });
await page.exposeFunction("verifyAdventurePlayer", async ({ sceneId, actorId, doorId, key }) => {
  const context = await browser.newContext({ viewport: { width: 1366, height: 900 } });
  const client = await context.newPage();
  client.on("pageerror", error => errors.push(error.message));
  try {
    await client.goto(process.env.TG_QA_URL ?? "http://localhost:30014");
    await client.waitForTimeout(1200);
    await client.locator("[name=username]").fill("[TG QA] Adventure Player");
    await client.locator("button[name=join]").click();
    await client.waitForFunction(() => globalThis.game?.ready);
    await client.waitForFunction(id => canvas.ready && canvas.scene?.id === id, sceneId);
    await client.evaluate(async () => { await game.user.sheet.close(); });
    const checks = await client.evaluate(async ({ sceneId, actorId, doorId }) => {
      const assertions = [];
      const assert = (value, message) => { if (!value) throw new Error(message); assertions.push(message); };
      assert(!game.user.isGM, "Player client uses player permissions");
      const scene = game.scenes.get(sceneId);
      const pc = scene.tokens.find(t => t.actorId === actorId);
      assert(pc.actor.isOwner && pc.actorLink, "Player owns linked PC");
      canvas.tokens.activate();
      pc.object.control({ releaseOthers: true });
      assert(pc.object.vision?.active && pc.object.visible, "Owned PC is visible with active vision");
      assert(scene.tokens.filter(t => t.hidden).every(t => !t.object.visible), "Hidden optional PCs and reinforcements stay invisible to player");
      const door = scene.walls.get(doorId);
      assert(door.ds === CONST.WALL_DOOR_STATES.CLOSED, "Player sees test door closed");
      await door.update({ ds: CONST.WALL_DOOR_STATES.OPEN });
      assert(door.ds === CONST.WALL_DOOR_STATES.OPEN, "Player can open unlocked native door");
      await door.update({ ds: CONST.WALL_DOOR_STATES.CLOSED });
      assert(door.ds === CONST.WALL_DOOR_STATES.CLOSED, "Player can close native door");
      return assertions;
    }, { sceneId, actorId, doorId });
    await client.locator("#notifications").evaluate(element => element.replaceChildren());
    await client.screenshot({ path: `artifacts/qa/last-delivery-${key}-player.png` });
    return checks;
  } finally { await context.close(); }
});
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
    const pack = game.packs.get("tokyo-ghoul-unofficial.last-delivery");
    assert(pack?.documentName === "Adventure", "Native Adventure compendium registered");
    const [adventure] = await pack.getDocuments();
    assert(adventure?.name === "The Last Delivery", "Native Adventure loads");
    await adventure.sheet.render({ force: true });
    await new Promise(resolve => setTimeout(resolve, 600));
    assert(adventure.sheet.rendered, "Adventure importer renders");
    await adventure.sheet.close();
    const source = adventure.toObject();
    const previousActive = game.scenes.active;
    let qaPlayer;
    const mappings = { actors: "Actor", items: "Item", journal: "JournalEntry", scenes: "Scene", folders: "Folder" };
    for (const [field, type] of Object.entries(mappings)) {
      assert(source[field].every(d => !game.collections.get(type).has(d._id)), `${type} fixtures absent before import`);
    }
    try {
      if (game.users.some(u => u.name === "[TG QA] Adventure Player")) throw new Error("Adventure player fixture already exists");
      qaPlayer = await User.create({ name: "[TG QA] Adventure Player", role: CONST.USER_ROLES.PLAYER });
      await adventure.import({ dialog: false, importFields: ["all"] });
      for (const [field, type] of Object.entries(mappings)) assert(source[field].every(d => game.collections.get(type).has(d._id)), `${type} imported with stable IDs`);
      const actors = source.actors.map(a => game.actors.get(a._id));
      for (const actor of actors) {
        assert(!actor.invalid, `${actor.name}: valid DataModel`);
        assert(actor.system.resources.vitality.value === actor.system.resources.vitality.max && actor.system.resources.vitality.value > 0, `${actor.name}: full Vitality`);
        assert(actor.system.resources.stamina.value === actor.system.resources.stamina.max, `${actor.name}: full Stamina`);
        assert(actor.system.resources.mealScore.value === actor.system.resources.mealScore.max, `${actor.name}: full Meal Score`);
        await actor.sheet.render({ force: true });
        assert(actor.sheet.rendered, `${actor.name}: sheet renders`);
        await actor.sheet.close();
      }
      for (const journal of source.journal) {
        const doc = game.journal.get(journal._id);
        assert(doc.ownership.default === 0, `${doc.name}: private by default`);
        for (const page of doc.pages) for (const match of String(page.text.content).matchAll(/@UUID\[([^\]]+)\]/g)) assert(await fromUuid(match[1]), `Link resolves: ${match[1]}`);
      }
      for (const scene of source.scenes) {
        const doc = game.scenes.get(scene._id);
        assert(doc.tokens.every(t => t.actor), `${doc.name}: every token resolves actor`);
        assert(doc.notes.every(n => n.entry && n.page), `${doc.name}: journal pins resolve`);
        assert((await fetch(doc.background.src)).ok, `${doc.name}: map asset served`);
        await doc.view();
        await new Promise(resolve => setTimeout(resolve, 800));
        assert(canvas.scene.id === doc.id, `${doc.name}: canvas renders`);
        assert(doc.tokenVision && doc.fog.exploration, `${doc.name}: vision and exploration enabled`);
        const party = doc.tokens.filter(t => t.actor?.type === "character");
        assert(party.length === 6 && party.every(t => t.actorLink && t.sight.enabled), `${doc.name}: six linked PCs with vision`);
        assert(party.filter(t => !t.hidden).length === 4, `${doc.name}: four core PCs visible`);
        assert(doc.lights.size >= 3 && doc.lights.every(l => l.walls), `${doc.name}: wall-constrained lights`);
        const { sceneLayouts } = await import("/systems/tokyo-ghoul-unofficial/src/packs-source/adventures/last-delivery-scenes.mjs");
        const key = doc.getFlag("tokyo-ghoul-unofficial", "adventure") && Object.keys(sceneLayouts)[scene.navOrder];
        const layout = sceneLayouts[key];
        assert(doc.walls.filter(w => w.door).every(w => w.object?.doorControl), `${doc.name}: all door controls render`);
        const pc = party.find(t => !t.hidden);
        canvas.tokens.activate();
        pc.object.control({ releaseOthers: true });
        assert(pc.object.vision?.active, `${doc.name}: controlled PC creates active vision source`);
        assert(pc.object.vision.los.contains(pc.x + 32, pc.y + 32), `${doc.name}: PC starting position is visible`);
        const gate = doc.walls.find(w => w.getFlag("tokyo-ghoul-unofficial", "name") === layout.doorProbe.name);
        assert(gate?.door === CONST.WALL_DOOR_TYPES.DOOR, `${doc.name}: native interactive door`);
        const collision = (probe, type) => CONFIG.Canvas.polygonBackends[type].testCollision(probe.from, probe.to, { type, mode: "any", level: canvas.level });
        const savedState = gate.ds;
        await gate.update({ ds: CONST.WALL_DOOR_STATES.CLOSED });
        await new Promise(resolve => setTimeout(resolve, 150));
        assert(collision(layout.doorProbe, "move"), `${doc.name}: closed door blocks movement`);
        if (gate.sight) assert(collision(layout.doorProbe, "sight"), `${doc.name}: closed door blocks sight`);
        else assert(!collision(layout.doorProbe, "sight"), `${doc.name}: fence gate permits sight`);
        await gate.update({ ds: CONST.WALL_DOOR_STATES.OPEN });
        await new Promise(resolve => setTimeout(resolve, 150));
        assert(!collision(layout.doorProbe, "move"), `${doc.name}: open door permits movement`);
        assert(!collision(layout.doorProbe, "sight"), `${doc.name}: open door permits sight`);
        assert(collision(layout.wallProbe, "move") && collision(layout.wallProbe, "sight"), `${doc.name}: solid wall blocks movement and sight`);
        await gate.update({ ds: savedState });
        pc.object.release();
        // Verify permissions/visibility on a separate real player client.
        const playerDoor = doc.walls.find(w => w.door && w.ds !== CONST.WALL_DOOR_STATES.LOCKED);
        const playerDoorState = playerDoor.ds;
        await playerDoor.update({ ds: CONST.WALL_DOOR_STATES.CLOSED });
        await pc.actor.update({ [`ownership.${qaPlayer.id}`]: CONST.DOCUMENT_OWNERSHIP_LEVELS.OWNER });
        await doc.activate();
        const playerChecks = await window.verifyAdventurePlayer({ sceneId: doc.id, actorId: pc.actor.id, doorId: playerDoor.id, key });
        for (const check of playerChecks) checks.push(`${doc.name}: ${check}`);
        await playerDoor.update({ ds: playerDoorState });
      }
      return { version: game.release.version, checks: checks.length, actors: source.actors.length, items: source.items.length, journals: source.journal.length, scenes: source.scenes.length };
    } finally {
      if (previousActive) await previousActive.activate();
      for (const field of ["scenes", "journal", "items", "actors", "folders"]) {
        const type = mappings[field];
        const ids = source[field].map(d => d._id).filter(id => game.collections.get(type).has(id));
        if (ids.length) await getDocumentClass(type).deleteDocuments(ids).catch(error => console.error(`Cleanup ${type}: ${error.message}`));
      }
      if (qaPlayer) await qaPlayer.delete();
    }
  });
  if (errors.length) throw new Error(errors.join("\n"));
  await fs.mkdir("artifacts/qa", { recursive: true });
  await fs.writeFile("artifacts/qa/last-delivery.json", JSON.stringify(report, null, 2));
  console.log(report);
} finally { await browser.close(); }
