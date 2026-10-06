import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import path from "node:path";
import { chromium } from "playwright";

const candidates = [process.env.TG_FOUNDRY_PUBLIC, "C:/FoundryVTT-Node-14.360/public"] .filter(Boolean);
let publicDir;
for (const candidate of candidates) {
  try { await fs.access(path.join(candidate, "css/foundry2.css")); publicDir = candidate; break; } catch {}
}

test("Foundry v14 layered fonts render UUID, close, menu and resize controls", { skip: !publicDir && "Set TG_FOUNDRY_PUBLIC to the local Foundry v14 public directory" }, async () => {
  const browser = await chromium.launch({ headless: true });
  try {
    const page = await browser.newPage();
    await page.route("http://tg-icons.test/**", async route => {
      const urlPath = new URL(route.request().url()).pathname;
      if (urlPath === "/") return route.fulfill({ contentType: "text/html", body: `<!doctype html><html><head>
        <link rel="stylesheet" href="/css/foundry2.css">
        <style>@import url("/fonts/fontawesome/css/all.min.css") layer(variables);</style>
        <link rel="stylesheet" href="/system/styles/tokyo-ghoul.css">
        <link rel="stylesheet" href="/system/styles/sheets.css">
        </head><body class="theme-dark"><section class="application tg-system tg-sheet" style="width:520px;height:180px">
        <header class="window-header"><h1 class="window-title">Icon regression</h1>
        <button type="button" class="header-control fa-solid fa-passport icon" data-action="copyUuid" aria-label="Copy UUID"></button>
        <button type="button" class="header-control icon fa-solid fa-ellipsis-vertical" data-action="toggleControls" aria-label="Options"></button>
        <button type="button" class="header-control icon fa-solid fa-xmark" data-action="close" aria-label="Close"></button>
        </header><section class="window-content"><button class="fa-solid fa-expand" aria-label="Expand"></button>
        <button class="icon fa-regular fa-copy" aria-label="Copy"></button>
        <button class="icon fa-duotone fa-copy" aria-label="Duotone copy"></button>
        <button class="text-button">Normal text</button><i class="fa-solid fa-link"></i></section>
        <div class="window-resize-handle"></div></section></body></html>` });
      const filename = urlPath.startsWith("/system/") ? path.resolve(urlPath.slice(8)) : path.join(publicDir, urlPath);
      try {
        const body = await fs.readFile(filename);
        const contentType = filename.endsWith(".css") ? "text/css" : filename.endsWith(".woff2") ? "font/woff2" : "image/webp";
        return route.fulfill({ body, contentType });
      } catch { return route.fulfill({ status: 404, body: "" }); }
    });
    await page.goto("http://tg-icons.test/");
    await page.evaluate(() => document.fonts.ready);
    const icons = await page.locator(".fa-solid, .fa-regular, .fa-duotone").evaluateAll(elements => elements.map(element => {
      const style = getComputedStyle(element), before = getComputedStyle(element, "::before");
      return { name: element.getAttribute("aria-label") ?? element.className, family: style.fontFamily, weight: style.fontWeight,
        beforeFamily: before.fontFamily, glyph: before.content, loaded: document.fonts.check(`${style.fontWeight} 16px ${style.fontFamily}`) };
    }));
    for (const icon of icons) {
      assert.match(icon.family, /Font Awesome/, JSON.stringify(icon));
      assert.match(icon.beforeFamily, /Font Awesome/, JSON.stringify(icon));
      assert.equal(icon.weight, icon.name === "Copy" ? "400" : "900", JSON.stringify(icon));
      assert.ok(icon.loaded, JSON.stringify(icon));
      assert.ok(icon.glyph !== "none" && icon.glyph !== "normal", JSON.stringify(icon));
    }
    assert.doesNotMatch(await page.locator(".text-button").evaluate(e => getComputedStyle(e).fontFamily), /Font Awesome/);
    const resize = await page.locator(".window-resize-handle").evaluate(element => ({ background: getComputedStyle(element).backgroundImage, width: element.offsetWidth, height: element.offsetHeight }));
    assert.match(resize.background, /resize-handle\.webp/);
    assert.ok(resize.width > 0 && resize.height > 0);
    await fs.mkdir("artifacts", { recursive: true });
    await page.screenshot({ path: "artifacts/window-icons.png" });
  } finally { await browser.close(); }
});
