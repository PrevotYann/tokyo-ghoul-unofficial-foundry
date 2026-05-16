import assert from "node:assert/strict";
import test from "node:test";

import {
  buildGimmickActivationSummary,
  calculateAttackGimmick,
  calculateDefenseGimmick,
  calculateFormGimmickBenefit,
  calculateGimmickStaminaCost,
  getUtilityGimmickGrantedEdges
} from "../../src/rules/gimmicks.mjs";

test("gimmick stamina costs use the higher of END or SPD unless overridden", () => {
  assert.equal(calculateGimmickStaminaCost({ mode: "maxEndSpd", end: 8, spd: 12 }), 12);
  assert.equal(calculateGimmickStaminaCost({ mode: "tripleMaxEndSpd", end: 8, spd: 12 }), 36);
  assert.equal(calculateGimmickStaminaCost({ mode: "custom", customCost: 7 }), 7);
  assert.equal(calculateGimmickStaminaCost({ mode: "maxEndSpd", end: 8, spd: 12, free: true }), 0);
});

test("activation summary toggles state and charges only on activation", () => {
  assert.deepEqual(buildGimmickActivationSummary({
    gimmickType: "utility",
    active: false,
    stats: { end: 4, spd: 6 }
  }), {
    gimmickType: "utility",
    active: true,
    staminaCost: 18,
    staminaCostMode: "tripleMaxEndSpd"
  });

  assert.equal(buildGimmickActivationSummary({ active: true, stats: { end: 4, spd: 6 } }).staminaCost, 0);
});

test("attack, defense, form, and utility gimmick helpers expose expected effects", () => {
  assert.deepEqual(calculateAttackGimmick({ rcl: 10, selectedStatValue: 6 }), {
    attackBonus: 16,
    formula: "RCL + selected stat"
  });

  assert.deepEqual(calculateDefenseGimmick({ turnsSinceLastUse: 2, attackTotal: 23 }), {
    available: true,
    autoPassTotal: 24,
    formula: "attacker total + 1"
  });

  assert.equal(calculateDefenseGimmick({ turnsSinceLastUse: 1, attackTotal: 23 }).available, false);
  assert.equal(calculateFormGimmickBenefit({ selectedBenefit: "damage", selectedStatValue: 5, currentDamageStat: 5 }).damageStat, 10);
  assert.deepEqual(getUtilityGimmickGrantedEdges(["A", "B", "C"]), ["A", "B"]);
});
