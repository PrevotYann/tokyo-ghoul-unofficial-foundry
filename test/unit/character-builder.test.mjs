import assert from "node:assert/strict";
import test from "node:test";

import {
  buildStatsFromPreset,
  calculateBuilderRcl,
  createCharacterDraft,
  createKaguneDraft,
  createQuinqueDraft,
  getClassStartingProfile
} from "../../src/rules/character-builder.mjs";

test("class profiles define required starting sources", () => {
  assert.deepEqual(getClassStartingProfile("ghoul"), {
    needsKagune: true,
    needsQuinque: false,
    kaguneRcl: 10,
    quinqueRcl: 0,
    kaguneEdgeSlots: 3,
    quinqueEdgeSlots: 0
  });
  assert.equal(getClassStartingProfile("quinx").kaguneRcl, 5);
  assert.equal(getClassStartingProfile("investigator").quinqueEdgeSlots, 3);
});

test("stat presets produce 60 base points", () => {
  const stats = buildStatsFromPreset("ukakuRanged");
  assert.equal(Object.values(stats).reduce((total, stat) => total + stat.base, 0), 60);
});

test("builder RCL adds +2 per unused edge slot", () => {
  assert.equal(calculateBuilderRcl({ baseRcl: 10, maxEdges: 3, chosenEdges: ["A"] }), 14);
});

test("kagune and quinque drafts include starting RCL and edge slot data", () => {
  assert.equal(createKaguneDraft({ actorClass: "quinx", edges: [] }).system.rcl, 7);
  assert.equal(createQuinqueDraft({ actorClass: "investigator", edges: ["A", "B"] }).system.rcl, 12);
});

test("character draft creates class-required owned item drafts", () => {
  assert.deepEqual(createCharacterDraft({ actorClass: "ghoul" }).items.map((item) => item.type), ["kagune"]);
  assert.deepEqual(createCharacterDraft({ actorClass: "investigator" }).items.map((item) => item.type), ["quinque"]);
  assert.deepEqual(createCharacterDraft({ actorClass: "quinx" }).items.map((item) => item.type), ["kagune", "quinque"]);
});
