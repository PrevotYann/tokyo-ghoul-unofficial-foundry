import assert from "node:assert/strict";
import test from "node:test";

import {
  applyKaguneTypeStatModifiers,
  calculateDerivedResources,
  calculateEdgeSlotRclBonus,
  calculateMealScoreMax,
  calculateRcBondsMax,
  calculateStaminaMax,
  calculateStartingRcl,
  calculateVitalityMax,
  validateStartingStatTotal
} from "../../src/rules/derived-stats.mjs";

const balancedStats = {
  str: { base: 10 },
  acc: { base: 10 },
  per: { base: 10 },
  end: { base: 10 },
  spd: { base: 10 },
  crl: { base: 10 }
};

test("Vitality max is (END + CRL) * 3", () => {
  assert.equal(calculateVitalityMax(8, 6), 42);
});

test("Stamina max is (END + SPD) * 3", () => {
  assert.equal(calculateStaminaMax(8, 12), 60);
});

test("Meal Score max floors CRL * 1.5 and has minimum 4", () => {
  assert.equal(calculateMealScoreMax(6), 9);
  assert.equal(calculateMealScoreMax(1), 4);
});

test("RC Bonds normally equal RCL and Rinkaku high-speed regeneration halves them", () => {
  assert.equal(calculateRcBondsMax(10), 10);
  assert.equal(calculateRcBondsMax(11, { highSpeedRegeneration: true }), 5);
});

test("unused starting edge slots add +2 RCL each", () => {
  assert.equal(calculateEdgeSlotRclBonus({ maxSlots: 3, chosenSlots: 1 }), 4);
  assert.equal(calculateStartingRcl({ baseRcl: 10, maxStartingEdges: 3, chosenStartingEdges: 0 }), 16);
});

test("Kagune type stat modifiers apply to totals", () => {
  assert.equal(applyKaguneTypeStatModifiers(balancedStats, "ukaku").spd, 13);
  assert.deepEqual(
    {
      end: applyKaguneTypeStatModifiers(balancedStats, "koukaku").end,
      spd: applyKaguneTypeStatModifiers(balancedStats, "koukaku").spd
    },
    { end: 13, spd: 7 }
  );
});

test("Ukaku reduces max Stamina by total SPD after type modifiers", () => {
  const derived = calculateDerivedResources({ stats: balancedStats, kaguneType: "ukaku" });
  assert.equal(derived.staminaMax, 56);
});

test("Rinkaku reduces max Vitality by total END", () => {
  const derived = calculateDerivedResources({ stats: balancedStats, kaguneType: "rinkaku" });
  assert.equal(derived.vitalityMax, 50);
});

test("starting stat validation expects 60 base points", () => {
  assert.deepEqual(validateStartingStatTotal(balancedStats), {
    valid: true,
    total: 60,
    expected: 60,
    difference: 0
  });
  assert.equal(validateStartingStatTotal({ ...balancedStats, str: { base: 11 } }).valid, false);
});
