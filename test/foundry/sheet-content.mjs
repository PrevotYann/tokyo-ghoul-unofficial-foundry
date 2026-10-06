import { chromium } from "playwright";
import fs from "node:fs/promises";
const browser = await chromium.launch({headless:true});
const page = await browser.newPage({viewport:{width:1366,height:900}});
const errors = [];
page.on("pageerror", e => errors.push(e.message));
await fs.mkdir("artifacts/qa",{recursive:true});
await page.exposeFunction("captureSheet", async name => {await page.locator("#notifications").evaluate(e=>e.replaceChildren()); await page.locator(".tg-system.tg-sheet").last().screenshot({path:`artifacts/qa/sheet-${name}.png`});});
try {
  await page.goto(process.env.TG_QA_URL ?? "http://localhost:30014");
  await page.waitForTimeout(1200);
  if (await page.locator("[name=username]").count()) {
    await page.locator("[name=username]").fill("Gamemaster");
    await page.locator("button[name=join]").click();
  }
  await page.waitForFunction(() => game?.ready);
  const report = await page.evaluate(async () => {
    if (game.world.id !== "tg-qa" || game.release.generation !== 14) throw Error("Requires disposable tg-qa world on v14");
    const checks = [];
    const assert = (ok, name) => {if (!ok) throw Error(name); checks.push(name);};
    const wait = ms => new Promise(r => setTimeout(r, ms));
    const created = [];
    try {
      const actor = await Actor.create({name:"[TG QA] Rich text",type:"npc",system:{
        biography:{appearance:"<p><strong>Original broker</strong></p>",personality:"<p>Patient</p>",backstory:"<ul><li>Evidence</li></ul>",goals:"<p>Rescue</p>"},
        progression:{notes:"<p><em>Progress</em></p>"},automation:{ruleNotes:"<p>GM notes</p>"}}});
      created.push(actor);
      await actor.sheet.render({force:true});
      actor.sheet.element.querySelector('[data-tg-tab="biography"]').click();
      const getEditor = () => actor.sheet.element.querySelector('prose-mirror[name="system.biography.appearance"]');
      assert(getEditor().querySelector("strong")?.textContent === "Original broker", "Biography renders styled HTML");
      assert(!getEditor().querySelector('[contenteditable="true"]'), "Biography is read-only until explicitly edited");
      assert(actor.sheet.element.querySelectorAll("prose-mirror").length === 6, "All actor rich text fields use native editors");
      assert(actor.sheet.element.querySelector('[name="system.progression.notes"] em')?.textContent === "Progress", "Progression notes render HTML");
      assert(actor.sheet.element.querySelector('[name="system.automation.ruleNotes"] p')?.textContent === "GM notes", "Settings notes render HTML");
      assert(getComputedStyle(getEditor().querySelector("button.toggle")).display === "flex" && getEditor().querySelector("button.toggle").getAttribute("aria-label"), "Owner pencil stays visible and has an accessible name");
      getEditor().querySelector("button.toggle").click();
      for (let n=0;n<50&&!getEditor().querySelector('[contenteditable="true"]');n++) await wait(50);
      const editable = getEditor().querySelector('[contenteditable="true"]');
      assert(editable, "Owner pencil activates rich text editing");
      const selection = getSelection(); const range = document.createRange(); range.selectNodeContents(editable); selection.removeAllRanges(); selection.addRange(range);
      editable.focus(); document.execCommand("insertText",false,"Edited broker");
      await wait(100);
      assert(getEditor().value.includes("Edited broker"), "Editor captures changed rich text");
      getEditor().save();
      for (let n=0;n<50&&!actor.system.biography.appearance.includes("Edited broker");n++) await wait(50);
      assert(actor.system.biography.appearance.includes("Edited broker"), "Native rich text save persists to Actor");
      await wait(300);
      assert(!getEditor().querySelector('[contenteditable="true"]'), "Save returns biography to read-only display");
      await captureSheet("biography");
      await actor.sheet.close();
      const {TokyoGhoulActorSheet} = await import("/systems/tokyo-ghoul-unofficial/src/sheets/actor-sheet.mjs");
      class ReadOnlySheet extends TokyoGhoulActorSheet {get isEditable() {return false;}}
      const observer = new ReadOnlySheet({document:actor});
      await observer.render({force:true});
      assert([...observer.element.querySelectorAll("prose-mirror")].every(e=>e.disabled && getComputedStyle(e.querySelector("button.toggle")).display === "none"), "Read-only sheet hides all rich text edit controls");
      await observer.close();
      for (const type of ["quinque","kagune","edge","gimmick"]) {
        const item = await Item.create({name:`[TG QA] ${type}`,type,system:{description:"<p><strong>Original weapon</strong></p>",notes:"<p>Edge notes</p>",dynamicEffect:"<p>Gimmick effect</p>"}});
        created.push(item); await item.sheet.render({force:true});
        const sheet = item.sheet.element;
        assert(sheet.querySelector('[name="system.description"] strong')?.textContent === "Original weapon", `${type} description renders HTML`);
        assert(!sheet.querySelector('[contenteditable="true"]'), `${type} descriptive text is initially read-only`);
        const checkboxes = [...sheet.querySelectorAll('input[type="checkbox"]')];
        for (const checkbox of checkboxes) {
          const box = checkbox.getBoundingClientRect();
          assert(box.width === 18 && box.height === 18 && getComputedStyle(checkbox).appearance === "auto", `${type} ${checkbox.name} uses a compact native checkbox`);
          assert(getComputedStyle(checkbox,"::before").content === "none", `${type} ${checkbox.name} has no duplicate icon square`);
        }
        if (checkboxes.length) {
          const checkbox = checkboxes[0], field = checkbox.name, before = checkbox.checked;
          checkbox.click();
          for(let n=0;n<50&&foundry.utils.getProperty(item,field)===before;n++) await wait(50);
          assert(foundry.utils.getProperty(item,field)===!before, `${type} checkbox saves its boolean value`);
        }
        if(type === "edge") assert(sheet.querySelector('[name="system.notes"] p')?.textContent === "Edge notes", "Edge notes render HTML");
        if(type === "gimmick") assert(sheet.querySelector('[name="system.dynamicEffect"] p')?.textContent === "Gimmick effect", "Gimmick effect renders HTML");
        if(["quinque","kagune"].includes(type)) await captureSheet(type);
        await item.sheet.setPosition({width:380});
        await wait(150);
        assert(sheet.querySelector(".window-content").scrollWidth <= sheet.querySelector(".window-content").clientWidth+2, `${type} narrow sheet has no horizontal overflow`);
        await item.sheet.close();
      }
    } finally {
      for(const document of created.reverse()) {await document.sheet.close(); await document.delete();}
    }
    return checks;
  });
  if(errors.length) throw Error(errors.join("\n"));
  await fs.mkdir("artifacts/qa",{recursive:true});
  await fs.writeFile("artifacts/qa/sheet-content.json",JSON.stringify(report,null,2));
  console.log(`PASS: ${report.length} sheet content checks on Foundry v14`);
} finally {await browser.close();}
