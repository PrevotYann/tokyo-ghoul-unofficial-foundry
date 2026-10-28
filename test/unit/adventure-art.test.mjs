import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import { createHash } from "node:crypto";
import { createLastDelivery } from "../../src/packs-source/adventures/last-delivery.mjs";
import { LAST_DELIVERY_ART_KEYS, lastDeliveryPortrait, migrateLastDeliveryActorArtwork, migrateLastDeliveryTokenArtwork } from "../../src/adventures/last-delivery-art.mjs";
import { runMigrations } from "../../src/rules/migrations.mjs";

const legacy = key => lastDeliveryPortrait(key).replace(/\.png$/, ".svg");
test("every adventure actor and placed token uses its own bundled illustrated portrait", async () => {
  const adventure = createLastDelivery();
  assert.equal(adventure.actors.length, LAST_DELIVERY_ART_KEYS.length);
  const portraits = new Set();
  for (const actor of adventure.actors) {
    const key = actor.flags["tokyo-ghoul-unofficial"].key;
    assert.equal(actor.img, lastDeliveryPortrait(key));
    assert.equal(actor.prototypeToken.texture.src, actor.img);
    const png = await fs.readFile(actor.img.replace("systems/tokyo-ghoul-unofficial/", ""));
    assert.deepEqual([...png.subarray(0, 8)], [137, 80, 78, 71, 13, 10, 26, 10]);
    assert.ok(png.readUInt32BE(16) >= 512 && png.readUInt32BE(20) >= 512, key);
    portraits.add(createHash("sha256").update(png).digest("hex"));
  }
  assert.equal(portraits.size, LAST_DELIVERY_ART_KEYS.length);
  for (const scene of adventure.scenes) for (const token of scene.tokens) {
    assert.equal(token.texture.src, adventure.actors.find(actor => actor._id === token.actorId).img);
  }
});

test("art upgrade updates legacy portraits, prototype textures and unlinked overrides independently", () => {
  const actor = { img: legacy("aya"), prototypeToken: { texture: { src: legacy("ren") } }, system: { resources: { vitality: { value: 7 } } } };
  const original = structuredClone(actor);
  assert.deepEqual(migrateLastDeliveryActorArtwork({ _source: actor }), { img: lastDeliveryPortrait("aya"), "prototypeToken.texture.src": lastDeliveryPortrait("ren") });
  assert.deepEqual(actor, original);
  assert.deepEqual(migrateLastDeliveryTokenArtwork({ texture: { src: legacy("boss") }, delta: { img: legacy("boss"), prototypeToken: { texture: { src: legacy("boss") } } } }), {
    "texture.src": lastDeliveryPortrait("boss"), "delta.img": lastDeliveryPortrait("boss"), "delta.prototypeToken.texture.src": lastDeliveryPortrait("boss")
  });
  assert.deepEqual(migrateLastDeliveryActorArtwork({ img: "uploads/aya.webp", prototypeToken: { texture: { src: legacy("aya") } } }), { "prototypeToken.texture.src": lastDeliveryPortrait("aya") });
  assert.deepEqual(migrateLastDeliveryActorArtwork({ img: legacy("aya"), prototypeToken: { texture: { src: "uploads/token.webp" } } }), { img: lastDeliveryPortrait("aya") });
  for (const value of ["uploads/custom.svg", legacy("unknown"), lastDeliveryPortrait("aya"), `${legacy("aya")}?custom=1`, undefined]) {
    assert.deepEqual(migrateLastDeliveryActorArtwork({ img: value, prototypeToken: { texture: { src: value } } }), {});
    assert.deepEqual(migrateLastDeliveryTokenArtwork({ texture: { src: value }, delta: { img: value } }), {});
  }
});

test("v0.6.0 preserves the existing adventure map files byte for byte", async () => {
  const maps = {
    "sazanami-alley.png": "ddc7471abc871c4f376ea168525fc33206a0a61a44f84318c035998ec8fecba7",
    "aobane-clinic.png": "40f4d455fc58ca0438529132fe8727c2d452e705e6fc582d9f7660accc21d108",
    "shigure-station.png": "5f3f38452c1733d0e355d9b7ddb846f5ef2be7d616137f620b994d019c03e746"
  };
  for (const [file, hash] of Object.entries(maps)) {
    const bytes = await fs.readFile(`assets/adventures/last-delivery/${file}`);
    assert.equal(createHash("sha256").update(bytes).digest("hex"), hash, file);
  }
});

test("schema 4 applies artwork to existing worlds once and only as the active GM", async () => {
  const previous = globalThis.game;
  const updates = [];
  let schema = 3;
  const actor = { type: "npc", _source: { img: legacy("boss") }, items: [], update: async update => updates.push(["actor", update]) };
  const scene = { tokens: [{ id: "legacy", texture: { src: legacy("boss") } }, { id: "custom", texture: { src: "uploads/boss.webp" } }], updateEmbeddedDocuments: async (type, update) => updates.push([type, update]) };
  globalThis.game = { user: { isActiveGM: false }, settings: { get: () => schema, set: async (_, key, value) => { schema = value; updates.push([key, value]); } }, actors: [actor], items: [], scenes: [scene] };
  try {
    await runMigrations();
    assert.deepEqual(updates, []);
    game.user.isActiveGM = true;
    await runMigrations({ dryRun: true });
    assert.deepEqual(updates, []);
    await runMigrations();
    assert.deepEqual(updates, [["actor", { img: lastDeliveryPortrait("boss") }], ["Token", [{ _id: "legacy", "texture.src": lastDeliveryPortrait("boss") }]], ["schemaVersion", 4]]);
    await runMigrations();
    assert.equal(updates.length, 3);
  } finally { globalThis.game = previous; }
});
