import assert from "node:assert/strict";
import test from "node:test";

import {
  advanceKakujaMastery,
  calculateKakujaUpkeep,
  canFullKakuja,
  getKakujaBonusOptions,
  getKakujaEligibility,
  getMasteryRequirement
} from "../../src/rules/kakuja.mjs";

test("Kakuja eligibility requires class, RCL, Cannibalistic, and half mastery for full", () => {
  assert.deepEqual(getKakujaEligibility({ actorClass: "ghoul", rcl: 50, edges: ["Cannibalistic"] }), {
    canHalf: true,
    canFull: false
  });
  assert.deepEqual(getKakujaEligibility({ actorClass: "ghoul", rcl: 150, edges: ["Cannibalistic"], masteredHalf: true }), {
    canHalf: true,
    canFull: true
  });
  assert.equal(getKakujaEligibility({ actorClass: "quinx", rcl: 150, edges: ["Cannibalistic"], masteredHalf: true }).canFull, false);
});

test("Quinx cannot full Kakuja", () => {
  assert.equal(canFullKakuja({ system: { identity: { class: "quinx" } } }), false);
  assert.equal(canFullKakuja({ system: { identity: { class: "ghoul" } } }), true);
});

test("Kakuja bonus options follow type and stage", () => {
  assert.deepEqual(getKakujaBonusOptions("ukaku", "half"), [{ stat: "spd", value: 20 }, { stat: "acc", value: 20 }]);
  assert.deepEqual(getKakujaBonusOptions("rinkaku", "full"), [{ stat: "rcl", value: 20 }, { stat: "spd", value: 40 }]);
});

test("Kakuja upkeep follows stage and mastery", () => {
  assert.equal(calculateKakujaUpkeep({ stage: "half", rcl: 50 }), 50);
  assert.equal(calculateKakujaUpkeep({ stage: "full", rcl: 150 }), 300);
  assert.equal(calculateKakujaUpkeep({ stage: "full", rcl: 150, mastered: true }), 75);
});

test("mastery requires combat or out-of-combat success streaks and failure causes lost control", () => {
  assert.equal(getMasteryRequirement({ context: "combat" }), 10);
  assert.equal(getMasteryRequirement({ context: "outOfCombat" }), 20);
  assert.deepEqual(advanceKakujaMastery({ currentSuccesses: 9, success: true, context: "combat" }), {
    successes: 10,
    mastered: true,
    lostControl: false
  });
  assert.deepEqual(advanceKakujaMastery({ currentSuccesses: 9, success: false, context: "combat" }), {
    successes: 0,
    mastered: false,
    lostControl: true
  });
});
