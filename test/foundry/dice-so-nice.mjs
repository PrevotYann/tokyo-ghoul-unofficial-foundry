import { chromium } from "playwright";
import fs from "node:fs/promises";

// Install and activate Dice So Nice! in the disposable QA world before running.
const browser = await chromium.launch({headless:true});
const page = await browser.newPage({viewport:{width:1366,height:900}});
const errors = [];
page.on("pageerror", e => errors.push(e.message));
try {
  await page.goto(process.env.TG_QA_URL ?? "http://localhost:30014");
  await page.waitForSelector("[name=username], #board");
  if (await page.locator("[name=username]").count()) {
    await page.locator("[name=username]").fill("Gamemaster");
    await page.locator("button[name=join]").click();
  }
  await page.waitForFunction(() => game?.ready);
  const active = await page.evaluate(() => game.modules.get("dice-so-nice")?.active);
  if (!active) throw Error("Activate Dice So Nice! in the disposable tg-qa world");
  await page.waitForFunction(() => game.dice3d?.getRole("basic")?.defaults.global?.colorset === "tokyo-ghoul-unofficial-red-black");
  const report = await page.evaluate(async () => {
    if (game.world.id !== "tg-qa" || game.release.generation !== 14) throw Error("Requires disposable tg-qa v14 world");
    const checks = [];
    const assert = (ok, label) => {if (!ok) throw Error(label); checks.push(label);};
    const theme = game.dice3d.exports.COLORSETS["tokyo-ghoul-unofficial-red-black"];
    assert(theme.background === "#111117" && theme.foreground === "#ff5263", "red/black theme registered");
    assert(game.dice3d.getRole("basic").defaults.global.colorset === theme.name, "theme is basic role default");
    const actor = await Actor.create({name:"[TG Dice QA]",type:"character"});
    const messages = [];
    const originalRandom = CONFIG.Dice.randomUniform;
    let starts = 0, completes = 0;
    const startHook = Hooks.on("diceSoNiceRollStart", () => starts++);
    const completeHook = Hooks.on("diceSoNiceRollComplete", () => completes++);
    try {
      for (const [kind, value, natural, extra] of [["ordinary",0.5,10,0],["critical",0,20,20],["fumble",0.999,1,0]]) {
        const start = starts, complete = completes;
        CONFIG.Dice.randomUniform = () => value;
        const result = await actor.rollCheck("str");
        CONFIG.Dice.randomUniform = originalRandom;
        const message = game.messages.contents.at(-1); messages.push(message);
        assert(result.natural === natural && result.extra === extra, `${kind}: expected dice`);
        assert(message.isRoll && message.rolls.length === (extra ? 2 : 1), `${kind}: native rolls retained`);
        for (let i=0; i<600 && completes === complete; i++) await new Promise(r=>setTimeout(r,50));
        assert(starts > start && completes > complete, `${kind}: real DsN animation starts and completes`);
      }
    } finally {
      CONFIG.Dice.randomUniform = originalRandom;
      Hooks.off("diceSoNiceRollStart", startHook);
      Hooks.off("diceSoNiceRollComplete", completeHook);
      await new Promise(r=>setTimeout(r,500));
      for (const message of messages) await message.delete();
      await actor.delete();
    }
    return {foundry:game.version,dsn:game.modules.get("dice-so-nice").version,checks};
  });
  if (errors.length) throw Error(errors.join("\n"));
  await fs.mkdir("artifacts/qa",{recursive:true});
  await fs.writeFile("artifacts/qa/dice-so-nice.json",JSON.stringify(report,null,2));
  console.log(`Foundry ${report.foundry}, Dice So Nice! ${report.dsn}: ${report.checks.length} checks passed.`);
} finally {await browser.close();}
