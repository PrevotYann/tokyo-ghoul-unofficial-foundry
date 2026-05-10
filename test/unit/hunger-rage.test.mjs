import assert from "node:assert/strict";
import test from "node:test";

import {
  calculateHungerTargetNumber,
  calculateRageTargetNumber,
  getCrossedResourceThresholds,
  reduceMealScoreDaily,
  resolveHungerFailure,
  resolveRageFailure,
  restoreMealScore
} from "../../src/rules/hunger-rage.mjs";

test("threshold detection reports newly crossed 50/25/10 percent thresholds", () => {
  assert.deepEqual(getCrossedResourceThresholds({ previousValue: 60, currentValue: 29, maxValue: 60 }), [
    { threshold: 0.5, key: "50%", value: 30 }
  ]);
  assert.deepEqual(getCrossedResourceThresholds({ previousValue: 60, currentValue: 5, maxValue: 60, alreadyChecked: ["50%"] }).map((entry) => entry.key), ["25%", "10%"]);
});

test("meal score daily reduction and restoration modes clamp to max", () => {
  assert.equal(reduceMealScoreDaily({ value: 5, max: 10 }), 4);
  assert.equal(reduceMealScoreDaily({ value: 0, max: 10 }), 0);
  assert.equal(restoreMealScore({ value: 2, max: 10 }, "fullHumanMeal"), 10);
  assert.equal(restoreMealScore({ value: 2, max: 10 }, "fullGhoulMeal"), 7);
  assert.equal(restoreMealScore({ value: 2, max: 10 }, "cannibalisticGhoulMeal"), 10);
});

test("hunger and rage target numbers equal missing resource", () => {
  assert.equal(calculateHungerTargetNumber({ mealScore: { value: 6, max: 10 } }), 4);
  assert.equal(calculateHungerTargetNumber({ stamina: { value: 18, max: 30 }, context: "inCombat" }), 12);
  assert.equal(calculateRageTargetNumber({ value: 20, max: 60 }), 40);
});

test("hunger failure applies initial and ongoing damage unless Rampant", () => {
  assert.deepEqual(resolveHungerFailure({ vitality: { value: 20 }, turnsOrIntervals: 2 }), {
    vitalityDamage: 7,
    suppressesRegeneration: true,
    tempStatBudget: 0,
    vitalityAfterDamage: 13
  });
  assert.deepEqual(resolveHungerFailure({ rampant: true }), {
    vitalityDamage: 0,
    suppressesRegeneration: false,
    tempStatBudget: 10
  });
});

test("rage failure sets temp budget and costs with voluntary and Rampant exceptions", () => {
  assert.deepEqual(resolveRageFailure(), { active: true, initialStaminaLoss: 5, perActionStaminaCost: 2, tempStatBudget: 10 });
  assert.equal(resolveRageFailure({ voluntary: true }).initialStaminaLoss, 0);
  assert.deepEqual(resolveRageFailure({ rampant: true }), { active: true, initialStaminaLoss: 0, perActionStaminaCost: 1, tempStatBudget: 10 });
});
