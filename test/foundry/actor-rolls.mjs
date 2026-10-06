import { chromium } from "playwright";
import fs from "node:fs/promises";

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1366, height: 900 } });
const errors = [];
page.on("pageerror", error => errors.push(error.stack ?? error.message));
try {
  await page.goto(process.env.TG_QA_URL ?? "http://localhost:30014");
  await page.waitForSelector("[name=username], #board");
  if (await page.locator("[name=username]").count()) {
    await page.locator("[name=username]").fill("Gamemaster");
    await page.locator("button[name=join]").click();
  }
  await page.waitForFunction(() => globalThis.game?.ready);
  const report = await page.evaluate(async () => {
    if (game.world.id !== "tg-qa" || game.release.generation !== 14) throw Error("Requires disposable tg-qa v14 world");
    const checks = [];
    const assert = (ok, name) => { if (!ok) throw Error(name); checks.push(name); };
    const waitFor = async predicate => {
      for (let i = 0; i < 100; i++) { if (predicate()) return; await new Promise(r => setTimeout(r, 50)); }
      throw Error("Timed out waiting for sheet action");
    };
    const originalInput = foundry.applications.api.DialogV2.input;
    const fixtures = [];
    try {
      for (const type of ["character", "npc"]) for (const cls of ["ghoul", "investigator", "quinx"]) {
        const actor = await Actor.create({name:`[TG Roll QA] ${type} ${cls}`,type,system:{identity:{class:cls}}});
        fixtures.push(actor);
        await actor.sheet.render({force:true});
        let root = actor.sheet.element;
        const action = name => !!root.querySelector(`[data-actor-action="${name}"]`);
        assert(action("rage") === (cls !== "ghoul"), `${type}/${cls} Rage visibility`);
        assert(!!root.querySelector('[name="system.resources.mealScore.value"]') === (cls !== "investigator"), `${type}/${cls} Meal visibility`);
        assert(action("activateKakuja") === (cls !== "investigator"), `${type}/${cls} Kakuja visibility`);
        assert(action("consume") === (cls !== "investigator") && action("evolve") === (cls !== "investigator"), `${type}/${cls} consumption/evolution visibility`);
        assert(action("forge") === (cls !== "ghoul") && action("upgrade") === (cls !== "ghoul"), `${type}/${cls} forge/upgrade visibility`);
        assert(!action("reload") && !action("toggleGimmick"), `${type}/${cls} equipment-dependent controls`);
        if (cls === "quinx") assert(!root.querySelector('[name="system.kakuja.stage"] option[value=full]') && !root.querySelector('[name="system.kakuja.masteredFull"]'), `${type}/${cls} half Kakuja only`);
        for (const tab of root.querySelectorAll("[data-tg-tab]")) {
          tab.click();
          assert(!root.querySelector(`[data-tg-panel="${tab.dataset.tgTab}"]`).hidden, `${type}/${cls} tab ${tab.dataset.tgTab}`);
        }
        root.querySelector('[data-tg-tab="overview"]').click();
        for (const stat of Object.keys(actor.system.stats)) {
          // A delayed dialog recreates the reported currentTarget=null failure.
          foundry.applications.api.DialogV2.input = async () => {
            await new Promise(r => setTimeout(r, 10));
            return {bonus:"2",penalty:"1",targetNumber:"5"};
          };
          const count = game.messages.size;
          root.querySelector(`[data-roll-stat="${stat}"]`).click();
          await waitFor(() => game.messages.size > count);
          const message = game.messages.contents.at(-1);
          const result = message.getFlag("tokyo-ghoul-unofficial", "roll");
          assert(result?.stat === stat && result.bonus === 2 && result.penalty === 1 && result.targetNumber === 5, `${type}/${cls} ${stat} delayed sheet click`);
          assert(message.isRoll && message.rolls.length === (result.natural === 20 ? 2 : 1), `${type}/${cls} ${stat} native dice`);
          assert(message.rolls[0].total === result.natural && (!result.extra || message.rolls[1].total === result.extra), `${type}/${cls} ${stat} same animated results`);
          await waitFor(() => document.querySelector(`[data-message-id="${message.id}"]`));
          // Foundry animates chat notifications asynchronously after creation.
          await new Promise(r => setTimeout(r, 400));
          await message.delete();
        }
        const count = game.messages.size;
        foundry.applications.api.DialogV2.input = async () => null;
        root.querySelector('[data-roll-stat="str"]').click();
        await new Promise(r => setTimeout(r, 50));
        assert(game.messages.size === count, `${type}/${cls} cancel creates no roll`);
        await actor.update({"system.stats.end.base":13});
        await actor.sheet.render({force:true});
        assert(actor.system.resources.vitality.max === (actor.getStat("end") + actor.getStat("crl"))*3, `${type}/${cls} derived update`);
        root = actor.sheet.element;
        await actor.createEmbeddedDocuments("Item", [{name:"QA Sidearm",type:"quinque",system:{sidearm:{enabled:true}}},{name:"QA Gimmick",type:"gimmick"},{name:"QA Loot",type:"loot"}]);
        await actor.sheet.render({force:true}); root = actor.sheet.element;
        assert(action("reload") && action("toggleGimmick"), `${type}/${cls} owned equipment controls`);
        const loot = actor.items.find(item => item.type === "loot");
        assert(!root.querySelector(`[data-item-id="${loot.id}"] [data-item-action="use"]`), `${type}/${cls} no inert loot button`);
        await actor.sheet.close();
      }
    } finally {
      foundry.applications.api.DialogV2.input = originalInput;
      for (const actor of fixtures) { await actor.sheet.close(); await actor.delete(); }
    }
    return { version: game.version, checks };
  });
  // Verify the actual native dialog too, using the investigator sheet.
  const id = await page.evaluate(async () => {
    const actor = await Actor.create({name:"[TG Roll QA] Native dialog",type:"character",system:{identity:{class:"investigator"}}});
    await actor.sheet.render({force:true}); return actor.id;
  });
  try {
    await page.locator('.tg-actor-sheet [data-roll-stat="str"]').click();
    await page.locator('.tg-dialog [name="bonus"]').fill("3");
    await page.locator('.tg-dialog [name="penalty"]').fill("2");
    await page.locator('.tg-dialog button[data-action="ok"]').click();
    await page.waitForFunction(id => game.messages.some(message => message.speaker.actor === id && message.getFlag("tokyo-ghoul-unofficial", "roll")?.bonus === 3), id);
    report.checks.push("native dialog STR roll succeeds after dialog closure");
  } finally {
    await page.evaluate(async id => {
      await new Promise(r => setTimeout(r, 400));
      for (const message of game.messages.filter(m => m.speaker.actor === id)) await message.delete();
      await game.actors.get(id)?.delete();
    }, id);
  }
  if (errors.length) throw Error(errors.join("\n"));
  await fs.mkdir("artifacts/qa", {recursive:true});
  await fs.writeFile("artifacts/qa/actor-rolls.json", JSON.stringify(report, null, 2));
  console.log(`Foundry ${report.version}: ${report.checks.length} Actor sheet/roll checks passed.`);
} finally { await browser.close(); }
