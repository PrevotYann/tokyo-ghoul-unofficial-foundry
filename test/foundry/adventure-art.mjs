import { chromium } from "playwright";
import fs from "node:fs/promises";

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1366, height: 900 } });
const errors = [];
page.on("pageerror", error => errors.push(error.message));
try {
  await page.goto(process.env.TG_QA_URL ?? "http://localhost:30014");
  await page.waitForSelector("[name=username], #board");
  if (await page.locator("[name=username]").count()) {
    await page.locator("[name=username]").fill("Gamemaster");
    await page.locator("button[name=join]").click();
  }
  await page.waitForFunction(() => globalThis.game?.ready);
  // Native compendium documents are the runtime source of truth.
  const results = await page.evaluate(async () => {
    if (game.world.id !== "tg-qa" || game.release.generation !== 14) throw new Error("Requires disposable tg-qa world on Foundry v14");
    const { runMigrations } = await import("/systems/tokyo-ghoul-unofficial/src/rules/migrations.mjs");
    const [packDocument] = await game.packs.get("tokyo-ghoul-unofficial.last-delivery").getDocuments();
    const adventure = packDocument.toObject();
    const checks = [];
    const assert = (condition, label) => { if (!condition) throw new Error(label); checks.push(label); };
    const portraits = [];
    for (const source of adventure.actors) {
      const image = new Image();
      image.src = source.img;
      await image.decode();
      assert(image.naturalWidth >= 512 && image.naturalHeight >= 512, `${source.name}: image loads`);
      const canvas = document.createElement("canvas");
      canvas.width = image.naturalWidth; canvas.height = image.naturalHeight;
      const context = canvas.getContext("2d"); context.drawImage(image, 0, 0);
      // Preserve the generated alpha, including its very slight edge/paint translucency.
      assert(context.getImageData(0, 0, 1, 1).data[3] <= 2, `${source.name}: transparent outside token`);
      assert(context.getImageData(Math.floor(canvas.width / 2), Math.floor(canvas.height / 2), 1, 1).data[3] >= 250, `${source.name}: solid portrait`);
      portraits.push({ name: source.name, width: image.naturalWidth, height: image.naturalHeight });
    }
    const source = foundry.utils.deepClone(adventure.actors[0]);
    const sourceScene = foundry.utils.deepClone(adventure.scenes[0]);
    const originalSchema = game.settings.get("tokyo-ghoul-unofficial", "schemaVersion");
    let actor, scene;
    try {
      delete source._id; source.name = "[TG QA] Portrait migration"; source.folder = null;
      source.img = source.img.replace(/\.png$/, ".svg");
      source.prototypeToken.texture.src = "systems/tokyo-ghoul-unofficial/assets/rc-mark.svg";
      actor = await Actor.create(source);
      await actor.update({ "system.resources.vitality.value": 7 });
      delete sourceScene._id; sourceScene.name = "[TG QA] Portrait scene"; sourceScene.folder = null;
      sourceScene.tokens = [{ ...actor.prototypeToken.toObject(), _id: foundry.utils.randomID(), actorId: actor.id, actorLink: false, x: 64, y: 64, texture: { src: source.img }, delta: { img: source.img } }];
      sourceScene.notes = []; sourceScene.journal = null;
      scene = await Scene.create(sourceScene);
      const background = JSON.stringify(scene.toObject().background);
      const walls = JSON.stringify(scene.toObject().walls);
      const lights = JSON.stringify(scene.toObject().lights);
      await game.settings.set("tokyo-ghoul-unofficial", "schemaVersion", 3);
      await runMigrations();
      assert(actor.img.endsWith("/aya.png"), "Legacy actor portrait migrated");
      assert(actor.prototypeToken.texture.src.endsWith("/rc-mark.svg"), "Custom prototype texture preserved");
      assert(actor.system.resources.vitality.value === 7, "Wounds preserved");
      assert(scene.tokens.contents[0].texture.src.endsWith("/aya.png"), "Placed token migrated");
      assert(scene.tokens.contents[0].delta.toObject().img.endsWith("/aya.png"), "Unlinked token portrait override migrated");
      assert(JSON.stringify(scene.toObject().background) === background && JSON.stringify(scene.toObject().walls) === walls && JSON.stringify(scene.toObject().lights) === lights, "Scene map, geometry and lighting preserved");
      await runMigrations();
      assert(game.settings.get("tokyo-ghoul-unofficial", "schemaVersion") === 4, "Schema 4 completed and repeat is safe");
      await actor.sheet.render({ force: true });
      const portrait = actor.sheet.element.querySelector(".tg-portrait");
      await portrait.decode();
      assert(portrait.naturalWidth >= 512 && portrait.getAttribute("src") === actor.img, "Real actor sheet displays generated portrait");
      return { version: game.release.version, system: game.system.version, checks: checks.length, portraits };
    } finally {
      await actor?.sheet.close();
      await scene?.delete();
      await actor?.delete();
      await game.settings.set("tokyo-ghoul-unofficial", "schemaVersion", originalSchema);
    }
  });
  if (errors.length) throw new Error(errors.join("\n"));
  await fs.mkdir("artifacts/qa", { recursive: true });
  await fs.writeFile("artifacts/qa/adventure-art.json", JSON.stringify(results, null, 2) + "\n");
  console.log(results);
} finally { await browser.close(); }
