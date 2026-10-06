import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import { createLastDelivery, adventureId } from "../../src/packs-source/adventures/last-delivery.mjs";
import { validateStartingStatTotal } from "../../src/rules/derived-stats.mjs";

test("Last Delivery is a complete deterministic native Adventure", () => {
  const adventure = createLastDelivery();
  assert.deepEqual(adventure, createLastDelivery());
  assert.equal(adventure.actors.filter(a => a.type === "character").length, 6);
  assert.equal(adventure.scenes.length, 3);
  assert.ok(adventure.journal.length >= 10);
  const ids = new Set(adventure.actors.map(a => a._id));
  const journals = new Set(adventure.journal.map(j => j._id));
  for (const actor of adventure.actors) {
    if (actor.type === "character") assert.ok(validateStartingStatTotal(actor.system.stats).valid, actor.name);
    assert.ok(actor.items.every(i => i._id && i.type));
    assert.ok(actor.system.resources.vitality.value > 0);
    assert.equal(actor.system.resources.vitality.value, actor.system.resources.vitality.max);
    assert.equal(actor.system.resources.stamina.value, actor.system.resources.stamina.max);
  }
  for (const scene of adventure.scenes) {
    assert.ok(journals.has(scene.journal));
    assert.ok(scene.tokens.length >= 3);
    for (const token of scene.tokens) {
      assert.ok(ids.has(token.actorId));
      assert.ok(token.x >= 0 && token.x + 64 <= scene.width);
      assert.ok(token.y >= 0 && token.y + 64 <= scene.height);
    }
  }
  const documents = [...adventure.actors, ...adventure.items, ...adventure.scenes, ...adventure.journal, ...adventure.folders];
  assert.equal(new Set(documents.map(d => d._id)).size, documents.length);
  const allIds = new Set(documents.map(d => d._id));
  for (const journal of adventure.journal) for (const match of JSON.stringify(journal).matchAll(/@UUID\[(?:Actor|Item|Scene|JournalEntry)\.([a-f0-9]{16})\]/g)) assert.ok(allIds.has(match[1]), match[0]);
  assert.equal(adventure._id, adventureId("adventure"));
});

test("adventure assets and manifest pack are distributable", async () => {
  const adventure = createLastDelivery();
  const manifest = JSON.parse(await fs.readFile("system.json", "utf8"));
  assert.ok(manifest.packs.some(p => p.name === "last-delivery" && p.type === "Adventure"));
  const paths = new Set([adventure.img, ...adventure.scenes.map(s => s.background.src), ...adventure.actors.map(a => a.img)]);
  for (const asset of paths) {
    const stat = await fs.stat(asset.replace("systems/tokyo-ghoul-unofficial/", ""));
    assert.ok(stat.size > 0, asset);
  }
});

test("every scene has blocking geometry, doors, light, fog and linked party tokens", () => {
  const adventure = createLastDelivery();
  const pcs = adventure.actors.filter(a => a.type === "character");
  for (const scene of adventure.scenes) {
    assert.equal(scene.tokenVision, true);
    assert.equal(scene.fog.exploration, true);
    assert.ok(scene.walls.length >= 10);
    assert.ok(scene.walls.some(w => w.door === 1));
    assert.ok(scene.lights.length >= 3);
    for (const wall of scene.walls) {
      assert.equal(wall.c.length, 4);
      assert.ok(wall.c.every(Number.isInteger));
      assert.ok(wall.c[0] !== wall.c[2] || wall.c[1] !== wall.c[3]);
      for (let i = 0; i < 4; i++) assert.ok(wall.c[i] >= 0 && wall.c[i] <= (i % 2 ? scene.height : scene.width));
      assert.equal(wall.move, 20);
    }
    const pcTokens = scene.tokens.filter(t => pcs.some(a => a._id === t.actorId));
    assert.equal(pcTokens.length, 6);
    assert.equal(new Set(pcTokens.map(t => t.actorId)).size, 6);
    assert.equal(pcTokens.filter(t => !t.hidden).length, 4);
    assert.ok(pcTokens.every(t => t.actorLink && t.sight.enabled));
    for (let i = 0; i < pcTokens.length; i++) for (let j = i + 1; j < pcTokens.length; j++) {
      const a = pcTokens[i], b = pcTokens[j];
      assert.ok(a.x + 64 <= b.x || b.x + 64 <= a.x || a.y + 64 <= b.y || b.y + 64 <= a.y, "Party starts without overlapping tokens");
    }
    for (const door of scene.walls.filter(w => w.door)) {
      for (const point of [[door.c[0], door.c[1]], [door.c[2], door.c[3]]]) {
        assert.ok(scene.walls.some(w => w !== door && ((w.c[0] === point[0] && w.c[1] === point[1]) || (w.c[2] === point[0] && w.c[3] === point[1]))), "Door endpoints meet adjoining walls");
      }
    }
    assert.ok(scene.lights.every(l => l.walls && l.config.dim > 0));
  }
});
