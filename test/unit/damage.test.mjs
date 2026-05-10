import assert from "node:assert/strict";
import test from "node:test";

import { calculateAttackFormula, calculateDefenseOutcome, getCounterTier } from "../../src/rules/damage.mjs";

test("basic attacks use STR or ACC with no stamina cost", () => {
  assert.deepEqual(calculateAttackFormula({ mode: "melee", source: "basic", str: 8 }), {
    damage: 8,
    staminaCost: 0,
    damageFormula: "STR",
    costFormula: "0"
  });
  assert.equal(calculateAttackFormula({ mode: "ranged", source: "basic", acc: 14 }).damage, 14);
});

test("kagune attacks add RCL and use minimum stamina cost 1", () => {
  assert.equal(calculateAttackFormula({ mode: "melee", source: "kagune", str: 8, rcl: 10 }).damage, 18);
  assert.equal(calculateAttackFormula({ mode: "melee", source: "kagune", str: 8, rcl: 10 }).staminaCost, 1);
  assert.equal(calculateAttackFormula({ mode: "ranged", source: "kagune", acc: 14, rcl: 10 }).staminaCost, 4);
});

test("quinque attacks add RCL and use inverse stamina cost", () => {
  assert.equal(calculateAttackFormula({ mode: "melee", source: "quinque", str: 8, rcl: 10 }).damage, 18);
  assert.equal(calculateAttackFormula({ mode: "melee", source: "quinque", str: 8, rcl: 10 }).staminaCost, 2);
  assert.equal(calculateAttackFormula({ mode: "ranged", source: "quinque", acc: 14, rcl: 10 }).staminaCost, 1);
});

test("sidearm uses ACC damage and no weapon RCL damage", () => {
  assert.deepEqual(calculateAttackFormula({ mode: "ranged", source: "quinque", acc: 14, rcl: 10, sidearm: true }), {
    damage: 14,
    staminaCost: 0,
    damageFormula: "ACC",
    costFormula: "0"
  });
});

test("defense outcomes apply take hit and failed dodge or block consequences", () => {
  assert.deepEqual(calculateDefenseOutcome({ defense: "takeHit", damage: 10 }), { vitalityDamage: 10, staminaDamage: 0 });
  assert.deepEqual(calculateDefenseOutcome({ defense: "dodge", damage: 11 }), { vitalityDamage: 11, staminaDamage: 5 });
  assert.deepEqual(calculateDefenseOutcome({ defense: "block", damage: 11 }), { vitalityDamage: 16, staminaDamage: 0 });
  assert.deepEqual(calculateDefenseOutcome({ defense: "block", damage: 11, harshConsequences: false }), { vitalityDamage: 11, staminaDamage: 0 });
});

test("successful defense prevents damage", () => {
  assert.deepEqual(calculateDefenseOutcome({ defense: "dodge", success: true, damage: 20 }), { vitalityDamage: 0, staminaDamage: 0 });
});

test("counter tiers match defense margin thresholds", () => {
  assert.deepEqual(getCounterTier(14, 10), { margin: 4, automatic: false, damageMultiplier: 0 });
  assert.deepEqual(getCounterTier(15, 10), { margin: 5, automatic: false, damageMultiplier: 0.5 });
  assert.deepEqual(getCounterTier(20, 10), { margin: 10, automatic: false, damageMultiplier: 1 });
  assert.deepEqual(getCounterTier(25, 10), { margin: 15, automatic: true, damageMultiplier: 1 });
  assert.deepEqual(getCounterTier(30, 10), { margin: 20, automatic: true, damageMultiplier: 1.5 });
});
